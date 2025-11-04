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
      height: 22px;
      background-color: #007acc;
      color: #ffffff;
      font-size: 12px;
      padding: 0 8px;
      border-top: 1px solid #005a9e;
      flex-shrink: 0;
      user-select: none;
      z-index: 100;
      position: relative;
    }

    .status-bar-left,
    .status-bar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-item {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 4px;
      cursor: default;
    }

    .status-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class StatusBarComponent {
}

