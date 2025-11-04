import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ElectronService } from './electron.service';
import { ChatMessage, ChatResponse } from './agent-provider.interface';

/**
 * @deprecated Este serviço está deprecated. Use AgentService ao invés disso.
 * Este serviço será mantido apenas para compatibilidade com código legado.
 * 
 * Para migrar:
 * - Substitua `OpenAIService` por `AgentService`
 * - Use `agentService.sendMessage()` ao invés de `openAIService.sendMessage()`
 * - Veja AGENTS_README.md para mais detalhes
 */
@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private apiKey: string | null = null;
  private apiUrl = 'https://api.openai.com/v1/chat/completions';
  private model = 'gpt-4'; // ou 'gpt-3.5-turbo' para economia

  constructor(private electronService: ElectronService) {
    // Carregar configuração do arquivo JSON
    this.loadConfig();
  }

  private loadConfig() {
    this.electronService.loadConfig().subscribe({
      next: (result) => {
        if (result.success && result.config && result.config.openaiApiKey) {
          this.apiKey = result.config.openaiApiKey;
        }
      },
      error: (error) => {
        console.error('Erro ao carregar configuração:', error);
      }
    });
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    
    // Salvar no arquivo JSON da IDE
    this.electronService.loadConfig().subscribe({
      next: (result) => {
        const config = result.config || {};
        config.openaiApiKey = apiKey;
        
        this.electronService.saveConfig(config).subscribe({
          next: (saveResult) => {
            if (saveResult.success) {
              console.log('API key salva com sucesso no arquivo de configuração');
            } else {
              console.error('Erro ao salvar API key:', saveResult.error);
            }
          },
          error: (error) => {
            console.error('Erro ao salvar configuração:', error);
          }
        });
      },
      error: (error) => {
        console.error('Erro ao carregar configuração antes de salvar:', error);
        // Tentar salvar mesmo assim
        this.electronService.saveConfig({ openaiApiKey: apiKey }).subscribe();
      }
    });
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  sendMessage(messages: ChatMessage[], projectContext?: string): Observable<ChatResponse> {
    if (!this.apiKey) {
      return throwError(() => new Error('API key não configurada. Por favor, configure sua chave da OpenAI.'));
    }

    // Adicionar contexto do projeto se fornecido
    const contextText = projectContext ? `Contexto do projeto atual:\n${projectContext}\n\n` : '';
    const systemMessages: ChatMessage[] = [{
      role: 'system',
      content: `Você é um assistente de IA especializado em desenvolvimento de software. Você ajuda desenvolvedores a criar, modificar e melhorar código.

${contextText}Instruções:
- Sempre forneça código completo e funcional
- Quando fornecer código, use blocos de código com formatação markdown (\`\`\`typescript ... \`\`\`)
- Explique suas decisões quando apropriado
- Seja preciso e conciso
- Se o usuário pedir para criar ou modificar arquivos, forneça o código completo no formato correto
- Use TypeScript/JavaScript para projetos Angular
- Siga as melhores práticas de desenvolvimento
- Se o usuário pedir para criar um arquivo, forneça o caminho sugerido e o código completo
- Se o usuário pedir para modificar um arquivo, mostre as mudanças necessárias`
    }];

    const allMessages = [...systemMessages, ...messages];

    return new Observable(observer => {
      fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: allMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.7,
          max_tokens: 2000
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
        const content = data.choices[0]?.message?.content || 'Resposta vazia';
        observer.next({ content });
        observer.complete();
      })
      .catch(error => {
        observer.error({
          content: '',
          error: error.message || 'Erro ao comunicar com a API da OpenAI'
        });
      });
    });
  }

  // Método para analisar código e sugerir melhorias
  analyzeCode(code: string, filePath: string): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Analise este código e sugira melhorias:\n\nArquivo: ${filePath}\n\n\`\`\`\n${code}\n\`\`\``
    }];

    return this.sendMessage(messages);
  }

  // Método para gerar código baseado em descrição
  generateCode(description: string, language: string = 'typescript', projectContext?: string): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Gere código ${language} para: ${description}\n\nForneça o código completo e funcional. Use o formato:\n\`\`\`${language}\n[código aqui]\n\`\`\``
    }];

    return this.sendMessage(messages, projectContext);
  }

  // Método para explicar código
  explainCode(code: string, filePath: string): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Explique este código em português:\n\nArquivo: ${filePath}\n\n\`\`\`\n${code}\n\`\`\``
    }];

    return this.sendMessage(messages);
  }

  // Método para melhorar código
  improveCode(code: string, filePath: string, improvements: string): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Melhore este código seguindo estas instruções: ${improvements}\n\nArquivo: ${filePath}\n\nCódigo atual:\n\`\`\`\n${code}\n\`\`\`\n\nForneça o código completo melhorado.`
    }];

    return this.sendMessage(messages);
  }
}

