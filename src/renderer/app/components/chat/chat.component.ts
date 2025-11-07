import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentService } from '../../services/agent.service';
import { FileService } from '../../services/file.service';
import { TerminalService } from '../../services/terminal.service';
import { TestFrameworkService } from '../../services/test-framework.service';
import { ElectronService } from '../../services/electron.service';
import { ChatMessage, AgentRequestOptions } from '../../services/agent-provider.interface';
import { MiniTerminalComponent } from './mini-terminal.component';
import { CodeBlockComponent } from './code-block.component';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  createdFile?: string; // Caminho do arquivo criado (para badges)
  parsedContent?: {
    text: string;
    codeBlocks: Array<{ code: string; language: string; index: number }>;
  }; // Conteúdo parseado para exibir código com efeito de digitação
  testExecution?: {
    command: string;
    framework: string;
    isRunning: boolean;
    hasFailed?: boolean; // Indica se o teste falhou
    errorDetails?: {
      testFile: string;
      errorMessage: string;
      output: string;
    }; // Detalhes do erro quando o teste falha
  }; // Informações sobre execução de teste
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MiniTerminalComponent, CodeBlockComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;
  @Input() projectPath: string | null = null;
  @Input() selectedFile: string | null = null;
  @Input() openFiles: string[] = [];
  @Output() fileCreated = new EventEmitter<string>(); // Emitir quando um arquivo for criado
  
  messages: Message[] = [];
  userMessage: string = '';
  isTyping: boolean = false;
  showServiceConfig: boolean = false;
  serviceUrl: string = 'http://localhost:3000';
  private conversationHistory: ChatMessage[] = [];
  openFilesCollapsed = true;

  // Expor método para o template
  get isServiceConfigured(): boolean {
    return this.agentService.isConfigured();
  }

  get providerName(): string | null {
    return this.agentService.getProviderName();
  }

  constructor(
    private agentService: AgentService,
    private fileService: FileService,
    private terminalService: TerminalService,
    private testFrameworkService: TestFrameworkService,
    private electronService: ElectronService
  ) {}

  ngOnInit() {
    this.loadServiceConfig();

    // Verificar se já tem provider configurado
    if (this.agentService.isConfigured()) {
      this.messages.push({
        role: 'assistant',
        content: `Olá! Estou conectada ao serviço de IA (${this.agentService.getProviderName() || 'ServiceIA'}). Como posso ajudar no seu projeto hoje?`,
        timestamp: new Date()
      });
    } else {
      this.showServiceConfig = true;
      this.messages.push({
        role: 'assistant',
        content: 'Para usar a assistente de IA, informe o endereço do serviço ServiceIA abaixo.',
        timestamp: new Date()
      });
    }
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  saveServiceConfig() {
    const trimmedUrl = this.serviceUrl.trim();
    if (trimmedUrl) {
      this.agentService.configure({ serviceUrl: trimmedUrl });
      this.showServiceConfig = false;
      this.messages.push({
        role: 'assistant',
        content: `Conexão com o serviço ${this.agentService.getProviderName() || 'ServiceIA'} atualizada com sucesso. Estou pronta para ajudar!`,
        timestamp: new Date()
      });
      this.scrollToBottom();
    }
  }

  private loadServiceConfig() {
    this.electronService.loadConfig().subscribe({
      next: (result) => {
        const savedUrl = result.config?.serviceIA?.serverUrl;
        if (result.success && typeof savedUrl === 'string' && savedUrl.trim()) {
          this.serviceUrl = savedUrl;
        }
      },
      error: () => {
        // Mantém valor padrão/local
      }
    });
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;

    // Se não tem provider configurado, mostrar mensagem
    if (!this.agentService.isConfigured()) {
      this.messages.push({
        role: 'assistant',
        content: 'Por favor, configure a URL do serviço ServiceIA antes de continuar.',
        timestamp: new Date()
      });
      this.showServiceConfig = true;
      this.scrollToBottom();
      return;
    }

    // Adicionar mensagem do usuário
    const userMessageText = this.userMessage.trim();
    this.messages.push({
      role: 'user',
      content: userMessageText,
      timestamp: new Date()
    });

    // Adicionar ao histórico da conversa
    this.conversationHistory.push({
      role: 'user',
      content: userMessageText
    });

    this.userMessage = '';
    this.isTyping = true;
    this.scrollToBottom();

    // Obter contexto do projeto e arquivo atual
    const options: AgentRequestOptions = {};
    
    if (this.projectPath) {
      options.projectContext = `Projeto Angular em: ${this.projectPath}`;
      
      const userMessageLower = userMessageText.toLowerCase();
      
      // Detectar se o usuário está pedindo para criar teste unitário
      const wantsToCreateTest = userMessageLower.includes('crie o teste') ||
                                userMessageLower.includes('criar teste') ||
                                userMessageLower.includes('crie teste') ||
                                userMessageLower.includes('crie um teste') ||
                                userMessageLower.includes('gerar teste') ||
                                userMessageLower.includes('criar teste unitário') ||
                                userMessageLower.includes('teste unitário para') ||
                                userMessageLower.includes('teste para o arquivo') ||
                                userMessageLower.includes('teste para');
      
      if (wantsToCreateTest) {
        // Extrair nome do arquivo da mensagem ou usar arquivo selecionado
        let targetFile = this.selectedFile;
        
        // Tentar extrair nome do arquivo da mensagem
        if (!targetFile) {
          // Procurar por padrões como "teste para arquivo.ts", "teste para app.component.ts", etc.
          const fileMatch = userMessageText.match(/(?:para|do|de)\s+([a-zA-Z0-9_\-\.\/\\]+\.(ts|js|html|component\.ts))/i);
          if (fileMatch && this.projectPath) {
            const fileName = fileMatch[1];
            // Tentar encontrar o arquivo completo no projeto
            this.fileService.listFilesByType(this.projectPath, ['.ts', '.js']).subscribe(files => {
              const foundFile = files.find(f => f.includes(fileName) || f.endsWith(fileName));
              if (foundFile && this.projectPath) {
                // Juntar caminhos manualmente (substituir require('path').join)
                const separator = this.projectPath.includes('\\') ? '\\' : '/';
                targetFile = `${this.projectPath}${separator}${foundFile}`;
                this.loadFileAndCreateTest(targetFile, options);
              } else {
                this.messages.push({
                  role: 'assistant',
                  content: `Não encontrei o arquivo "${fileName}" no projeto. Por favor, selecione o arquivo na árvore de arquivos ou especifique o caminho completo.`,
                  timestamp: new Date()
                });
                this.isTyping = false;
                this.scrollToBottom();
              }
            });
            return;
          }
        }
        
        if (targetFile) {
          this.loadFileAndCreateTest(targetFile, options);
          return;
        } else {
          this.messages.push({
            role: 'assistant',
            content: 'Por favor, selecione o arquivo para o qual deseja criar o teste unitário, ou especifique o nome do arquivo na mensagem (ex: "crie o teste para app.component.ts").',
            timestamp: new Date()
          });
          this.isTyping = false;
          this.scrollToBottom();
          return;
        }
      }
      
      // Detectar se o usuário está pedindo para executar comandos
      const wantsToExecuteCommand = userMessageLower.includes('execute') ||
                                    userMessageLower.includes('executar') ||
                                    userMessageLower.includes('rodar') ||
                                    userMessageLower.includes('run') ||
                                    userMessageLower.includes('npm ') ||
                                    userMessageLower.includes('ng ') ||
                                    userMessageLower.includes('yarn ') ||
                                    userMessageLower.includes('pnpm ') ||
                                    userMessageLower.startsWith('npm ') ||
                                    userMessageLower.startsWith('ng ') ||
                                    userMessageLower.startsWith('yarn ') ||
                                    userMessageLower.startsWith('pnpm ');
      
      if (wantsToExecuteCommand) {
        // Tentar extrair o comando da mensagem
        let command = userMessageText.trim();
        
        // Se começa diretamente com um comando (npm, ng, yarn, pnpm), usar como está
        if (command.match(/^(npm|ng|yarn|pnpm|node|npx)\s+/i)) {
          this.executeCommandInTerminal(command);
          return;
        }
        
        // Tentar extrair comando entre aspas, backticks ou após palavras-chave
        const commandMatch = command.match(/(?:execute|executar|rodar|run|comando):?\s*['"`]([^'"`]+)['"`]|['"`](npm[^'"`]+|ng[^'"`]+)['"`]/i);
        if (commandMatch) {
          command = commandMatch[1] || commandMatch[2];
          this.executeCommandInTerminal(command);
          return;
        }
        
        // Tentar extrair após palavras-chave
        const afterKeywordMatch = command.match(/(?:execute|executar|rodar|run)\s+(?:o\s+)?(?:comando\s+)?['"]?([^'"]+)/i);
        if (afterKeywordMatch) {
          command = afterKeywordMatch[1].trim();
          if (command.match(/^(npm|ng|yarn|pnpm|node|npx)/i)) {
            this.executeCommandInTerminal(command);
            return;
          }
        }
        
        // Se não conseguir extrair, perguntar para a IA ou tentar executar o comando completo
        // Por enquanto, vamos enviar para a IA processar e ela pode sugerir o comando
        // Mas vamos adicionar uma flag para que a IA saiba que pode executar comandos
        options.canExecuteCommands = true;
      }
      
      // Detectar se o usuário está pedindo para listar arquivos específicos
      const wantsToListFiles = userMessageLower.includes('liste') || 
                               userMessageLower.includes('listar') || 
                               userMessageLower.includes('mostre os') ||
                               userMessageLower.includes('mostre arquivos') ||
                               userMessageLower.includes('arquivos de teste') ||
                               userMessageLower.includes('testes unitários') ||
                               userMessageLower.includes('arquivos html') ||
                               userMessageLower.includes('arquivos ts') ||
                               userMessageLower.includes('arquivos typescript');
      
      if (wantsToListFiles) {
        // Detectar tipo de arquivo solicitado
        let extensions: string[] | undefined;
        
        if (userMessageLower.includes('teste') || userMessageLower.includes('spec')) {
          // Listar arquivos de teste
          this.fileService.listTestFiles(this.projectPath).subscribe(files => {
            options.projectFilesInfo = `Arquivos de teste do projeto (${files.length} arquivos):\n${files.join('\n')}`;
            this.sendMessageWithOptions(options);
          });
          return;
        } else if (userMessageLower.includes('html')) {
          extensions = ['.html'];
        } else if (userMessageLower.includes('typescript') || userMessageLower.includes('ts')) {
          extensions = ['.ts'];
        } else if (userMessageLower.includes('css') || userMessageLower.includes('scss')) {
          extensions = ['.css', '.scss'];
        }
        
        if (extensions) {
          this.fileService.listFilesByType(this.projectPath, extensions).subscribe(files => {
            const typeName = extensions![0].replace('.', '').toUpperCase();
            options.projectFilesInfo = `Arquivos ${typeName} do projeto (${files.length} arquivos):\n${files.join('\n')}`;
            this.sendMessageWithOptions(options);
          });
          return;
        } else {
          // Listar todos os arquivos relevantes
          this.fileService.listFilesByType(this.projectPath, ['.ts', '.html', '.css', '.scss']).subscribe(files => {
            options.projectFilesInfo = `Arquivos do projeto (${files.length} arquivos principais):\n${files.slice(0, 100).join('\n')}${files.length > 100 ? '\n... (mostrando primeiros 100 arquivos)' : ''}`;
            this.sendMessageWithOptions(options);
          });
          return;
        }
      }
    }

    if (this.selectedFile) {
      options.currentFile = this.selectedFile;
      // Opcional: carregar conteúdo do arquivo se necessário
      // this.fileService.readFile(this.selectedFile).subscribe(content => {
      //   options.currentFileContent = content;
      // });
    }

    const openFilesList = Array.from(new Set((this.openFiles || []).filter(file => !!file)));
    if (openFilesList.length > 0) {
      const formattedOpenFiles = openFilesList.map(file => `- ${file}`).join('\n');
      options.projectFilesInfo = options.projectFilesInfo
        ? `${options.projectFilesInfo}\n\nArquivos abertos atualmente (${openFilesList.length}):\n${formattedOpenFiles}`
        : `Arquivos abertos atualmente (${openFilesList.length}):\n${formattedOpenFiles}`;
      options.openFiles = openFilesList;
    }

    // Enviar para o agente usando o AgentService
    this.sendMessageWithOptions(options);
  }

  private sendMessageWithOptions(options: AgentRequestOptions) {
    this.agentService.sendMessage(this.conversationHistory, options).subscribe({
      next: (response) => {
        const assistantMessage = response.content;
        
        // Parsear mensagem para extrair blocos de código
        const parsedContent = this.parseMessageContent(assistantMessage);
        
        this.messages.push({
          role: 'assistant',
          content: assistantMessage,
          parsedContent: parsedContent,
          timestamp: new Date()
        });
        
        // Adicionar ao histórico
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage
        });
        
        this.isTyping = false;
        this.scrollToBottom();
        
        // Verificar se a resposta contém código para criar arquivos
        this.checkForCodeActions(assistantMessage);
        
        // Verificar se a resposta contém comandos para executar
        if (options.canExecuteCommands) {
          this.checkForCommandsToExecute(assistantMessage);
        }
      },
      error: (error) => {
        this.messages.push({
          role: 'assistant',
          content: `Erro: ${error.error || error.message || 'Erro ao comunicar com a API da OpenAI'}`,
          timestamp: new Date()
        });
        this.isTyping = false;
        this.scrollToBottom();
      }
    });
  }

  private checkForCodeActions(message: string) {
    // Verificar se a mensagem contém blocos de código
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches = [...message.matchAll(codeBlockRegex)];
    
    if (matches.length > 0 && this.projectPath) {
      // Se houver código e um projeto aberto, podemos oferecer criar arquivo
      // Por enquanto, apenas detectamos - implementação futura
      console.log('Código detectado na resposta:', matches.length, 'blocos');
    }
  }

  /**
   * Verifica se a resposta da IA contém comandos para executar
   */
  private checkForCommandsToExecute(message: string) {
    // Padrões comuns de comandos
    const commandPatterns = [
      /`(npm\s+[^`]+)`/g,
      /`(ng\s+[^`]+)`/g,
      /`(yarn\s+[^`]+)`/g,
      /`(pnpm\s+[^`]+)`/g,
      /`(npx\s+[^`]+)`/g,
      /`(node\s+[^`]+)`/g
    ];
    
    const foundCommands: string[] = [];
    
    commandPatterns.forEach(pattern => {
      const matches = [...message.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && !foundCommands.includes(match[1])) {
          foundCommands.push(match[1]);
        }
      });
    });
    
    // Se encontrar comandos, perguntar ao usuário se quer executar
    // Por enquanto, vamos apenas logar - podemos implementar confirmação depois
    if (foundCommands.length > 0) {
      console.log('Comandos detectados na resposta:', foundCommands);
      // TODO: Oferecer botão para executar comandos sugeridos pela IA
    }
  }

  // Método para analisar arquivo atual
  analyzeCurrentFile(filePath: string) {
    if (!this.projectPath || !filePath) return;

    this.fileService.readFile(filePath).subscribe({
      next: (content) => {
        // Usar o método de análise do agente
        this.isTyping = true;
        this.agentService.analyzeCode(content, filePath).subscribe({
          next: (response) => {
            this.messages.push({
              role: 'assistant',
              content: response.content,
              timestamp: new Date()
            });
            this.isTyping = false;
            this.scrollToBottom();
          },
          error: (error) => {
            this.messages.push({
              role: 'assistant',
              content: `Erro ao analisar arquivo: ${error.error || error.message || 'Erro desconhecido'}`,
              timestamp: new Date()
            });
            this.isTyping = false;
            this.scrollToBottom();
          }
        });
      },
      error: (error) => {
        console.error('Erro ao ler arquivo para análise:', error);
      }
    });
  }

  /**
   * Carrega arquivo e cria teste unitário
   */
  private loadFileAndCreateTest(filePath: string, options: AgentRequestOptions) {
    if (!this.projectPath) return;

    // Verificar se o arquivo já é um teste
    if (filePath.includes('.spec.ts') || filePath.includes('.test.ts')) {
      this.messages.push({
        role: 'assistant',
        content: 'Este arquivo já é um arquivo de teste. Por favor, selecione o arquivo fonte (component, service, etc.) para criar o teste.',
        timestamp: new Date()
      });
      this.isTyping = false;
      this.scrollToBottom();
      return;
    }

    // Ler conteúdo do arquivo
    this.fileService.readFile(filePath).subscribe({
      next: (content) => {
        // Determinar o nome do arquivo de teste
        const pathParts = filePath.split(/[\\/]/);
        const fileName = pathParts[pathParts.length - 1];
        const baseName = fileName.replace(/\.(ts|js)$/, '');
        const testFileName = `${baseName}.spec.ts`;
        
        // Criar mensagem específica para gerar teste
        const testPrompt = `Crie um teste unitário completo para o seguinte arquivo Angular.

Nome do arquivo: ${fileName}
Caminho: ${filePath}
Nome do arquivo de teste: ${testFileName}

Código do arquivo:
\`\`\`typescript
${content}
\`\`\`

Instruções:
- Crie um teste unitário completo usando Jest ou Jasmine (padrão Angular)
- Teste todos os métodos públicos, propriedades e comportamentos
- Use mocks apropriados para dependências
- Inclua testes de casos de sucesso e erro
- Siga as melhores práticas de testes Angular
- Forneça o código completo do arquivo de teste (.spec.ts)
- Use o formato de código markdown com \`\`\`typescript`;

        // Preparar opções com contexto completo
        options.currentFile = filePath;
        options.currentFileContent = content;
        options.projectFilesInfo = `Vou criar o teste unitário: ${testFileName}\nBaseado no arquivo: ${filePath}`;

        // Criar histórico temporário para esta requisição
        const testHistory: ChatMessage[] = [
          {
            role: 'user',
            content: testPrompt
          }
        ];

        // Enviar para o agente
        this.agentService.sendMessage(testHistory, options).subscribe({
          next: (response) => {
            const assistantMessage = response.content;
            
            // Parsear mensagem para extrair blocos de código
            const parsedContent = this.parseMessageContent(assistantMessage);
            
            this.messages.push({
              role: 'assistant',
              content: assistantMessage,
              parsedContent: parsedContent,
              timestamp: new Date()
            });
            
            // Adicionar ao histórico da conversa
            this.conversationHistory.push({
              role: 'user',
              content: `Crie o teste unitário para ${fileName}`
            });
            this.conversationHistory.push({
              role: 'assistant',
              content: assistantMessage
            });
            
            this.isTyping = false;
            this.scrollToBottom();
            
            // Verificar se a resposta contém código do teste
            this.checkForTestCodeAndOfferSave(assistantMessage, filePath, testFileName);
          },
          error: (error) => {
            this.messages.push({
              role: 'assistant',
              content: `Erro ao gerar teste unitário: ${error.error || error.message || 'Erro desconhecido'}`,
              timestamp: new Date()
            });
            this.isTyping = false;
            this.scrollToBottom();
          }
        });
      },
      error: (error) => {
        this.messages.push({
          role: 'assistant',
          content: `Erro ao ler arquivo: ${error.message || 'Não foi possível ler o arquivo'}`,
          timestamp: new Date()
        });
        this.isTyping = false;
        this.scrollToBottom();
      }
    });
  }

  /**
   * Verifica se a resposta contém código de teste e cria automaticamente
   */
  private checkForTestCodeAndOfferSave(message: string, sourceFile: string, testFileName: string) {
    // Verificar se há blocos de código TypeScript na resposta
    const codeBlockRegex = /```typescript\s*\n([\s\S]*?)```/g;
    const matches = [...message.matchAll(codeBlockRegex)];
    
    if (matches.length > 0 && this.projectPath) {
      // Extrair o código do teste (pegar o primeiro bloco de código TypeScript)
      let testCode = matches[0][1];
      
      // Limpar o código (remover linhas em branco no início e fim)
      testCode = testCode.trim();
      
      // Determinar caminho do arquivo de teste
      const pathParts = sourceFile.split(/[\\/]/);
      const sourceDir = pathParts.slice(0, -1);
      const separator = sourceFile.includes('\\') ? '\\' : '/';
      const testFilePath = sourceDir.join(separator) + separator + testFileName;
      
      // Criar o arquivo automaticamente
      this.fileService.writeFile(testFilePath, testCode).subscribe({
        next: () => {
          // Atualizar a última mensagem para incluir o arquivo criado
          const lastMessageIndex = this.messages.length - 1;
          if (lastMessageIndex >= 0) {
            // Manter apenas uma mensagem simples e adicionar o arquivo criado
            this.messages[lastMessageIndex] = {
              ...this.messages[lastMessageIndex],
              content: '✅ Teste unitário criado com sucesso!',
              createdFile: testFilePath
            };
          }
          
          // Emitir evento para abrir o arquivo no editor
          this.fileCreated.emit(testFilePath);
          
          this.scrollToBottom();
          console.log('Arquivo de teste criado com sucesso:', testFilePath);
        },
        error: (error) => {
          console.error('Erro ao criar arquivo de teste:', error);
          // Adicionar mensagem de erro
          setTimeout(() => {
            this.messages.push({
              role: 'assistant',
              content: `❌ Erro ao criar arquivo de teste: ${error.message || 'Erro desconhecido'}`,
              timestamp: new Date()
            });
            this.scrollToBottom();
          }, 500);
        }
      });
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getFileName(filePath: string | null): string {
    if (!filePath) return '';
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1] || filePath;
  }

  get openFilesContext(): string[] {
    return Array.from(new Set((this.openFiles || []).filter(file => !!file)));
  }

  /**
   * Abre arquivo criado no editor
   */
  openCreatedFile(filePath: string) {
    this.fileCreated.emit(filePath);
  }

  openFileFromChat(filePath: string) {
    if (filePath) {
      this.fileCreated.emit(filePath);
    }
  }

  toggleOpenFilesPanel() {
    this.openFilesCollapsed = !this.openFilesCollapsed;
  }

  /**
   * Executa o teste do arquivo criado
   */
  runTest(filePath: string, event?: Event) {
    if (event) {
      event.stopPropagation(); // Evitar que o clique abra o arquivo
    }

    if (!this.projectPath) {
      this.messages.push({
        role: 'assistant',
        content: '❌ Nenhum projeto aberto. Por favor, abra um projeto primeiro.',
        timestamp: new Date()
      });
      this.scrollToBottom();
      return;
    }

    // Detectar framework de teste e executar comando
    const projectPath = this.projectPath!; // Já foi verificado acima
    
    this.testFrameworkService.detectTestFramework(projectPath).subscribe({
      next: (frameworkInfo) => {
        const command = frameworkInfo.testFileCommand(filePath, projectPath);
        
        // Adicionar mensagem com mini terminal
        // Salvar o caminho completo do arquivo para referência futura
        const testMessage: Message = {
          role: 'assistant',
          content: `Executando teste: ${command}`,
          timestamp: new Date(),
          createdFile: filePath, // Salvar caminho do arquivo de teste para referência
          testExecution: {
            command: command,
            framework: frameworkInfo.framework,
            isRunning: true,
            hasFailed: false
          }
        };
        
        const messageIndex = this.messages.length;
        this.messages.push(testMessage);
        this.scrollToBottom();
        
        // Executar comando no terminal após um pequeno delay para o terminal renderizar
        setTimeout(() => {
          this.terminalService.executeCommand(command, projectPath);
        }, 300);
      },
      error: (error) => {
        console.error('Erro ao detectar framework de teste:', error);
        const command = `npm test -- ${filePath.replace(projectPath + '/', '').replace(/\\/g, '/')}`;
        
        // Adicionar mensagem com mini terminal mesmo em caso de erro
        const testMessage: Message = {
          role: 'assistant',
          content: '⚠️ Framework não detectado. Usando Jest por padrão.',
          timestamp: new Date(),
          testExecution: {
            command: command,
            framework: 'jest',
            isRunning: true
          }
        };
        
        this.messages.push(testMessage);
        this.scrollToBottom();
        
        setTimeout(() => {
          this.terminalService.executeCommand(command, projectPath);
        }, 300);
      }
    });
  }

  /**
   * Executa um comando no terminal a partir de uma mensagem do chat
   */
  private executeCommandInTerminal(command: string) {
    if (!this.projectPath) {
      this.messages.push({
        role: 'assistant',
        content: '❌ Nenhum projeto aberto. Por favor, abra um projeto primeiro.',
        timestamp: new Date()
      });
      this.isTyping = false;
      this.scrollToBottom();
      return;
    }

    // Adicionar mensagem com mini terminal
    const commandMessage: Message = {
      role: 'assistant',
      content: `▶️ Executando comando: \`${command}\``,
      timestamp: new Date(),
      testExecution: {
        command: command,
        framework: 'command',
        isRunning: true
      }
    };
    
    this.messages.push(commandMessage);
    this.scrollToBottom();
    
    // Executar comando no terminal após um pequeno delay para o terminal renderizar
    setTimeout(() => {
      this.terminalService.executeCommand(command, this.projectPath!);
    }, 300);
  }

  /**
   * Fecha o mini terminal de teste
   */
  closeTestTerminal(messageIndex: number) {
    if (this.messages[messageIndex]?.testExecution) {
      this.messages[messageIndex].testExecution!.isRunning = false;
    }
  }

  /**
   * Cria uma função de callback para fechar o terminal de uma mensagem específica
   */
  getCloseTestTerminalCallback(messageIndex: number): () => void {
    return () => this.closeTestTerminal(messageIndex);
  }

  getTestFailedCallback(messageIndex: number): (errorDetails: { testFile: string; errorMessage: string; output: string }) => void {
    return (errorDetails) => {
      if (this.messages[messageIndex]?.testExecution) {
        // Tentar usar o arquivo criado originalmente se disponível
        // Procurar mensagens anteriores que criaram o arquivo de teste
        let actualTestFile = errorDetails.testFile;
        
        // Procurar na mensagem atual ou anteriores por createdFile
        for (let i = messageIndex; i >= 0; i--) {
          if (this.messages[i]?.createdFile && 
              (this.messages[i].createdFile!.includes('.spec.') || this.messages[i].createdFile!.includes('.test.'))) {
            actualTestFile = this.messages[i].createdFile!;
            break;
          }
        }
        
        // Se ainda não encontrou, tentar construir o caminho completo
        if (actualTestFile === errorDetails.testFile && this.projectPath) {
          const separator = this.projectPath.includes('\\') ? '\\' : '/';
          let testFile = errorDetails.testFile;
          
          // Normalizar separadores
          testFile = testFile.replace(/\//g, separator).replace(/\\/g, separator);
          
          // Se não é caminho absoluto, construir
          if (!testFile.includes(':') && !testFile.startsWith(this.projectPath)) {
            actualTestFile = `${this.projectPath}${separator}${testFile}`;
          } else {
            actualTestFile = testFile;
          }
        }
        
        this.messages[messageIndex].testExecution!.hasFailed = true;
        this.messages[messageIndex].testExecution!.errorDetails = {
          testFile: actualTestFile,
          errorMessage: errorDetails.errorMessage,
          output: errorDetails.output
        };
        this.messages[messageIndex].testExecution!.isRunning = false;
        this.scrollToBottom();
      }
    };
  }

  /**
   * Gera um teste corrigido baseado no erro
   */
  generateFixedTest(messageIndex: number, errorDetails: { testFile: string; errorMessage: string; output: string }) {
    if (!this.projectPath || !this.agentService.isConfigured()) {
      this.messages.push({
        role: 'assistant',
        content: 'Por favor, configure o serviço de IA antes de gerar testes corrigidos.',
        timestamp: new Date()
      });
      return;
    }

    // Usar o caminho do arquivo de teste já processado
    let testFile = errorDetails.testFile;
    
    // Garantir que o caminho está correto
    if (!testFile.includes(':') && !testFile.startsWith('/') && this.projectPath) {
      // É um caminho relativo, construir caminho completo
      const separator = this.projectPath.includes('\\') ? '\\' : '/';
      testFile = testFile.replace(/\//g, separator).replace(/\\/g, separator);
      
      // Se não começa com projectPath, adicionar
      if (!testFile.startsWith(this.projectPath)) {
        // Remover separadores duplicados
        testFile = `${this.projectPath}${separator}${testFile.replace(/^[\/\\]+/, '')}`;
      }
    }
    
    const errorMessage = errorDetails.errorMessage;
    const output = errorDetails.output;

    // Adicionar mensagem indicando que está gerando correção
    this.messages.push({
      role: 'user',
      content: `Corrigir teste que falhou: ${testFile}`,
      timestamp: new Date()
    });

    this.isTyping = true;
    this.scrollToBottom();

    // Ler o arquivo de teste atual
    this.fileService.readFile(testFile).subscribe({
      next: (testContent) => {
        // Ler o arquivo fonte se possível
        const sourceFile = testFile.replace('.spec.ts', '.ts').replace('.test.ts', '.ts');
        let sourceContent = '';
        
        this.fileService.readFile(sourceFile).subscribe({
          next: (content) => {
            sourceContent = content;
            this.sendTestFixRequest(testFile, testContent, sourceContent, errorMessage, output);
          },
          error: () => {
            // Se não conseguir ler o arquivo fonte, continuar sem ele
            this.sendTestFixRequest(testFile, testContent, '', errorMessage, output);
          }
        });
      },
      error: (error) => {
        this.isTyping = false;
        
        // Tentar encontrar o arquivo usando createdFile das mensagens anteriores
        let alternativePath = testFile;
        let foundAlternative = false;
        
        // Procurar em todas as mensagens pelo arquivo criado
        for (let i = this.messages.length - 1; i >= 0; i--) {
          if (this.messages[i]?.createdFile && 
              (this.messages[i].createdFile!.includes('.spec.') || this.messages[i].createdFile!.includes('.test.'))) {
            alternativePath = this.messages[i].createdFile!;
            foundAlternative = true;
            break;
          }
        }
        
        // Se encontrou um caminho alternativo, tentar novamente
        if (foundAlternative && alternativePath !== testFile) {
          this.fileService.readFile(alternativePath).subscribe({
            next: (testContent) => {
              const sourceFile = alternativePath.replace('.spec.ts', '.ts').replace('.test.ts', '.ts');
              this.fileService.readFile(sourceFile).subscribe({
                next: (content) => {
                  this.sendTestFixRequest(alternativePath, testContent, content, errorMessage, output);
                },
                error: () => {
                  this.sendTestFixRequest(alternativePath, testContent, '', errorMessage, output);
                }
              });
            },
            error: (err) => {
              this.messages.push({
                role: 'assistant',
                content: `Erro ao ler arquivo de teste.\nTentado: ${testFile}\nAlternativa: ${alternativePath}\nErro: ${err.message || 'Arquivo não encontrado'}`,
                timestamp: new Date()
              });
              this.scrollToBottom();
            }
          });
        } else {
          this.messages.push({
            role: 'assistant',
            content: `Erro ao ler arquivo de teste: ${testFile}\nErro: ${error.message || 'Erro desconhecido'}\n\nPor favor, verifique se o arquivo existe.`,
            timestamp: new Date()
          });
          this.scrollToBottom();
        }
      }
    });
  }

  /**
   * Envia requisição para IA corrigir o teste
   */
  private sendTestFixRequest(
    testFile: string, 
    testContent: string, 
    sourceContent: string,
    errorMessage: string,
    output: string
  ) {
    const fixPrompt = `Corrija o seguinte teste unitário que está falhando.

Arquivo de teste: ${testFile}

Erro encontrado:
${errorMessage}

Saída completa do teste:
${output.substring(0, 2000)}${output.length > 2000 ? '...' : ''}

Código atual do teste:
\`\`\`typescript
${testContent}
\`\`\`

${sourceContent ? `Código do arquivo fonte sendo testado:
\`\`\`typescript
${sourceContent.substring(0, 3000)}${sourceContent.length > 3000 ? '...' : ''}
\`\`\`
` : ''}

Por favor:
1. Analise o erro e identifique a causa raiz
2. Corrija o teste para que ele passe
3. Mantenha a estrutura e os casos de teste existentes
4. Forneça o código completo do teste corrigido em um bloco de código TypeScript
5. Se necessário, explique brevemente o que foi corrigido

Forneça APENAS o código do teste corrigido, sem explicações adicionais antes do código.`;

    const options: AgentRequestOptions = {
      projectFilesInfo: `Teste falhando: ${testFile}\nErro: ${errorMessage.substring(0, 200)}`
    };

    const fixHistory: ChatMessage[] = [
      {
        role: 'user',
        content: fixPrompt
      }
    ];

    this.agentService.sendMessage(fixHistory, options).subscribe({
      next: (response) => {
        this.isTyping = false;
        const assistantMessage = response.content;

        // Verificar se a resposta contém código do teste corrigido
        const codeMatch = assistantMessage.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
        if (codeMatch) {
          const fixedTestCode = codeMatch[1].trim();
          
          // Substituir o arquivo de teste
          this.fileService.writeFile(testFile, fixedTestCode).subscribe({
            next: () => {
              this.messages.push({
                role: 'assistant',
                content: `✅ Teste corrigido com sucesso! O arquivo foi atualizado.`,
                timestamp: new Date()
              });
              this.fileCreated.emit(testFile);
              this.scrollToBottom();
            },
            error: (error) => {
              this.messages.push({
                role: 'assistant',
                content: `❌ Erro ao salvar teste corrigido: ${error.message || 'Erro desconhecido'}`,
                timestamp: new Date()
              });
              this.scrollToBottom();
            }
          });
        } else {
          // Se não encontrou código, mostrar a resposta completa
          this.messages.push({
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date()
          });
          this.scrollToBottom();
        }
      },
      error: (error) => {
        this.isTyping = false;
        this.messages.push({
          role: 'assistant',
          content: `Erro ao gerar correção: ${error.error || error.message || 'Erro desconhecido'}`,
          timestamp: new Date()
        });
        this.scrollToBottom();
      }
    });
  }

  /**
   * Parseia o conteúdo da mensagem para extrair blocos de código
   */
  private parseMessageContent(content: string): { text: string; codeBlocks: Array<{ code: string; language: string; index: number }> } {
    const codeBlocks: Array<{ code: string; language: string; index: number }> = [];
    let text = content;
    let blockIndex = 0;

    // Padrão para encontrar blocos de código markdown: ```language\ncode\n```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let offset = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'typescript';
      const code = match[2];
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;

      codeBlocks.push({
        code: code,
        language: language,
        index: blockIndex++
      });

      // Substituir o bloco de código por um placeholder
      const placeholder = `__CODE_BLOCK_${codeBlocks.length - 1}__`;
      text = text.substring(0, startIndex + offset) + placeholder + text.substring(endIndex + offset);
      offset += placeholder.length - (endIndex - startIndex);
    }

    return { text, codeBlocks };
  }

  /**
   * Renderiza o conteúdo parseado com blocos de código
   */
  renderMessageContent(message: Message): Array<{ type: 'text' | 'code'; content: string; language?: string }> {
    if (!message.parsedContent) {
      // Se não tem parsedContent, retornar conteúdo simples
      return [{ type: 'text', content: message.content }];
    }

    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    const { text, codeBlocks } = message.parsedContent;

    // Dividir texto pelos placeholders
    const textParts = text.split(/(__CODE_BLOCK_\d+__)/);

    textParts.forEach((part, index) => {
      const codeBlockMatch = part.match(/__CODE_BLOCK_(\d+)__/);
      if (codeBlockMatch) {
        const blockIndex = parseInt(codeBlockMatch[1]);
        const codeBlock = codeBlocks[blockIndex];
        if (codeBlock) {
          parts.push({
            type: 'code',
            content: codeBlock.code,
            language: codeBlock.language
          });
        }
      } else if (part.trim()) {
        parts.push({
          type: 'text',
          content: part
        });
      }
    });

    // Se não encontrou blocos, retornar conteúdo original
    if (parts.length === 0) {
      parts.push({ type: 'text', content: message.content });
    }

    return parts;
  }

  // Método para resetar o badge quando um novo arquivo é selecionado
  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedFile']) {
      // Sem badge dedicado, nenhuma ação necessária ao alterar seleção
    }
  }
}

