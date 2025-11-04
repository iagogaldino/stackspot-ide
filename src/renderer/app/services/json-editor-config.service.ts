import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JSONEditorConfigService {
  // Arquivos padrão que sempre usam interface visual
  private readonly defaultFiles = [
    'package.json',
    'tsconfig.json',
    'angular.json',
    'tsconfig.app.json',
    'tsconfig.spec.json',
    'composer.json',
    'bower.json'
  ];

  // Arquivos customizados pelo usuário
  private customFiles: string[] = [];
  private customFilesSubject = new BehaviorSubject<string[]>([]);
  public customFiles$ = this.customFilesSubject.asObservable();

  constructor(private electronService: ElectronService) {
    this.loadConfig();
  }

  /**
   * Verifica se um arquivo deve usar o editor visual
   */
  shouldUseVisualEditor(filePath: string): boolean {
    const fileName = this.getFileName(filePath);
    
    // Verificar arquivos padrão
    if (this.defaultFiles.includes(fileName)) {
      return true;
    }
    
    // Verificar arquivos customizados
    if (this.customFiles.includes(fileName)) {
      return true;
    }
    
    return false;
  }

  /**
   * Adiciona um arquivo à lista de customizados
   */
  addFile(fileName: string): Observable<boolean> {
    if (!this.customFiles.includes(fileName)) {
      this.customFiles.push(fileName);
      this.customFilesSubject.next([...this.customFiles]);
      return this.saveConfig();
    }
    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }

  /**
   * Remove um arquivo da lista de customizados
   */
  removeFile(fileName: string): Observable<boolean> {
    this.customFiles = this.customFiles.filter(f => f !== fileName);
    this.customFilesSubject.next([...this.customFiles]);
    return this.saveConfig();
  }

  /**
   * Retorna lista de arquivos customizados
   */
  getCustomFiles(): string[] {
    return [...this.customFiles];
  }

  /**
   * Retorna lista de arquivos padrão
   */
  getDefaultFiles(): string[] {
    return [...this.defaultFiles];
  }

  /**
   * Retorna todos os arquivos configurados (padrão + customizados)
   */
  getAllConfiguredFiles(): string[] {
    return [...this.defaultFiles, ...this.customFiles];
  }

  /**
   * Extrai nome do arquivo do caminho completo
   */
  private getFileName(filePath: string): string {
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }

  /**
   * Carrega configuração do arquivo de settings
   */
  private loadConfig() {
    this.electronService.loadConfig().subscribe({
      next: (result) => {
        if (result.success && result.config) {
          // Carregar configuração existente e mesclar com padrão
          const savedConfig = result.config;
          
          if (savedConfig.jsonEditorFiles && Array.isArray(savedConfig.jsonEditorFiles)) {
            this.customFiles = savedConfig.jsonEditorFiles;
            this.customFilesSubject.next([...this.customFiles]);
          }
        }
      },
      error: (error) => {
        console.error('Erro ao carregar configuração do editor JSON:', error);
      }
    });
  }

  /**
   * Salva configuração no arquivo de settings
   */
  private saveConfig(): Observable<boolean> {
    return new Observable(observer => {
      this.electronService.loadConfig().subscribe({
        next: (result) => {
          if (result.success && result.config) {
            // Mesclar com configuração existente
            const updatedConfig = {
              ...result.config,
              jsonEditorFiles: this.customFiles
            };
            
            this.electronService.saveConfig(updatedConfig).subscribe({
              next: () => {
                console.log('Configuração do editor JSON salva com sucesso');
                observer.next(true);
                observer.complete();
              },
              error: (error) => {
                console.error('Erro ao salvar configuração do editor JSON:', error);
                observer.next(false);
                observer.complete();
              }
            });
          } else {
            // Se não há configuração existente, criar nova
            this.electronService.saveConfig({
              jsonEditorFiles: this.customFiles
            }).subscribe({
              next: () => {
                console.log('Configuração do editor JSON salva com sucesso');
                observer.next(true);
                observer.complete();
              },
              error: (error) => {
                console.error('Erro ao salvar configuração do editor JSON:', error);
                observer.next(false);
                observer.complete();
              }
            });
          }
        },
        error: (error) => {
          // Se erro ao carregar, criar nova configuração
          this.electronService.saveConfig({
            jsonEditorFiles: this.customFiles
          }).subscribe({
            next: () => {
              observer.next(true);
              observer.complete();
            },
            error: (err) => {
              console.error('Erro ao salvar configuração do editor JSON:', err);
              observer.next(false);
              observer.complete();
            }
          });
        }
      });
    });
  }
}

