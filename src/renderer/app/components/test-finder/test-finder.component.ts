import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../services/file.service';
import { TabsService } from '../../services/tabs.service';
import { WorkspaceService } from '../../services/workspace.service';
import { TerminalService } from '../../services/terminal.service';
import { TestGeneratorService, TestGenerationProgress } from '../../services/test-generator';
import { TerminalVisibilityService } from '../../services/terminal-visibility.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-test-finder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-finder.component.html',
  styleUrl: './test-finder.component.css'
})
export class TestFinderComponent implements OnInit, OnDestroy {
  testFiles: string[] = [];
  selectedTests: Set<string> = new Set();
  loading = false;
  error: string | null = null;
  openedTestFile: string | null = null;
  generating = false;
  showProgress = false;
  generationProgress: TestGenerationProgress | null = null;
  private subscriptions = new Subscription();
  private currentProjectPath: string | null = null;

  constructor(
    private fileService: FileService,
    private tabsService: TabsService,
    private workspaceService: WorkspaceService,
    private terminalService: TerminalService,
    private testGeneratorService: TestGeneratorService,
    private terminalVisibilityService: TerminalVisibilityService
  ) {}

  ngOnInit() {
    // Carregar projeto atual
    this.currentProjectPath = this.workspaceService.getProjectPath();
    if (this.currentProjectPath) {
      this.loadSourceFiles();
    }
    
    // Escutar mudanças no projeto
    this.subscriptions.add(
      this.workspaceService.projectPath$.subscribe(projectPath => {
        this.currentProjectPath = projectPath;
        this.loadSourceFiles();
      })
    );

    // Escutar progresso da geração
    this.subscriptions.add(
      this.testGeneratorService.progress$.subscribe((progress: TestGenerationProgress) => {
        this.generationProgress = progress;
        this.showProgress = true;
        
        // Se completou, fechar progresso após delay
        if (progress.fileStatus === 'completed' && progress.currentFile === progress.totalFiles) {
          setTimeout(() => {
            this.showProgress = false;
            this.generating = false;
            this.loadSourceFiles(); // Recarregar lista para mostrar novos arquivos
          }, 3000);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadSourceFiles() {
    const projectPath = this.currentProjectPath;
    
    if (!projectPath) {
      this.testFiles = [];
      this.error = null;
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      // Buscar arquivos TypeScript fonte (exclui arquivos de teste)
      this.testFiles = await this.fileService.listSourceFiles(projectPath).toPromise() || [];
      
      // Ordenar por nome
      this.testFiles.sort();
      
      console.log(`Encontrados ${this.testFiles.length} arquivos fonte (.ts)`);
    } catch (err: any) {
      this.error = `Erro ao buscar arquivos fonte: ${err.message}`;
      console.error('Erro ao carregar arquivos fonte:', err);
      this.testFiles = [];
    } finally {
      this.loading = false;
    }
  }

  // Manter método loadTestFiles para compatibilidade (caso seja chamado de outros lugares)
  async loadTestFiles() {
    await this.loadSourceFiles();
  }

  openTestFile(filePath: string, event?: Event) {
    if (event) {
      event.stopPropagation(); // Evitar que o checkbox seja acionado
    }

    const projectPath = this.currentProjectPath;
    
    if (!projectPath) {
      return;
    }

    // Construir caminho absoluto
    // filePath pode ser relativo ou absoluto
    let fullPath: string;
    if (filePath.startsWith(projectPath)) {
      // Já é absoluto
      fullPath = filePath;
    } else {
      // É relativo, construir caminho absoluto
      // Detectar sistema operacional via userAgent ou usar '/' como padrão
      const isWindows = navigator.platform.toLowerCase().includes('win');
      const pathSeparator = isWindows ? '\\' : '/';
      fullPath = `${projectPath}${pathSeparator}${filePath.replace(/\//g, pathSeparator)}`;
    }

    // Armazenar arquivo aberto para mostrar o prompt
    this.openedTestFile = fullPath;

    // Abrir arquivo na aba
    this.tabsService.openTab(fullPath);
  }

  closeTestPrompt() {
    this.openedTestFile = null;
  }

  getFileName(filePath: string): string {
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }

  toggleTestSelection(filePath: string, event: Event) {
    event.stopPropagation(); // Evitar que abra o arquivo ao clicar no checkbox
    
    if (this.selectedTests.has(filePath)) {
      this.selectedTests.delete(filePath);
    } else {
      this.selectedTests.add(filePath);
    }
  }

  isTestSelected(filePath: string): boolean {
    return this.selectedTests.has(filePath);
  }

  selectAll() {
    this.testFiles.forEach(file => this.selectedTests.add(file));
  }

  deselectAll() {
    this.selectedTests.clear();
  }

  getSelectedCount(): number {
    return this.selectedTests.size;
  }

  async runSelectedTests() {
    const selected = Array.from(this.selectedTests);
    
    if (selected.length === 0) {
      return;
    }

    const projectPath = this.currentProjectPath;
    if (!projectPath) {
      alert('Nenhum projeto aberto');
      return;
    }

    try {
      // Construir caminhos relativos dos arquivos de teste
      const testPaths = selected.map(filePath => {
        if (filePath.startsWith(projectPath)) {
          // É absoluto, converter para relativo
          const relative = filePath.substring(projectPath.length);
          return relative.replace(/^[\/\\]/, '').replace(/\\/g, '/');
        }
        // Já é relativo
        return filePath.replace(/\\/g, '/');
      });

      // Executar comando ng test ou npm test
      // Para Angular, geralmente é: ng test --include="**/arquivo.spec.ts"
      const testPattern = testPaths.map(path => `"**/${this.getFileName(path)}"`).join(' ');
      
      // Comando para executar testes específicos
      const command = `ng test --include="${testPattern}" --watch=false`;
      
      // Executar no terminal
      this.terminalService.executeCommand(command);
      
      console.log(`Executando ${selected.length} teste(s):`, testPaths);
    } catch (error: any) {
      console.error('Erro ao executar testes:', error);
      alert(`Erro ao executar testes: ${error.message}`);
    }
  }

  /**
   * Gera teste para os arquivos selecionados
   */
  generateTest() {
    const selected = Array.from(this.selectedTests);
    
    if (selected.length === 0) {
      console.log('Nenhum arquivo selecionado para gerar teste');
      return;
    }

    const projectPath = this.currentProjectPath;
    if (!projectPath) {
      alert('Nenhum projeto aberto');
      return;
    }

    // Construir caminhos absolutos dos arquivos selecionados
    const sourceFiles = selected.map(filePath => {
      if (filePath.startsWith(projectPath)) {
        return filePath;
      }
      // É relativo, construir caminho absoluto
      const isWindows = navigator.platform.toLowerCase().includes('win');
      const pathSeparator = isWindows ? '\\' : '/';
      return `${projectPath}${pathSeparator}${filePath.replace(/\//g, pathSeparator)}`;
    });

    this.generating = true;
    this.showProgress = true;
    
    // Abrir terminal automaticamente
    this.terminalVisibilityService.openTerminal();

    // Iniciar geração
    this.testGeneratorService.generateTests(sourceFiles).subscribe({
      next: (progress: TestGenerationProgress) => {
        this.generationProgress = progress;
      },
      error: (error: any) => {
        console.error('Erro ao gerar testes:', error);
        alert(`Erro ao gerar testes: ${error.message || 'Erro desconhecido'}`);
        this.generating = false;
        this.showProgress = false;
      }
    });
  }

  /**
   * Cancela a geração em andamento
   */
  cancelGeneration() {
    this.testGeneratorService.cancel();
    this.generating = false;
    this.showProgress = false;
  }

  /**
   * Fecha o modal de progresso
   */
  closeProgress() {
    if (!this.generating) {
      this.showProgress = false;
    }
  }

  // Expor Math para o template
  Math = Math;
}

