import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TabsService } from './tabs.service';
import { FileService } from './file.service';

/**
 * Serviço para gerenciar informações do workspace
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private projectPathSubject = new BehaviorSubject<string | null>(null);
  public projectPath$: Observable<string | null> = this.projectPathSubject.asObservable();

  constructor(
    private tabsService: TabsService,
    private fileService: FileService
  ) {}

  /**
   * Define o caminho do projeto atual
   */
  setProjectPath(path: string | null): void {
    this.projectPathSubject.next(path);
  }

  /**
   * Obtém o caminho do projeto atual
   */
  getProjectPath(): string | null {
    return this.projectPathSubject.value;
  }

  /**
   * Abre um arquivo no editor
   */
  async openFile(filePath: string): Promise<void> {
    this.tabsService.openTab(filePath);
  }

  /**
   * Cria um novo arquivo
   */
  async createFile(filePath: string, content: string = ''): Promise<void> {
    try {
      await this.fileService.writeFile(filePath, content).toPromise();
      this.tabsService.openTab(filePath);
    } catch (error) {
      throw new Error(`Erro ao criar arquivo: ${error}`);
    }
  }

  /**
   * Mostra uma mensagem ao usuário (console por enquanto)
   */
  async showMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
    
    // TODO: Implementar notificação visual no futuro
  }

  /**
   * Mostra um diálogo de confirmação
   */
  async showConfirm(message: string): Promise<boolean> {
    // Por enquanto, usar confirm do navegador
    // TODO: Implementar diálogo customizado
    return window.confirm(message);
  }
}

