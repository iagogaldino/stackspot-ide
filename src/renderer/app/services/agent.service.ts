import { Injectable, Inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AgentProvider, ChatMessage, ChatResponse, AgentRequestOptions } from './agent-provider.interface';

/**
 * Token de injeção para o provider de agentes
 * Permite que diferentes providers sejam injetados
 */
export const AGENT_PROVIDER = new InjectionToken<AgentProvider>('AGENT_PROVIDER');

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private currentProvider: AgentProvider | null = null;

  constructor(@Inject(AGENT_PROVIDER) private provider: AgentProvider) {
    this.currentProvider = provider;
  }

  /**
   * Define o provider de agentes a ser usado
   */
  setProvider(provider: AgentProvider): void {
    this.currentProvider = provider;
  }

  /**
   * Obtém o provider atual
   */
  getProvider(): AgentProvider | null {
    return this.currentProvider;
  }

  /**
   * Verifica se há um provider configurado
   */
  isConfigured(): boolean {
    return this.currentProvider?.isConfigured() ?? false;
  }

  /**
   * Obtém o nome do provider atual
   */
  getProviderName(): string | null {
    return this.currentProvider?.name ?? null;
  }

  /**
   * Configura o provider atual
   */
  configure(config: any): void {
    if (this.currentProvider) {
      this.currentProvider.configure(config);
    }
  }

  /**
   * Envia uma mensagem usando o provider atual
   */
  sendMessage(
    messages: ChatMessage[],
    options?: AgentRequestOptions
  ): Observable<ChatResponse> {
    if (!this.currentProvider) {
      throw new Error('Nenhum provider de agentes configurado');
    }

    if (!this.currentProvider.isConfigured()) {
      throw new Error(`Provider ${this.currentProvider.name} não está configurado`);
    }

    return this.currentProvider.sendMessage(messages, options);
  }

  /**
   * Analisa código usando o provider atual
   */
  analyzeCode(code: string, filePath: string): Observable<ChatResponse> {
    if (!this.currentProvider) {
      throw new Error('Nenhum provider de agentes configurado');
    }

    return this.currentProvider.analyzeCode(code, filePath);
  }

  /**
   * Gera código usando o provider atual
   */
  generateCode(
    description: string,
    language: string = 'typescript',
    context?: string
  ): Observable<ChatResponse> {
    if (!this.currentProvider) {
      throw new Error('Nenhum provider de agentes configurado');
    }

    return this.currentProvider.generateCode(description, language, context);
  }

  /**
   * Explica código usando o provider atual
   */
  explainCode(code: string, filePath: string): Observable<ChatResponse> {
    if (!this.currentProvider) {
      throw new Error('Nenhum provider de agentes configurado');
    }

    return this.currentProvider.explainCode(code, filePath);
  }

  /**
   * Melhora código usando o provider atual
   */
  improveCode(
    code: string,
    filePath: string,
    improvements: string
  ): Observable<ChatResponse> {
    if (!this.currentProvider) {
      throw new Error('Nenhum provider de agentes configurado');
    }

    return this.currentProvider.improveCode(code, filePath, improvements);
  }
}

