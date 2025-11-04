import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AgentProvider, ChatMessage, ChatResponse, AgentRequestOptions } from '../agent-provider.interface';
import { ElectronService } from '../electron.service';

@Injectable({
  providedIn: 'root'
})
export class OpenAIAgentProvider implements AgentProvider {
  readonly name = 'openai';
  private apiKey: string | null = null;
  private apiUrl = 'https://api.openai.com/v1/chat/completions';
  private defaultModel = 'gpt-4';

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
      return throwError(() => new Error('API key não configurada. Por favor, configure sua chave da OpenAI.'));
    }

    const systemMessage = this.buildSystemMessage(options);
    const allMessages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...messages
    ];

    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 2000;

    return new Observable(observer => {
      fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: allMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature,
          max_tokens: maxTokens
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

  private buildSystemMessage(options?: AgentRequestOptions): string {
    let contextText = '';
    
    if (options?.projectContext) {
      contextText += `Contexto do projeto atual:\n${options.projectContext}\n\n`;
    }

    if (options?.currentFile && options?.currentFileContent) {
      contextText += `Arquivo atual sendo editado: ${options.currentFile}\n`;
      contextText += `Conteúdo do arquivo:\n\`\`\`\n${options.currentFileContent}\n\`\`\`\n\n`;
    }

    // Adicionar informações sobre arquivos do projeto se disponível
    if (options?.projectFilesInfo) {
      contextText += `\nInformações sobre arquivos do projeto:\n${options.projectFilesInfo}\n\n`;
    }

    // Adicionar informação sobre execução de comandos
    let commandExecutionInfo = '';
    if (options?.canExecuteCommands) {
      commandExecutionInfo = `\n**IMPORTANTE - Execução de Comandos:**
O usuário pode executar comandos no terminal diretamente. Se você sugerir comandos (como npm, ng, yarn, etc.), eles podem ser executados automaticamente.
Quando sugerir comandos, use formatação clara com backticks, por exemplo: \`npm test\` ou \`ng serve\`.
Se o usuário pedir para executar algo, você pode sugerir o comando apropriado.\n\n`;
    }

    return `Você é um assistente de IA especializado em desenvolvimento de software. Você ajuda desenvolvedores a criar, modificar e melhorar código.
${commandExecutionInfo}

${contextText}Instruções:
- Sempre forneça código completo e funcional
- Quando fornecer código, use blocos de código com formatação markdown (\`\`\`typescript ... \`\`\`)
- Explique suas decisões quando apropriado
- Seja preciso e conciso
- Se o usuário pedir para criar ou modificar arquivos, forneça o código completo no formato correto
- Use TypeScript/JavaScript para projetos Angular
- Siga as melhores práticas de desenvolvimento
- Se o usuário pedir para criar um arquivo, forneça o caminho sugerido e o código completo
- Se o usuário pedir para modificar um arquivo, mostre as mudanças necessárias
- Se o usuário pedir para listar arquivos (ex: "liste os testes", "mostre arquivos HTML"), você tem acesso à lista de arquivos do projeto
- Quando mencionar arquivos, use os caminhos relativos fornecidos no contexto do projeto

**IMPORTANTE - Criação de Testes Unitários:**
Quando o usuário pedir para criar um teste unitário:
- Analise o código do arquivo fornecido completamente
- Identifique todos os métodos, propriedades e comportamentos que precisam ser testados
- Crie testes usando Jest ou Jasmine (padrão Angular)
- Use TestBed para componentes Angular
- Mock todas as dependências (services, imports, etc.)
- Inclua testes para casos de sucesso, erro e edge cases
- Teste inicialização, métodos públicos, eventos, e propriedades
- Para componentes Angular, teste renderização, inputs, outputs e interações do usuário
- Para services, teste métodos públicos e tratamento de erros
- Forneça o código completo do arquivo .spec.ts formatado corretamente
- Use imports apropriados do Angular (TestBed, ComponentFixture, etc.)
- Exemplo de estrutura básica:
  \`\`\`typescript
  import { ComponentFixture, TestBed } from '@angular/core/testing';
  import { ComponentName } from './component-name';
  
  describe('ComponentName', () => {
    let component: ComponentName;
    let fixture: ComponentFixture<ComponentName>;
    
    beforeEach(() => {
      TestBed.configureTestingModule({
        declarations: [ComponentName]
      });
      fixture = TestBed.createComponent(ComponentName);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
    
    it('should create', () => {
      expect(component).toBeTruthy();
    });
    
    // Adicione mais testes aqui
  });
  \`\`\``;
  }

  private loadConfig() {
    this.electronService.loadConfig().subscribe({
      next: (result) => {
        if (result.success && result.config?.openaiApiKey) {
          this.apiKey = result.config.openaiApiKey;
          if (result.config.openaiModel) {
            this.defaultModel = result.config.openaiModel;
          }
        }
      },
      error: (error) => {
        console.error('Erro ao carregar configuração:', error);
      }
    });
  }

  private saveConfig() {
    this.electronService.loadConfig().subscribe({
      next: (result) => {
        const config = result.config || {};
        config.openaiApiKey = this.apiKey;
        config.openaiModel = this.defaultModel;
        
        this.electronService.saveConfig(config).subscribe({
          next: (saveResult) => {
            if (saveResult.success) {
              console.log('Configuração OpenAI salva com sucesso');
            } else {
              console.error('Erro ao salvar configuração:', saveResult.error);
            }
          },
          error: (error) => {
            console.error('Erro ao salvar configuração:', error);
          }
        });
      },
      error: (error) => {
        console.error('Erro ao carregar configuração antes de salvar:', error);
        this.electronService.saveConfig({
          openaiApiKey: this.apiKey,
          openaiModel: this.defaultModel
        }).subscribe();
      }
    });
  }
}

