import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsService, Tab } from '../../services/tabs.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css'
})
export class TabsComponent implements OnInit, OnDestroy {
  tabs: Tab[] = [];
  activeTabId: string | null = null;
  private tabsSubscription?: Subscription;
  private activeTabSubscription?: Subscription;

  constructor(private tabsService: TabsService) {}

  ngOnInit() {
    this.tabsSubscription = this.tabsService.tabs$.subscribe(tabs => {
      this.tabs = tabs;
    });

    this.activeTabSubscription = this.tabsService.activeTabId$.subscribe(activeId => {
      this.activeTabId = activeId;
    });
  }

  ngOnDestroy() {
    if (this.tabsSubscription) {
      this.tabsSubscription.unsubscribe();
    }
    if (this.activeTabSubscription) {
      this.activeTabSubscription.unsubscribe();
    }
  }

  /**
   * Ativa uma aba ao clicar nela
   */
  selectTab(tabId: string): void {
    this.tabsService.setActiveTab(tabId);
  }

  /**
   * Fecha uma aba
   */
  closeTab(tabId: string, event: MouseEvent): void {
    event.stopPropagation(); // Evitar que o clique ative a aba
    this.tabsService.closeTab(tabId);
  }

  /**
   * Verifica se uma aba está ativa
   */
  isActiveTab(tabId: string): boolean {
    return this.activeTabId === tabId;
  }

  /**
   * Obtém ícone baseado na extensão do arquivo
   */
  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return '📘';
      case 'js': return '📜';
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'scss': return '💅';
      case 'json': return '📄';
      case 'md': return '📝';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg': return '🖼️';
      default: return '📄';
    }
  }
}

