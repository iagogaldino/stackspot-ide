import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  error?: string;
}

export interface AgentProvider {
  /**
   * Nome do provider (ex: 'openai', 'claude', 'gemini')
   */
  readonly name: string;

  /**
   * Verifica se o provider está configurado e pronto para uso
   */
  isConfigured(): boolean;

  /**
   * Configura o provider com as credenciais necessárias
   */
  configure(config: any): void;

  /**
   * Envia uma mensagem para o agente
   */
  sendMessage(
    messages: ChatMessage[],
    options?: AgentRequestOptions
  ): Observable<ChatResponse>;

  /**
   * Analisa código e retorna sugestões
   */
  analyzeCode(code: string, filePath: string): Observable<ChatResponse>;

  /**
   * Gera código baseado em descrição
   */
  generateCode(
    description: string,
    language: string,
    context?: string
  ): Observable<ChatResponse>;

  /**
   * Explica código
   */
  explainCode(code: string, filePath: string): Observable<ChatResponse>;

  /**
   * Melhora código seguindo instruções
   */
  improveCode(
    code: string,
    filePath: string,
    improvements: string
  ): Observable<ChatResponse>;
}

export interface AgentRequestOptions {
  /**
   * Contexto do projeto (caminho, estrutura, etc.)
   */
  projectContext?: string;

  /**
   * Arquivo atual sendo editado
   */
  currentFile?: string;

  /**
   * Conteúdo do arquivo atual
   */
  currentFileContent?: string;

  /**
   * Informações sobre arquivos do projeto (lista de arquivos por tipo, etc.)
   */
  projectFilesInfo?: string;

  /**
   * Lista de arquivos atualmente abertos no editor
   */
  openFiles?: string[];

  /**
   * Temperatura para geração (0-1)
   */
  temperature?: number;

  /**
   * Máximo de tokens
   */
  maxTokens?: number;

  /**
   * Modelo específico a ser usado
   */
  model?: string;

  /**
   * Se a IA pode executar comandos no terminal
   */
  canExecuteCommands?: boolean;
}

