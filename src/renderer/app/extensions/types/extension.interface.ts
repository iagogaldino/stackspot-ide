import { ExtensionManifest } from './extension-manifest.interface';

/**
 * Status de uma extensão
 */
export type ExtensionStatus = 'loaded' | 'active' | 'inactive' | 'error';

/**
 * Interface principal de uma extensão
 */
export interface Extension {
  /** ID único da extensão */
  id: string;
  
  /** Caminho do diretório da extensão */
  path: string;
  
  /** Manifest da extensão */
  manifest: ExtensionManifest;
  
  /** Status atual */
  status: ExtensionStatus;
  
  /** Mensagem de erro (se houver) */
  error?: string;
  
  /** Instância da extensão (após carregamento) */
  instance?: ExtensionInstance;
}

/**
 * Instância ativa de uma extensão
 */
export interface ExtensionInstance {
  /** Função de ativação da extensão */
  activate: (context: ExtensionContext) => Promise<void> | void;
  
  /** Função de desativação da extensão */
  deactivate?: () => Promise<void> | void;
  
  /** Exportações da extensão (se houver) */
  exports?: any;
}

/**
 * Contexto passado para a extensão
 */
export interface ExtensionContext {
  /** ID da extensão */
  extensionId: string;
  
  /** Caminho do diretório da extensão */
  extensionPath: string;
  
  /** API da IDE */
  api: ExtensionAPI;
  
  /** Subscriptions para limpeza */
  subscriptions: Array<{ dispose: () => void }>;
}

/**
 * API principal exposta para extensões
 */
export interface ExtensionAPI {
  /** API de comandos */
  commands: CommandsAPI;
  
  /** API do workspace */
  workspace: WorkspaceAPI;
  
  /** API do editor */
  editor: EditorAPI;
  
  /** API do terminal */
  terminal: TerminalAPI;
  
  /** API do sistema de arquivos */
  fs: FileSystemAPI;
  
  /** API de eventos */
  events: EventsAPI;
  
  /** API de configuração */
  config: ConfigAPI;
}

/**
 * API de comandos
 */
export interface CommandsAPI {
  /** Registrar um comando */
  registerCommand(command: string, callback: (...args: any[]) => any): { dispose: () => void };
  
  /** Executar um comando */
  executeCommand(command: string, ...args: any[]): Promise<any>;
  
  /** Listar comandos disponíveis */
  getCommands(): Promise<string[]>;
}

/**
 * API do workspace
 */
export interface WorkspaceAPI {
  /** Obter caminho do projeto atual */
  getProjectPath(): Promise<string | null>;
  
  /** Abrir arquivo no editor */
  openFile(filePath: string): Promise<void>;
  
  /** Criar novo arquivo */
  createFile(filePath: string, content?: string): Promise<void>;
  
  /** Mostrar mensagem ao usuário */
  showMessage(message: string, type?: 'info' | 'warning' | 'error'): Promise<void>;
  
  /** Mostrar diálogo de confirmação */
  showConfirm(message: string): Promise<boolean>;
}

/**
 * API do editor
 */
export interface EditorAPI {
  /** Obter conteúdo do editor ativo */
  getContent(): Promise<string>;
  
  /** Definir conteúdo do editor ativo */
  setContent(content: string): Promise<void>;
  
  /** Obter seleção atual */
  getSelection(): Promise<{ startLine: number; startColumn: number; endLine: number; endColumn: number } | null>;
  
  /** Adicionar marcador (decorator) no editor */
  addMarker(options: {
    line: number;
    column: number;
    message: string;
    severity?: 'error' | 'warning' | 'info';
  }): { dispose: () => void };
  
  /** Obter posição do cursor */
  getCursorPosition(): Promise<{ line: number; column: number } | null>;
}

/**
 * API do terminal
 */
export interface TerminalAPI {
  /** Executar comando no terminal */
  executeCommand(command: string): Promise<void>;
  
  /** Obter output do terminal */
  getOutput(): Promise<string>;
  
  /** Limpar terminal */
  clear(): Promise<void>;
}

/**
 * API do sistema de arquivos
 */
export interface FileSystemAPI {
  /** Ler arquivo */
  readFile(filePath: string): Promise<string>;
  
  /** Escrever arquivo */
  writeFile(filePath: string, content: string): Promise<void>;
  
  /** Listar arquivos */
  listFiles(dirPath: string, extensions?: string[]): Promise<string[]>;
  
  /** Verificar se arquivo existe */
  exists(filePath: string): Promise<boolean>;
}

/**
 * API de eventos
 */
export interface EventsAPI {
  /** Ouvir mudanças de arquivo */
  onFileChanged(callback: (event: { path: string; type: 'created' | 'modified' | 'deleted' }) => void): { dispose: () => void };
  
  /** Ouvir mudanças no editor */
  onEditorContentChanged(callback: (content: string) => void): { dispose: () => void };
  
  /** Ouvir mudanças no projeto */
  onProjectChanged(callback: (projectPath: string | null) => void): { dispose: () => void };
}

/**
 * API de configuração
 */
export interface ConfigAPI {
  /** Obter configuração */
  get<T = any>(key: string, defaultValue?: T): T;
  
  /** Definir configuração */
  set(key: string, value: any): Promise<void>;
  
  /** Obter configuração da extensão */
  getExtensionConfig<T = any>(key: string, defaultValue?: T): T;
  
  /** Definir configuração da extensão */
  setExtensionConfig(key: string, value: any): Promise<void>;
}

