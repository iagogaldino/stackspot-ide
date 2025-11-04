import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileTreeComponent } from './components/file-tree/file-tree.component';
import { EditorComponent } from './components/editor/editor.component';
import { ProjectPanelComponent } from './components/project-panel/project-panel.component';
import { TerminalComponent } from './components/terminal/terminal.component';
import { ChatComponent } from './components/chat/chat.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { StatusBarComponent } from './components/status-bar/status-bar.component';
import { ActivityBarComponent, ActivityView } from './components/activity-bar/activity-bar.component';
import { ExtensionsManagerComponent } from './components/extensions/extensions-manager.component';
import { TestFinderComponent } from './components/test-finder/test-finder.component';
import { TestPromptComponent } from './components/test-prompt/test-prompt.component';
import { TabsService } from './services/tabs.service';
import { WorkspaceService } from './services/workspace.service';
import { ExtensionService } from './services/extension.service';
import { ResizableDirective } from './directives/resizable.directive';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FileTreeComponent, EditorComponent, ProjectPanelComponent, TerminalComponent, ChatComponent, TabsComponent, StatusBarComponent, ActivityBarComponent, ExtensionsManagerComponent, TestFinderComponent, TestPromptComponent, ResizableDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'MyIDE';
  currentProjectPath: string | null = null;
  selectedFile: string | null = null;
  showTerminal = false;
  showChat = false;
  activeView: ActivityView = 'explorer';
  private activeTabSubscription?: Subscription;

  constructor(
    private tabsService: TabsService,
    private workspaceService: WorkspaceService,
    private extensionService: ExtensionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Escutar mudanças na aba ativa
    this.activeTabSubscription = this.tabsService.activeTabId$.subscribe(activeId => {
      if (activeId) {
        const activeTab = this.tabsService.getActiveTab();
        if (activeTab) {
          // Criar nova referência para forçar detecção de mudança
          const newFilePath = activeTab.filePath;
          if (this.selectedFile !== newFilePath) {
            this.selectedFile = newFilePath;
            this.cdr.detectChanges();
          }
        }
      } else {
        if (this.selectedFile !== null) {
          this.selectedFile = null;
          this.cdr.detectChanges();
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.activeTabSubscription) {
      this.activeTabSubscription.unsubscribe();
    }
  }

  onProjectOpened(projectPath: string) {
    this.currentProjectPath = projectPath;
    // Atualizar workspace service para extensões
    this.workspaceService.setProjectPath(projectPath);
    // O terminal será atualizado automaticamente via Input binding
  }

  onFileSelected(filePath: string) {
    // Abrir arquivo em uma aba
    this.tabsService.openTab(filePath);
  }

  onViewChanged(view: ActivityView) {
    this.activeView = view;
  }

  toggleTerminal() {
    this.showTerminal = !this.showTerminal;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Ctrl + " (aspas duplas) para toggle terminal
    if (event.ctrlKey && event.key === '"') {
      event.preventDefault();
      this.toggleTerminal();
    }
  }

  isTestFile(filePath: string | null): boolean {
    if (!filePath) return false;
    const testExtensions = ['.spec.ts', '.test.ts', '.spec.js', '.test.js'];
    return testExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }
}

