import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy, Renderer2, inject } from '@angular/core';

export type ResizeDirection = 'horizontal' | 'vertical';

/**
 * Diretiva reutilizável para tornar elementos redimensionáveis, similar ao VS Code.
 * 
 * @example
 * // Redimensionamento horizontal (sidebar)
 * <aside appResizable direction="horizontal" [initialSize]="300" [minSize]="150" [maxSize]="800" storageKey="sidebar-width">
 *   Conteúdo da sidebar
 * </aside>
 * 
 * @example
 * // Redimensionamento vertical (terminal)
 * <div appResizable direction="vertical" [initialSize]="300" [minSize]="100" [maxSize]="600" storageKey="terminal-height">
 *   Conteúdo do terminal
 * </div>
 * 
 * A diretiva cria automaticamente um handle de redimensionamento e salva o tamanho no localStorage
 * se uma storageKey for fornecida.
 */
@Directive({
  selector: '[appResizable]',
  standalone: true
})
export class ResizableDirective implements OnInit, OnDestroy {
  @Input() direction: ResizeDirection = 'horizontal';
  @Input() minSize: number = 50;
  @Input() maxSize: number = 1000;
  @Input() initialSize?: number;
  @Input() storageKey?: string; // Para persistir o tamanho no localStorage

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private isResizing = false;
  private startPos = 0;
  private startSize = 0;
  private resizeHandle?: HTMLElement;
  private listeners: (() => void)[] = [];

  ngOnInit() {
    this.createResizeHandle();
    this.loadSavedSize();
    this.applyInitialSize();
  }

  ngOnDestroy() {
    this.removeResizeHandle();
    this.listeners.forEach(unsubscribe => unsubscribe());
  }

  private createResizeHandle() {
    const handle = this.renderer.createElement('div');
    const handleClass = this.direction === 'horizontal' 
      ? 'resize-handle-horizontal' 
      : 'resize-handle-vertical';
    
    this.renderer.addClass(handle, 'resize-handle');
    this.renderer.addClass(handle, handleClass);
    
    // Adicionar cursor apropriado
    const cursor = this.direction === 'horizontal' ? 'col-resize' : 'row-resize';
    this.renderer.setStyle(handle, 'cursor', cursor);

    // Inserir o handle na posição apropriada
    const parent = this.el.nativeElement.parentElement;
    if (parent) {
      // Para horizontal: handle após o elemento (direita)
      // Para vertical: handle antes do elemento (topo) se for o último filho, senão após
      if (this.direction === 'horizontal') {
        const nextSibling = this.el.nativeElement.nextSibling;
        if (nextSibling) {
          this.renderer.insertBefore(parent, handle, nextSibling);
        } else {
          this.renderer.appendChild(parent, handle);
        }
      } else {
        // Vertical: inserir antes do elemento (para que o handle fique no topo do painel)
        this.renderer.insertBefore(parent, handle, this.el.nativeElement);
      }
    }

    this.resizeHandle = handle;

    // Adicionar listeners ao handle
    const mousedownListener = this.renderer.listen(handle, 'mousedown', (e: MouseEvent) => {
      this.onMouseDown(e);
    });

    this.listeners.push(mousedownListener);
  }

  private removeResizeHandle() {
    if (this.resizeHandle) {
      this.renderer.removeChild(this.resizeHandle.parentElement, this.resizeHandle);
      this.resizeHandle = undefined;
    }
  }

  private applyInitialSize() {
    const element = this.el.nativeElement;
    if (this.initialSize !== undefined) {
      if (this.direction === 'horizontal') {
        this.renderer.setStyle(element, 'width', `${this.initialSize}px`);
        this.renderer.setStyle(element, 'flex', `0 0 ${this.initialSize}px`);
      } else {
        this.renderer.setStyle(element, 'height', `${this.initialSize}px`);
        this.renderer.setStyle(element, 'flex', `0 0 ${this.initialSize}px`);
      }
    }
  }

  private loadSavedSize() {
    if (this.storageKey && typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const size = parseInt(saved, 10);
          if (!isNaN(size) && size >= this.minSize && size <= this.maxSize) {
            this.initialSize = size;
          }
        }
      } catch (e) {
        console.warn('Failed to load saved size:', e);
      }
    }
  }

  private saveSize(size: number) {
    if (this.storageKey && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.storageKey, size.toString());
      } catch (e) {
        console.warn('Failed to save size:', e);
      }
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // Prevenir que o evento seja tratado se clicou no handle
    if (event.target === this.resizeHandle) {
      event.preventDefault();
      event.stopPropagation();
      
      this.isResizing = true;
      this.startPos = this.direction === 'horizontal' ? event.clientX : event.clientY;
      this.startSize = this.direction === 'horizontal' 
        ? this.el.nativeElement.offsetWidth 
        : this.el.nativeElement.offsetHeight;

      // Adicionar classes para feedback visual
      document.body.style.cursor = this.direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      
      if (this.resizeHandle) {
        this.renderer.addClass(this.resizeHandle, 'resizing');
      }

      const mouseMoveListener = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
        this.onMouseMove(e);
      });

      const mouseUpListener = this.renderer.listen('document', 'mouseup', () => {
        this.onMouseUp();
        mouseMoveListener();
        mouseUpListener();
      });
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;

    const currentPos = this.direction === 'horizontal' ? event.clientX : event.clientY;
    const delta = currentPos - this.startPos;
    
    // Para vertical com handle antes do elemento, mover para baixo (delta positivo) aumenta o tamanho
    // Para horizontal com handle depois do elemento, mover para direita (delta positivo) aumenta o tamanho
    // Em ambos os casos, delta positivo = aumentar, então não precisa inverter
    let newSize = this.startSize + delta;

    // Aplicar limites
    newSize = Math.max(this.minSize, Math.min(this.maxSize, newSize));

    // Aplicar novo tamanho
    const element = this.el.nativeElement;
    if (this.direction === 'horizontal') {
      this.renderer.setStyle(element, 'width', `${newSize}px`);
      this.renderer.setStyle(element, 'flex', `0 0 ${newSize}px`);
    } else {
      this.renderer.setStyle(element, 'height', `${newSize}px`);
      this.renderer.setStyle(element, 'flex', `0 0 ${newSize}px`);
    }

    // Salvar tamanho
    this.saveSize(newSize);
  }

  private onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      if (this.resizeHandle) {
        this.renderer.removeClass(this.resizeHandle, 'resizing');
      }
    }
  }
}

