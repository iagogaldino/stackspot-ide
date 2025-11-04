import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService } from '../../services/file.service';
import { JSONField } from './models/json-field.model';
import { ScriptsFieldComponent } from './components/scripts-field.component';
import { DependenciesFieldComponent } from './components/dependencies-field.component';
import { JSONFieldComponent } from './components/json-field.component';

@Component({
  selector: 'app-json-visual-editor',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ScriptsFieldComponent,
    DependenciesFieldComponent,
    JSONFieldComponent
  ],
  templateUrl: './json-visual-editor.component.html',
  styleUrl: './json-visual-editor.component.css'
})
export class JSONVisualEditorComponent implements OnInit, OnDestroy {
  @Input() jsonData!: any;
  @Input() filePath!: string;
  @Output() dataChanged = new EventEmitter<any>();
  @Output() errorOccurred = new EventEmitter<void>();

  fields: JSONField[] = [];
  private originalData: any;
  hasError = false;

  constructor(private fileService: FileService) {}

  ngOnInit() {
    if (!this.jsonData) {
      console.error('JSONVisualEditorComponent: jsonData é null ou undefined');
      this.hasError = true;
      this.errorOccurred.emit();
      return;
    }
    try {
      this.originalData = JSON.parse(JSON.stringify(this.jsonData)); // Deep copy
      this.buildFields();
      if (this.fields.length === 0) {
        console.warn('JSONVisualEditorComponent: Nenhum campo encontrado');
        this.hasError = true;
        this.errorOccurred.emit();
      }
    } catch (error) {
      console.error('Erro ao inicializar JSONVisualEditorComponent:', error);
      this.hasError = true;
      this.errorOccurred.emit();
    }
  }

  ngOnDestroy() {
    // Cleanup se necessário
  }

  /**
   * Constrói estrutura de campos a partir do JSON
   */
  private buildFields() {
    this.fields = [];
    if (!this.jsonData || typeof this.jsonData !== 'object' || Array.isArray(this.jsonData)) {
      console.error('JSONVisualEditorComponent: jsonData não é um objeto válido');
      this.hasError = true;
      return;
    }
    try {
      this.parseObject(this.jsonData, '', this.fields);
      if (this.fields.length === 0) {
        console.warn('JSONVisualEditorComponent: Objeto vazio ou sem propriedades');
      }
    } catch (error) {
      console.error('Erro ao construir campos:', error);
      this.hasError = true;
    }
  }

  /**
   * Parse recursivo de objetos JSON
   */
  private parseObject(obj: any, path: string, fields: JSONField[]): void {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;
        const fieldType = this.detectFieldType(value, key);
        
        const field: JSONField = {
          key: key,
          value: value,
          type: fieldType.type,
          path: currentPath,
          isSpecial: fieldType.isSpecial
        };

        fields.push(field);
      }
    }
  }

  /**
   * Detecta tipo de campo e se é especial
   */
  private detectFieldType(value: any, key: string): { type: 'string' | 'number' | 'boolean' | 'array' | 'object'; isSpecial?: 'scripts' | 'dependencies' | 'devDependencies' } {
    if (Array.isArray(value)) {
      return { type: 'array' };
    }
    
    if (value === null || value === undefined) {
      return { type: 'string' };
    }
    
    if (typeof value === 'object') {
      // Verificar se é campo especial
      if (key === 'scripts' || key === 'script') {
        return { type: 'object', isSpecial: 'scripts' };
      }
      if (key === 'dependencies') {
        return { type: 'object', isSpecial: 'dependencies' };
      }
      if (key === 'devDependencies') {
        return { type: 'object', isSpecial: 'devDependencies' };
      }
      return { type: 'object' };
    }
    
    if (typeof value === 'number') {
      return { type: 'number' };
    }
    
    if (typeof value === 'boolean') {
      return { type: 'boolean' };
    }
    
    return { type: 'string' };
  }

  /**
   * Atualiza valor de um campo
   */
  updateField(path: string, newValue: any) {
    this.setNestedProperty(this.jsonData, path, newValue);
    this.dataChanged.emit(this.jsonData);
  }

  /**
   * Define propriedade aninhada no objeto
   */
  private setNestedProperty(obj: any, path: string, value: any) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Salva JSON
   */
  saveJSON() {
    const jsonString = JSON.stringify(this.jsonData, null, 2);
    this.fileService.writeFile(this.filePath, jsonString).subscribe({
      next: () => {
        console.log('JSON salvo com sucesso');
        this.originalData = JSON.parse(JSON.stringify(this.jsonData));
        // Emitir evento para notificar que foi salvo
        this.dataChanged.emit(this.jsonData);
      },
      error: (error) => {
        console.error('Erro ao salvar JSON:', error);
        alert('Erro ao salvar arquivo: ' + (error.message || 'Erro desconhecido'));
      }
    });
  }

  /**
   * Ver código JSON bruto
   */
  viewCode() {
    // Emitir evento para alternar para Monaco Editor
    // Isso será tratado pelo EditorComponent
  }

  /**
   * Obtém nome do arquivo
   */
  getFileName(): string {
    if (!this.filePath) return '';
    const parts = this.filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }
}

