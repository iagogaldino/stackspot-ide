# Sistema de Extensões - MyIDE

## Visão Geral

O sistema de extensões permite que desenvolvedores criem plugins que estendem a funcionalidade da IDE. As extensões podem:
- Adicionar novos comandos e atalhos de teclado
- Criar novos painéis e visualizações
- Integrar com ferramentas externas
- Adicionar novos formatadores e linters
- Criar novos provedores de IA
- Adicionar funcionalidades ao editor (Monaco)

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    MyIDE Core                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │         Extension Manager Service                  │ │
│  │  - Carrega extensões                              │ │
│  │  - Gerencia lifecycle                             │ │
│  │  - Expõe APIs da IDE                              │ │
│  └───────────────────────────────────────────────────┘ │
│                          │                               │
│                          │ registra                      │
│                          ▼                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │         Extension API (Window.myIDE)              │ │
│  │  - Commands API                                  │ │
│  │  - Workspace API                                 │ │
│  │  - Editor API                                    │ │
│  │  - Terminal API                                  │ │
│  │  - File System API                               │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ usa
                          │
┌─────────────────────────────────────────────────────────┐
│                    Extensões                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │  extension.json (Manifest)                       │ │
│  │  main.js (Entry Point)                           │ │
│  │  package.json (Dependências)                     │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Estrutura de Diretórios

```
MyIDE/
├── src/
│   ├── main/
│   │   └── extensions/          # Gerenciamento de extensões no main process
│   │       ├── extension-manager.ts
│   │       └── extension-loader.ts
│   └── renderer/
│       └── app/
│           ├── services/
│           │   └── extension.service.ts
│           ├── extensions/
│           │   ├── api/
│           │   │   ├── commands.api.ts
│           │   │   ├── workspace.api.ts
│           │   │   ├── editor.api.ts
│           │   │   └── terminal.api.ts
│           │   └── types/
│           │       ├── extension.interface.ts
│           │       └── extension-manifest.interface.ts
│           └── components/
│               └── extensions/
│                   ├── extension-manager.component.ts
│                   └── extension-manager.component.html
├── extensions/                   # Diretório de extensões instaladas
│   └── {extension-id}/
│       ├── package.json
│       ├── extension.json
│       └── dist/
│           └── main.js
└── docs/
    └── extensions/
        └── EXAMPLE_EXTENSION.md
```

## Manifest da Extensão (extension.json)

```json
{
  "name": "minha-extensao",
  "displayName": "Minha Extensão",
  "version": "1.0.0",
  "description": "Descrição da extensão",
  "publisher": "seu-nome",
  "engines": {
    "myide": "^1.0.0"
  },
  "main": "./dist/main.js",
  "activationEvents": [
    "onStart",
    "onCommand:meuComando"
  ],
  "contributes": {
    "commands": [
      {
        "command": "meuComando",
        "title": "Meu Comando",
        "category": "Extensão"
      }
    ],
    "keybindings": [
      {
        "command": "meuComando",
        "key": "ctrl+shift+m",
        "mac": "cmd+shift+m"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "meuComando",
          "when": "editorTextFocus"
        }
      ]
    }
  }
}
```

## API de Extensões

### 1. Commands API

Permite registrar e executar comandos:

```typescript
// Registrar comando
window.myIDE.commands.registerCommand('meuComando', (args) => {
  console.log('Comando executado!', args);
});

// Executar comando
window.myIDE.commands.executeCommand('outroComando', { data: 'valor' });
```

### 2. Workspace API

Acessa informações do workspace:

```typescript
// Obter caminho do projeto
const projectPath = await window.myIDE.workspace.getProjectPath();

// Abrir arquivo
await window.myIDE.workspace.openFile('/caminho/para/arquivo.ts');

// Criar arquivo
await window.myIDE.workspace.createFile('/caminho/novo-arquivo.ts', 'conteúdo');
```

### 3. Editor API

Interage com o editor Monaco:

```typescript
// Obter conteúdo do editor ativo
const content = await window.myIDE.editor.getContent();

// Definir conteúdo
await window.myIDE.editor.setContent('novo conteúdo');

// Obter seleção
const selection = await window.myIDE.editor.getSelection();

// Adicionar marcador de texto
window.myIDE.editor.addMarker({
  line: 10,
  column: 5,
  message: 'Erro aqui',
  severity: 'error'
});
```

### 4. Terminal API

Executa comandos no terminal:

```typescript
// Executar comando
await window.myIDE.terminal.executeCommand('ng build');

// Obter output
const output = await window.myIDE.terminal.getOutput();
```

### 5. File System API

Operações de arquivo:

```typescript
// Ler arquivo
const content = await window.myIDE.fs.readFile('/caminho/arquivo.ts');

// Escrever arquivo
await window.myIDE.fs.writeFile('/caminho/arquivo.ts', 'conteúdo');

// Listar arquivos
const files = await window.myIDE.fs.listFiles('/caminho', ['.ts', '.html']);
```

### 6. Events API

Inscrever-se em eventos:

```typescript
// Ouvir mudanças de arquivo
window.myIDE.events.onFileChanged((event) => {
  console.log('Arquivo mudou:', event.path);
});

// Ouvir mudanças no editor
window.myIDE.events.onEditorContentChanged((content) => {
  console.log('Conteúdo mudou');
});
```

## Lifecycle de uma Extensão

1. **Descoberta**: Extension Manager escaneia o diretório `extensions/`
2. **Validação**: Valida o `extension.json` e verifica compatibilidade
3. **Carregamento**: Carrega o arquivo `main.js` da extensão
4. **Ativação**: Executa `activate()` quando um evento de ativação ocorre
5. **Execução**: Extensão pode usar as APIs
6. **Desativação**: Executa `deactivate()` quando necessário

## Tipos de Extensões

### 1. Command Extensions
Extensões que adicionam comandos e atalhos.

### 2. Language Extensions
Extensões que adicionam suporte a linguagens (syntax highlighting, autocomplete).

### 3. UI Extensions
Extensões que adicionam novos painéis e visualizações.

### 4. Integration Extensions
Extensões que integram com ferramentas externas (Git, Docker, etc).

### 5. AI Provider Extensions
Extensões que adicionam novos provedores de IA (similar ao sistema atual de agentes).

## Exemplo de Extensão

Veja `docs/extensions/EXAMPLE_EXTENSION.md` para um exemplo completo.

## Segurança

- Extensões são executadas em contexto isolado
- APIs são expostas de forma controlada via preload
- Validação de manifest antes do carregamento
- Sandboxing de código extensão

## Próximos Passos

1. Implementar Extension Manager Service
2. Criar APIs de extensão no preload
3. Criar UI de gerenciamento de extensões
4. Documentar APIs detalhadamente
5. Criar ferramentas de desenvolvimento (CLI para criar extensões)

