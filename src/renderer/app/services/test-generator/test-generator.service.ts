import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';
import { switchMap, catchError, tap, finalize } from 'rxjs/operators';
import { AgentService } from '../agent.service';
import { FileService } from '../file.service';
import { ChatMessage, AgentRequestOptions } from '../agent-provider.interface';

export interface TestGenerationProgress {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  currentFilePath?: string; // Path completo do arquivo atual
  fileStatus: 'pending' | 'processing' | 'completed' | 'error' | 'generating' | 'testing' | 'refining';
  error?: string;
  overallProgress?: number; // Percentual de progresso geral (0-100)
  fileProgress?: {
    itBlocks: Array<{
      name: string;
      status: 'pending' | 'generating' | 'testing' | 'passed' | 'failed' | 'skipped';
      attempts: number;
      maxAttempts: number;
      error?: string;
    }>;
    error?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TestGeneratorService {
  private progressSubject = new BehaviorSubject<TestGenerationProgress>({
    currentFile: 0,
    totalFiles: 0,
    currentFileName: '',
    fileStatus: 'pending'
  });

  public progress$ = this.progressSubject.asObservable();
  private cancelSubject = new Subject<void>();
  private isGenerating = false;

  constructor(
    private agentService: AgentService,
    private fileService: FileService
  ) {}

  /**
   * Gera testes para os arquivos fornecidos
   */
  generateTests(sourceFiles: string[]): Observable<TestGenerationProgress> {
    if (this.isGenerating) {
      return throwError(() => new Error('Já existe uma geração em andamento'));
    }

    if (!this.agentService.isConfigured()) {
      return throwError(() => new Error('Agente não configurado. Por favor, configure o serviço de IA nas configurações do chat.'));
    }

    if (sourceFiles.length === 0) {
      return throwError(() => new Error('Nenhum arquivo selecionado para gerar testes'));
    }

    this.isGenerating = true;
    this.cancelSubject = new Subject<void>();

    const totalFiles = sourceFiles.length;
    let currentIndex = 0;

    // Emitir progresso inicial
    this.progressSubject.next({
      currentFile: 0,
      totalFiles,
      currentFileName: '',
      fileStatus: 'pending',
      overallProgress: 0
    });

    // Processar arquivos sequencialmente
    const processFile = (index: number): Observable<TestGenerationProgress> => {
      if (index >= sourceFiles.length) {
        // Todos os arquivos processados
        this.isGenerating = false;
        return of({
          currentFile: totalFiles,
          totalFiles,
          currentFileName: '',
          fileStatus: 'completed',
          overallProgress: 100
        });
      }

      // Verificar se foi cancelado
      if (this.cancelSubject.closed) {
        this.isGenerating = false;
        return throwError(() => new Error('Geração cancelada'));
      }

      const filePath = sourceFiles[index];
      const fileName = this.getFileName(filePath);

      // Atualizar progresso para "processando"
      this.progressSubject.next({
        currentFile: index,
        totalFiles,
        currentFileName: fileName,
        currentFilePath: filePath,
        fileStatus: 'processing',
        overallProgress: Math.round((index / totalFiles) * 100)
      });

      // Ler conteúdo do arquivo
      return this.fileService.readFile(filePath).pipe(
        switchMap((content) => {
          // Determinar nome do arquivo de teste
          const pathParts = filePath.split(/[\\/]/);
          const baseName = pathParts[pathParts.length - 1].replace(/\.(ts|js)$/, '');
          const testFileName = `${baseName}.spec.ts`;

          // Criar prompt para gerar teste
          const testPrompt = `Crie um teste unitário completo para o seguinte arquivo Angular.

Nome do arquivo: ${fileName}
Caminho: ${filePath}
Nome do arquivo de teste: ${testFileName}

Código do arquivo:
\`\`\`typescript
${content}
\`\`\`

Instruções:
- Crie um teste unitário completo usando Jest ou Jasmine (padrão Angular)
- Teste todos os métodos públicos, propriedades e comportamentos
- Use mocks apropriados para dependências
- Inclua testes de casos de sucesso e erro
- Siga as melhores práticas de testes Angular
- Forneça o código completo do arquivo de teste (.spec.ts)
- Use o formato de código markdown com \`\`\`typescript`;

          const testHistory: ChatMessage[] = [
            {
              role: 'user',
              content: testPrompt
            }
          ];

          const options: AgentRequestOptions = {
            currentFile: filePath,
            currentFileContent: content,
            projectFilesInfo: `Criando teste unitário: ${testFileName}\nBaseado no arquivo: ${filePath}`
          };

          // Gerar teste usando AgentService
          return this.agentService.sendMessage(testHistory, options).pipe(
            switchMap((response) => {
              if (response.error) {
                throw new Error(response.error);
              }

              // Extrair código do teste da resposta
              const testCode = this.extractTestCode(response.content);
              
              if (!testCode) {
                throw new Error('Não foi possível extrair código de teste da resposta');
              }

              // Determinar caminho do arquivo de teste
              const testFilePath = this.getTestFilePath(filePath);

              // Salvar arquivo de teste
              return this.fileService.writeFile(testFilePath, testCode).pipe(
                switchMap((success) => {
                  if (!success) {
                    throw new Error('Falha ao salvar arquivo de teste');
                  }

                  // Atualizar progresso para "completado"
                  const progress: TestGenerationProgress = {
                    currentFile: index + 1,
                    totalFiles,
                    currentFileName: fileName,
                    currentFilePath: filePath,
                    fileStatus: 'completed',
                    overallProgress: Math.round(((index + 1) / totalFiles) * 100)
                  };

                  this.progressSubject.next(progress);

                  // Processar próximo arquivo
                  return processFile(index + 1);
                })
              );
            }),
            catchError((error) => {
              // Atualizar progresso com erro
              const progress: TestGenerationProgress = {
                currentFile: index + 1,
                totalFiles,
                currentFileName: fileName,
                currentFilePath: filePath,
                fileStatus: 'error',
                error: error.message || 'Erro desconhecido',
                overallProgress: Math.round(((index + 1) / totalFiles) * 100)
              };

              this.progressSubject.next(progress);

              // Continuar com próximo arquivo mesmo em caso de erro
              return processFile(index + 1);
            })
          );
        }),
        catchError((error) => {
          // Erro ao ler arquivo
          const progress: TestGenerationProgress = {
            currentFile: index + 1,
            totalFiles,
            currentFileName: fileName,
            currentFilePath: filePath,
            fileStatus: 'error',
            error: `Erro ao ler arquivo: ${error.message || 'Erro desconhecido'}`,
            overallProgress: Math.round(((index + 1) / totalFiles) * 100)
          };

          this.progressSubject.next(progress);

          // Continuar com próximo arquivo
          return processFile(index + 1);
        }),
        finalize(() => {
          if (index === sourceFiles.length - 1) {
            this.isGenerating = false;
          }
        })
      );
    };

    // Iniciar processamento
    return processFile(0);
  }

  /**
   * Cancela a geração em andamento
   */
  cancel(): void {
    if (this.isGenerating) {
      this.cancelSubject.next();
      this.cancelSubject.complete();
      this.isGenerating = false;
    }
  }

  /**
   * Extrai código de teste da resposta da IA
   */
  private extractTestCode(response: string): string | null {
    // Procurar por blocos de código TypeScript
    const codeBlockRegex = /```(?:typescript|ts)?\n([\s\S]*?)```/g;
    const matches = [...response.matchAll(codeBlockRegex)];

    if (matches.length > 0) {
      // Retornar o primeiro bloco de código encontrado
      return matches[0][1].trim();
    }

    // Se não encontrar blocos de código, tentar extrair código sem markdown
    // Procurar por imports ou describe que indicam início de teste
    const testStartRegex = /(import[\s\S]*?describe[\s\S]*)/;
    const testMatch = response.match(testStartRegex);
    
    if (testMatch) {
      return testMatch[1].trim();
    }

    return null;
  }

  /**
   * Obtém o caminho do arquivo de teste baseado no arquivo fonte
   */
  private getTestFilePath(sourceFilePath: string): string {
    // Se já é um arquivo de teste, retornar como está
    if (sourceFilePath.includes('.spec.ts') || sourceFilePath.includes('.test.ts')) {
      return sourceFilePath;
    }

    // Substituir extensão por .spec.ts
    const pathParts = sourceFilePath.split(/[\\/]/);
    const fileName = pathParts[pathParts.length - 1];
    const baseName = fileName.replace(/\.(ts|js)$/, '');
    const testFileName = `${baseName}.spec.ts`;
    
    pathParts[pathParts.length - 1] = testFileName;
    return pathParts.join(pathParts[0].includes(':') ? '\\' : '/');
  }

  /**
   * Obtém o nome do arquivo do caminho completo
   */
  private getFileName(filePath: string): string {
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }
}

