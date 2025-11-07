import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AgentProvider, ChatMessage, ChatResponse, AgentRequestOptions } from '../agent-provider.interface';
import { ElectronService } from '../electron.service';

/**
 * Exemplo de implementação de um provider para Claude (Anthropic)
 * Este é um exemplo de como criar um novo provider de agentes
 * 
 * Para usar este provider:
 * 1. Configure as credenciais da API Anthropic
 * 2. Registre este provider no main.ts
 * 3. Atualize o AGENT_PROVIDER token para usar ClaudeAgentProvider
 */
@Injectable({
  providedIn: 'root'
})
export class ClaudeAgentProvider implements AgentProvider {
  readonly name = 'claude';
  private apiKey: string | null = null;
  private apiUrl = 'https://api.anthropic.com/v1/messages';
  private defaultModel = 'claude-3-opus-20240229';

  constructor(private electronService: ElectronService) {
    this.loadConfig();
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  configure(config: { apiKey: string; model?: string }): void {
    this.apiKey = config.apiKey;
    if (config.model) {
      this.defaultModel = config.model;
    }
    this.saveConfig();
  }

  sendMessage(
    messages: ChatMessage[],
    options?: AgentRequestOptions
  ): Observable<ChatResponse> {
    if (!this.apiKey) {
      return throwError(() => new Error('API key não configurada. Por favor, configure sua chave da API Anthropic.'));
    }

    // TODO: Implementar chamada real para API Anthropic
    // A API do Claude tem uma estrutura diferente da OpenAI
    
    return new Observable(observer => {
      const enhancedMessages: ChatMessage[] = [...messages];
      const contextMessage = this.buildContextMessage(options);
      if (contextMessage) {
        enhancedMessages.unshift({
          role: 'system',
          content: contextMessage
        });
      }

      // Implementação exemplo
      fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options?.model || this.defaultModel,
          max_tokens: options?.maxTokens ?? 2000,
          messages: enhancedMessages.map(msg => ({
            role: msg.role === 'system' ? 'user' : msg.role,
            content: msg.content
          }))
        })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(error => {
            throw new Error(error.error?.message || `HTTP error! status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        const content = data.content[0]?.text || 'Resposta vazia';
        observer.next({ content });
        observer.complete();
      })
      .catch(error => {
        observer.error({
          content: '',
          error: error.message || 'Erro ao comunicar com a API do Claude'
        });
      });
    });
  }

  analyzeCode(code: string, filePath: string): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Analise este código e sugira melhorias:\n\nArquivo: ${filePath}\n\n\`\`\`\n${code}\n\`\`\``
    }];

    return this.sendMessage(messages);
  }

  generateCode(
    description: string,
    language: string = 'typescript',
    context?: string
  ): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Gere código ${language} para: ${description}\n\nForneça o código completo e funcional. Use o formato:\n\`\`\`${language}\n[código aqui]\n\`\`\``
    }];

    return this.sendMessage(messages, { projectContext: context });
  }

  explainCode(code: string, filePath: string): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Explique este código em português:\n\nArquivo: ${filePath}\n\n\`\`\`\n${code}\n\`\`\``
    }];

    return this.sendMessage(messages);
  }

  improveCode(
    code: string,
    filePath: string,
    improvements: string
  ): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Melhore este código seguindo estas instruções: ${improvements}\n\nArquivo: ${filePath}\n\nCódigo atual:\n\`\`\`\n${code}\n\`\`\`\n\nForneça o código completo melhorado.`
    }];

    return this.sendMessage(messages);
  }

  private loadConfig() {
    this.electronService.loadConfig().subscribe({
      next: (result) => {
        if (result.success && result.config?.claudeApiKey) {
          this.apiKey = result.config.claudeApiKey;
          if (result.config.claudeModel) {
            this.defaultModel = result.config.claudeModel;
          }
        }
      },
      error: (error) => {
        console.error('Erro ao carregar configuração:', error);
      }
    });
  }

  private buildContextMessage(options?: AgentRequestOptions): string {
    const contextParts: string[] = [];

    if (options?.projectContext) {
      contextParts.push(`Contexto do projeto:\n${options.projectContext}`);
    }

    if (options?.currentFile) {
      contextParts.push(`Arquivo em foco: ${options.currentFile}`);
      if (options.currentFileContent) {
        contextParts.push(`Conteúdo do arquivo:\n\`\`\`\n${options.currentFileContent}\n\`\`\``);
      }
    }

    if (options?.projectFilesInfo) {
      contextParts.push(`Informações adicionais:\n${options.projectFilesInfo}`);
    }

    if (options?.openFiles?.length) {
      const openFilesList = options.openFiles.map(file => `- ${file}`).join('\n');
      contextParts.push(`Arquivos abertos atualmente (${options.openFiles.length}):\n${openFilesList}`);
    }

    if (options?.canExecuteCommands) {
      contextParts.push('O usuário pode executar comandos no terminal; quando sugerir um comando, use a formatação `comando`.');
    }

    if (!contextParts.length) {
      return '';
    }

    return contextParts.join('\n\n');
  }

  private saveConfig() {
    this.electronService.loadConfig().subscribe({
      next: (result) => {
        const config = result.config || {};
        config.claudeApiKey = this.apiKey;
        config.claudeModel = this.defaultModel;
        
        this.electronService.saveConfig(config).subscribe({
          next: (saveResult) => {
            if (saveResult.success) {
              console.log('Configuração Claude salva com sucesso');
            }
          },
          error: (error) => {
            console.error('Erro ao salvar configuração:', error);
          }
        });
      }
    });
  }
}

