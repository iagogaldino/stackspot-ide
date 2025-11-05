import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService, FileItem } from '../../services/file.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './file-tree.component.html',
  styleUrl: './file-tree.component.css'
})
export class FileTreeComponent implements OnInit, OnDestroy {
  @Input() projectPath!: string;
  @Output() fileSelected = new EventEmitter<string>();
  
  allFiles: FileItem[] = []; // Armazena todos os arquivos sem filtro
  filteredFiles: FileItem[] = []; // Arquivos filtrados para exibição
  expandedDirs: Set<string> = new Set();
  selectedFile: string | null = null;
  filterText: string = '';
  private subscription: Subscription | null = null;

  constructor(
    private fileService: FileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDirectory(this.projectPath);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadDirectory(path: string) {
    this.subscription = this.fileService.readDirectory(path).subscribe({
      next: (items) => {
        // Filtrar node_modules, dist, etc.
        this.allFiles = items.filter(item => 
          !item.name.startsWith('.') && 
          item.name !== 'node_modules' && 
          item.name !== 'dist' &&
          item.name !== '.angular'
        );
        this.applyFilter();
        console.log('Diretório carregado:', this.allFiles);
      },
      error: (error) => {
        console.error('Erro ao carregar diretório:', error);
      }
    });
  }

  onFilterChange() {
    this.applyFilter();
  }

  applyFilter() {
    if (!this.filterText || this.filterText.trim() === '') {
      this.filteredFiles = this.allFiles;
      return;
    }

    const filterLower = this.filterText.toLowerCase().trim();
    this.filteredFiles = this.filterItems(this.allFiles, filterLower);
  }

  filterItems(items: FileItem[], filterText: string): FileItem[] {
    const filtered: FileItem[] = [];

    for (const item of items) {
      const matches = item.name.toLowerCase().includes(filterText);
      let filteredChildren: FileItem[] = [];

      // Se tem filhos, filtrar recursivamente
      if (item.children && item.children.length > 0) {
        filteredChildren = this.filterItems(item.children, filterText);
      }

      // Incluir se o item ou algum filho corresponde ao filtro
      if (matches || filteredChildren.length > 0) {
        const filteredItem: FileItem = {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : item.children
        };
        
        // Se tem filhos filtrados, expandir automaticamente
        if (filteredChildren.length > 0) {
          this.expandedDirs.add(item.path);
        }
        
        filtered.push(filteredItem);
      }
    }

    return filtered;
  }

  toggleDirectory(item: FileItem, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (item.isDirectory) {
      // Se for diretório, apenas expandir/colapsar, não selecionar
      if (this.expandedDirs.has(item.path)) {
        this.expandedDirs.delete(item.path);
      } else {
        this.expandedDirs.add(item.path);
        // Sempre carregar subdiretórios quando expandir
        // Mesmo se já tiver children, recarregar para garantir que está atualizado
        this.loadSubDirectory(item);
      }
    } else {
      // Se for arquivo, selecionar e abrir
      this.selectFile(item.path);
    }
  }

  loadSubDirectory(item: FileItem) {
    // Marcar como carregando
    item.children = [];
    
    this.fileService.readDirectory(item.path).subscribe({
      next: (children) => {
        const filteredChildren = children.filter(child => 
          !child.name.startsWith('.') && 
          child.name !== 'node_modules' && 
          child.name !== 'dist' &&
          child.name !== '.angular'
        );
        
        // Atualizar o item atual
        item.children = filteredChildren;
        
        // Atualizar também em allFiles para manter sincronização
        const updateInAllFiles = (items: FileItem[]): boolean => {
          for (const file of items) {
            if (file.path === item.path) {
              file.children = filteredChildren;
              return true;
            }
            if (file.children && updateInAllFiles(file.children)) {
              return true;
            }
          }
          return false;
        };
        updateInAllFiles(this.allFiles);
        
        // Reaplicar filtro se houver para atualizar filteredFiles
        if (this.filterText) {
          this.applyFilter();
        }
        
        // Forçar detecção de mudanças do Angular
        // Isso garante que a UI seja atualizada quando os filhos forem carregados
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar subdiretório:', error);
        item.children = [];
        this.cdr.detectChanges();
      }
    });
  }

  selectFile(filePath: string) {
    this.selectedFile = filePath;
    this.fileSelected.emit(filePath);
  }

  isExpanded(path: string): boolean {
    return this.expandedDirs.has(path);
  }

  isSelected(path: string): boolean {
    return this.selectedFile === path;
  }

  getFileIcon(item: FileItem): string {
    if (item.isDirectory) {
      return '📁';
    }
    
    const ext = item.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return '📘';
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'json': return '📋';
      case 'md': return '📝';
      default: return '📄';
    }
  }
}

