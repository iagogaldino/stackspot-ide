# Proposta MVP - IDE para Projetos Angular

## Visão Geral

Desenvolver uma IDE simples inspirada no VS Code, focada em projetos Angular. O MVP será uma aplicação desktop usando tecnologias web modernas.

## Stack Tecnológica Recomendada

### Opção 1: Electron + Angular ⭐ (RECOMENDADA)
- **Framework**: Electron + Angular
- **Editor de Código**: Monaco Editor (mesmo editor do VS Code)
- **Linguagem**: TypeScript
- **Vantagens**: 
  - ✅ **Consistência**: IDE para Angular feita com Angular
  - ✅ **TypeScript nativo**: Mesma linguagem do projeto e da IDE
  - ✅ **Conhecimento**: Se já conhece Angular, já sabe a stack
  - ✅ **Reutiliza componentes do VS Code** (Monaco Editor)
  - ✅ **Acesso completo ao sistema de arquivos** (via Electron)
  - ✅ **Suporte nativo a Node.js**
  - ✅ **Ecossistema maduro** (Angular + Electron)
  - ✅ **Componentes reutilizáveis**: Pode reutilizar componentes Angular Material

### Opção 2: Electron + React
- **Framework**: Electron + React
- **Editor de Código**: Monaco Editor
- **Vantagens**: 
  - Ecossistema muito popular
  - Muitos exemplos disponíveis
  - Mais leve que Angular

### Opção 3: Tauri + Angular
- **Framework**: Tauri (Rust + Web) + Angular
- **Editor**: Monaco Editor
- **Vantagens**: 
  - Bundle menor
  - Mais seguro
  - Desempenho melhor
  - Porém: menos maduro que Electron

### Opção 4: Web App Progresiva (PWA)
- **Framework**: Angular + PWA
- **Editor**: Monaco Editor
- **Limitações**: Acesso limitado ao sistema de arquivos

## Arquitetura do MVP

### Componentes Principais

1. **Editor de Código**
   - Monaco Editor (Microsoft)
   - Suporte a TypeScript, HTML, CSS, JSON
   - Syntax highlighting
   - Auto-complete básico

2. **Gerenciador de Arquivos**
   - Árvore de arquivos do projeto
   - Criar, renomear, deletar arquivos
   - Navegação por pastas

3. **Terminal Integrado**
   - xterm.js ou node-pty
   - Executar comandos Angular CLI
   - `ng serve`, `ng build`, `ng test`

4. **Painel de Projetos**
   - Lista de projetos recentes
   - Criar novo projeto Angular
   - Abrir projeto existente

5. **Painel de Build/Output**
   - Mostrar logs de compilação
   - Erros e warnings
   - Status do servidor de desenvolvimento

## Funcionalidades MVP (Phase 1)

### Essenciais
- ✅ Abrir projeto Angular existente
- ✅ Visualizar estrutura de arquivos
- ✅ Editar arquivos TypeScript, HTML, CSS
- ✅ Terminal integrado
- ✅ Executar `ng serve` e abrir no navegador
- ✅ Ver logs de compilação

### Nice to Have (Phase 2)
- 🔄 Criar novo projeto Angular
- 🔄 Auto-complete para Angular (decorators, imports)
- 🔄 Navegação entre arquivos (Ctrl+P)
- 🔄 Busca em arquivos
- 🔄 Git básico integrado

## Estrutura de Pastas Proposta (Electron + Angular)

```
MyIDE/
├── src/
│   ├── main/              # Processo principal (Electron)
│   │   ├── main.ts       # Entry point Electron
│   │   ├── window.ts     # Gerenciamento de janelas
│   │   └── fileSystem.ts # Operações de arquivo
│   ├── renderer/          # Processo de renderização (Angular App)
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── editor/
│   │   │   │   ├── file-tree/
│   │   │   │   ├── terminal/
│   │   │   │   └── project-panel/
│   │   │   ├── services/
│   │   │   │   ├── file.service.ts
│   │   │   │   ├── terminal.service.ts
│   │   │   │   └── electron.service.ts
│   │   │   ├── app.component.ts
│   │   │   ├── app.component.html
│   │   │   └── app.module.ts (ou standalone)
│   │   ├── index.html
│   │   └── main.ts        # Bootstrap Angular
│   └── shared/            # Código compartilhado
├── angular.json           # Configuração Angular
├── package.json
└── README.md
```

## Tecnologias Específicas (Electron + Angular)

### Core
- **Electron**: ^27.0.0
- **Angular**: ^17.0.0 ou ^18.0.0 (standalone components)
- **TypeScript**: ^5.0.0
- **Monaco Editor**: ^0.44.0
- **xterm.js**: ^5.0.0 (terminal)
- **node-pty**: ^1.0.0 (terminal nativo)

### UI/Styling
- **Angular Material** (recomendado) ou **Tailwind CSS**
- **Angular CDK** (para componentes avançados)
- **Angular Router** (navegação)

### Utilitários
- **chokidar**: Observar mudanças em arquivos
- **fs-extra**: Operações de arquivo
- **rxjs**: Já incluído no Angular (para observables)

### Comunicação Electron <-> Angular
- **IPC (Inter-Process Communication)**: Electron para comunicação entre processos
- **Service Pattern**: Criar services Angular para encapsular comunicação com Electron

## Fluxo de Trabalho MVP

1. **Abrir Aplicação**
   - Tela inicial: Lista de projetos recentes + botão "Abrir Projeto"

2. **Abrir Projeto Angular**
   - Selecionar pasta do projeto
   - Validar se é projeto Angular (verificar `angular.json`)
   - Carregar estrutura de arquivos

3. **Interface Principal**
   - Sidebar esquerda: Árvore de arquivos
   - Centro: Editor Monaco
   - Sidebar direita: Painel de propriedades (opcional)
   - Bottom: Terminal integrado

4. **Executar Projeto**
   - Botão "Run" → executa `ng serve`
   - Terminal mostra logs
   - Auto-abre navegador quando pronto

## Próximos Passos para Implementação

### Sprint 1: Setup Base
1. Configurar projeto Electron + Angular
   - `ng new MyIDE --routing`
   - Configurar Electron main process
   - Integrar Electron com Angular
2. Integrar Monaco Editor no Angular
3. Criar layout básico (sidebar + editor) usando Angular Material

### Sprint 2: Sistema de Arquivos
1. Criar service para comunicação Electron (IPC)
2. Implementar file tree component (Angular)
3. Abrir arquivos no editor Monaco
4. Salvar alterações

### Sprint 3: Terminal
1. Integrar xterm.js no Angular
2. Criar terminal service com IPC
3. Executar comandos Angular CLI
4. Mostrar output em tempo real

### Sprint 4: Integração Angular
1. Detectar projeto Angular (validar `angular.json`)
2. Executar `ng serve` via terminal
3. Abrir navegador automaticamente
4. Monitorar status do servidor

### Sprint 5: Melhorias
1. Projetos recentes (localStorage)
2. Melhorias de UI/UX (Angular Material)
3. Testes básicos (Jasmine/Karma)
4. Auto-complete Angular no Monaco

## Desafios e Considerações

### Desafios Técnicos
- **Performance**: Monaco Editor pode ser pesado com arquivos grandes
- **Terminal**: Integração com processos Node pode ser complexa
- **Sincronização**: Manter estado entre processos Electron

### Soluções
- Lazy loading de arquivos grandes (Angular lazy loading)
- Virtual scrolling na file tree (Angular CDK Scrolling)
- State management (Angular Services + RxJS ou NgRx)
- Comunicação IPC: Services Angular que se comunicam com Electron main process

## Recursos de Aprendizado

- [Electron Docs](https://www.electronjs.org/docs)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [xterm.js](https://xtermjs.org/)
- [Angular CLI](https://angular.io/cli)

## Alternativas Rápidas para MVP

Se quiser um MVP ainda mais rápido, considere:

1. **Fork do VS Code**: Modificar o VS Code open-source
2. **Theia IDE**: Framework baseado em VS Code
3. **CodeSandbox/StackBlitz**: Inspirar-se em IDEs web

## Arquitetura de Comunicação Electron + Angular

### Como funciona a comunicação:

```
┌─────────────────────────────────────┐
│   Electron Main Process             │
│   (Node.js - acesso ao sistema)    │
│   - File System                     │
│   - Processos (ng serve)           │
│   - IPC handlers                   │
└──────────────┬──────────────────────┘
               │ IPC (ipcMain/ipcRenderer)
               │
┌──────────────▼──────────────────────┐
│   Angular Renderer Process          │
│   (Browser - UI)                    │
│   - Components Angular              │
│   - Services (IPC communication)    │
│   - Monaco Editor                   │
└─────────────────────────────────────┘
```

### Exemplo de Service Angular para IPC:

```typescript
// electron.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ElectronService {
  private ipcRenderer = (window as any).require('electron').ipcRenderer;

  openFile(path: string): Observable<string> {
    return new Observable(observer => {
      this.ipcRenderer.send('read-file', path);
      this.ipcRenderer.once('file-content', (_, content) => {
        observer.next(content);
        observer.complete();
      });
    });
  }
}
```

---

**Recomendação**: Começar com **Electron + Angular + Monaco Editor** para ter consistência total, controle e um MVP funcional em 2-3 semanas. A stack Angular garante que você trabalhe com TypeScript em toda a aplicação!

