# Guia de Extensões - MyIDE

Este guia explica como trabalhar com extensões na MyIDE, tanto do ponto de vista do desenvolvedor da IDE quanto do desenvolvedor de extensões.

## Índice

1. [Visão Geral](#visão-geral)
2. [Para Desenvolvedores de Extensões](#para-desenvolvedores-de-extensões)
3. [Para Desenvolvedores da IDE](#para-desenvolvedores-da-ide)
4. [APIs Disponíveis](#apis-disponíveis)
5. [Exemplos](#exemplos)

## Visão Geral

O sistema de extensões da MyIDE permite:

- **Estender funcionalidades**: Adicione novos comandos, painéis e ferramentas
- **Integrar ferramentas**: Conecte ferramentas externas (Git, Docker, etc)
- **Customizar experiência**: Modifique o comportamento da IDE
- **Adicionar suporte a linguagens**: Suporte para novas linguagens de programação

## Para Desenvolvedores de Extensões

### Criando uma Extensão

1. **Criar estrutura básica:**

```
minha-extensao/
├── package.json
├── extension.json
├── tsconfig.json
└── src/
    └── main.ts
```

2. **Definir o manifest (extension.json):**

```json
{
  "name": "minha-extensao",
  "displayName": "Minha Extensão",
  "version": "1.0.0",
  "description": "Descrição da extensão",
  "main": "./dist/main.js",
  "activationEvents": ["onStart"],
  "contributes": {
    "commands": [...],
    "keybindings": [...]
  }
}
```

3. **Implementar a extensão (src/main.ts):**

```typescript
export async function activate(context: ExtensionContext) {
  // Registrar comandos, listeners, etc
  const command = context.api.commands.registerCommand(
    'meuComando',
    () => {
      // Lógica do comando
    }
  );
  
  context.subscriptions.push(command);
}

export async function deactivate() {
  // Limpeza
}
```

4. **Compilar e instalar:**

```bash
# Compilar
npm run build

# Copiar para extensions/
cp -r minha-extensao extensions/
```

### APIs Disponíveis

Consulte `EXTENSIONS_ARCHITECTURE.md` para documentação completa das APIs.

#### Commands API

```typescript
// Registrar comando
const command = context.api.commands.registerCommand('meuComando', () => {
  console.log('Comando executado!');
});

// Executar comando
await context.api.commands.executeCommand('outroComando', arg1, arg2);
```

#### Workspace API

```typescript
// Obter caminho do projeto
const projectPath = await context.api.workspace.getProjectPath();

// Abrir arquivo
await context.api.workspace.openFile('/caminho/arquivo.ts');

// Mostrar mensagem
await context.api.workspace.showMessage('Mensagem', 'info');
```

#### Editor API

```typescript
// Obter conteúdo
const content = await context.api.editor.getContent();

// Definir conteúdo
await context.api.editor.setContent('novo conteúdo');

// Obter seleção
const selection = await context.api.editor.getSelection();
```

## Para Desenvolvedores da IDE

### Estrutura de Código

- **Types**: `src/renderer/app/extensions/types/`
- **Service**: `src/renderer/app/services/extension.service.ts`
- **Main Process**: `src/main/extensions/` (a criar)

### Carregando Extensões

O `ExtensionService` é responsável por:

1. Escanear diretório `extensions/`
2. Validar manifests
3. Carregar módulos JavaScript
4. Ativar extensões baseado em eventos
5. Gerenciar lifecycle

### Adicionando Novas APIs

1. Definir interface em `extension.interface.ts`
2. Implementar no `ExtensionService.createExtensionAPI()`
3. Expor via preload (se necessário)
4. Documentar no `EXTENSIONS_ARCHITECTURE.md`

## APIs Disponíveis

### Commands API
Registrar e executar comandos.

### Workspace API
Acessar informações do workspace e arquivos.

### Editor API
Interagir com o editor Monaco.

### Terminal API
Executar comandos no terminal.

### File System API
Operações de leitura/escrita de arquivos.

### Events API
Ouvir eventos da IDE (mudanças de arquivo, editor, etc).

### Config API
Acessar e modificar configurações.

## Exemplos

### Exemplos Disponíveis

1. **Exemplo Básico**: `docs/extensions/EXAMPLE_EXTENSION.md`
   - Extensão simples de formatação de código
   - Demonstra comandos básicos e APIs

2. **Validador de Tags**: `docs/extensions/TAG_VALIDATOR_EXTENSION.md`
   - **Extensão completa para identificar tags não fechadas** em HTML/XML
   - Analisa código e adiciona marcadores visuais
   - Validação automática ao editar
   - Configurações personalizáveis
   - Exemplo prático de análise de código e integração com editor

### Exemplo Simples - Hello World

```typescript
export async function activate(context: ExtensionContext) {
  const command = context.api.commands.registerCommand(
    'helloWorld',
    async () => {
      await context.api.workspace.showMessage('Hello, World!', 'info');
    }
  );
  
  context.subscriptions.push(command);
}
```

### Exemplo - Validador de Tags (Completo)

Veja `docs/extensions/TAG_VALIDATOR_EXTENSION.md` para o exemplo completo de uma extensão que:

- ✅ Identifica tags HTML/XML não fechadas
- ✅ Detecta tags de fechamento órfãs
- ✅ Adiciona marcadores visuais no editor
- ✅ Valida automaticamente ao editar
- ✅ Configurações personalizáveis
- ✅ Debounce para performance

Este é um exemplo real e funcional que demonstra análise de código, eventos e integração com o editor.

### Exemplo - Linter Customizado (Simplificado)

```typescript
export async function activate(context: ExtensionContext) {
  // Ouvir mudanças no editor
  const subscription = context.api.events.onEditorContentChanged(
    async (content) => {
      // Analisar código
      const errors = analyzeCode(content);
      
      // Adicionar marcadores de erro
      errors.forEach(error => {
        context.api.editor.addMarker({
          line: error.line,
          column: error.column,
          message: error.message,
          severity: 'error'
        });
      });
    }
  );
  
  context.subscriptions.push(subscription);
}
```

## Próximos Passos

- [ ] Implementar carregamento dinâmico de módulos
- [ ] Adicionar marketplace de extensões
- [ ] Criar ferramenta CLI para criar extensões
- [ ] Adicionar testes para extensões
- [ ] Documentar todas as APIs detalhadamente

