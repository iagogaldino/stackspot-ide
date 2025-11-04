import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService } from '../../services/file.service';
import { TestParserService } from '../../services/test-parser.service';
import { TerminalService } from '../../services/terminal.service';
import { TestFrameworkService } from '../../services/test-framework.service';
import { WorkspaceService } from '../../services/workspace.service';
import { TerminalVisibilityService } from '../../services/terminal-visibility.service';
import { TestOutputParserService } from '../../services/test-output-parser.service';
import { TestFileStructure, ImportStatement, DescribeBlock, ItBlock, TestStatus } from './models/test-file-structure.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-test-visual-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-visual-editor.component.html',
  styleUrl: './test-visual-editor.component.css'
})
export class TestVisualEditorComponent implements OnInit, OnDestroy {
  @Input() testFileContent!: string;
  @Input() filePath!: string;
  @Output() dataChanged = new EventEmitter<string>();
  @Output() errorOccurred = new EventEmitter<void>();

  structure: TestFileStructure | null = null;
  hasError = false;
  errorMessage = '';
  private originalContent: string = '';

  // Estados de edição
  editingImport: ImportStatement | null = null;
  editingDescribe: DescribeBlock | null = null;
  editingIt: ItBlock | null = null;
  newImport: Partial<ImportStatement> | null = null;
  newDescribe: Partial<DescribeBlock> | null = null;
  newIt: Partial<ItBlock> | null = null;

  isRunningTests = false;
  private testOutputSubscription?: Subscription;

  constructor(
    private fileService: FileService,
    private testParser: TestParserService,
    private terminalService: TerminalService,
    private testFrameworkService: TestFrameworkService,
    private workspaceService: WorkspaceService,
    private terminalVisibilityService: TerminalVisibilityService,
    private testOutputParser: TestOutputParserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (!this.testFileContent) {
      console.error('TestVisualEditorComponent: testFileContent é null ou undefined');
      this.hasError = true;
      this.errorOccurred.emit();
      return;
    }

    try {
      this.originalContent = this.testFileContent;
      this.structure = this.testParser.parseTestFile(this.testFileContent);
    } catch (error: any) {
      console.error('Erro ao parsear arquivo de teste:', error);
      this.hasError = true;
      this.errorMessage = error.message || 'Erro ao parsear arquivo de teste';
      this.errorOccurred.emit();
    }
  }

  ngOnDestroy() {
    // Limpar subscriptions
    if (this.testOutputSubscription) {
      this.testOutputSubscription.unsubscribe();
    }
    // Limpar status dos testes
    this.resetTestStatuses();
  }

  /**
   * Reseta o status de todos os testes
   */
  private resetTestStatuses() {
    if (!this.structure) return;
    
    this.structure.describeBlocks.forEach(describe => {
      describe.itBlocks.forEach(it => {
        it.status = 'not-run';
        it.errorMessage = undefined;
      });
    });
  }

  /**
   * Atualiza o status de um teste baseado no resultado do output
   */
  private updateTestStatus(testName: string, describeName: string | undefined, status: 'passed' | 'failed' | 'running', errorMessage?: string) {
    if (!this.structure) {
      console.log('[TestEditor] updateTestStatus: estrutura não disponível');
      return;
    }

    // console.log('[TestEditor] Tentando fazer match:', { testName, describeName, status });

    // Buscar o teste correspondente
    for (const describe of this.structure.describeBlocks) {
      // Verificar se é o describe correto
      if (describeName) {
        const describeMatches = this.testOutputParser.matchTestName(describe.name, describeName);
        // console.log('[TestEditor] Describe match:', describe.name, 'vs', describeName, '=', describeMatches);
        if (!describeMatches) {
          continue;
        }
      }

      // Buscar o it block correspondente
      for (const it of describe.itBlocks) {
        const testMatches = this.testOutputParser.matchTestName(it.name, testName);
        // console.log('[TestEditor] Test match:', it.name, 'vs', testName, '=', testMatches);
        
        if (testMatches) {
          // console.log('[TestEditor] Match encontrado! Atualizando status para:', status);
          it.status = status;
          if (errorMessage) {
            it.errorMessage = errorMessage;
          }
          // Forçar detecção de mudanças para atualizar a UI
          this.cdr.detectChanges();
          return;
        }
      }
    }

    // console.log('[TestEditor] Nenhum match encontrado para:', { testName, describeName });
  }

  /**
   * Marca todos os testes como "running" quando começa a execução
   */
  private markTestsAsRunning() {
    if (!this.structure) return;
    
    this.structure.describeBlocks.forEach(describe => {
      describe.itBlocks.forEach(it => {
        it.status = 'running';
        it.errorMessage = undefined;
      });
    });
  }

  /**
   * Salva o arquivo de teste
   */
  saveTestFile() {
    if (!this.structure) return;

    // Validar estrutura antes de salvar
    if (!this.validateStructure()) {
      return;
    }

    try {
      const generatedCode = this.testParser.generateCode(this.structure);
      
      this.fileService.writeFile(this.filePath, generatedCode).subscribe({
        next: () => {
          this.originalContent = generatedCode;
          this.dataChanged.emit(generatedCode);
          this.showSuccessMessage('Arquivo salvo com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao salvar arquivo de teste:', error);
          this.showErrorMessage('Erro ao salvar arquivo: ' + (error.message || 'Erro desconhecido'));
        }
      });
    } catch (error: any) {
      console.error('Erro ao gerar código:', error);
      this.showErrorMessage('Erro ao gerar código: ' + (error.message || 'Erro desconhecido'));
    }
  }

  private validateStructure(): boolean {
    if (!this.structure) return false;

    // Validar imports
    for (const imp of this.structure.imports) {
      if (!imp.from || imp.from.trim() === '') {
        this.showErrorMessage('Todos os imports devem ter um "from" válido');
        return false;
      }
    }

    // Validar describes
    for (const describe of this.structure.describeBlocks) {
      if (!describe.name || describe.name.trim() === '') {
        this.showErrorMessage('Todos os describe blocks devem ter um nome');
        return false;
      }

      // Validar it blocks
      for (const it of describe.itBlocks) {
        if (!it.name || it.name.trim() === '') {
          this.showErrorMessage('Todos os testes devem ter um nome');
          return false;
        }
      }
    }

    return true;
  }

  private showSuccessMessage(message: string) {
    // Criar elemento de notificação temporário
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #4caf50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  private showErrorMessage(message: string) {
    // Criar elemento de notificação temporário
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #f44336;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * Gerenciamento de Imports
   */
  startEditingImport(imp: ImportStatement) {
    this.editingImport = { ...imp };
    this.cancelNewImport();
    this.cancelEditing();
  }

  saveImport(imp: ImportStatement) {
    if (!this.structure) return;

    const index = this.structure.imports.findIndex(i => i.id === imp.id);
    if (index !== -1 && this.editingImport) {
      this.structure.imports[index] = { ...this.editingImport };
      this.editingImport = null;
    }
  }

  cancelEditingImport() {
    this.editingImport = null;
  }

  deleteImport(imp: ImportStatement) {
    if (!this.structure) return;
    if (confirm('Tem certeza que deseja remover este import?')) {
      this.structure.imports = this.structure.imports.filter(i => i.id !== imp.id);
    }
  }

  startNewImport() {
    this.newImport = {
      namedImports: [],
      from: ''
    };
    this.cancelEditing();
  }

  addNewImport() {
    if (!this.structure || !this.newImport || !this.newImport.from) return;

    const newImport: ImportStatement = {
      id: `import_${Date.now()}`,
      defaultImport: this.newImport.defaultImport,
      namedImports: this.newImport.namedImports?.filter(Boolean) || [],
      namespaceImport: this.newImport.namespaceImport,
      from: this.newImport.from,
      originalLine: 0,
      originalText: ''
    };

    this.structure.imports.push(newImport);
    this.cancelNewImport();
  }

  cancelNewImport() {
    this.newImport = null;
  }

  addNamedImport(imp: ImportStatement) {
    if (!imp.namedImports) {
      imp.namedImports = [];
    }
    imp.namedImports.push('');
  }

  removeNamedImport(imp: ImportStatement, index: number) {
    if (imp.namedImports) {
      imp.namedImports.splice(index, 1);
    }
  }

  addNamedImportToNew() {
    if (!this.newImport) return;
    if (!this.newImport.namedImports) {
      this.newImport.namedImports = [];
    }
    this.newImport.namedImports.push('');
  }

  removeNamedImportFromNew(index: number) {
    if (!this.newImport || !this.newImport.namedImports) return;
    this.newImport.namedImports.splice(index, 1);
  }

  /**
   * Gerenciamento de Describe Blocks
   */
  startEditingDescribe(describe: DescribeBlock) {
    this.editingDescribe = { ...describe };
    this.cancelNewDescribe();
    this.cancelEditing();
  }

  saveDescribe(describe: DescribeBlock) {
    if (!this.structure || !this.editingDescribe) return;

    const index = this.structure.describeBlocks.findIndex(d => d.id === describe.id);
    if (index !== -1) {
      this.structure.describeBlocks[index] = { ...this.editingDescribe };
      this.editingDescribe = null;
    }
  }

  cancelEditingDescribe() {
    this.editingDescribe = null;
  }

  deleteDescribe(describe: DescribeBlock) {
    if (!this.structure) return;
    if (confirm('Tem certeza que deseja remover este describe block?')) {
      this.structure.describeBlocks = this.structure.describeBlocks.filter(d => d.id !== describe.id);
    }
  }

  startNewDescribe() {
    this.newDescribe = {
      name: '',
      itBlocks: []
    };
    this.cancelEditing();
  }

  addNewDescribe() {
    if (!this.structure || !this.newDescribe || !this.newDescribe.name) return;

    const newDescribe: DescribeBlock = {
      id: `describe_${Date.now()}`,
      name: this.newDescribe.name,
      originalLine: 0,
      beforeEach: this.newDescribe.beforeEach,
      afterEach: this.newDescribe.afterEach,
      beforeAll: this.newDescribe.beforeAll,
      afterAll: this.newDescribe.afterAll,
      itBlocks: [],
      additionalCode: ''
    };

    this.structure.describeBlocks.push(newDescribe);
    this.cancelNewDescribe();
  }

  cancelNewDescribe() {
    this.newDescribe = null;
  }

  /**
   * Gerenciamento de It Blocks
   */
  startEditingIt(describe: DescribeBlock, it: ItBlock) {
    this.editingIt = { ...it };
    this.editingDescribe = describe;
    this.cancelNewIt();
    this.cancelEditing();
  }

  saveIt(describe: DescribeBlock, it: ItBlock) {
    if (!this.structure || !this.editingDescribe || !this.editingIt) return;

    const describeIndex = this.structure.describeBlocks.findIndex(d => d.id === describe.id);
    if (describeIndex !== -1) {
      const itIndex = this.structure.describeBlocks[describeIndex].itBlocks.findIndex(i => i.id === it.id);
      if (itIndex !== -1) {
        this.structure.describeBlocks[describeIndex].itBlocks[itIndex] = { ...this.editingIt };
        this.editingIt = null;
        this.editingDescribe = null;
      }
    }
  }

  cancelEditingIt() {
    this.editingIt = null;
    this.editingDescribe = null;
  }

  deleteIt(describe: DescribeBlock, it: ItBlock) {
    if (!this.structure) return;
    if (confirm('Tem certeza que deseja remover este teste?')) {
      const describeIndex = this.structure.describeBlocks.findIndex(d => d.id === describe.id);
      if (describeIndex !== -1) {
        this.structure.describeBlocks[describeIndex].itBlocks = 
          this.structure.describeBlocks[describeIndex].itBlocks.filter(i => i.id !== it.id);
      }
    }
  }

  startNewIt(describe: DescribeBlock) {
    // Cancelar outras edições, mas manter o describe para criar o it
    this.editingImport = null;
    this.editingIt = null;
    this.cancelNewImport();
    this.cancelNewDescribe();
    
    // Iniciar novo it block
    this.newIt = {
      name: '',
      body: '',
      isTest: false
    };
    this.editingDescribe = describe;
  }

  addNewIt() {
    if (!this.structure || !this.editingDescribe || !this.newIt || !this.newIt.name) {
      console.log('addNewIt: validação falhou', { 
        hasStructure: !!this.structure, 
        hasEditingDescribe: !!this.editingDescribe, 
        hasNewIt: !!this.newIt, 
        newItName: this.newIt?.name 
      });
      return;
    }

    const newIt: ItBlock = {
      id: `it_${Date.now()}`,
      name: this.newIt.name,
      originalLine: 0,
      body: this.newIt.body || '    expect(true).toBeTruthy();',
      isTest: this.newIt.isTest || false
    };

    const describeIndex = this.structure.describeBlocks.findIndex(d => d.id === this.editingDescribe!.id);
    if (describeIndex !== -1) {
      this.structure.describeBlocks[describeIndex].itBlocks.push(newIt);
      this.newIt = null;
      // Manter editingDescribe para permitir adicionar mais testes
      // this.editingDescribe = null;
      console.log('addNewIt: teste adicionado com sucesso');
    } else {
      console.error('addNewIt: describe não encontrado', this.editingDescribe.id);
    }
  }

  cancelNewIt() {
    this.newIt = null;
    // Só limpar editingDescribe se não estiver editando o describe
    if (!this.editingIt) {
      this.editingDescribe = null;
    }
  }

  /**
   * Cancelar todas as edições
   */
  private cancelEditing() {
    this.editingImport = null;
    // Não cancelar editingDescribe aqui se estamos criando um novo it
    // this.editingDescribe = null;
    this.editingIt = null;
  }

  /**
   * Obtém nome do arquivo
   */
  getFileName(): string {
    if (!this.filePath) return '';
    const parts = this.filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }

  /**
   * Obtém o caminho do projeto
   */
  private getProjectPath(): string | null {
    // Tentar obter do WorkspaceService primeiro
    const workspacePath = this.workspaceService.getProjectPath();
    if (workspacePath) {
      return workspacePath;
    }
    
    // Fallback: tentar encontrar o diretório raiz do projeto subindo na árvore
    if (!this.filePath) return null;
    
    const pathParts = this.filePath.split(/[\/\\]/);
    
    // Procurar por angular.json ou package.json subindo na árvore
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const potentialPath = pathParts.slice(0, i + 1).join('/');
      // Por enquanto, assumir que o projeto está 2-3 níveis acima do arquivo
      // Isso pode ser melhorado depois verificando se existe package.json
      if (i < pathParts.length - 3) {
        return potentialPath;
      }
    }
    
    // Último fallback: retornar diretório do arquivo
    const pathWithoutFile = pathParts.slice(0, -1).join('/');
    return pathWithoutFile;
  }

  /**
   * Executa o teste do arquivo atual
   */
  runTest() {
    if (!this.filePath || this.isRunningTests) return;

    // Obter caminho do projeto
    const projectPath = this.getProjectPath();
    
    if (!projectPath) {
      this.showErrorMessage('Não foi possível determinar o caminho do projeto. Certifique-se de que um projeto está aberto.');
      return;
    }

    this.isRunningTests = true;
    this.showSuccessMessage('Executando testes...');

    // Limpar buffer do parser
    this.testOutputParser.clearBuffer();

    // Resetar status dos testes e marcar como running
    this.resetTestStatuses();
    this.markTestsAsRunning();

    // Abrir terminal automaticamente
    this.terminalVisibilityService.openTerminal();

    // Aguardar um pouco para o terminal abrir antes de executar o comando
    setTimeout(() => {
      // Detectar framework de teste
      this.testFrameworkService.detectTestFramework(projectPath).subscribe({
        next: (frameworkInfo) => {
          // Gerar comando para executar o arquivo de teste específico
          const command = frameworkInfo.testFileCommand(this.filePath, projectPath);
          
          console.log('Executando comando de teste:', command);
          
          // Limpar subscription anterior se existir
          if (this.testOutputSubscription) {
            this.testOutputSubscription.unsubscribe();
          }

          // Observar output do terminal em tempo real
          this.testOutputSubscription = this.terminalService.output$.subscribe({
            next: (output) => {
              // Parsear output - o output pode vir em chunks, então processamos linha por linha
              const lines = output.split(/\r?\n/);
              for (const line of lines) {
                if (line.trim()) {
                  const results = this.testOutputParser.parseOutputLine(line);
                  
                  // Atualizar status dos testes em tempo real
                  results.forEach(result => {
                    // console.log('[TestEditor] Atualizando status do teste:', result);
                    this.updateTestStatus(
                      result.testName,
                      result.describeName,
                      result.status,
                      result.errorMessage
                    );
                  });
                }
              }
            }
          });
          
          // Executar comando no terminal
          this.terminalService.executeCommand(command, projectPath);

          // Parar de observar após 60 segundos (ou quando o teste terminar)
          setTimeout(() => {
            if (this.testOutputSubscription) {
              this.testOutputSubscription.unsubscribe();
              this.testOutputSubscription = undefined;
            }
            this.isRunningTests = false;
            this.showSuccessMessage('Execução do teste finalizada. Verifique o terminal para ver os resultados.');
          }, 60000);
        },
        error: (error) => {
          console.error('Erro ao detectar framework de teste:', error);
          this.isRunningTests = false;
          this.showErrorMessage('Erro ao detectar framework de teste. Tentando executar com comando padrão...');
          
          // Fallback: tentar com npm test
          const command = `npm test -- ${this.getFileName()}`;
          console.log('Executando comando fallback:', command);
          this.terminalService.executeCommand(command, projectPath);
          
          setTimeout(() => {
            this.isRunningTests = false;
          }, 60000);
        }
      });
    }, 300); // Aguardar 300ms para o terminal abrir
  }

  /**
   * Formata string de exibição do describe
   */
  getDescribeDisplay(describe: DescribeBlock): string {
    return `describe('${describe.name}', ...)`;
  }

  /**
   * Formata string de exibição do it block
   */
  getItDisplay(it: ItBlock): string {
    return `${it.isTest ? 'test' : 'it'}('${it.name}', ...)`;
  }

  /**
   * Formata string de exibição do import
   */
  getImportDisplay(imp: ImportStatement): string {
    let result = '';
    
    if (imp.defaultImport) {
      result += imp.defaultImport;
    }
    
    if (imp.defaultImport && imp.namedImports && imp.namedImports.length > 0) {
      result += ', ';
    }
    
    if (imp.namedImports && imp.namedImports.length > 0) {
      result += `{ ${imp.namedImports.join(', ')} }`;
    }
    
    if (imp.namespaceImport) {
      result += `* as ${imp.namespaceImport}`;
    }
    
    result += ` from '${imp.from}'`;
    
    return result;
  }
}

