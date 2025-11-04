import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService, FileItem } from '../../services/file.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-tree.component.html',
  styleUrl: './file-tree.component.css'
})
export class FileTreeComponent implements OnInit, OnDestroy {
  @Input() projectPath!: string;
  @Output() fileSelected = new EventEmitter<string>();
  
  files: FileItem[] = [];
  expandedDirs: Set<string> = new Set();
  selectedFile: string | null = null;
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
        this.files = items.filter(item => 
          !item.name.startsWith('.') && 
          item.name !== 'node_modules' && 
          item.name !== 'dist' &&
          item.name !== '.angular'
        );
        console.log('Diretório carregado:', this.files);
      },
      error: (error) => {
        console.error('Erro ao carregar diretório:', error);
      }
    });
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
        item.children = children.filter(child => 
          !child.name.startsWith('.') && 
          child.name !== 'node_modules' && 
          child.name !== 'dist' &&
          child.name !== '.angular'
        );
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

