import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExtensionService } from '../../services/extension.service';
import { Extension } from '../../extensions/types/extension.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-extensions-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './extensions-manager.component.html',
  styleUrl: './extensions-manager.component.css'
})
export class ExtensionsManagerComponent implements OnInit, OnDestroy {
  extensions: Extension[] = [];
  activeTab: 'installed' | 'marketplace' = 'installed';
  private subscriptions: Subscription[] = [];

  // Marketplace de extensões (hardcoded por enquanto)
  marketplaceExtensions = [
    {
      id: 'tag-validator-extension',
      name: 'Validador de Tags',
      displayName: 'Validador de Tags HTML/XML',
      version: '1.0.0',
      description: 'Identifica e marca tags HTML/XML não fechadas automaticamente no editor',
      publisher: 'myide',
      icon: '⚡',
      installed: false
    }
  ];

  constructor(private extensionService: ExtensionService) {}

  ngOnInit() {
    const sub = this.extensionService.extensions$.subscribe(extensions => {
      this.extensions = extensions;
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getExtensionStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'error':
        return 'status-error';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-loaded';
    }
  }

  getExtensionStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'error':
        return 'Erro';
      case 'inactive':
        return 'Inativa';
      case 'loaded':
        return 'Carregada';
      default:
        return status;
    }
  }

  async toggleExtension(extension: Extension) {
    try {
      if (extension.status === 'active') {
        await this.extensionService.deactivateExtension(extension.id);
      } else if (extension.status === 'loaded' || extension.status === 'inactive') {
        await this.extensionService.activateExtension(extension.id);
      }
    } catch (error) {
      console.error('Erro ao alternar extensão:', error);
    }
  }

  reloadExtensions() {
    this.extensionService.loadExtensions();
  }

  setActiveTab(tab: 'installed' | 'marketplace') {
    this.activeTab = tab;
  }

  isInstalled(extensionId: string): boolean {
    return this.extensions.some(ext => ext.id === extensionId);
  }

  getInstalledExtension(extensionId: string): Extension | undefined {
    return this.extensions.find(ext => ext.id === extensionId);
  }

  async installFromMarketplace(marketplaceExt: any, event?: Event) {
    try {
      // Mostrar feedback de instalação
      const installBtn = event?.target as HTMLElement;
      if (installBtn) {
        installBtn.textContent = '⏳ Instalando...';
        installBtn.setAttribute('disabled', 'true');
      }

      const result = await this.extensionService.installExtension(marketplaceExt.id);
      
      if (result.success) {
        // Atualizar estado do marketplace
        marketplaceExt.installed = true;
        
        // Mostrar sucesso
        await this.showMessage(`Extensão "${marketplaceExt.displayName}" instalada com sucesso!`, 'info');
        
        // Mudar para aba de instaladas após 1 segundo
        setTimeout(() => {
          this.setActiveTab('installed');
        }, 1000);
      } else {
        await this.showMessage(`Erro ao instalar extensão: ${result.error}`, 'error');
        
        // Restaurar botão
        if (installBtn) {
          installBtn.textContent = '📥 Instalar';
          installBtn.removeAttribute('disabled');
        }
      }
    } catch (error: any) {
      await this.showMessage(`Erro ao instalar extensão: ${error.message}`, 'error');
    }
  }

  private async showMessage(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    // Usar console por enquanto, mas pode ser melhorado com notificações visuais
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} ${message}`);
    
    // TODO: Implementar notificação visual
    alert(message);
  }
}

