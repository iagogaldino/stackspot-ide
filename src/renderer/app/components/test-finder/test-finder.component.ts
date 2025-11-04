import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../services/file.service';
import { TabsService } from '../../services/tabs.service';
import { WorkspaceService } from '../../services/workspace.service';
import { TerminalService } from '../../services/terminal.service';
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
  private subscriptions = new Subscription();
  private currentProjectPath: string | null = null;

  constructor(
    private fileService: FileService,
    private tabsService: TabsService,
    private workspaceService: WorkspaceService,
    private terminalService: TerminalService
  ) {}

  ngOnInit() {
    // Carregar projeto atual
    this.currentProjectPath = this.workspaceService.getProjectPath();
    if (this.currentProjectPath) {
      this.loadTestFiles();
    }
    
    // Escutar mudanças no projeto
    this.subscriptions.add(
      this.workspaceService.projectPath$.subscribe(projectPath => {
        this.currentProjectPath = projectPath;
        this.loadTestFiles();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadTestFiles() {
    const projectPath = this.currentProjectPath;
    
    if (!projectPath) {
      this.testFiles = [];
      this.error = null;
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      // Buscar arquivos de teste
      const testExtensions = ['.spec.ts', '.test.ts', '.spec.js', '.test.js'];
      this.testFiles = await this.fileService.listFilesByType(projectPath, testExtensions).toPromise() || [];
      
      // Ordenar por nome
      this.testFiles.sort();
      
      console.log(`Encontrados ${this.testFiles.length} arquivos de teste`);
    } catch (err: any) {
      this.error = `Erro ao buscar arquivos de teste: ${err.message}`;
      console.error('Erro ao carregar arquivos de teste:', err);
      this.testFiles = [];
    } finally {
      this.loading = false;
    }
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
   * Por enquanto, apenas loga os arquivos selecionados
   */
  generateTest() {
    const selected = Array.from(this.selectedTests);
    
    if (selected.length === 0) {
      console.log('Nenhum arquivo selecionado para gerar teste');
      return;
    }

    console.log('Gerar teste para os seguintes arquivos:', selected);
    // TODO: Implementar lógica de geração de teste
  }
}

