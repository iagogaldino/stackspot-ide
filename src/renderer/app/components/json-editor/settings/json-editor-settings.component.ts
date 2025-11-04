import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JSONEditorConfigService } from '../../../services/json-editor-config.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-json-editor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h3>⚙️ Configuração do Editor JSON</h3>
      </div>
      
      <div class="settings-content">
        <!-- Arquivos Padrão -->
        <div class="settings-section">
          <h4 class="section-title">📋 Arquivos Padrão (sempre habilitados)</h4>
          <div class="files-list">
            <div *ngFor="let file of defaultFiles" class="file-item default-file">
              <span class="file-icon">✅</span>
              <span class="file-name">{{ file }}</span>
            </div>
          </div>
        </div>

        <!-- Arquivos Customizados -->
        <div class="settings-section">
          <h4 class="section-title">📝 Arquivos Customizados</h4>
          <div class="files-list">
            <div *ngFor="let file of customFiles" class="file-item custom-file">
              <span class="file-icon">📄</span>
              <span class="file-name">{{ file }}</span>
              <button 
                class="remove-btn" 
                (click)="removeFile(file)"
                title="Remover arquivo">
                🗑️
              </button>
            </div>
            <div *ngIf="customFiles.length === 0" class="empty-message">
              Nenhum arquivo customizado adicionado
            </div>
          </div>
          
          <!-- Formulário para adicionar -->
          <div class="add-file-form">
            <input 
              type="text" 
              [(ngModel)]="newFileName"
              placeholder="Nome do arquivo (ex: my-config.json)"
              class="file-input"
              (keydown.enter)="addFile()">
            <button 
              class="add-btn" 
              (click)="addFile()"
              [disabled]="!newFileName.trim()">
              + Adicionar
            </button>
          </div>
        </div>
      </div>
      
      <div class="settings-footer">
        <button class="close-btn" (click)="closeDialog()">Fechar</button>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      background-color: #1e1e1e;
      border: 1px solid #3e3e42;
      border-radius: 8px;
      width: 500px;
      max-height: 600px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .settings-header {
      background-color: #2d2d30;
      border-bottom: 1px solid #3e3e42;
      padding: 16px;
    }

    .settings-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #cccccc;
    }

    .settings-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #cccccc;
      margin: 0;
    }

    .files-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-item {
      background-color: #2d2d30;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .default-file {
      opacity: 0.8;
    }

    .custom-file {
      justify-content: space-between;
    }

    .file-icon {
      font-size: 14px;
    }

    .file-name {
      flex: 1;
      font-size: 13px;
      color: #cccccc;
      font-family: 'Consolas', 'Courier New', monospace;
    }

    .remove-btn {
      background: rgba(220, 53, 69, 0.2);
      border: 1px solid #dc3545;
      border-radius: 4px;
      color: #dc3545;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .remove-btn:hover {
      background: rgba(220, 53, 69, 0.3);
    }

    .empty-message {
      padding: 12px;
      text-align: center;
      color: #808080;
      font-size: 12px;
      font-style: italic;
    }

    .add-file-form {
      display: flex;
      gap: 8px;
    }

    .file-input {
      flex: 1;
      background-color: #252526;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      padding: 8px 12px;
      color: #cccccc;
      font-size: 12px;
      font-family: 'Consolas', 'Courier New', monospace;
    }

    .file-input:focus {
      outline: none;
      border-color: #007acc;
    }

    .add-btn {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      border: none;
      border-radius: 4px;
      color: white;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .add-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #34ce57 0%, #28d4a8 100%);
    }

    .add-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .settings-footer {
      background-color: #2d2d30;
      border-top: 1px solid #3e3e42;
      padding: 12px 16px;
      display: flex;
      justify-content: flex-end;
    }

    .close-btn {
      background: #007acc;
      border: none;
      border-radius: 4px;
      color: white;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #005a9e;
    }

    /* Scrollbar */
    .settings-content::-webkit-scrollbar {
      width: 8px;
    }

    .settings-content::-webkit-scrollbar-track {
      background: #1e1e1e;
    }

    .settings-content::-webkit-scrollbar-thumb {
      background: #3e3e42;
      border-radius: 4px;
    }

    .settings-content::-webkit-scrollbar-thumb:hover {
      background: #505050;
    }
  `]
})
export class JSONEditorSettingsComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  
  defaultFiles: string[] = [];
  customFiles: string[] = [];
  newFileName: string = '';
  private subscription?: Subscription;

  constructor(private jsonEditorConfig: JSONEditorConfigService) {}

  ngOnInit() {
    this.defaultFiles = this.jsonEditorConfig.getDefaultFiles();
    
    this.subscription = this.jsonEditorConfig.customFiles$.subscribe(files => {
      this.customFiles = files;
    });
    
    // Carregar arquivos customizados iniciais
    this.customFiles = this.jsonEditorConfig.getCustomFiles();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  addFile() {
    if (this.newFileName.trim()) {
      // Validar formato (deve terminar com .json)
      let fileName = this.newFileName.trim();
      if (!fileName.endsWith('.json')) {
        fileName = fileName + '.json';
      }
      
      this.jsonEditorConfig.addFile(fileName).subscribe({
        next: () => {
          this.newFileName = '';
        },
        error: (error) => {
          console.error('Erro ao adicionar arquivo:', error);
          alert('Erro ao adicionar arquivo: ' + (error.message || 'Erro desconhecido'));
        }
      });
    }
  }

  removeFile(fileName: string) {
    if (confirm(`Tem certeza que deseja remover "${fileName}" da lista?`)) {
      this.jsonEditorConfig.removeFile(fileName).subscribe({
        error: (error) => {
          console.error('Erro ao remover arquivo:', error);
          alert('Erro ao remover arquivo: ' + (error.message || 'Erro desconhecido'));
        }
      });
    }
  }

  closeDialog() {
    this.close.emit();
  }
}

