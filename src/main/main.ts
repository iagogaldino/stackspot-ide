import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as chokidar from 'chokidar';
import { spawn } from 'child_process';
import * as http from 'http';

// Caminho do arquivo de configuração da IDE
function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'myide-config.json');
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  });

  // Carregar a aplicação Angular
  // Em desenvolvimento, sempre carregar do localhost
  // Em produção, carregar do arquivo compilado
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // Função para aguardar o servidor estar pronto
    const waitForServer = () => {
      const http = require('http');
      const checkServer = () => {
        const req = http.get('http://localhost:4200', (res: http.IncomingMessage) => {
          if (res.statusCode === 200) {
            mainWindow?.loadURL('http://localhost:4200');
            mainWindow?.webContents.openDevTools();
          } else {
            setTimeout(checkServer, 500);
          }
        });
        req.on('error', () => {
          setTimeout(checkServer, 500);
        });
      };
      checkServer();
    };
    
    waitForServer();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Função para inicializar terminal
function initTerminal(cwd?: string) {
  if (terminalProcess && terminalProcess.stdin) {
    // Se já existe, atualizar o diretório atual apenas se necessário
    // Aguardar um pouco para evitar conflito com input do usuário
      if (cwd && fs.existsSync(cwd)) {
        setTimeout(() => {
          if (terminalProcess && terminalProcess.stdin && !terminalProcess.stdin.destroyed) {
            const changeDirCmd = process.platform === 'win32' ? `cd /d "${cwd}"\r\n` : `cd "${cwd}"\n`;
            terminalProcess.stdin.resume();
            terminalProcess.stdin.write(changeDirCmd);
          }
        }, 100);
      }
    return; // Já inicializado
  }

  // Determinar shell baseado no OS
  // No Windows, usar cmd.exe que funciona melhor sem pty
  // No Linux/Mac, usar bash
  const shell = process.platform === 'win32' ? 'cmd.exe' : process.env['SHELL'] || '/bin/bash';
  const shellArgs = process.platform === 'win32' ? [] : ['-l'];
  
  // Usar o diretório do projeto se fornecido, senão usar o diretório atual
  const workingDir = cwd && fs.existsSync(cwd) ? cwd : process.cwd();
  
  
  // Criar processo usando spawn
  terminalProcess = spawn(shell, shellArgs, {
    cwd: workingDir,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
    windowsVerbatimArguments: false
  });
  

  // Enviar output para o renderer
  if (terminalProcess.stdout) {
    terminalProcess.stdout.setEncoding('utf8');
    terminalProcess.stdout.on('data', (data: string | Buffer) => {
      const dataStr = typeof data === 'string' ? data : data.toString('utf8');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:data', dataStr);
      }
    });
    
    terminalProcess.stdout.on('error', (error: Error) => {
      console.error('Erro no stdout do terminal:', error);
    });
  }

  if (terminalProcess.stderr) {
    terminalProcess.stderr.setEncoding('utf8');
    terminalProcess.stderr.on('data', (data: string | Buffer) => {
      const dataStr = typeof data === 'string' ? data : data.toString('utf8');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:data', dataStr);
      }
    });
    
    terminalProcess.stderr.on('error', (error: Error) => {
      console.error('Erro no stderr do terminal:', error);
    });
  }
  
  // Configurar stdin para aceitar input
  if (terminalProcess.stdin) {
    terminalProcess.stdin.setDefaultEncoding('utf8');
    // Garantir que o stdin não está pausado
    terminalProcess.stdin.resume();
  }
  
  // Monitorar eventos do processo
  terminalProcess.on('error', (error: Error) => {
    console.error('Erro no processo terminal:', error);
  });
  
  terminalProcess.on('exit', (code: number | null) => {
    terminalProcess = null;
  });

  // Lidar com saída do processo
  terminalProcess.on('exit', (code: number) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal:data', `\r\nProcess exited with code ${code}\r\n`);
    }
    terminalProcess = null;
  });

  terminalProcess.on('error', (error: Error) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal:data', `\r\nError: ${error.message}\r\n`);
    }
  });
}

// Handler para atualizar diretório do terminal
ipcMain.on('terminal:setCwd', (_, cwd: string) => {
  if (cwd && fs.existsSync(cwd)) {
    if (terminalProcess && terminalProcess.stdin) {
      // Terminal já existe, enviar comando cd
      const changeDirCmd = process.platform === 'win32' ? `cd /d "${cwd}"\r\n` : `cd "${cwd}"\n`;
      terminalProcess.stdin.resume();
      terminalProcess.stdin.write(changeDirCmd);
    } else {
      // Terminal não existe, criar com o diretório correto
      initTerminal(cwd);
    }
  }
});

// Quando Electron estiver pronto
app.whenReady().then(() => {
  createWindow();
  
  // Aguardar janela estar pronta antes de inicializar terminal
  setTimeout(() => {
    initTerminal();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      setTimeout(() => {
        initTerminal();
      }, 1000);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handler para salvar configuração da IDE
ipcMain.handle('config:save', async (_, config: any) => {
  try {
    const configPath = getConfigPath();
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Handler para carregar configuração da IDE
ipcMain.handle('config:load', async () => {
  try {
    const configPath = getConfigPath();
    if (await fs.pathExists(configPath)) {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return { success: true, config };
    }
    return { success: true, config: {} };
  } catch (error: any) {
    return { success: false, error: error.message, config: {} };
  }
});

// IPC Handlers - Comunicação com Angular

// Abrir diálogo para selecionar pasta
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Ler arquivo
ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    // Verificar se é um arquivo antes de tentar ler
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      return { success: false, error: 'EISDIR: Não é possível ler um diretório como arquivo' };
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Escrever arquivo
ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Ler diretório
ipcMain.handle('fs:readDirectory', async (_, dirPath: string) => {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    return {
      success: true,
      items: items.map(item => ({
        name: item.name,
        path: path.join(dirPath, item.name),
        isDirectory: item.isDirectory(),
        isFile: item.isFile()
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Função auxiliar para listar arquivos recursivamente
async function listFilesRecursively(dirPath: string, extensions?: string[], excludeDirs: string[] = []): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      // Ignorar diretórios excluídos
      if (item.isDirectory()) {
        if (excludeDirs.includes(item.name)) {
          continue;
        }
        // Recursivamente listar arquivos em subdiretórios
        const subFiles = await listFilesRecursively(fullPath, extensions, excludeDirs);
        files.push(...subFiles);
      } else if (item.isFile()) {
        // Se não há filtro de extensão ou a extensão corresponde
        if (!extensions || extensions.length === 0) {
          files.push(fullPath);
        } else {
          const fileName = item.name.toLowerCase();
          const ext = path.extname(item.name).toLowerCase();
          
          // Verificar se a extensão corresponde
          const matches = extensions.some(e => {
            const extLower = e.toLowerCase();
            const normalizedExt = extLower.startsWith('.') ? extLower : `.${extLower}`;
            
            // Verificação direta de extensão
            if (ext === normalizedExt) {
              return true;
            }
            
            // Para arquivos de teste (.spec.ts, .test.ts)
            if (extLower.includes('spec') || extLower.includes('test')) {
              return fileName.endsWith('.spec.ts') || 
                     fileName.endsWith('.spec.js') ||
                     fileName.endsWith('.test.ts') || 
                     fileName.endsWith('.test.js');
            }
            
            return false;
          });
          
          if (matches) {
            files.push(fullPath);
          }
        }
      }
    }
  } catch (error: any) {
    // Ignorar erros de permissão ou outros
    console.error(`Erro ao listar arquivos em ${dirPath}:`, error.message);
  }
  
  return files;
}

// Listar arquivos por tipo/extensão
ipcMain.handle('fs:listFilesByType', async (_, projectPath: string, extensions?: string[]) => {
  try {
    const excludeDirs = ['node_modules', 'dist', '.angular', '.git', '.vscode', 'coverage', '.idea'];
    const files = await listFilesRecursively(projectPath, extensions, excludeDirs);
    
    // Converter caminhos absolutos para relativos ao projeto
    const relativeFiles = files.map(file => path.relative(projectPath, file));
    
    return {
      success: true,
      files: relativeFiles,
      count: relativeFiles.length
    };
  } catch (error: any) {
    return { success: false, error: error.message, files: [], count: 0 };
  }
});

// Verificar se é projeto Angular
ipcMain.handle('angular:isAngularProject', async (_, projectPath: string) => {
  try {
    const angularJsonPath = path.join(projectPath, 'angular.json');
    const exists = await fs.pathExists(angularJsonPath);
    return { success: true, isAngular: exists };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Observar mudanças em arquivos (usando chokidar)
const watchers = new Map<string, chokidar.FSWatcher>();

ipcMain.handle('fs:watchDirectory', async (_, dirPath: string) => {
  try {
    // Remover watcher anterior se existir
    const existingWatcher = watchers.get(dirPath);
    if (existingWatcher) {
      await existingWatcher.close();
    }

    const watcher = chokidar.watch(dirPath, {
      ignored: /(^|[\/\\])\../, // Ignorar arquivos ocultos
      persistent: true
    });

    watchers.set(dirPath, watcher);

    watcher.on('all', (event, filePath) => {
      mainWindow?.webContents.send('file-changed', { event, path: filePath });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:unwatchDirectory', async (_, dirPath: string) => {
  try {
    const watcher = watchers.get(dirPath);
    if (watcher) {
      await watcher.close();
      watchers.delete(dirPath);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Terminal handlers
let terminalProcess: any = null;
let terminalBuffer = '';

ipcMain.on('terminal:data', (_, data: string) => {
  if (!terminalProcess || !terminalProcess.stdin) {
    // Se não tem processo, criar um novo
    initTerminal();
    // Aguardar um pouco para o processo estar pronto
    setTimeout(() => {
      if (terminalProcess && terminalProcess.stdin && !terminalProcess.stdin.destroyed) {
        try {
          terminalProcess.stdin.resume();
          terminalProcess.stdin.write(data);
        } catch (error) {
          console.error('Erro ao escrever no terminal:', error);
        }
      }
    }, 200);
  } else {
    if (terminalProcess.stdin && !terminalProcess.stdin.destroyed) {
      try {
        terminalProcess.stdin.resume();
        terminalProcess.stdin.write(data);
      } catch (error) {
        console.error('Erro ao escrever no terminal:', error);
      }
    }
  }
});

// Handler para inicializar terminal quando solicitado
ipcMain.on('terminal:init', () => {
  if (!terminalProcess) {
    initTerminal();
  }
});

ipcMain.on('terminal:terminate', () => {
  if (terminalProcess) {
    terminalProcess.kill();
    terminalProcess = null;
  }
});

