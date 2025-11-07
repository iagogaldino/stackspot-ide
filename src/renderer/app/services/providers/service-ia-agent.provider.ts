import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { AgentProvider, ChatMessage, ChatResponse, AgentRequestOptions } from '../agent-provider.interface';
import { ElectronService } from '../electron.service';

interface ServiceIAResponse {
  message?: string;
  content?: string;
  error?: string;
}

interface QueueItem {
  payload: { message: string };
  resolve: (response: ServiceIAResponse | string) => void;
  reject: (error: unknown) => void;
  cancelled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceIAAgentProvider implements AgentProvider, OnDestroy {
  readonly name = 'service-ia';

  private serverUrl: string | null = 'http://localhost:3000';
  private threadId: string | null = null;
  private socket: Socket | null = null;
  private connectPromise: Promise<void> | null = null;
  private requestQueue: QueueItem[] = [];
  private processingQueue = false;
  private readonly responseTimeoutMs = 60000;

  constructor(private electronService: ElectronService) {
    this.loadConfig();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  isConfigured(): boolean {
    return !!this.serverUrl;
  }

  configure(config: { serviceUrl?: string; resetThread?: boolean }): void {
    if (config.serviceUrl && config.serviceUrl !== this.serverUrl) {
      this.serverUrl = config.serviceUrl;
      this.reconnect();
    }

    if (config.resetThread) {
      this.threadId = null;
    }

    this.saveConfig();
  }

  sendMessage(messages: ChatMessage[], options?: AgentRequestOptions): Observable<ChatResponse> {
    if (!this.serverUrl) {
      return new Observable<ChatResponse>((observer) => {
        observer.error({
          content: '',
          error: 'ServiceIA não configurado. Informe a URL do serviço nas configurações.'
        });
      });
    }

    const prompt = this.buildPrompt(messages, options);

    return new Observable<ChatResponse>((observer) => {
      const queueItem: QueueItem = {
        payload: { message: prompt },
        resolve: (response) => {
          try {
            const content = this.normalizeResponse(response);
            observer.next({ content });
            observer.complete();
          } catch (error: any) {
            observer.error({
              content: '',
              error: this.normalizeError(error)
            });
          }
        },
        reject: (error) => {
          observer.error({
            content: '',
            error: this.normalizeError(error)
          });
        },
        cancelled: false
      };

      this.enqueue(queueItem);

      return () => {
        queueItem.cancelled = true;
      };
    });
  }

  analyzeCode(code: string, filePath: string): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Analise o código abaixo e sugira melhorias específicas para o arquivo ${filePath}:\n\n\`\`\`typescript\n${code}\n\`\`\``
    }];

    return this.sendMessage(messages, {
      currentFile: filePath,
      currentFileContent: code,
      projectContext: `Análise de código solicitada para ${filePath}`
    });
  }

  generateCode(description: string, language: string = 'typescript', context?: string): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Gere código ${language} com base na seguinte descrição:\n\n${description}\n\nRetorne apenas o código em um bloco markdown.`
    }];

    return this.sendMessage(messages, {
      projectContext: context
    });
  }

  explainCode(code: string, filePath: string): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Explique detalhadamente o que faz o seguinte arquivo (${filePath}):\n\n\`\`\`typescript\n${code}\n\`\`\``
    }];

    return this.sendMessage(messages, {
      currentFile: filePath,
      currentFileContent: code
    });
  }

  improveCode(code: string, filePath: string, improvements: string): Observable<ChatResponse> {
    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Melhore o código do arquivo ${filePath} seguindo estas instruções:\n${improvements}\n\nCódigo atual:\n\`\`\`typescript\n${code}\n\`\`\`\n\nRetorne o código completo atualizado dentro de um bloco markdown.`
    }];

    return this.sendMessage(messages, {
      currentFile: filePath,
      currentFileContent: code,
      projectContext: `Solicitação de melhorias para ${filePath}`
    });
  }

  private enqueue(item: QueueItem): void {
    this.requestQueue.push(item);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue) {
      return;
    }

    while (this.requestQueue.length > 0) {
      const current = this.requestQueue[0];

      if (current.cancelled) {
        this.requestQueue.shift();
        continue;
      }

      try {
        await this.ensureConnection();
      } catch (error) {
        current.reject(error);
        this.requestQueue.shift();
        continue;
      }

      const socket = this.socket;
      if (!socket || !socket.connected) {
        current.reject(new Error('Não foi possível conectar ao ServiceIA.'));
        this.requestQueue.shift();
        continue;
      }

      this.processingQueue = true;

      const onResponse = (data: ServiceIAResponse | string) => {
        cleanup();
        this.requestQueue.shift();
        if (!current.cancelled) {
          current.resolve(data);
        }
        this.processingQueue = false;
        this.processQueue();
      };

      const onError = (error: unknown) => {
        cleanup();
        this.requestQueue.shift();
        current.reject(error);
        this.processingQueue = false;
        this.processQueue();
      };

      const timeoutHandle = setTimeout(() => {
        cleanup();
        this.requestQueue.shift();
        current.reject(new Error('Tempo limite excedido ao aguardar resposta do ServiceIA.'));
        this.processingQueue = false;
        this.processQueue();
      }, this.responseTimeoutMs);

      const cleanup = () => {
        clearTimeout(timeoutHandle);
        socket.off('response', onResponse);
        socket.off('error', onError);
      };

      socket.once('response', onResponse);
      socket.once('error', onError);
      socket.emit('message', current.payload);
      return;
    }
  }

  private ensureConnection(): Promise<void> {
    if (!this.serverUrl) {
      return Promise.reject(new Error('ServiceIA não configurado.'));
    }

    if (this.socket?.connected) {
      return Promise.resolve();
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise<void>((resolve, reject) => {
      try {
        this.createSocket();
        if (!this.socket) {
          reject(new Error('Falha ao inicializar conexão com ServiceIA.'));
          return;
        }

        const socket = this.socket;

        const onConnect = () => {
          cleanup();
          if (this.threadId) {
            socket.emit('restore_thread', { threadId: this.threadId });
          }
          resolve();
        };

        const onConnectError = (error: unknown) => {
          cleanup();
          reject(error instanceof Error ? error : new Error(this.normalizeError(error)));
        };

        const cleanup = () => {
          socket.off('connect', onConnect);
          socket.off('connect_error', onConnectError);
        };

        socket.on('connect', onConnect);
        socket.on('connect_error', onConnectError);

        if (!socket.connected) {
          socket.connect();
        } else {
          onConnect();
        }
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Erro desconhecido ao conectar ao ServiceIA.'));
      }
    }).finally(() => {
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  private createSocket(): void {
    if (!this.serverUrl) {
      return;
    }

    this.disconnect();

    this.socket = io(this.serverUrl, {
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });

    const socket = this.socket;

    socket.on('thread_created', (data: { threadId?: string }) => {
      if (data?.threadId) {
        this.threadId = data.threadId;
        this.saveConfig();
      }
    });

    socket.on('thread_restored', (data: { threadId?: string }) => {
      if (data?.threadId) {
        this.threadId = data.threadId;
        this.saveConfig();
      }
    });

    socket.on('disconnect', () => {
      this.processingQueue = false;
    });
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.off();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private reconnect(): void {
    this.disconnect();
    this.processQueue();
  }

  private buildPrompt(messages: ChatMessage[], options?: AgentRequestOptions): string {
    const contextParts: string[] = [];

    if (options?.projectContext) {
      contextParts.push(`Contexto do projeto:\n${options.projectContext}`);
    }

    if (options?.currentFile) {
      const fileHeader = `Arquivo atual: ${options.currentFile}`;
      if (options.currentFileContent) {
        contextParts.push(`${fileHeader}\n\`\`\`\n${options.currentFileContent}\n\`\`\``);
      } else {
        contextParts.push(fileHeader);
      }
    }

    if (options?.projectFilesInfo) {
      contextParts.push(`Informações adicionais do projeto:\n${options.projectFilesInfo}`);
    }

    if (options?.openFiles?.length) {
      const openFilesList = options.openFiles.map(file => `- ${file}`).join('\n');
      contextParts.push(`Arquivos abertos atualmente (${options.openFiles.length}):\n${openFilesList}`);
    }

    if (options?.canExecuteCommands) {
      contextParts.push('O usuário pode executar comandos no terminal. Sugira comandos formatados com backticks (`comando`).');
    }

    const conversation = messages.map((message) => {
      const roleLabel = message.role === 'assistant'
        ? 'Assistente'
        : message.role === 'system'
          ? 'Sistema'
          : 'Usuário';
      return `${roleLabel}:\n${message.content}`;
    }).join('\n\n');

    const contextBlock = contextParts.length
      ? `### Contexto\n${contextParts.join('\n\n')}\n\n`
      : '';

    return `${contextBlock}### Conversa\n${conversation}\n\nResponda como uma assistente de desenvolvimento de software, fornecendo código completo e instruções claras quando necessário.`;
  }

  private normalizeResponse(response: ServiceIAResponse | string): string {
    if (typeof response === 'string') {
      if (!response.trim()) {
        throw new Error('Resposta vazia recebida do ServiceIA.');
      }
      return response;
    }

    if (!response) {
      throw new Error('Resposta inválida recebida do ServiceIA.');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    if (response.message) {
      return response.message;
    }

    if (response.content) {
      return response.content;
    }

    throw new Error('Resposta sem conteúdo recebida do ServiceIA.');
  }

  private normalizeError(error: unknown): string {
    if (!error) {
      return 'Erro desconhecido ao comunicar com o ServiceIA.';
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Erro inesperado ao comunicar com o ServiceIA.';
    }
  }

  private loadConfig(): void {
    this.electronService.loadConfig().pipe(take(1)).subscribe({
      next: (result) => {
        if (result.success && result.config) {
          const serviceConfig = result.config.serviceIA || {};
          if (serviceConfig.serverUrl) {
            this.serverUrl = serviceConfig.serverUrl;
          }
          if (serviceConfig.threadId) {
            this.threadId = serviceConfig.threadId;
          }
        }
      },
      error: () => {
        // Se falhar ao carregar, mantemos valores padrão
      }
    });
  }

  private saveConfig(): void {
    const updateConfig = (config: any = {}) => {
      return {
        ...config,
        serviceIA: {
          serverUrl: this.serverUrl,
          threadId: this.threadId
        }
      };
    };

    this.electronService.loadConfig().pipe(take(1)).subscribe({
      next: (result) => {
        const config = updateConfig(result.config || {});
        this.electronService.saveConfig(config).pipe(take(1)).subscribe({
          next: (saveResult) => {
            if (!saveResult.success) {
              console.error('Erro ao salvar configuração do ServiceIA:', saveResult.error);
            }
          },
          error: (error) => {
            console.error('Erro ao persistir configuração do ServiceIA:', error);
          }
        });
      },
      error: () => {
        const config = updateConfig();
        this.electronService.saveConfig(config).pipe(take(1)).subscribe({
          error: (error) => console.error('Erro ao salvar configuração do ServiceIA:', error)
        });
      }
    });
  }
}

