import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-bar">
      <div class="status-bar-left">
        <span class="status-item">Pronto</span>
      </div>
      <div class="status-bar-right">
        <!-- Aqui serão adicionadas configurações futuras -->
        <span class="status-item">IDE v1.0.0</span>
      </div>
    </div>
  `,
  styles: [`
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: var(--status-bar-height);
      background-color: var(--color-status-bar);
      color: var(--color-text-white);
      font-size: var(--status-bar-font-size);
      padding: 0 var(--status-bar-padding-x);
      border-top: var(--border-width-thin) solid var(--color-status-bar-border);
      flex-shrink: 0;
      user-select: none;
      z-index: var(--z-index-status-bar);
      position: relative;
    }

    .status-bar-left,
    .status-bar-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-2xl);
    }

    .status-item {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 var(--spacing-md);
      cursor: default;
    }

    .status-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class StatusBarComponent {
}

