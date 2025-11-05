import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService } from '../../services/file.service';
import { TabsService } from '../../services/tabs.service';
import { WorkspaceService } from '../../services/workspace.service';
import { Subscription } from 'rxjs';

interface SearchResult {
  path: string;
  name: string;
  extension: string;
  relativePath: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  fileTypeFilter: string = '';
  results: SearchResult[] = [];
  filteredResults: SearchResult[] = [];
  loading = false;
  error: string | null = null;
  private currentProjectPath: string | null = null;
  private subscriptions = new Subscription();

  // Tipos de arquivo comuns
  fileTypes = [
    { value: '', label: 'Todos os tipos' },
    { value: '.ts', label: 'TypeScript (.ts)' },
    { value: '.js', label: 'JavaScript (.js)' },
    { value: '.html', label: 'HTML (.html)' },
    { value: '.css', label: 'CSS (.css)' },
    { value: '.json', label: 'JSON (.json)' },
    { value: '.md', label: 'Markdown (.md)' },
    { value: '.spec.ts', label: 'Testes (.spec.ts)' },
    { value: '.test.ts', label: 'Testes (.test.ts)' }
  ];

  constructor(
    private fileService: FileService,
    private tabsService: TabsService,
    private workspaceService: WorkspaceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Carregar projeto atual
    this.currentProjectPath = this.workspaceService.getProjectPath();
    if (this.currentProjectPath) {
      this.loadAllFiles();
    }
    
    // Escutar mudanças no projeto
    this.subscriptions.add(
      this.workspaceService.projectPath$.subscribe(projectPath => {
        this.currentProjectPath = projectPath;
        this.results = [];
        this.filteredResults = [];
        this.searchQuery = '';
        this.fileTypeFilter = '';
        if (projectPath) {
          this.loadAllFiles();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFileTypeChange() {
    this.applyFilters();
  }

  applyFilters() {
    const queryLower = this.searchQuery.trim().toLowerCase();
    
    // Filtrar por nome e tipo
    this.filteredResults = this.results.filter(result => {
      // Se não há query de texto, mostrar todos (ou apenas os filtrados por tipo)
      const matchesName = !queryLower || 
                         result.name.toLowerCase().includes(queryLower) ||
                         result.relativePath.toLowerCase().includes(queryLower);
      
      // Sempre aplicar filtro de tipo se houver
      const matchesType = !this.fileTypeFilter || 
                         result.extension.toLowerCase() === this.fileTypeFilter.toLowerCase();
      
      return matchesName && matchesType;
    });
  }

  async loadAllFiles() {
    if (!this.currentProjectPath) {
      this.error = 'Nenhum projeto aberto';
      return;
    }

    const projectPath = this.currentProjectPath; // Garantir que não é null
    this.loading = true;
    this.error = null;

    try {
      // Buscar todos os arquivos do projeto
      const allFiles = await this.fileService.listFilesByType(projectPath).toPromise() || [];
      
      // Converter para SearchResult
      // Os arquivos retornados são relativos ao projeto, precisamos converter para absolutos
      this.results = allFiles.map(filePath => {
        // Construir caminho absoluto
        // filePath pode ser relativo ou absoluto (por segurança)
        let absolutePath: string;
        if (filePath.startsWith(projectPath)) {
          // Já é absoluto
          absolutePath = filePath;
        } else {
          // É relativo, construir caminho absoluto
          const isWindows = navigator.platform.toLowerCase().includes('win');
          const pathSeparator = isWindows ? '\\' : '/';
          absolutePath = `${projectPath}${pathSeparator}${filePath.replace(/\//g, pathSeparator)}`;
        }
        
        const fileName = filePath.split(/[\/\\]/).pop() || '';
        const extension = fileName.includes('.') 
          ? '.' + fileName.split('.').pop() 
          : '';
        
        return {
          path: absolutePath,
          name: fileName,
          extension: extension,
          relativePath: filePath
        };
      });

      // Sempre aplicar filtros (pode mostrar todos os arquivos se não houver filtro)
      this.applyFilters();
      
    } catch (err: any) {
      this.error = `Erro ao carregar arquivos: ${err.message}`;
      console.error('Erro ao carregar arquivos:', err);
      this.results = [];
      this.filteredResults = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async performSearch() {
    // A busca agora é apenas filtrar os resultados já carregados
    this.applyFilters();
  }

  openFile(result: SearchResult) {
    this.tabsService.openTab(result.path);
  }

  getFileIcon(extension: string): string {
    switch (extension.toLowerCase()) {
      case '.ts': return '📘';
      case '.js': return '📜';
      case '.html': return '🌐';
      case '.css': return '🎨';
      case '.json': return '📋';
      case '.md': return '📝';
      case '.spec.ts':
      case '.test.ts': return '🧪';
      default: return '📄';
    }
  }
}

