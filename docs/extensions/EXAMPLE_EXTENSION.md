# Exemplo de Extensão - Formatador de Código

Este documento mostra como criar uma extensão simples que formata código TypeScript automaticamente.

## Estrutura da Extensão

```
minha-extensao-formatador/
├── package.json
├── extension.json
└── src/
    └── main.ts
```

## 1. package.json

```json
{
  "name": "minha-extensao-formatador",
  "version": "1.0.0",
  "description": "Formata código TypeScript automaticamente",
  "main": "./dist/main.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 2. extension.json (Manifest)

```json
{
  "name": "minha-extensao-formatador",
  "displayName": "Formatador de Código",
  "version": "1.0.0",
  "description": "Formata código TypeScript automaticamente ao salvar",
  "publisher": "seu-nome",
  "engines": {
    "myide": "^1.0.0"
  },
  "main": "./dist/main.js",
  "activationEvents": [
    "onStart"
  ],
  "contributes": {
    "commands": [
      {
        "command": "formatarCodigo",
        "title": "Formatar Código",
        "category": "Editor"
      }
    ],
    "keybindings": [
      {
        "command": "formatarCodigo",
        "key": "shift+alt+f",
        "mac": "shift+alt+f"
      }
    ]
  }
}
```

## 3. src/main.ts (Código da Extensão)

```typescript
/**
 * Ativação da extensão
 */
export async function activate(context: ExtensionContext) {
  console.log('Formatador de Código ativado!');

  // Registrar comando de formatação
  const formatCommand = context.api.commands.registerCommand(
    'formatarCodigo',
    async () => {
      try {
        // Obter conteúdo do editor
        const content = await context.api.editor.getContent();
        
        // Formatar código (simplificado - em produção, usar prettier ou similar)
        const formatted = formatCode(content);
        
        // Aplicar código formatado
        await context.api.editor.setContent(formatted);
        
        // Mostrar mensagem
        await context.api.workspace.showMessage(
          'Código formatado com sucesso!',
          'info'
        );
      } catch (error) {
        await context.api.workspace.showMessage(
          `Erro ao formatar código: ${error}`,
          'error'
        );
      }
    }
  );

  // Adicionar à lista de subscriptions
  context.subscriptions.push(formatCommand);

  // Ouvir mudanças no editor e formatar automaticamente
  const onChangeSubscription = context.api.events.onEditorContentChanged(
    async (content) => {
      // Formatar apenas ao salvar (detectar evento de save via workspace)
      // Por enquanto, apenas log
      console.log('Conteúdo do editor mudou');
    }
  );

  context.subscriptions.push(onChangeSubscription);

  // Ouvir mudanças de arquivo
  const onFileChangeSubscription = context.api.events.onFileChanged(
    (event) => {
      if (event.type === 'modified' && event.path.endsWith('.ts')) {
        console.log(`Arquivo modificado: ${event.path}`);
      }
    }
  );

  context.subscriptions.push(onFileChangeSubscription);
}

/**
 * Desativação da extensão
 */
export async function deactivate() {
  console.log('Formatador de Código desativado!');
}

/**
 * Função simples de formatação (exemplo)
 * Em produção, usar biblioteca como Prettier
 */
function formatCode(code: string): string {
  // Remover espaços extras
  let formatted = code.replace(/\s+/g, ' ');
  
  // Adicionar quebras de linha após chaves e ponto-e-vírgula
  formatted = formatted.replace(/\{/g, '{\n  ');
  formatted = formatted.replace(/\}/g, '\n}');
  formatted = formatted.replace(/;/g, ';\n');
  
  // Remover múltiplas linhas vazias
  formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return formatted;
}

// Tipos (devem corresponder aos tipos da IDE)
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
  // ... outros
}

interface CommandsAPI {
  registerCommand(command: string, callback: (...args: any[]) => any): { dispose: () => void };
  executeCommand(command: string, ...args: any[]): Promise<any>;
}

interface WorkspaceAPI {
  showMessage(message: string, type?: 'info' | 'warning' | 'error'): Promise<void>;
}

interface EditorAPI {
  getContent(): Promise<string>;
  setContent(content: string): Promise<void>;
}

interface EventsAPI {
  onEditorContentChanged(callback: (content: string) => void): { dispose: () => void };
  onFileChanged(callback: (event: FileChangeEvent) => void): { dispose: () => void };
}

interface FileChangeEvent {
  path: string;
  type: 'created' | 'modified' | 'deleted';
}
```

## 4. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Como Usar

1. **Compilar a extensão:**
   ```bash
   cd minha-extensao-formatador
   npm install
   npm run build
   ```

2. **Instalar na IDE:**
   - Copiar a pasta da extensão para `extensions/`
   - Reiniciar a IDE
   - A extensão será carregada automaticamente

3. **Usar:**
   - Pressione `Shift+Alt+F` para formatar o código manualmente
   - Ou use o comando "Formatar Código" do palette de comandos

## Próximos Passos

- Integrar com Prettier para formatação real
- Adicionar configurações (eslint, prettier config)
- Suportar formatação automática ao salvar
- Adicionar outros formatadores (HTML, CSS, etc)

