import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { Terminal } from 'xterm';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TerminalService {
  private terminal: Terminal | null = null;
  private isConnected = false;
  private outputSubject = new Subject<string>(); // Subject para broadcast de output
  public output$ = this.outputSubject.asObservable(); // Observable público para outros componentes

  private terminalDataListener?: (data: string) => void;

  constructor(private electronService: ElectronService) {
    // Configurar listener de output sempre, mesmo sem terminal visual conectado
    this.setupOutputListener();
  }

  private setupOutputListener() {
    // Escutar output do Electron (sempre, independente de terminal visual)
    if (window.electronAPI && !this.terminalDataListener) {
      this.terminalDataListener = (data: string) => {
        // Broadcast para todos os listeners
        this.outputSubject.next(data);
        
        // Escrever no terminal principal se estiver conectado
        if (this.terminal && this.isConnected) {
          this.terminal.write(data);
        }
      };
      
      window.electronAPI.onTerminalData(this.terminalDataListener);
    }
  }

  connect(terminal: Terminal) {
    this.terminal = terminal;
    this.isConnected = true;

    // Garantir que o listener está configurado
    this.setupOutputListener();

    // Inicializar terminal no Electron
    if (window.electronAPI) {
      window.electronAPI.initTerminal();
    }

    // Escutar comandos do terminal
    terminal.onData((data) => {
      // Fazer local echo manualmente para garantir que os caracteres apareçam
      const charCode = data.charCodeAt(0);
      
      // Tratar caracteres especiais
      if (data.length === 1) {
        // Backspace (charCode 127 ou 8)
        if (charCode === 127 || charCode === 8) {
          // Backspace - mover cursor e apagar caractere
          terminal.write('\b \b'); // Move back, escreve espaço, move back novamente
        }
        // Enter (charCode 13)
        else if (charCode === 13 || charCode === 10) {
          // Enter - escrever quebra de linha
          terminal.write('\r\n');
          // Enviar \r\n para o Electron (cmd.exe precisa de ambos)
          this.sendCommand('\r\n');
          return; // Não enviar novamente abaixo
        }
        // Caracteres imprimíveis normais
        else if (charCode >= 32 && charCode < 127) {
          // O xterm normalmente faz local echo, mas vamos garantir escrevendo manualmente
          // Isso é necessário porque cmd.exe pode não ecoar os caracteres
          terminal.write(data);
        }
      } else {
        // Sequências de escape ou múltiplos caracteres - escrever diretamente
        terminal.write(data);
      }
      
      // Enviar para o Electron (exceto Enter, que já foi enviado acima)
      if (charCode !== 13 && charCode !== 10) {
        this.sendCommand(data);
      }
    });
  }

  disconnect() {
    this.isConnected = false;
    if (window.electronAPI) {
      window.electronAPI.terminateTerminal();
    }
  }

  private sendCommand(data: string) {
    // Enviar comando mesmo se o terminal visual não estiver conectado
    // O processo do terminal no Electron funciona independentemente
    if (window.electronAPI) {
      window.electronAPI.sendTerminalData(data);
    }
  }

  write(data: string) {
    if (this.terminal && this.isConnected) {
      this.terminal.write(data);
    }
  }

  setCwd(cwd: string) {
    if (window.electronAPI) {
      window.electronAPI.setTerminalCwd(cwd);
    }
  }

  /**
   * Executa um comando no terminal
   * @param command Comando a ser executado
   * @param cwd Diretório de trabalho (opcional)
   */
  executeCommand(command: string, cwd?: string) {
    // Garantir que o listener está configurado
    this.setupOutputListener();
    
    // Garantir que o terminal está inicializado no Electron
    // O processo funciona independentemente do terminal visual estar conectado
    if (window.electronAPI) {
      window.electronAPI.initTerminal();
    }
    
    // Executar comando (o processo do terminal será criado automaticamente se necessário)
    this.sendCommandWithNewline(command, cwd);
  }

  private sendCommandWithNewline(command: string, cwd?: string) {
    if (cwd) {
      this.setCwd(cwd);
      // Aguardar um pouco para o diretório mudar antes de executar o comando
      setTimeout(() => {
        this.sendCommand(command + '\r\n');
      }, 200);
    } else {
      this.sendCommand(command + '\r\n');
    }
  }
}


