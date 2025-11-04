# Extensão: Validador de Tags - Identificar Tags Não Fechadas

Esta extensão identifica e marca tags HTML/XML não fechadas no editor.

## Estrutura da Extensão

```
tag-validator-extension/
├── package.json
├── extension.json
├── tsconfig.json
└── src/
    └── main.ts
```

## 1. package.json

```json
{
  "name": "tag-validator-extension",
  "version": "1.0.0",
  "description": "Valida e identifica tags HTML/XML não fechadas",
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
  "name": "tag-validator-extension",
  "displayName": "Validador de Tags",
  "version": "1.0.0",
  "description": "Identifica e marca tags HTML/XML não fechadas automaticamente",
  "publisher": "myide",
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
        "command": "tagValidator.validate",
        "title": "Validar Tags",
        "category": "Editor"
      },
      {
        "command": "tagValidator.clearMarkers",
        "title": "Limpar Marcadores",
        "category": "Editor"
      }
    ],
    "keybindings": [
      {
        "command": "tagValidator.validate",
        "key": "ctrl+shift+v",
        "mac": "cmd+shift+v"
      }
    ],
    "configuration": [
      {
        "id": "tagValidator.autoValidate",
        "title": "Validação Automática",
        "type": "boolean",
        "default": true,
        "description": "Validar tags automaticamente ao editar"
      },
      {
        "id": "tagValidator.validateOnSave",
        "title": "Validar ao Salvar",
        "type": "boolean",
        "default": true,
        "description": "Validar tags quando o arquivo é salvo"
      },
      {
        "id": "tagValidator.fileTypes",
        "title": "Tipos de Arquivo",
        "type": "array",
        "default": [".html", ".xml", ".tsx", ".jsx"],
        "description": "Extensões de arquivo para validar"
      }
    ]
  }
}
```

## 3. src/main.ts (Código da Extensão)

```typescript
/**
 * Extensão para validar tags HTML/XML não fechadas
 */

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
  getCursorPosition(): Promise<{ line: number; column: number } | null>;
  addMarker(options: MarkerOptions): { dispose: () => void };
}

interface EventsAPI {
  onEditorContentChanged(callback: (content: string) => void): { dispose: () => void };
  onFileChanged(callback: (event: FileChangeEvent) => void): { dispose: () => void };
}

interface ConfigAPI {
  getExtensionConfig<T>(key: string, defaultValue?: T): T;
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

interface TagMatch {
  tag: string;
  line: number;
  column: number;
  isClosing: boolean;
  isSelfClosing: boolean;
}

interface ValidationResult {
  unclosedTags: Array<{
    tag: string;
    line: number;
    column: number;
    message: string;
  }>;
  orphanClosingTags: Array<{
    tag: string;
    line: number;
    column: number;
    message: string;
  }>;
}

/**
 * Ativação da extensão
 */
export async function activate(context: ExtensionContext) {
  console.log('Validador de Tags ativado!');

  let currentMarkers: Array<{ dispose: () => void }> = [];
  let currentFilePath: string | null = null;

  /**
   * Limpar todos os marcadores
   */
  function clearMarkers() {
    currentMarkers.forEach(marker => marker.dispose());
    currentMarkers = [];
  }

  /**
   * Verificar se o arquivo deve ser validado
   */
  function shouldValidateFile(filePath: string | null): boolean {
    if (!filePath) return false;
    
    const fileTypes = context.api.config.getExtensionConfig<string[]>(
      'tagValidator.fileTypes',
      ['.html', '.xml', '.tsx', '.jsx']
    );

    const extension = filePath.substring(filePath.lastIndexOf('.'));
    return fileTypes.includes(extension);
  }

  /**
   * Extrair tags do conteúdo
   */
  function extractTags(content: string): TagMatch[] {
    const tags: TagMatch[] = [];
    const lines = content.split('\n');

    // Regex para encontrar tags
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\s*\/?>/g;
    
    lines.forEach((line, lineIndex) => {
      let match;
      while ((match = tagRegex.exec(line)) !== null) {
        const fullMatch = match[0];
        const tagName = match[1];
        const column = match.index;
        
        const isClosing = fullMatch.startsWith('</');
        const isSelfClosing = fullMatch.endsWith('/>') || 
                             ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName.toLowerCase());

        tags.push({
          tag: tagName.toLowerCase(),
          line: lineIndex,
          column: column,
          isClosing,
          isSelfClosing
        });
      }
    });

    return tags;
  }

  /**
   * Validar tags e retornar problemas encontrados
   */
  function validateTags(content: string): ValidationResult {
    const tags = extractTags(content);
    const unclosedTags: ValidationResult['unclosedTags'] = [];
    const orphanClosingTags: ValidationResult['orphanClosingTags'] = [];
    
    // Stack para rastrear tags abertas
    const openTagsStack: Array<{ tag: string; line: number; column: number }> = [];

    tags.forEach(tagMatch => {
      if (tagMatch.isSelfClosing) {
        // Tags auto-fechadas são ignoradas
        return;
      }

      if (tagMatch.isClosing) {
        // Tag de fechamento
        const lastOpen = openTagsStack[openTagsStack.length - 1];
        
        if (!lastOpen) {
          // Tag de fechamento sem abertura correspondente
          orphanClosingTags.push({
            tag: tagMatch.tag,
            line: tagMatch.line,
            column: tagMatch.column,
            message: `Tag de fechamento </${tagMatch.tag}> sem tag de abertura correspondente`
          });
        } else if (lastOpen.tag === tagMatch.tag) {
          // Tag corresponde, remover da stack
          openTagsStack.pop();
        } else {
          // Tag não corresponde - pode ser aninhamento incorreto
          // Vamos procurar na stack se há uma correspondência
          const foundIndex = openTagsStack.findIndex(t => t.tag === tagMatch.tag);
          
          if (foundIndex !== -1) {
            // Encontrou correspondência, mas há tags não fechadas antes
            const unclosedBefore = openTagsStack.splice(foundIndex + 1);
            unclosedBefore.forEach(unclosed => {
              unclosedTags.push({
                tag: unclosed.tag,
                line: unclosed.line,
                column: unclosed.column,
                message: `Tag <${unclosed.tag}> não foi fechada antes de </${tagMatch.tag}>`
              });
            });
            openTagsStack.pop(); // Remove a tag correspondente
          } else {
            // Tag de fechamento não corresponde
            orphanClosingTags.push({
              tag: tagMatch.tag,
              line: tagMatch.line,
              column: tagMatch.column,
              message: `Tag de fechamento </${tagMatch.tag}> não corresponde à tag aberta <${lastOpen.tag}>`
            });
          }
        }
      } else {
        // Tag de abertura
        openTagsStack.push({
          tag: tagMatch.tag,
          line: tagMatch.line,
          column: tagMatch.column
        });
      }
    });

    // Qualquer tag restante na stack não foi fechada
    openTagsStack.forEach(unclosed => {
      unclosedTags.push({
        tag: unclosed.tag,
        line: unclosed.line,
        column: unclosed.column,
        message: `Tag <${unclosed.tag}> não foi fechada`
      });
    });

    return { unclosedTags, orphanClosingTags };
  }

  /**
   * Adicionar marcadores no editor
   */
  async function addMarkers(validationResult: ValidationResult) {
    clearMarkers();

    // Adicionar marcadores para tags não fechadas
    validationResult.unclosedTags.forEach(problem => {
      const marker = context.api.editor.addMarker({
        line: problem.line,
        column: problem.column,
        message: problem.message,
        severity: 'error'
      });
      currentMarkers.push(marker);
    });

    // Adicionar marcadores para tags de fechamento órfãs
    validationResult.orphanClosingTags.forEach(problem => {
      const marker = context.api.editor.addMarker({
        line: problem.line,
        column: problem.column,
        message: problem.message,
        severity: 'warning'
      });
      currentMarkers.push(marker);
    });

    // Mostrar mensagem de resumo
    const totalProblems = validationResult.unclosedTags.length + validationResult.orphanClosingTags.length;
    if (totalProblems > 0) {
      await context.api.workspace.showMessage(
        `Encontrados ${totalProblems} problema(s) de tags: ${validationResult.unclosedTags.length} não fechadas, ${validationResult.orphanClosingTags.length} órfãs`,
        'warning'
      );
    } else {
      await context.api.workspace.showMessage('Todas as tags estão válidas!', 'info');
    }
  }

  /**
   * Executar validação
   */
  async function runValidation() {
    try {
      const content = await context.api.editor.getContent();
      const projectPath = await context.api.workspace.getProjectPath();
      
      // Verificar se deve validar este arquivo
      if (!shouldValidateFile(currentFilePath)) {
        return;
      }

      const validationResult = validateTags(content);
      await addMarkers(validationResult);
    } catch (error: any) {
      await context.api.workspace.showMessage(
        `Erro ao validar tags: ${error.message}`,
        'error'
      );
    }
  }

  // Registrar comando de validação
  const validateCommand = context.api.commands.registerCommand(
    'tagValidator.validate',
    runValidation
  );
  context.subscriptions.push(validateCommand);

  // Registrar comando para limpar marcadores
  const clearCommand = context.api.commands.registerCommand(
    'tagValidator.clearMarkers',
    () => {
      clearMarkers();
    }
  );
  context.subscriptions.push(clearCommand);

  // Validação automática ao mudar conteúdo do editor
  const autoValidate = context.api.config.getExtensionConfig<boolean>(
    'tagValidator.autoValidate',
    true
  );

  if (autoValidate) {
    let validationTimeout: any = null;

    const onContentChanged = context.api.events.onEditorContentChanged(
      async (content: string) => {
        // Debounce: aguardar 500ms após última mudança
        if (validationTimeout) {
          clearTimeout(validationTimeout);
        }

        validationTimeout = setTimeout(async () => {
          if (shouldValidateFile(currentFilePath)) {
            const validationResult = validateTags(content);
            await addMarkers(validationResult);
          }
        }, 500);
      }
    );

    context.subscriptions.push(onContentChanged);
  }

  // Validar ao salvar arquivo
  const validateOnSave = context.api.config.getExtensionConfig<boolean>(
    'tagValidator.validateOnSave',
    true
  );

  if (validateOnSave) {
    const onFileChanged = context.api.events.onFileChanged(
      async (event: FileChangeEvent) => {
        if (event.type === 'modified' && event.path === currentFilePath) {
          await runValidation();
        }
      }
    );

    context.subscriptions.push(onFileChanged);
  }

  // Validar imediatamente ao ativar
  setTimeout(() => {
    runValidation();
  }, 1000);
}

/**
 * Desativação da extensão
 */
export async function deactivate() {
  console.log('Validador de Tags desativado!');
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

## Funcionalidades

### 1. Detecção de Tags Não Fechadas
- Analisa o conteúdo HTML/XML
- Identifica tags de abertura sem fechamento correspondente
- Rastreia aninhamento de tags

### 2. Detecção de Tags Órfãs
- Identifica tags de fechamento sem abertura correspondente
- Detecta tags de fechamento incorretas

### 3. Marcadores Visuais
- Adiciona marcadores de erro no editor
- Diferencia entre erros (tags não fechadas) e warnings (tags órfãs)

### 4. Validação Automática
- Valida automaticamente ao editar (configurável)
- Valida ao salvar arquivo (configurável)
- Debounce para evitar validações excessivas

### 5. Configuração
- Tipos de arquivo para validar (padrão: .html, .xml, .tsx, .jsx)
- Ativar/desativar validação automática
- Ativar/desativar validação ao salvar

## Como Usar

### Instalação

1. Compilar a extensão:
```bash
cd tag-validator-extension
npm install
npm run build
```

2. Copiar para diretório de extensões:
```bash
cp -r tag-validator-extension extensions/
```

3. Reiniciar a IDE

### Uso

- **Validação Manual**: Pressione `Ctrl+Shift+V` (ou `Cmd+Shift+V` no Mac)
- **Validação Automática**: Ativada por padrão, valida ao editar
- **Limpar Marcadores**: Use o comando "Limpar Marcadores"

### Exemplo de Uso

```html
<!-- HTML com erro - tag div não fechada -->
<div>
  <p>Conteúdo</p>
  <!-- Falta </div> aqui -->
```

A extensão marcará a tag `<div>` na linha 1 como não fechada.

## Melhorias Futuras

1. **Auto-correção**: Sugerir fechamento automático de tags
2. **Suporte a mais linguagens**: Angular templates, Vue, etc.
3. **Análise mais profunda**: Atributos obrigatórios, tags obsoletas
4. **Integração com linter**: Usar regras do ESLint/HTMLHint
5. **Quick fixes**: Sugerir correções com um clique

## Considerações de Performance

- Validação usa regex simples (rápida)
- Debounce de 500ms evita validações excessivas
- Valida apenas arquivos configurados
- Marcadores são limpos antes de adicionar novos

Este exemplo demonstra como uma extensão pode analisar código e fornecer feedback visual útil ao desenvolvedor!

