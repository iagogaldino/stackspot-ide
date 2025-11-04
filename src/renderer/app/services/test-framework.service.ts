import { Injectable } from '@angular/core';
import { FileService } from './file.service';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export type TestFramework = 'jest' | 'jasmine' | 'karma' | 'mocha' | 'vitest' | 'unknown';

export interface TestFrameworkInfo {
  framework: TestFramework;
  command: string; // Comando base para executar testes
  testFileCommand: (filePath: string, projectPath: string) => string; // Comando para executar arquivo específico
}

@Injectable({
  providedIn: 'root'
})
export class TestFrameworkService {
  constructor(private fileService: FileService) {}

  /**
   * Detecta qual framework de teste está configurado no projeto
   */
  detectTestFramework(projectPath: string): Observable<TestFrameworkInfo> {
    // Ler package.json para verificar dependências e scripts
    const packageJsonPath = `${projectPath}/package.json`;
    
    return this.fileService.readFile(packageJsonPath).pipe(
      switchMap((content) => {
        try {
          const packageJson = JSON.parse(content);
          const dependencies = {
            ...packageJson.dependencies || {},
            ...packageJson.devDependencies || {}
          };
          
          const scripts = packageJson.scripts || {};
          
          // Verificar por dependências
          const hasJest = dependencies['jest'] || dependencies['@jest/globals'];
          const hasJasmine = dependencies['jasmine'] || dependencies['@types/jasmine'];
          const hasKarma = dependencies['karma'];
          const hasMocha = dependencies['mocha'];
          const hasVitest = dependencies['vitest'];
          
          // Verificar por scripts de teste
          const hasJestScript = scripts['test']?.includes('jest') || scripts['test:unit']?.includes('jest');
          const hasKarmaScript = scripts['test']?.includes('karma') || scripts['test:unit']?.includes('karma');
          const hasVitestScript = scripts['test']?.includes('vitest') || scripts['test:unit']?.includes('vitest');
          
          // Prioridade: Jest > Vitest > Karma/Jasmine > Mocha
          if (hasJest || hasJestScript) {
            return of(this.getJestInfo());
          }
          
          if (hasVitest || hasVitestScript) {
            return of(this.getVitestInfo());
          }
          
          if (hasKarma || hasKarmaScript) {
            return of(this.getKarmaInfo());
          }
          
          if (hasJasmine && !hasKarma) {
            return of(this.getJasmineInfo());
          }
          
          if (hasMocha) {
            return of(this.getMochaInfo());
          }
          
          // Verificar arquivos de configuração
          // Por padrão, se for Angular, provavelmente é Karma
          return this.fileService.isAngularProject(projectPath).pipe(
            map((isAngular) => {
              if (isAngular) {
                return this.getKarmaInfo();
              }
              // Padrão: tentar Jest (mais comum)
              return this.getJestInfo();
            })
          );
        } catch (error) {
          console.error('Erro ao detectar framework de teste:', error);
          // Padrão: Jest
          return of(this.getJestInfo());
        }
      }),
      catchError((error) => {
        console.error('Erro ao ler package.json:', error);
        // Padrão: Jest
        return of(this.getJestInfo());
      })
    );
  }

  private getJestInfo(): TestFrameworkInfo {
    return {
      framework: 'jest',
      command: 'npm test',
      testFileCommand: (filePath: string, projectPath: string) => {
        // Converter caminho absoluto para relativo
        // Normalizar separadores e garantir que o caminho está correto
        const normalizedProjectPath = projectPath.replace(/\\/g, '/');
        const normalizedFilePath = filePath.replace(/\\/g, '/');
        let relativePath = normalizedFilePath.replace(normalizedProjectPath + '/', '');
        
        // Se ainda é absoluto, tentar extrair apenas o nome do arquivo
        if (relativePath.includes(':/')) {
          const parts = normalizedFilePath.split('/');
          relativePath = parts[parts.length - 1];
        }
        
        // Usar caminho relativo ou apenas o nome do arquivo
        return `npm test -- ${relativePath}`;
      }
    };
  }

  private getVitestInfo(): TestFrameworkInfo {
    return {
      framework: 'vitest',
      command: 'npm test',
      testFileCommand: (filePath: string, projectPath: string) => {
        const relativePath = filePath.replace(projectPath + '/', '').replace(/\\/g, '/');
        return `npm test -- ${relativePath}`;
      }
    };
  }

  private getKarmaInfo(): TestFrameworkInfo {
    return {
      framework: 'karma',
      command: 'ng test',
      testFileCommand: (filePath: string, projectPath: string) => {
        // Para Karma/Angular, usar ng test com include pattern
        const relativePath = filePath.replace(projectPath + '/', '').replace(/\\/g, '/');
        // Extrair apenas o nome do arquivo para usar como pattern
        const fileName = relativePath.split('/').pop() || relativePath;
        return `ng test --include='**/${fileName}'`;
      }
    };
  }

  private getJasmineInfo(): TestFrameworkInfo {
    return {
      framework: 'jasmine',
      command: 'npm test',
      testFileCommand: (filePath: string, projectPath: string) => {
        const relativePath = filePath.replace(projectPath + '/', '').replace(/\\/g, '/');
        return `npm test -- ${relativePath}`;
      }
    };
  }

  private getMochaInfo(): TestFrameworkInfo {
    return {
      framework: 'mocha',
      command: 'npm test',
      testFileCommand: (filePath: string, projectPath: string) => {
        const relativePath = filePath.replace(projectPath + '/', '').replace(/\\/g, '/');
        return `npm test -- ${relativePath}`;
      }
    };
  }
}

