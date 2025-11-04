import { Component, OnInit, OnDestroy, Input, OnChanges, ViewChild, ElementRef, AfterViewInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentService } from '../../services/agent.service';
import { FileService } from '../../services/file.service';
import { MonacoEditorService } from '../../services/monaco-editor.service';
import { ChatMessage, AgentRequestOptions } from '../../services/agent-provider.interface';
import { CodeBlockComponent } from '../chat/code-block.component';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  parsedContent?: {
    text: string;
    codeBlocks: Array<{ code: string; language: string; index: number }>;
  };
}

@Component({
  selector: 'app-test-prompt',
  standalone: true,
  imports: [CommonModule, FormsModule, CodeBlockComponent],
  templateUrl: './test-prompt.component.html',
  styleUrl: './test-prompt.component.css'
})
export class TestPromptComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() testFilePath: string | null = null;
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  messages: Message[] = [];
  userMessage: string = '';
  isTyping: boolean = false;
  testFileContent: string = '';
  private conversationHistory: ChatMessage[] = [];

  constructor(
    private agentService: AgentService,
    private fileService: FileService,
    private monacoEditorService: MonacoEditorService
  ) {}

  async ngOnInit() {
    if (this.testFilePath) {
      await this.loadTestFile();
    }

    // Mensagem inicial
    this.messages.push({
      role: 'assistant',
      content: 'Olá! Estou pronta para trabalhar com este teste. Como posso ajudar?',
      timestamp: new Date()
    });
  }

  ngAfterViewInit() {
    this.scrollToBottom();
    if (this.messageInput) {
      setTimeout(() => this.messageInput.nativeElement.focus(), 100);
    }
  }

  ngOnDestroy() {
    // Limpar ao destruir
  }

  async loadTestFile() {
    if (!this.testFilePath) return;

    try {
      this.testFileContent = await this.fileService.readFile(this.testFilePath).toPromise() || '';
      console.log('Conteúdo do arquivo de teste carregado:', this.testFileContent.substring(0, 100));
    } catch (error) {
      console.error('Erro ao carregar arquivo de teste:', error);
      this.testFileContent = '';
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['testFilePath']) {
      if (changes['testFilePath'].currentValue) {
        this.loadTestFile();
      }
      // Limpar mensagens quando mudar de arquivo
      if (!changes['testFilePath'].firstChange) {
        this.messages = [{
          role: 'assistant',
          content: 'Olá! Estou pronta para trabalhar com este teste. Como posso ajudar?',
          timestamp: new Date()
        }];
        this.conversationHistory = [];
      }
    }
  }

  async sendMessage() {
    if (!this.userMessage.trim()) return;

    if (!this.agentService.isConfigured()) {
      this.messages.push({
        role: 'assistant',
        content: 'Por favor, configure sua API key no painel de chat primeiro.',
        timestamp: new Date()
      });
      this.scrollToBottom();
      return;
    }

    const userPrompt = this.userMessage.trim();
    this.userMessage = '';

    // Adicionar mensagem do usuário
    this.messages.push({
      role: 'user',
      content: userPrompt,
      timestamp: new Date()
    });

    this.scrollToBottom();
    this.isTyping = true;

    try {
      // Construir prompt com contexto do arquivo de teste
      const fileContext = this.testFileContent 
        ? `\n\nArquivo de teste atual (${this.getFileName()}):\n\`\`\`typescript\n${this.testFileContent}\n\`\`\`\n\n`
        : '';

      const fullPrompt = `Você está trabalhando com um arquivo de teste Angular. ${fileContext}\n\nPergunta do usuário: ${userPrompt}\n\nPor favor, forneça uma resposta focada neste teste específico.`;

      // Adicionar ao histórico
      this.conversationHistory.push({
        role: 'user',
        content: fullPrompt
      });

      // Enviar para IA com contexto do arquivo usando as propriedades corretas
      const options: AgentRequestOptions = {
        currentFile: this.testFilePath || undefined,
        currentFileContent: this.testFileContent || undefined,
        projectContext: `Trabalhando com arquivo de teste: ${this.getFileName()}`
      };

      const response = await this.agentService.sendMessage(this.conversationHistory, options).toPromise();

      if (response && response.content) {
        // Adicionar resposta da IA
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          parsedContent: this.parseMessageContent(response.content)
        };

        this.messages.push(assistantMessage);
        this.conversationHistory.push({
          role: 'assistant',
          content: response.content
        });
      } else {
        throw new Error('Resposta vazia da IA');
      }
    } catch (error: any) {
      this.messages.push({
        role: 'assistant',
        content: `Erro ao processar sua mensagem: ${error.message || 'Erro desconhecido'}`,
        timestamp: new Date()
      });
    } finally {
      this.isTyping = false;
      this.scrollToBottom();
    }
  }

  parseMessageContent(content: string): { text: string; codeBlocks: Array<{ code: string; language: string; index: number }> } {
    const codeBlocks: Array<{ code: string; language: string; index: number }> = [];
    let text = content;
    let index = 0;

    // Regex para encontrar blocos de código
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    const replacements: Array<{ start: number; end: number; placeholder: string }> = [];

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'typescript';
      const code = match[2];
      const placeholder = `__CODE_BLOCK_${index}__`;

      codeBlocks.push({ code, language, index });
      replacements.push({
        start: match.index,
        end: match.index + match[0].length,
        placeholder
      });
      index++;
    }

    // Substituir blocos de código por placeholders
    replacements.reverse().forEach(replacement => {
      text = text.substring(0, replacement.start) + replacement.placeholder + text.substring(replacement.end);
    });

    return { text, codeBlocks };
  }

  renderMessageContent(message: Message): Array<{ type: 'text' | 'code'; content: string; language?: string }> {
    if (!message.parsedContent) {
      return [{ type: 'text', content: message.content }];
    }

    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let text = message.parsedContent.text;
    let codeBlockIndex = 0;

    message.parsedContent.codeBlocks.forEach((block, index) => {
      const placeholder = `__CODE_BLOCK_${index}__`;
      const placeholderIndex = text.indexOf(placeholder);

      if (placeholderIndex !== -1) {
        // Adicionar texto antes do código
        if (placeholderIndex > 0) {
          parts.push({ type: 'text', content: text.substring(0, placeholderIndex) });
        }
        // Adicionar código
        parts.push({ type: 'code', content: block.code, language: block.language });
        // Remover placeholder do texto
        text = text.substring(placeholderIndex + placeholder.length);
      }
    });

    // Adicionar texto restante
    if (text.length > 0) {
      parts.push({ type: 'text', content: text });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: message.content }];
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  getFileName(): string {
    if (!this.testFilePath) return '';
    const parts = this.testFilePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }

  isConfigured(): boolean {
    return this.agentService.isConfigured();
  }
}

