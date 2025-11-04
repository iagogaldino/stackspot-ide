# Sistema de Agentes Desacoplado

Este documento explica como funciona o sistema de agentes desacoplado da IDE e como adicionar novos providers.

## Arquitetura

O sistema foi projetado para ser totalmente desacoplado, permitindo que diferentes APIs de agentes sejam integradas facilmente:

```
┌─────────────────────────────────────────┐
│         ChatComponent                   │
│  (Componente de UI)                     │
└──────────────┬──────────────────────────┘
               │
               │ usa
               ▼
┌─────────────────────────────────────────┐
│         AgentService                    │
│  (Serviço central de agentes)          │
└──────────────┬──────────────────────────┘
               │
               │ delega para
               ▼
┌─────────────────────────────────────────┐
│      AgentProvider (Interface)          │
│  - sendMessage()                        │
│  - analyzeCode()                        │
│  - generateCode()                       │
│  - explainCode()                        │
│  - improveCode()                        │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────┐
│ OpenAI       │  │ Claude       │
│ Provider     │  │ Provider     │
│              │  │ (exemplo)    │
└──────────────┘  └──────────────┘
```

## Estrutura de Arquivos

```
src/renderer/app/services/
├── agent-provider.interface.ts      # Interface que todos os providers devem implementar
├── agent.service.ts                 # Serviço central que gerencia o provider atual
├── providers/
│   ├── openai-agent.provider.ts    # Implementação para OpenAI
│   └── example-claude-agent.provider.ts  # Exemplo de implementação para Claude
└── AGENTS_README.md                 # Este arquivo
```

## Como Adicionar um Novo Provider

### Passo 1: Criar o Provider

Crie um novo arquivo em `src/renderer/app/services/providers/` implementando a interface `AgentProvider`:

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AgentProvider, ChatMessage, ChatResponse, AgentRequestOptions } from '../agent-provider.interface';
import { ElectronService } from '../electron.service';

@Injectable({
  providedIn: 'root'
})
export class MeuNovoProvider implements AgentProvider {
  readonly name = 'meu-provider';
  private apiKey: string | null = null;

  constructor(private electronService: ElectronService) {}

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  configure(config: { apiKey: string }): void {
    this.apiKey = config.apiKey;
    // Salvar configuração
  }

  sendMessage(
    messages: ChatMessage[],
    options?: AgentRequestOptions
  ): Observable<ChatResponse> {
    // Implementar chamada para sua API
    // ...
  }

  // Implementar outros métodos necessários...
  analyzeCode(code: string, filePath: string): Observable<ChatResponse> { }
  generateCode(description: string, language: string, context?: string): Observable<ChatResponse> { }
  explainCode(code: string, filePath: string): Observable<ChatResponse> { }
  improveCode(code: string, filePath: string, improvements: string): Observable<ChatResponse> { }
}
```

### Passo 2: Registrar no main.ts

Atualize `src/renderer/main.ts` para registrar o novo provider:

```typescript
import { MeuNovoProvider } from './app/services/providers/meu-novo-provider';
import { AGENT_PROVIDER } from './app/services/agent.service';

bootstrapApplication(AppComponent, {
  providers: [
    // ... outros providers
    MeuNovoProvider,
    {
      provide: AGENT_PROVIDER,
      useExisting: MeuNovoProvider  // Ou OpenAIAgentProvider, ClaudeAgentProvider, etc.
    }
  ]
});
```

### Passo 3: Configurar no Componente de Chat

O `ChatComponent` já está preparado para usar qualquer provider através do `AgentService`. Não é necessário alterar o componente.

## Interface AgentProvider

A interface `AgentProvider` define os métodos que todos os providers devem implementar:

```typescript
interface AgentProvider {
  readonly name: string;
  isConfigured(): boolean;
  configure(config: any): void;
  sendMessage(messages: ChatMessage[], options?: AgentRequestOptions): Observable<ChatResponse>;
  analyzeCode(code: string, filePath: string): Observable<ChatResponse>;
  generateCode(description: string, language: string, context?: string): Observable<ChatResponse>;
  explainCode(code: string, filePath: string): Observable<ChatResponse>;
  improveCode(code: string, filePath: string, improvements: string): Observable<ChatResponse>;
}
```

## AgentRequestOptions

Opções que podem ser passadas ao enviar mensagens:

```typescript
interface AgentRequestOptions {
  projectContext?: string;      // Contexto do projeto
  currentFile?: string;          // Arquivo atual sendo editado
  currentFileContent?: string;  // Conteúdo do arquivo atual
  temperature?: number;          // Temperatura (0-1)
  maxTokens?: number;            // Máximo de tokens
  model?: string;                // Modelo específico
}
```

## Exemplos de Providers

### OpenAI (Já implementado)
- Provider: `OpenAIAgentProvider`
- Configuração: `{ apiKey: string, model?: string }`
- Modelo padrão: `gpt-4`

### Claude (Exemplo)
- Provider: `ClaudeAgentProvider` (arquivo exemplo)
- Configuração: `{ apiKey: string, model?: string }`
- Modelo padrão: `claude-3-opus-20240229`

## Vantagens da Arquitetura Desacoplada

1. **Flexibilidade**: Fácil trocar entre diferentes providers
2. **Extensibilidade**: Adicionar novos providers é simples
3. **Testabilidade**: Cada provider pode ser testado isoladamente
4. **Manutenibilidade**: Código organizado e separado por responsabilidade
5. **Reutilização**: O `AgentService` centraliza a lógica comum

## Próximos Passos

- [ ] Adicionar suporte para múltiplos providers simultâneos
- [ ] Criar UI para seleção de provider
- [ ] Adicionar cache de respostas
- [ ] Implementar retry automático
- [ ] Adicionar métricas e logging

