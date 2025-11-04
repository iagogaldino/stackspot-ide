/**
 * Extensão: Test Finder
 * Lista todos os arquivos de teste do projeto Angular
 */

declare const window: any;

interface ExtensionContext {
  extensionId: string;
  extensionPath: string;
  api: ExtensionAPI;
  subscriptions: Array<{ dispose: () => void }>;
}

interface ExtensionAPI {
  commands: CommandsAPI;
  workspace: WorkspaceAPI;
  editor: EditorAPI;
  events: EventsAPI;
  config: ConfigAPI;
  fs: FileSystemAPI;
}

interface CommandsAPI {
  registerCommand(command: string, callback: (...args: any[]) => any): { dispose: () => void };
}

interface WorkspaceAPI {
  getProjectPath(): Promise<string | null>;
  showMessage(message: string, type?: 'info' | 'warning' | 'error'): Promise<void>;
}

interface EditorAPI {
  getContent(): Promise<string>;
  addMarker(options: MarkerOptions): { dispose: () => void };
}

interface EventsAPI {
  onEditorContentChanged(callback: (content: string) => void): { dispose: () => void };
  onFileChanged(callback: (event: FileChangeEvent) => void): { dispose: () => void };
  onProjectChanged(callback: (projectPath: string | null) => void): { dispose: () => void };
}

interface ConfigAPI {
  getExtensionConfig<T>(key: string, defaultValue?: T): T;
}

interface FileSystemAPI {
  listFiles(dirPath: string, extensions?: string[]): Promise<string[]>;
  readFile(filePath: string): Promise<string>;
}

interface MarkerOptions {
  line: number;
  column: number;
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

interface FileChangeEvent {
  path: string;
  type: 'created' | 'modified' | 'deleted';
}

/**
 * Ativação da extensão
 */
export async function activate(context: ExtensionContext) {
  console.log('Test Finder ativado!');

  let testFiles: string[] = [];
  let currentProjectPath: string | null = null;

  /**
   * Buscar todos os arquivos de teste
   */
  async function findTestFiles(projectPath: string): Promise<string[]> {
    try {
      const testExtensions = ['.spec.ts', '.test.ts', '.spec.js', '.test.js'];
      const files = await context.api.fs.listFiles(projectPath, testExtensions);
      return files.sort();
    } catch (error: any) {
      console.error('Erro ao buscar arquivos de teste:', error);
      await context.api.workspace.showMessage(
        `Erro ao buscar arquivos de teste: ${error.message}`,
        'error'
      );
      return [];
    }
  }

  /**
   * Atualizar lista de testes
   */
  async function refreshTestList() {
    const projectPath = await context.api.workspace.getProjectPath();
    
    if (!projectPath) {
      await context.api.workspace.showMessage(
        'Nenhum projeto aberto. Abra um projeto Angular para listar os testes.',
        'warning'
      );
      testFiles = [];
      return;
    }

    currentProjectPath = projectPath;
    
    await context.api.workspace.showMessage('Buscando arquivos de teste...', 'info');
    
    testFiles = await findTestFiles(projectPath);
    
    // Emitir evento para atualizar a UI
    // Nota: A extensão precisa se comunicar com o componente Angular
    // Por enquanto, vamos apenas logar e mostrar mensagem
    console.log(`Encontrados ${testFiles.length} arquivos de teste:`, testFiles);
    
    if (testFiles.length > 0) {
      await context.api.workspace.showMessage(
        `Encontrados ${testFiles.length} arquivo(s) de teste`,
        'info'
      );
    } else {
      await context.api.workspace.showMessage(
        'Nenhum arquivo de teste encontrado',
        'info'
      );
    }
  }

  // Registrar comando para atualizar lista
  const refreshCommand = context.api.commands.registerCommand(
    'testFinder.refresh',
    refreshTestList
  );
  context.subscriptions.push(refreshCommand);

  // Listener para mudanças no projeto
  const onProjectChanged = context.api.events.onProjectChanged(
    async (projectPath: string | null) => {
      if (projectPath) {
        currentProjectPath = projectPath;
        await refreshTestList();
      } else {
        testFiles = [];
        currentProjectPath = null;
      }
    }
  );
  context.subscriptions.push(onProjectChanged);

  // Buscar testes ao ativar
  setTimeout(async () => {
    await refreshTestList();
  }, 2000);

  // Expor função para obter lista de testes (para uso pelo componente Angular)
  if (typeof window !== 'undefined') {
    (window as any).__testFinderExtension = {
      getTestFiles: () => testFiles,
      refresh: refreshTestList
    };
  }
}

/**
 * Desativação da extensão
 */
export async function deactivate() {
  console.log('Test Finder desativado!');
  if (typeof window !== 'undefined') {
    delete (window as any).__testFinderExtension;
  }
}

