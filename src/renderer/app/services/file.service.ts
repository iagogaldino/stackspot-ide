import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  children?: FileItem[];
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  constructor(private electronService: ElectronService) {}

  readDirectory(dirPath: string): Observable<FileItem[]> {
    return this.electronService.readDirectory(dirPath).pipe(
      map(result => {
        if (result.success && result.items) {
          return result.items.map(item => ({
            name: item.name,
            path: item.path,
            isDirectory: item.isDirectory,
            isFile: item.isFile,
            children: undefined // Inicializar como undefined para ser carregado sob demanda
          }));
        }
        return [];
      })
    );
  }

  readFile(filePath: string): Observable<string> {
    return this.electronService.readFile(filePath).pipe(
      map(result => {
        if (result.success && result.content) {
          return result.content;
        }
        throw new Error(result.error || 'Erro ao ler arquivo');
      })
    );
  }

  writeFile(filePath: string, content: string): Observable<boolean> {
    return this.electronService.writeFile(filePath, content).pipe(
      map(result => {
        if (result.success) {
          return true;
        }
        throw new Error(result.error || 'Erro ao escrever arquivo');
      })
    );
  }

  isAngularProject(projectPath: string): Observable<boolean> {
    return this.electronService.isAngularProject(projectPath).pipe(
      map(result => result.success && result.isAngular === true)
    );
  }

  /**
   * Lista arquivos do projeto por tipo/extensão
   * @param projectPath Caminho do projeto
   * @param extensions Extensões a filtrar (ex: ['.ts', '.spec.ts', '.html'])
   * @returns Observable com array de caminhos relativos dos arquivos
   */
  listFilesByType(projectPath: string, extensions?: string[]): Observable<string[]> {
    return this.electronService.listFilesByType(projectPath, extensions).pipe(
      map(result => {
        if (result.success && result.files) {
          return result.files;
        }
        return [];
      })
    );
  }

  /**
   * Lista arquivos de teste (spec.ts, test.ts, etc.)
   */
  listTestFiles(projectPath: string): Observable<string[]> {
    return this.listFilesByType(projectPath, ['.spec.ts', '.test.ts', '.spec.js', '.test.js']);
  }

  /**
   * Lista arquivos TypeScript
   */
  listTypeScriptFiles(projectPath: string): Observable<string[]> {
    return this.listFilesByType(projectPath, ['.ts']);
  }

  /**
   * Lista arquivos HTML
   */
  listHtmlFiles(projectPath: string): Observable<string[]> {
    return this.listFilesByType(projectPath, ['.html']);
  }

  /**
   * Lista arquivos CSS/SCSS
   */
  listStyleFiles(projectPath: string): Observable<string[]> {
    return this.listFilesByType(projectPath, ['.css', '.scss', '.sass']);
  }
}

