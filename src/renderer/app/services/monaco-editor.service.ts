import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as monaco from 'monaco-editor';

/**
 * Serviço para expor o editor Monaco para extensões
 */
@Injectable({
  providedIn: 'root'
})
export class MonacoEditorService {
  private activeEditorSubject = new BehaviorSubject<monaco.editor.IStandaloneCodeEditor | null>(null);
  public activeEditor$: Observable<monaco.editor.IStandaloneCodeEditor | null> = this.activeEditorSubject.asObservable();

  private editorContentSubject = new BehaviorSubject<string>('');
  public editorContent$: Observable<string> = this.editorContentSubject.asObservable();

  private currentFilePathSubject = new BehaviorSubject<string | null>(null);
  public currentFilePath$: Observable<string | null> = this.currentFilePathSubject.asObservable();

  private markers: Map<string, monaco.editor.IMarkerData[]> = new Map();

  constructor() {}

  /**
   * Registra um editor ativo
   */
  registerEditor(editor: monaco.editor.IStandaloneCodeEditor, filePath: string): void {
    this.activeEditorSubject.next(editor);
    this.currentFilePathSubject.next(filePath);
    
    // Atualizar conteúdo quando o editor mudar
    const model = editor.getModel();
    if (model) {
      this.editorContentSubject.next(model.getValue());
      
      // Listener para mudanças no conteúdo
      model.onDidChangeContent(() => {
        this.editorContentSubject.next(model.getValue());
      });
    }
  }

  /**
   * Remove o editor ativo
   */
  unregisterEditor(): void {
    this.activeEditorSubject.next(null);
    this.currentFilePathSubject.next(null);
    this.editorContentSubject.next('');
  }

  /**
   * Obtém o editor ativo
   */
  getActiveEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.activeEditorSubject.value;
  }

  /**
   * Obtém o conteúdo do editor ativo
   */
  getContent(): string {
    const editor = this.getActiveEditor();
    if (editor) {
      const model = editor.getModel();
      return model ? model.getValue() : '';
    }
    return '';
  }

  /**
   * Define o conteúdo do editor ativo
   */
  setContent(content: string): void {
    const editor = this.getActiveEditor();
    if (editor) {
      const model = editor.getModel();
      if (model) {
        model.setValue(content);
      }
    }
  }

  /**
   * Obtém a seleção atual
   */
  getSelection(): { startLine: number; startColumn: number; endLine: number; endColumn: number } | null {
    const editor = this.getActiveEditor();
    if (!editor) return null;

    const selection = editor.getSelection();
    if (!selection) return null;

    return {
      startLine: selection.startLineNumber,
      startColumn: selection.startColumn,
      endLine: selection.endLineNumber,
      endColumn: selection.endColumn
    };
  }

  /**
   * Obtém a posição do cursor
   */
  getCursorPosition(): { line: number; column: number } | null {
    const editor = this.getActiveEditor();
    if (!editor) return null;

    const position = editor.getPosition();
    if (!position) return null;

    return {
      line: position.lineNumber,
      column: position.column
    };
  }

  /**
   * Adiciona um marcador (decorator) no editor
   */
  addMarker(options: {
    line: number;
    column: number;
    message: string;
    severity?: 'error' | 'warning' | 'info';
  }): { dispose: () => void } {
    const editor = this.getActiveEditor();
    if (!editor) {
      return { dispose: () => {} };
    }

    const model = editor.getModel();
    if (!model) {
      return { dispose: () => {} };
    }

    const markerId = `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const severity = options.severity === 'error' ? monaco.MarkerSeverity.Error :
                     options.severity === 'warning' ? monaco.MarkerSeverity.Warning :
                     monaco.MarkerSeverity.Info;

    // Calcular o fim do marcador (destacar apenas parte da tag para não bloquear edição)
    // Usar um tamanho fixo menor para evitar problemas durante edição
    let endColumn = options.column + 10; // Destacar apenas 10 caracteres
    try {
      const lineContent = model.getLineContent(options.line);
      if (lineContent && lineContent.length > 0) {
        // Limitar ao tamanho da linha
        endColumn = Math.min(endColumn, lineContent.length + 1);
      }
    } catch (e) {
      // Se houver erro, usar apenas uma coluna
      endColumn = options.column + 1;
    }
    
    // Garantir que startColumn <= endColumn
    if (endColumn < options.column) {
      endColumn = options.column + 1;
    }
    
    const marker: monaco.editor.IMarkerData = {
      message: options.message,
      severity,
      startLineNumber: options.line,
      startColumn: options.column,
      endLineNumber: options.line,
      endColumn: endColumn
    };

    // Adicionar marcador de forma segura
    try {
      const markers = this.markers.get(model.uri.toString()) || [];
      markers.push(marker);
      this.markers.set(model.uri.toString(), markers);
      monaco.editor.setModelMarkers(model, 'extension', [...markers]);
    } catch (error) {
      console.error('Erro ao adicionar marcador:', error);
      // Retornar dispose vazio se houver erro
      return { dispose: () => {} };
    }

    return {
      dispose: () => {
        const currentMarkers = this.markers.get(model.uri.toString()) || [];
        const filtered = currentMarkers.filter(m => m !== marker);
        this.markers.set(model.uri.toString(), filtered);
        monaco.editor.setModelMarkers(model, 'extension', filtered);
      }
    };
  }

  /**
   * Limpa todos os marcadores
   */
  clearAllMarkers(): void {
    const editor = this.getActiveEditor();
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    this.markers.delete(model.uri.toString());
    monaco.editor.setModelMarkers(model, 'extension', []);
  }
}

