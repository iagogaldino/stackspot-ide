import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypingEffectDirective } from './typing-effect.directive';

@Component({
  selector: 'app-code-block',
  standalone: true,
  imports: [CommonModule, TypingEffectDirective],
  template: `
    <div class="code-block-container">
      <div class="code-block-header">
        <span class="code-language">{{ language }}</span>
        <button class="copy-button" (click)="copyCode()" title="Copiar código">
          📋
        </button>
      </div>
      <pre class="code-block"><code #codeElement [appTypingEffect]="code" [enabled]="enableTyping" [speed]="typingSpeed"></code></pre>
    </div>
  `,
  styles: [`
    .code-block-container {
      background-color: #1e1e1e;
      border: 1px solid #3e3e42;
      border-radius: 6px;
      margin: 8px 0;
      overflow: hidden;
    }

    .code-block-header {
      background-color: #252526;
      padding: 6px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #3e3e42;
    }

    .code-language {
      font-size: 11px;
      color: #858585;
      text-transform: uppercase;
      font-weight: 500;
    }

    .copy-button {
      background: none;
      border: none;
      color: #cccccc;
      cursor: pointer;
      font-size: 14px;
      padding: 2px 6px;
      border-radius: 3px;
      transition: background-color 0.2s;
    }

    .copy-button:hover {
      background-color: #3e3e42;
    }

    .code-block {
      margin: 0;
      padding: 12px;
      background-color: #1e1e1e;
      color: #d4d4d4;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
      word-wrap: normal;
      tab-size: 2;
    }

    .code-block code {
      display: block;
      width: 100%;
      color: inherit;
      font-family: inherit;
      font-size: inherit;
    }
  `]
})
export class CodeBlockComponent implements OnInit, OnChanges {
  @Input() code: string = '';
  @Input() language: string = 'typescript';
  @Input() enableTyping: boolean = true;
  @Input() typingSpeed: number = 20; // ms por caractere

  @ViewChild('codeElement', { static: false }) codeElement?: ElementRef;

  ngOnInit() {
    // Se o código já está completo e não deve usar typing, exibir imediatamente
    if (!this.enableTyping && this.code) {
      // O efeito de digitação será desabilitado pelo input
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['code'] && !this.enableTyping && this.codeElement) {
      // Atualizar código se typing está desabilitado
    }
  }

  copyCode() {
    if (this.code) {
      navigator.clipboard.writeText(this.code).then(() => {
        // Feedback visual pode ser adicionado aqui
        const button = document.querySelector('.copy-button');
        if (button) {
          const originalText = button.textContent;
          button.textContent = '✓';
          setTimeout(() => {
            button.textContent = originalText;
          }, 1000);
        }
      }).catch(err => {
        console.error('Erro ao copiar:', err);
      });
    }
  }
}

