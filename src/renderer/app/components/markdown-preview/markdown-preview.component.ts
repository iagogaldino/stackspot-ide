import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Component({
  selector: 'app-markdown-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="markdown-preview">
      <div class="markdown-content" [innerHTML]="htmlContent"></div>
    </div>
  `,
  styles: [`
    .markdown-preview {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      background-color: #1e1e1e;
      color: #cccccc;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      min-height: 0;
      flex: 1;
    }

    .markdown-content {
      max-width: 900px;
      margin: 0 auto;
      flex: 1;
    }

    /* Estilos para elementos Markdown */
    .markdown-content :deep(h1) {
      color: #ffffff;
      font-size: 2em;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #3e3e42;
    }

    .markdown-content :deep(h2) {
      color: #ffffff;
      font-size: 1.5em;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #3e3e42;
    }

    .markdown-content :deep(h3) {
      color: #ffffff;
      font-size: 1.25em;
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 12px;
    }

    .markdown-content :deep(h4),
    .markdown-content :deep(h5),
    .markdown-content :deep(h6) {
      color: #ffffff;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    .markdown-content :deep(p) {
      margin-bottom: 16px;
      color: #cccccc;
    }

    .markdown-content :deep(ul),
    .markdown-content :deep(ol) {
      margin-bottom: 16px;
      padding-left: 30px;
    }

    .markdown-content :deep(li) {
      margin-bottom: 8px;
      color: #cccccc;
    }

    .markdown-content :deep(blockquote) {
      border-left: 4px solid #007acc;
      padding-left: 16px;
      margin: 16px 0;
      color: #808080;
      font-style: italic;
    }

    .markdown-content :deep(code) {
      background-color: #252526;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 0.9em;
      color: #d4d4d4;
    }

    .markdown-content :deep(pre) {
      background-color: #252526;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      padding: 16px;
      overflow-x: auto;
      margin: 16px 0;
    }

    .markdown-content :deep(pre code) {
      background-color: transparent;
      padding: 0;
      color: #d4d4d4;
    }

    .markdown-content :deep(a) {
      color: #4ec9b0;
      text-decoration: none;
    }

    .markdown-content :deep(a:hover) {
      text-decoration: underline;
    }

    .markdown-content :deep(table) {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }

    .markdown-content :deep(th),
    .markdown-content :deep(td) {
      border: 1px solid #3e3e42;
      padding: 8px 12px;
      text-align: left;
    }

    .markdown-content :deep(th) {
      background-color: #2d2d30;
      font-weight: 600;
      color: #ffffff;
    }

    .markdown-content :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin: 16px 0;
    }

    .markdown-content :deep(hr) {
      border: none;
      border-top: 1px solid #3e3e42;
      margin: 24px 0;
    }

    /* Scrollbar */
    .markdown-preview::-webkit-scrollbar {
      width: 12px;
    }

    .markdown-preview::-webkit-scrollbar-track {
      background: #1e1e1e;
    }

    .markdown-preview::-webkit-scrollbar-thumb {
      background: #3e3e42;
      border-radius: 6px;
    }

    .markdown-preview::-webkit-scrollbar-thumb:hover {
      background: #505050;
    }
  `]
})
export class MarkdownPreviewComponent implements OnInit, OnChanges {
  @Input() markdownContent: string = '';
  htmlContent: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {
    // Configurar marked
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  ngOnInit() {
    this.renderMarkdown();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['markdownContent']) {
      this.renderMarkdown();
    }
  }

  private async renderMarkdown() {
    if (!this.markdownContent) {
      this.htmlContent = '';
      return;
    }

    try {
      // marked.parse pode retornar uma Promise ou string dependendo da versão
      const result = marked.parse(this.markdownContent);
      const html = result instanceof Promise ? await result : result as string;
      this.htmlContent = this.sanitizer.sanitize(1, html) as SafeHtml;
    } catch (error) {
      console.error('Erro ao renderizar Markdown:', error);
      this.htmlContent = this.sanitizer.sanitize(1, '<p>Erro ao renderizar Markdown</p>') as SafeHtml;
    }
  }
}

