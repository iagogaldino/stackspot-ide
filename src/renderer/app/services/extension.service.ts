import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Extension, ExtensionInstance, ExtensionContext, ExtensionStatus, ExtensionAPI } from '../extensions/types/extension.interface';
import { ExtensionManifest } from '../extensions/types/extension-manifest.interface';
import { ElectronService } from './electron.service';
import { MonacoEditorService } from './monaco-editor.service';
import { WorkspaceService } from './workspace.service';
import { TerminalService } from './terminal.service';
import { FileService } from './file.service';
import { TabsService } from './tabs.service';

// Usar o tipo do ElectronService para evitar conflitos
declare global {
  interface Window {
    myIDE: ExtensionAPI;
  }
}

/**
 * Serviço responsável por gerenciar extensões
 */
@Injectable({
  providedIn: 'root'
})
export class ExtensionService implements OnInit, OnDestroy {
  private extensions = new Map<string, Extension>();
  private extensionsSubject = new BehaviorSubject<Extension[]>([]);
  public extensions$: Observable<Extension[]> = this.extensionsSubject.asObservable();
  
  private commands = new Map<string, (...args: any[]) => any>();
  private commandSubscriptions = new Map<string, Array<{ dispose: () => void }>>();
  private eventListeners = new Map<string, Array<() => void>>();
  private extensionAPI: ExtensionAPI;

  constructor(
    private electronService: ElectronService,
    private monacoEditorService: MonacoEditorService,
    private workspaceService: WorkspaceService,
    private terminalService: TerminalService,
    private fileService: FileService,
    private tabsService: TabsService
  ) {
    this.extensionAPI = this.createExtensionAPI();
    this.exposeAPI();
  }

  ngOnInit() {
    // Carregar extensões quando o serviço for inicializado
    this.loadExtensions();
  }

  ngOnDestroy() {
    // Limpar todas as extensões
    this.extensions.forEach(ext => {
      if (ext.instance) {
        this.deactivateExtension(ext.id);
      }
    });
  }

  /**
   * Expõe a API no window.myIDE
   */
  private exposeAPI(): void {
    if (typeof window !== 'undefined') {
      const win = window as any;
      
      // Verificar se myIDE já existe e se é configurable
      const descriptor = Object.getOwnPropertyDescriptor(window, 'myIDE');
      
      if (descriptor && !descriptor.configurable) {
        // Propriedade readonly/não configurable - tentar atualizar propriedades
        if (win.myIDE && typeof win.myIDE === 'object') {
          try {
            Object.keys(this.extensionAPI).forEach(key => {
              try {
                // Tentar atualizar propriedade individual
                const propDesc = Object.getOwnPropertyDescriptor(win.myIDE, key);
                if (!propDesc || propDesc.configurable !== false) {
                  win.myIDE[key] = (this.extensionAPI as any)[key];
                }
              } catch (e) {
                // Ignorar se não conseguir atualizar
              }
            });
          } catch (e) {
            console.warn('Não foi possível atualizar myIDE:', e);
          }
          return;
        }
      }
      
      // Se não existe ou é configurable, criar/sobrescrever
      if (!win.myIDE) {
        try {
          win.myIDE = this.extensionAPI;
        } catch (e) {
          // Se falhar, tentar definir
          try {
            Object.defineProperty(window, 'myIDE', {
              value: this.extensionAPI,
              writable: true,
              configurable: true,
              enumerable: true
            });
          } catch (e2) {
            // Se ainda falhar, apenas logar e continuar
            console.warn('Não foi possível expor myIDE API. Extensões podem não funcionar:', e2);
          }
        }
      } else {
        // Já existe - tentar atualizar
        try {
          Object.assign(win.myIDE, this.extensionAPI);
        } catch (e) {
          // Se não conseguir, atualizar propriedades individualmente
          Object.keys(this.extensionAPI).forEach(key => {
            try {
              win.myIDE[key] = (this.extensionAPI as any)[key];
            } catch (e2) {
              // Ignorar
            }
          });
        }
      }
    }
  }

  /**
   * Carrega todas as extensões
   */
  async loadExtensions(): Promise<void> {
    try {
      if (!window.electronAPI) {
        console.warn('Electron API não disponível, extensões não serão carregadas');
        return;
      }

      const result = await window.electronAPI.listExtensions();
      if (!result.success) {
        console.error('Erro ao listar extensões:', result.error);
        return;
      }

      const extensionsInfo = result.extensions || [];
      
      for (const info of extensionsInfo) {
        if (info.valid && info.manifest) {
          await this.loadExtension(info.path);
        } else {
          console.warn(`Extensão inválida em ${info.path}:`, info.error);
        }
      }

      this.updateExtensionsSubject();
    } catch (error) {
      console.error('Erro ao carregar extensões:', error);
    }
  }

  /**
   * Carrega uma extensão específica
   */
  async loadExtension(extensionPath: string): Promise<Extension | null> {
    try {
      if (!window.electronAPI) return null;

      // Carregar manifest
      const manifestResult = await window.electronAPI.loadExtensionManifest(extensionPath);
      if (!manifestResult.success || !manifestResult.manifest) {
        console.error(`Erro ao carregar manifest de ${extensionPath}`);
        return null;
      }

      const manifest = manifestResult.manifest as ExtensionManifest;
      const extensionId = manifest.name;

      // Verificar se já está carregada
      if (this.extensions.has(extensionId)) {
        return this.extensions.get(extensionId)!;
      }

      // Criar objeto de extensão
      const extension: Extension = {
        id: extensionId,
        path: extensionPath,
        manifest,
        status: 'loaded'
      };

      this.extensions.set(extensionId, extension);
      this.updateExtensionsSubject();

      // Ativar se necessário
      if (this.shouldActivateOnStart(manifest)) {
        await this.activateExtension(extensionId);
      }

      return extension;
    } catch (error: any) {
      console.error(`Erro ao carregar extensão de ${extensionPath}:`, error);
      return null;
    }
  }

  /**
   * Verifica se a extensão deve ser ativada na inicialização
   */
  private shouldActivateOnStart(manifest: ExtensionManifest): boolean {
    return manifest.activationEvents?.includes('onStart') ?? false;
  }

  /**
   * Ativa uma extensão
   */
  async activateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extensão ${extensionId} não encontrada`);
    }

    if (extension.status === 'active') {
      return;
    }

    try {
      // Carregar código fonte do módulo
      const mainPath = extension.manifest.main;
      const moduleResult = await window.electronAPI.loadExtensionModule(extension.path, mainPath);
      
      if (!moduleResult.success || !moduleResult.code) {
        throw new Error(moduleResult.error || 'Falha ao carregar módulo da extensão');
      }

      // Executar o código no renderer process
      // O código já deve estar em JavaScript (compilado ou não)
      const moduleCode = moduleResult.code;
      
      // Criar um contexto isolado para o módulo (similar ao CommonJS)
      const moduleExports: any = {};
      const moduleModule = { exports: moduleExports };
      
      // Criar função require para importações comuns
      const moduleRequire = (name: string) => {
        if (name === 'myide') {
          return window.myIDE;
        }
        // Retornar objeto vazio para outros módulos (extensões podem não usar)
        return {};
      };
      
      // Executar o código da extensão em um contexto isolado
      // Usar Function constructor para executar o código
      const moduleFunction = new Function(
        'exports',
        'require',
        'module',
        'myIDE',
        moduleCode
      );
      moduleFunction(moduleExports, moduleRequire, moduleModule, window.myIDE);
      
      // Se o código usa module.exports, usar module.exports, senão usar exports
      const module = moduleModule.exports && Object.keys(moduleModule.exports).length > 0 
        ? moduleModule.exports 
        : moduleExports;
      
      // Verificar se tem função activate
      if (typeof module.activate !== 'function') {
        throw new Error('Extensão não exporta função activate');
      }

      const instance: ExtensionInstance = {
        activate: module.activate,
        deactivate: module.deactivate,
        exports: module.exports
      };

      extension.instance = instance;

      // Criar contexto
      const context = this.createExtensionContext(extension);

      // Ativar extensão
      await instance.activate(context);

      extension.status = 'active';
      this.updateExtensionsSubject();
    } catch (error: any) {
      extension.status = 'error';
      extension.error = error.message;
      this.updateExtensionsSubject();
      console.error(`Erro ao ativar extensão ${extensionId}:`, error);
    }
  }

  /**
   * Desativa uma extensão
   */
  async deactivateExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    if (!extension || !extension.instance) {
      return;
    }

    try {
      // Desativar extensão
      if (extension.instance.deactivate) {
        await extension.instance.deactivate();
      }

      // Limpar subscriptions
      const subscriptions = this.commandSubscriptions.get(extensionId);
      if (subscriptions) {
        subscriptions.forEach(sub => sub.dispose());
        this.commandSubscriptions.delete(extensionId);
      }

      // Limpar listeners
      const listeners = this.eventListeners.get(extensionId);
      if (listeners) {
        listeners.forEach(listener => listener());
        this.eventListeners.delete(extensionId);
      }

      extension.status = 'inactive';
      extension.instance = undefined;
      this.updateExtensionsSubject();
    } catch (error) {
      console.error(`Erro ao desativar extensão ${extensionId}:`, error);
    }
  }

  /**
   * Cria o contexto de uma extensão
   */
  private createExtensionContext(extension: Extension): ExtensionContext {
    return {
      extensionId: extension.id,
      extensionPath: extension.path,
      api: this.extensionAPI,
      subscriptions: []
    };
  }

  /**
   * Obtém uma extensão pelo ID
   */
  getExtension(extensionId: string): Extension | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * Lista todas as extensões
   */
  getAllExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Atualiza o subject de extensões
   */
  private updateExtensionsSubject(): void {
    this.extensionsSubject.next(this.getAllExtensions());
  }

  /**
   * Instala uma extensão do marketplace/local
   */
  async installExtension(extensionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!window.electronAPI) {
        return { success: false, error: 'Electron API não disponível' };
      }

      const result = await window.electronAPI.installExtension(extensionId);
      
      if (result.success) {
        // Recarregar extensões após instalação
        await this.loadExtensions();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cria a API de extensões
   */
  private createExtensionAPI(): ExtensionAPI {
    return {
      commands: {
        registerCommand: (command: string, callback: (...args: any[]) => any) => {
          this.commands.set(command, callback);
          
          const dispose = () => {
            this.commands.delete(command);
          };

          // Registrar subscription para limpeza
          const extensionId = this.getCurrentExtensionId();
          if (extensionId) {
            const subs = this.commandSubscriptions.get(extensionId) || [];
            subs.push({ dispose });
            this.commandSubscriptions.set(extensionId, subs);
          }

          return { dispose };
        },
        executeCommand: async (command: string, ...args: any[]): Promise<any> => {
          const handler = this.commands.get(command);
          if (!handler) {
            throw new Error(`Comando '${command}' não encontrado`);
          }
          return handler(...args);
        },
        getCommands: async (): Promise<string[]> => {
          return Array.from(this.commands.keys());
        }
      },
      workspace: {
        getProjectPath: async (): Promise<string | null> => {
          return this.workspaceService.getProjectPath();
        },
        openFile: async (filePath: string): Promise<void> => {
          await this.workspaceService.openFile(filePath);
        },
        createFile: async (filePath: string, content?: string): Promise<void> => {
          await this.workspaceService.createFile(filePath, content || '');
        },
        showMessage: async (message: string, type?: 'info' | 'warning' | 'error'): Promise<void> => {
          await this.workspaceService.showMessage(message, type);
        },
        showConfirm: async (message: string): Promise<boolean> => {
          return await this.workspaceService.showConfirm(message);
        }
      },
      editor: {
        getContent: async (): Promise<string> => {
          return this.monacoEditorService.getContent();
        },
        setContent: async (content: string): Promise<void> => {
          this.monacoEditorService.setContent(content);
        },
        getSelection: async () => {
          return this.monacoEditorService.getSelection();
        },
        addMarker: (options: any) => {
          return this.monacoEditorService.addMarker(options);
        },
        getCursorPosition: async () => {
          return this.monacoEditorService.getCursorPosition();
        }
      },
      terminal: {
        executeCommand: async (command: string): Promise<void> => {
          this.terminalService.executeCommand(command);
        },
        getOutput: async (): Promise<string> => {
          // Por enquanto, retornar string vazia
          // TODO: Implementar captura de output
          return '';
        },
        clear: async (): Promise<void> => {
          // TODO: Implementar limpeza de terminal
        }
      },
      fs: {
        readFile: async (filePath: string): Promise<string> => {
          return await this.fileService.readFile(filePath).toPromise() || '';
        },
        writeFile: async (filePath: string, content: string): Promise<void> => {
          await this.fileService.writeFile(filePath, content).toPromise();
        },
        listFiles: async (dirPath: string, extensions?: string[]): Promise<string[]> => {
          // TODO: Implementar listagem de arquivos
          return [];
        },
        exists: async (filePath: string): Promise<boolean> => {
          // TODO: Implementar verificação de existência
          return false;
        }
      },
      events: {
        onFileChanged: (callback: any) => {
          const listener = (event: any, data: any) => {
            callback({ path: data.path, type: data.event });
          };
          
          if (window.electronAPI) {
            window.electronAPI.onFileChanged(listener);
          }

          const dispose = () => {
            if (window.electronAPI) {
              window.electronAPI.removeFileChangedListener(listener);
            }
          };

          const extensionId = this.getCurrentExtensionId();
          if (extensionId) {
            const listeners = this.eventListeners.get(extensionId) || [];
            listeners.push(dispose);
            this.eventListeners.set(extensionId, listeners);
          }

          return { dispose };
        },
        onEditorContentChanged: (callback: any) => {
          const subscription = this.monacoEditorService.editorContent$.subscribe(callback);
          
          const dispose = () => {
            subscription.unsubscribe();
          };

          const extensionId = this.getCurrentExtensionId();
          if (extensionId) {
            const listeners = this.eventListeners.get(extensionId) || [];
            listeners.push(dispose);
            this.eventListeners.set(extensionId, listeners);
          }

          return { dispose };
        },
        onProjectChanged: (callback: any) => {
          const subscription = this.workspaceService.projectPath$.subscribe(callback);
          
          const dispose = () => {
            subscription.unsubscribe();
          };

          const extensionId = this.getCurrentExtensionId();
          if (extensionId) {
            const listeners = this.eventListeners.get(extensionId) || [];
            listeners.push(dispose);
            this.eventListeners.set(extensionId, listeners);
          }

          return { dispose };
        }
      },
      config: {
        get: <T = any>(key: string, defaultValue?: T): T => {
          // TODO: Implementar sistema de configurações
          return defaultValue as T;
        },
        set: async (key: string, value: any): Promise<void> => {
          // TODO: Implementar sistema de configurações
        },
        getExtensionConfig: <T = any>(key: string, defaultValue?: T): T => {
          // TODO: Implementar configurações por extensão
          return defaultValue as T;
        },
        setExtensionConfig: async (key: string, value: any): Promise<void> => {
          // TODO: Implementar configurações por extensão
        }
      }
    };
  }

  /**
   * Obtém o ID da extensão atual (para rastreamento de subscriptions)
   * Por enquanto, retorna null - em produção, usar stack de contexto
   */
  private getCurrentExtensionId(): string | null {
    // TODO: Implementar rastreamento de contexto de extensão
    return null;
  }
}
