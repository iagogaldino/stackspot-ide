import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy, Renderer2, inject } from '@angular/core';

export interface ContextMenuItem {
  label?: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean; // Para adicionar separador antes deste item
}

/**
 * Diretiva reutilizável para exibir menu de contexto (right-click menu).
 * 
 * @example
 * // No componente TypeScript
 * menuItems: ContextMenuItem[] = [
 *   { label: 'Abrir', icon: '📂', action: () => this.openFile() },
 *   { label: 'Copiar caminho', icon: '📋', action: () => this.copyPath() },
 *   { label: 'Separador', separator: true },
 *   { label: 'Excluir', icon: '🗑️', action: () => this.deleteFile(), disabled: false }
 * ];
 * 
 * // No template HTML
 * <div [appContextMenu]="menuItems" [contextData]="fileData">
 *   Conteúdo clicável
 * </div>
 */
@Directive({
  selector: '[appContextMenu]',
  standalone: true
})
export class ContextMenuDirective implements OnInit, OnDestroy {
  @Input() appContextMenu: ContextMenuItem[] = [];
  @Input() contextData?: any; // Dados opcionais passados para as ações do menu

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private contextMenu?: HTMLElement;
  private listeners: (() => void)[] = [];

  ngOnInit() {
    // Criar o elemento do menu de contexto (oculto inicialmente)
    this.createContextMenu();
  }

  ngOnDestroy() {
    this.removeContextMenu();
    this.listeners.forEach(unsubscribe => unsubscribe());
  }

  private createContextMenu() {
    const menu = this.renderer.createElement('div');
    this.renderer.addClass(menu, 'context-menu');
    this.renderer.setStyle(menu, 'display', 'none');
    this.renderer.setStyle(menu, 'position', 'fixed');
    this.renderer.setStyle(menu, 'z-index', '10000');
    
    // Adicionar ao body para garantir que fique acima de outros elementos
    this.renderer.appendChild(document.body, menu);
    this.contextMenu = menu;
  }

  private removeContextMenu() {
    if (this.contextMenu) {
      this.renderer.removeChild(document.body, this.contextMenu);
      this.contextMenu = undefined;
    }
  }

  private buildMenuItems() {
    if (!this.contextMenu) return;

    // Limpar conteúdo anterior
    this.contextMenu.innerHTML = '';

    this.appContextMenu.forEach((item, index) => {
      // Se é apenas um separador, criar apenas o separador visual
      if (item.separator && !item.label && !item.action) {
        const separator = this.renderer.createElement('div');
        this.renderer.addClass(separator, 'context-menu-separator');
        this.renderer.appendChild(this.contextMenu, separator);
        return; // Pular para o próximo item
      }

      // Adicionar separador antes deste item se necessário
      if (item.separator && index > 0) {
        const separator = this.renderer.createElement('div');
        this.renderer.addClass(separator, 'context-menu-separator');
        this.renderer.appendChild(this.contextMenu, separator);
      }

      // Se não tem label nem action, não criar item (apenas separador foi criado acima)
      if (!item.label && !item.action) {
        return;
      }

      // Criar item do menu
      const menuItem = this.renderer.createElement('div');
      this.renderer.addClass(menuItem, 'context-menu-item');
      
      if (item.disabled) {
        this.renderer.addClass(menuItem, 'disabled');
      }

      // Criar conteúdo do item
      const itemContent = this.renderer.createElement('span');
      this.renderer.addClass(itemContent, 'context-menu-item-content');
      
      // Adicionar ícone se houver
      if (item.icon) {
        const icon = this.renderer.createElement('span');
        this.renderer.addClass(icon, 'context-menu-item-icon');
        this.renderer.setProperty(icon, 'textContent', item.icon);
        this.renderer.appendChild(itemContent, icon);
      }

      // Adicionar label se houver
      if (item.label) {
        const label = this.renderer.createElement('span');
        this.renderer.addClass(label, 'context-menu-item-label');
        this.renderer.setProperty(label, 'textContent', item.label);
        this.renderer.appendChild(itemContent, label);
      }

      this.renderer.appendChild(menuItem, itemContent);
      this.renderer.appendChild(this.contextMenu, menuItem);

      // Adicionar listener de clique se não estiver desabilitado e tiver ação
      if (!item.disabled && item.action) {
        const clickListener = this.renderer.listen(menuItem, 'click', (e: MouseEvent) => {
          e.stopPropagation();
          this.hideContextMenu();
          // Executar ação passando contextData se disponível
          if (this.contextData) {
            // Criar uma função wrapper que passa contextData
            const actionWithData = () => {
              // A ação pode acessar this.contextData através do closure
              if (item.action) {
                item.action();
              }
            };
            actionWithData();
          } else {
            if (item.action) {
              item.action();
            }
          }
        });
        this.listeners.push(clickListener);
      }
    });
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.appContextMenu.length === 0) return;

    // Construir itens do menu
    this.buildMenuItems();

    // Mostrar menu na posição do clique
    if (this.contextMenu) {
      const x = event.clientX;
      const y = event.clientY;

      this.renderer.setStyle(this.contextMenu, 'left', `${x}px`);
      this.renderer.setStyle(this.contextMenu, 'top', `${y}px`);
      this.renderer.setStyle(this.contextMenu, 'display', 'block');

      // Ajustar posição se o menu sair da tela
      setTimeout(() => {
        if (this.contextMenu) {
          const rect = this.contextMenu.getBoundingClientRect();
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          let newX = x;
          let newY = y;

          // Ajustar horizontalmente
          if (rect.right > windowWidth) {
            newX = windowWidth - rect.width - 10;
          }
          if (newX < 0) newX = 10;

          // Ajustar verticalmente
          if (rect.bottom > windowHeight) {
            newY = windowHeight - rect.height - 10;
          }
          if (newY < 0) newY = 10;

          this.renderer.setStyle(this.contextMenu, 'left', `${newX}px`);
          this.renderer.setStyle(this.contextMenu, 'top', `${newY}px`);
        }
      }, 0);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.contextMenu && !this.contextMenu.contains(event.target as Node)) {
      this.hideContextMenu();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent): void {
    if (this.contextMenu && !this.contextMenu.contains(event.target as Node)) {
      this.hideContextMenu();
    }
  }

  private hideContextMenu() {
    if (this.contextMenu) {
      this.renderer.setStyle(this.contextMenu, 'display', 'none');
    }
  }
}

