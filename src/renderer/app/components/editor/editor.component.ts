import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../services/file.service';
import { JSONEditorConfigService } from '../../services/json-editor-config.service';
import { JSONVisualEditorComponent } from '../json-editor/json-visual-editor.component';
import { JSONEditorSettingsComponent } from '../json-editor/settings/json-editor-settings.component';
import { MarkdownPreviewComponent } from '../markdown-preview/markdown-preview.component';
import { TestVisualEditorComponent } from '../test-editor/test-visual-editor.component';
import { TabsService } from '../../services/tabs.service';
import { MonacoEditorService } from '../../services/monaco-editor.service';
import { Subscription } from 'rxjs';
import * as monaco from 'monaco-editor';

// Configurar Monaco para evitar conflitos com Zone.js
// Desabilitar Web Workers que causam o erro "Unexpected usage"
if (!(globalThis as any).MonacoEnvironment) {
  (globalThis as any).MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
      // Retornar um blob URL vazio que não faz nada
      // Isso evita o erro "Unexpected usage" causado pelo conflito com Zone.js do Angular
      const blob = new Blob([''], { type: 'application/javascript' });
      return URL.createObjectURL(blob);
    },
    getWorker: function (moduleId: string, label: string) {
      // Retornar um Worker dummy que não faz nada
      const blob = new Blob(['self.onmessage = function() {};'], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      return new Worker(url);
    }
  };
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, JSONVisualEditorComponent, JSONEditorSettingsComponent, MarkdownPreviewComponent, TestVisualEditorComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() filePath!: string;
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;
  
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private subscription: Subscription | null = null;
  private contentSubscription: Subscription | null = null;
  private resizeListener: (() => void) | null = null;
  
  // Para editor JSON visual
  jsonData: any = null;
  showVisualEditor = false;
  
  // Para preview Markdown
  markdownContent: string = '';
  showMarkdownPreview = false;
  
  // Para editor de testes visual
  testFileContent: string = '';
  showTestVisualEditor = false;

  constructor(
    private fileService: FileService,
    private jsonEditorConfig: JSONEditorConfigService,
    private tabsService: TabsService,
    private monacoEditorService: MonacoEditorService
  ) {}

  ngOnInit() {
    if (this.filePath) {
      // Aguardar um pouco para garantir que o ViewChild está disponível
      setTimeout(() => {
        if (this.filePath) {
          this.loadFile();
        }
      }, 0);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.contentSubscription) {
      this.contentSubscription.unsubscribe();
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.editor) {
      // Desregistrar editor antes de destruir
      this.monacoEditorService.unregisterEditor();
      this.editor.dispose();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filePath']) {
      // Limpar estado anterior
      if (this.editor) {
        this.editor.dispose();
        this.editor = null;
      }
      this.jsonData = null;
      this.showVisualEditor = false;
      this.markdownContent = '';
      this.showMarkdownPreview = false;
      this.testFileContent = '';
      this.showTestVisualEditor = false;
      
      // Carregar novo arquivo se houver
      // Usar setTimeout para garantir que o DOM está atualizado
      if (this.filePath) {
        setTimeout(() => {
          if (this.filePath) {
            this.loadFile();
          }
        }, 100);
      }
    }
  }

  loadFile() {
    if (!this.filePath) {
      // Limpar editor se não há arquivo
      if (this.editor) {
        this.editor.dispose();
        this.editor = null;
      }
      this.jsonData = null;
      this.showVisualEditor = false;
      this.markdownContent = '';
      this.showMarkdownPreview = false;
      this.testFileContent = '';
      this.showTestVisualEditor = false;
      return;
    }

    // Cancelar subscription anterior se existir
    if (this.contentSubscription) {
      this.contentSubscription.unsubscribe();
    }

    // Verificar se é um arquivo antes de tentar ler
    // O erro EISDIR indica que estamos tentando ler um diretório
    // Vamos verificar isso antes de tentar ler
    this.contentSubscription = this.fileService.readFile(this.filePath).subscribe({
      next: (content) => {
        // Verificar se é arquivo Markdown
        if (this.isMarkdownFile()) {
          this.markdownContent = content;
          this.showMarkdownPreview = true;
          this.showVisualEditor = false;
          this.showTestVisualEditor = false;
        }
        // Verificar se é arquivo de teste
        else if (this.isTestFile()) {
          this.testFileContent = content;
          this.showTestVisualEditor = true;
          this.showVisualEditor = false;
          this.showMarkdownPreview = false;
        }
        // Verificar se deve usar editor visual para JSON
        else if (this.shouldUseVisualEditor()) {
          try {
            const parsed = JSON.parse(content);
            // Verificar se é um objeto válido (não array, não null)
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              this.jsonData = parsed;
              this.showVisualEditor = true;
              this.showTestVisualEditor = false;
              // Não criar Monaco Editor ainda - será criado se o visual falhar
            } else {
              // JSON válido mas não é objeto simples, usar Monaco
              this.showVisualEditor = false;
              // Aguardar um pouco para garantir que o DOM está atualizado
              setTimeout(() => {
                if (this.filePath && this.editorContainer?.nativeElement) {
                  this.createEditor(content);
                }
              }, 50);
            }
          } catch (error) {
            // JSON inválido, usar Monaco Editor
            console.error('JSON inválido, usando Monaco Editor:', error);
            this.showVisualEditor = false;
            // Aguardar um pouco para garantir que o DOM está atualizado
            setTimeout(() => {
              if (this.filePath && this.editorContainer?.nativeElement) {
                this.createEditor(content);
              }
            }, 50);
          }
        } else {
          this.showVisualEditor = false;
          this.showTestVisualEditor = false;
          // Aguardar um pouco para garantir que o DOM está atualizado
          setTimeout(() => {
            if (this.filePath && this.editorContainer?.nativeElement) {
              this.createEditor(content);
            }
          }, 100);
        }
      },
      error: (error) => {
        // Se o erro for EISDIR, significa que tentamos abrir um diretório
        if (error.message && error.message.includes('EISDIR')) {
          console.warn('Não é possível abrir um diretório como arquivo:', this.filePath);
          // Não mostrar erro no console, apenas ignorar
          return;
        }
        console.error('Erro ao carregar arquivo:', error);
      }
    });
  }

  /**
   * Verifica se é arquivo Markdown
   */
  isMarkdownFile(): boolean {
    if (!this.filePath) return false;
    const lowerPath = this.filePath.toLowerCase();
    return lowerPath.endsWith('.md') || lowerPath.endsWith('.markdown');
  }

  /**
   * Verifica se deve usar editor visual para este arquivo
   */
  shouldUseVisualEditor(): boolean {
    if (!this.filePath?.endsWith('.json')) {
      return false;
    }
    return this.jsonEditorConfig.shouldUseVisualEditor(this.filePath);
  }

  /**
   * Alterna entre editor visual e Monaco Editor (para JSON)
   */
  toggleEditorView() {
    this.showVisualEditor = !this.showVisualEditor;
    if (!this.showVisualEditor && this.editorContainer) {
      // Recarregar conteúdo no Monaco
      this.fileService.readFile(this.filePath).subscribe({
        next: (content) => {
          this.createEditor(content);
        }
      });
    }
  }

  /**
   * Alterna entre preview e código (para Markdown)
   */
  toggleMarkdownPreview() {
    this.showMarkdownPreview = !this.showMarkdownPreview;
    if (!this.showMarkdownPreview && this.editorContainer) {
      // Recarregar conteúdo no Monaco
      this.fileService.readFile(this.filePath).subscribe({
        next: (content) => {
          this.createEditor(content);
        }
      });
    }
  }

  /**
   * Verifica se é arquivo de teste
   */
  isTestFile(): boolean {
    if (!this.filePath) return false;
    const lowerPath = this.filePath.toLowerCase();
    return lowerPath.endsWith('.spec.ts') || 
           lowerPath.endsWith('.test.ts') || 
           lowerPath.endsWith('.spec.js') || 
           lowerPath.endsWith('.test.js');
  }

  /**
   * Alterna entre editor visual e Monaco Editor (para Testes)
   */
  toggleTestVisualEditor() {
    this.showTestVisualEditor = !this.showTestVisualEditor;
    if (!this.showTestVisualEditor && this.editorContainer) {
      // Recarregar conteúdo no Monaco
      this.fileService.readFile(this.filePath).subscribe({
        next: (content) => {
          this.createEditor(content);
        }
      });
    }
  }

  /**
   * Handler para mudanças no editor visual de testes
   */
  onTestFileChanged(content: string) {
    this.testFileContent = content;
    // Recarregar no Monaco se necessário
    if (!this.showTestVisualEditor && this.editorContainer) {
      setTimeout(() => {
        if (this.filePath && this.editorContainer?.nativeElement) {
          this.createEditor(content);
        }
      }, 100);
    }
  }

  createEditor(content: string) {
    // Verificar se o container está disponível
    if (!this.editorContainer || !this.editorContainer.nativeElement) {
      // Tentar novamente após um pequeno delay
      setTimeout(() => {
        if (this.filePath && this.editorContainer?.nativeElement) {
          this.createEditor(content);
        }
      }, 200);
      return;
    }

    // Dispor editor anterior se existir
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }

    // Detectar linguagem pelo arquivo
    const language = this.detectLanguage(this.filePath);

    // Garantir que o container tenha dimensões
    const container = this.editorContainer.nativeElement;
    if (container) {
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.minWidth = '0';
      container.style.minHeight = '0';
      container.style.position = 'relative';
    }

    // Criar editor Monaco
    this.editor = monaco.editor.create(container, {
      value: content,
      language: language,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'off',
      scrollBeyondLastLine: false,
      fixedOverflowWidgets: true,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto'
      },
      // Desabilitar funcionalidades que dependem de Web Workers para evitar conflito com Zone.js
      hover: {
        enabled: false
      },
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnEnter: 'off',
      tabCompletion: 'off',
      wordBasedSuggestions: false,
      // Desabilitar outros recursos que usam workers
      codeLens: false,
      colorDecorators: false,
      lightbulb: {
        enabled: false
      }
    });

    // Registrar editor no serviço para extensões
    this.monacoEditorService.registerEditor(this.editor, this.filePath);

    // Listener para mudanças no conteúdo
    this.editor.onDidChangeModelContent(() => {
      this.markTabAsDirty();
    });

    // Forçar layout após criar e quando a janela redimensionar
    setTimeout(() => {
      if (this.editor) {
        this.editor.layout();
      }
    }, 100);

    // Listener para redimensionamento da janela
    this.resizeListener = () => {
      if (this.editor) {
        setTimeout(() => {
          this.editor?.layout();
        }, 50);
      }
    };
    window.addEventListener('resize', this.resizeListener);

    // Marcar como "dirty" (não salvo) quando conteúdo mudar
    this.editor.onDidChangeModelContent(() => {
      this.markTabAsDirty();
    });

    // Adicionar atalho Ctrl+S para salvar
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      this.saveFile();
    });

    // Configurar menu de contexto (clique com botão direito)
    this.configureContextMenu();
  }

  /**
   * CONFIGURAÇÃO DO MENU DE CONTEXTO (CLIQUE COM BOTÃO DIREITO)
   * 
   * Este método configura os botões que aparecem quando você clica com botão direito no editor.
   * 
   * Para adicionar novos botões:
   * 1. Use this.editor.addAction() com as seguintes propriedades:
   *    - id: identificador único do botão
   *    - label: texto que aparece no menu
   *    - contextMenuGroupId: grupo do menu ('navigation', '1_modification', '9_cutcopypaste', etc.)
   *    - contextMenuOrder: ordem dentro do grupo (menor número = mais acima)
   *    - run: função que será executada ao clicar
   * 
   * Grupos de menu disponíveis:
   * - 'navigation': Ações de navegação
   * - '1_modification': Ações de modificação
   * - '9_cutcopypaste': Ações de copiar/colar
   * - 'z_commands': Comandos adicionais
   * 
   * Para criar um separador: use label: '---' e run: () => {}
   */
  configureContextMenu() {
    if (!this.editor) return;

    // ============================================
    // ADICIONE SEUS BOTÕES AQUI
    // ============================================

    // Botão: Analisar código com IA
    this.editor.addAction({
      id: 'analyze-code',
      label: 'Analisar código com IA',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1,
      run: () => {
        this.analyzeCodeWithAI();
      }
    });

    // Botão: Explicar código
    this.editor.addAction({
      id: 'explain-code',
      label: 'Explicar código',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 2,
      run: () => {
        this.explainCodeWithAI();
      }
    });

    // Botão: Melhorar código
    this.editor.addAction({
      id: 'improve-code',
      label: 'Melhorar código',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 3,
      run: () => {
        this.improveCodeWithAI();
      }
    });

    // Separador (linha divisória)
    this.editor.addAction({
      id: 'separator-1',
      label: '---',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 4,
      run: () => {}
    });

    // Botão: Formatar documento
    this.editor.addAction({
      id: 'format-document',
      label: 'Formatar documento',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 5,
      run: () => {
        this.formatDocument();
      }
    });

    // Botão: Copiar caminho do arquivo
    this.editor.addAction({
      id: 'copy-path',
      label: 'Copiar caminho do arquivo',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 6,
      run: () => {
        this.copyFilePath();
      }
    });

    // ============================================
    // EXEMPLO: Como adicionar um novo botão
    // ============================================
    /*
    this.editor.addAction({
      id: 'meu-botao',
      label: 'Meu Botão Personalizado',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 7,
      run: () => {
        // Sua lógica aqui
        console.log('Botão clicado!');
      }
    });
    */
  }

  private analyzeCodeWithAI() {
    if (!this.editor || !this.filePath) return;
    
    const selectedText = this.editor.getModel()?.getValueInRange(
      this.editor.getSelection() || new monaco.Selection(1, 1, 1, 1)
    ) || this.editor.getValue();
    
    // Emitir evento para o componente pai ou usar um serviço
    console.log('Analisar código:', selectedText);
    // TODO: Integrar com AgentService
  }

  private explainCodeWithAI() {
    if (!this.editor || !this.filePath) return;
    
    const selectedText = this.editor.getModel()?.getValueInRange(
      this.editor.getSelection() || new monaco.Selection(1, 1, 1, 1)
    ) || this.editor.getValue();
    
    console.log('Explicar código:', selectedText);
    // TODO: Integrar com AgentService
  }

  private improveCodeWithAI() {
    if (!this.editor || !this.filePath) return;
    
    const selectedText = this.editor.getModel()?.getValueInRange(
      this.editor.getSelection() || new monaco.Selection(1, 1, 1, 1)
    ) || this.editor.getValue();
    
    console.log('Melhorar código:', selectedText);
    // TODO: Integrar com AgentService
  }

  private formatDocument() {
    if (!this.editor) return;
    
    this.editor.getAction('editor.action.formatDocument')?.run();
  }

  private copyFilePath() {
    if (!this.filePath) return;
    
    navigator.clipboard.writeText(this.filePath).then(() => {
      console.log('Caminho copiado:', this.filePath);
    });
  }

  saveFile() {
    if (!this.editor || !this.filePath) return;

    const content = this.editor.getValue();
    
    this.subscription = this.fileService.writeFile(this.filePath, content).subscribe({
      next: () => {
        // Arquivo salvo com sucesso
        console.log('Arquivo salvo:', this.filePath);
        this.markTabAsClean();
      },
      error: (error) => {
        console.error('Erro ao salvar arquivo:', error);
      }
    });
  }

  /**
   * Marca a aba como modificada (dirty)
   */
  private markTabAsDirty() {
    if (this.filePath) {
      const tabs = this.tabsService.getTabs();
      const tab = tabs.find(t => t.filePath === this.filePath);
      if (tab) {
        this.tabsService.setTabDirty(tab.id, true);
      }
    }
  }

  /**
   * Marca a aba como limpa (salva)
   */
  private markTabAsClean() {
    if (this.filePath) {
      const tabs = this.tabsService.getTabs();
      const tab = tabs.find(t => t.filePath === this.filePath);
      if (tab) {
        this.tabsService.setTabDirty(tab.id, false);
      }
    }
  }

  detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return 'typescript';
      case 'js': return 'javascript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  }

  getFileName(): string {
    if (!this.filePath) return '';
    const parts = this.filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }

  /**
   * Handler quando dados JSON são alterados
   */
  onJsonDataChanged(newData: any) {
    this.jsonData = newData;
    // Apenas atualizar em memória, não salvar automaticamente
    // O usuário deve clicar em "Salvar" para persistir
    this.markTabAsDirty();
  }

  /**
   * Handler quando ocorre erro no editor visual
   */
  onVisualEditorError() {
    console.warn('Erro no editor visual, voltando para Monaco Editor');
    this.showVisualEditor = false;
    // Recarregar arquivo no Monaco Editor
    if (this.filePath) {
      this.fileService.readFile(this.filePath).subscribe({
        next: (content) => {
          this.createEditor(content);
        },
        error: (error) => {
          console.error('Erro ao carregar arquivo no Monaco:', error);
        }
      });
    }
  }

  /**
   * Controla visibilidade do diálogo de configuração
   */
  showConfigDialog = false;

  /**
   * Abre diálogo de configuração
   */
  openConfigDialog() {
    this.showConfigDialog = true;
  }

  /**
   * Fecha diálogo de configuração
   */
  closeConfigDialog() {
    this.showConfigDialog = false;
  }
}

