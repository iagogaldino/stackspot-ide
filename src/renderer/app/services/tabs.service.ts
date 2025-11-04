import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Tab {
  id: string;
  filePath: string;
  fileName: string;
  isDirty?: boolean; // Se o arquivo foi modificado mas não salvo
}

@Injectable({
  providedIn: 'root'
})
export class TabsService {
  private tabsSubject = new BehaviorSubject<Tab[]>([]);
  public tabs$ = this.tabsSubject.asObservable();

  private activeTabIdSubject = new BehaviorSubject<string | null>(null);
  public activeTabId$ = this.activeTabIdSubject.asObservable();

  constructor() {}

  /**
   * Obtém todas as abas
   */
  getTabs(): Tab[] {
    return this.tabsSubject.value;
  }

  /**
   * Obtém a aba ativa
   */
  getActiveTab(): Tab | null {
    const tabs = this.tabsSubject.value;
    const activeId = this.activeTabIdSubject.value;
    return tabs.find(tab => tab.id === activeId) || null;
  }

  /**
   * Abre uma nova aba ou ativa se já estiver aberta
   */
  openTab(filePath: string): void {
    const tabs = this.tabsSubject.value;
    
    // Verificar se a aba já está aberta
    const existingTab = tabs.find(tab => tab.filePath === filePath);
    if (existingTab) {
      this.setActiveTab(existingTab.id);
      return;
    }

    // Criar nova aba
    const newTab: Tab = {
      id: this.generateTabId(),
      filePath: filePath,
      fileName: this.getFileName(filePath),
      isDirty: false
    };

    const newTabs = [...tabs, newTab];
    this.tabsSubject.next(newTabs);
    this.setActiveTab(newTab.id);
  }

  /**
   * Fecha uma aba
   */
  closeTab(tabId: string): void {
    const tabs = this.tabsSubject.value;
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    
    if (tabIndex === -1) return;

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    this.tabsSubject.next(newTabs);

    // Se a aba fechada era a ativa, ativar outra
    if (this.activeTabIdSubject.value === tabId) {
      if (newTabs.length > 0) {
        // Ativar a aba à direita, ou à esquerda se era a última
        const newActiveIndex = tabIndex < newTabs.length ? tabIndex : tabIndex - 1;
        this.setActiveTab(newTabs[newActiveIndex].id);
      } else {
        this.activeTabIdSubject.next(null);
      }
    }
  }

  /**
   * Define a aba ativa
   */
  setActiveTab(tabId: string): void {
    this.activeTabIdSubject.next(tabId);
  }

  /**
   * Marca uma aba como modificada (dirty)
   */
  setTabDirty(tabId: string, isDirty: boolean): void {
    const tabs = this.tabsSubject.value;
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      tab.isDirty = isDirty;
      this.tabsSubject.next([...tabs]);
    }
  }

  /**
   * Fecha todas as abas
   */
  closeAllTabs(): void {
    this.tabsSubject.next([]);
    this.activeTabIdSubject.next(null);
  }

  /**
   * Fecha todas as abas exceto a ativa
   */
  closeOtherTabs(tabId: string): void {
    const tabs = this.tabsSubject.value;
    const activeTab = tabs.find(t => t.id === tabId);
    if (activeTab) {
      this.tabsSubject.next([activeTab]);
      this.setActiveTab(tabId);
    } else {
      // Se não há mais abas, limpar
      if (this.tabsSubject.value.length === 0) {
        this.activeTabIdSubject.next(null);
      }
    }
  }

  /**
   * Gera um ID único para a aba
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extrai o nome do arquivo do caminho
   */
  private getFileName(filePath: string): string {
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }
}

