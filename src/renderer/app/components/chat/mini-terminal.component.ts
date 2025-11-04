import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { TerminalService } from '../../services/terminal.service';
import { Subscription } from 'rxjs';
import 'xterm/css/xterm.css';

@Component({
  selector: 'app-mini-terminal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mini-terminal-container">
      <div class="mini-terminal-header">
        <span class="terminal-title">Executando teste...</span>
        <button class="terminal-close" (click)="close()" title="Fechar">×</button>
      </div>
      <div #terminalContainer class="mini-terminal"></div>
    </div>
  `,
  styles: [`
    .mini-terminal-container {
      background: #1e1e1e;
      border-radius: 6px;
      margin: 8px 0;
      overflow: hidden;
      border: 1px solid #3e3e42;
    }

    .mini-terminal-header {
      background: #2d2d30;
      padding: 6px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #3e3e42;
    }

    .terminal-title {
      font-size: 12px;
      color: #cccccc;
      font-weight: 500;
    }

    .terminal-close {
      background: none;
      border: none;
      color: #cccccc;
      cursor: pointer;
      font-size: 18px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      transition: background-color 0.2s;
    }

    .terminal-close:hover {
      background-color: #3e3e42;
    }

    .mini-terminal {
      height: 200px;
      width: 100%;
      padding: 8px;
      overflow: hidden;
    }

    /* Estilos customizados para o terminal */
    :host ::ng-deep .xterm {
      height: 100%;
    }

    :host ::ng-deep .xterm-viewport {
      background-color: #1e1e1e !important;
    }

    :host ::ng-deep .xterm-screen {
      background-color: #1e1e1e !important;
    }
  `]
})
export class MiniTerminalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('terminalContainer', { static: true }) terminalContainer!: ElementRef;
  @Input() command: string = '';
  @Input() onClose?: () => void;
  @Input() onTestFailed?: (errorDetails: { testFile: string; errorMessage: string; output: string }) => void;

  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private outputBuffer: string[] = [];
  private maxLines = 100; // Limitar número de linhas para performance
  private outputSubscription?: Subscription;
  private fullOutput: string = ''; // Armazenar saída completa para análise
  private testFinished: boolean = false;

  constructor(private terminalService: TerminalService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.initTerminal();
    }, 100);
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private initTerminal() {
    // Criar instância do xterm
    this.terminal = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#ffffff',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      },
      fontSize: 11,
      fontFamily: 'Consolas, "Courier New", monospace',
      cursorBlink: false,
      cursorStyle: 'block',
      disableStdin: true, // Desabilitar input no mini terminal
      allowProposedApi: true,
      convertEol: true,
      rows: 10, // Número fixo de linhas
      cols: 80
    });

    // Adicionar addon de fit
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    // Abrir terminal no container
    this.terminal.open(this.terminalContainer.nativeElement);
    
    // Ajustar tamanho
    setTimeout(() => {
      this.fitAddon?.fit();
    }, 50);

    // Escutar output do terminal
    this.setupTerminalListener();

    // Mostrar comando inicial
    if (this.command) {
      this.terminal.writeln(`$ ${this.command}`);
      this.terminal.writeln('');
    }
  }

  private setupTerminalListener() {
    // Limpar subscription anterior se existir
    if (this.outputSubscription) {
      this.outputSubscription.unsubscribe();
    }
    
    // Escutar dados do terminal via TerminalService
    this.outputSubscription = this.terminalService.output$.subscribe((data: string) => {
      if (this.terminal) {
        // Adicionar ao buffer
        const lines = data.split('\n');
        this.outputBuffer.push(...lines);
        
        // Limitar tamanho do buffer
        if (this.outputBuffer.length > this.maxLines) {
          this.outputBuffer = this.outputBuffer.slice(-this.maxLines);
          // Recriar o terminal com apenas as últimas linhas se necessário
        }
        
        // Acumular saída completa para análise
        this.fullOutput += data;
        
        // Escrever no terminal
        this.terminal.write(data);
        
        // Scroll automático
        this.terminal.scrollToBottom();
        
        // Detectar se o teste falhou (apenas uma vez)
        if (!this.testFinished && this.fullOutput.length > 0) {
          this.checkForTestFailure();
        }
      }
    });
  }

  close() {
    if (this.onClose) {
      this.onClose();
    }
    this.cleanup();
  }

  private cleanup() {
    // Limpar subscription
    if (this.outputSubscription) {
      this.outputSubscription.unsubscribe();
      this.outputSubscription = undefined;
    }
    
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
    if (this.fitAddon) {
      this.fitAddon = null;
    }
  }

  // Método público para adicionar output manualmente
  addOutput(data: string) {
    if (this.terminal) {
      this.terminal.write(data);
      this.terminal.scrollToBottom();
    }
  }

  /**
   * Verifica se o teste falhou analisando a saída
   */
  private checkForTestFailure() {
    // Padrões que indicam falha de teste
    const failurePatterns = [
      /FAIL\s+([^\s]+)/i,
      /FAILED\s+([^\s]+)/i,
      /Error:\s+([^\n]+)/i,
      /✕\s+([^\n]+)/i,
      /×\s+([^\n]+)/i,
      /Test Suites:\s+\d+\s+failed/i,
      /Tests:\s+\d+\s+failed/i
    ];

    const hasFailure = failurePatterns.some(pattern => pattern.test(this.fullOutput));
    
    if (hasFailure && !this.testFinished) {
      this.testFinished = true;
      
      // Extrair informações do erro
      const errorDetails = this.extractErrorDetails(this.fullOutput);
      
      if (errorDetails && this.onTestFailed) {
        // Aguardar um pouco para garantir que toda a saída foi capturada
        setTimeout(() => {
          this.onTestFailed!(errorDetails);
        }, 500);
      }
    }
  }

  /**
   * Extrai detalhes do erro da saída do teste
   */
  private extractErrorDetails(output: string): { testFile: string; errorMessage: string; output: string } | null {
    // Tentar encontrar o arquivo de teste que falhou
    // Padrões mais específicos para capturar caminhos completos
    let testFile = 'unknown-test-file.spec.ts';
    
    // Padrão 1: Caminho completo após FAIL (ex: FAIL src/app/app.spec.ts)
    const failPattern = /FAIL\s+([^\s]+\.[\w]+\.(spec|test)\.(ts|js|tsx|jsx))/i;
    const failMatch = output.match(failPattern);
    if (failMatch) {
      testFile = failMatch[1];
    } else {
      // Padrão 2: Caminho completo com barras (ex: src/app/app.spec.ts)
      const pathPattern = /([\w\/\\]+[\w\/\\]+\.(spec|test)\.(ts|js|tsx|jsx))/i;
      const pathMatch = output.match(pathPattern);
      if (pathMatch) {
        testFile = pathMatch[1];
      } else {
        // Padrão 3: Apenas nome do arquivo (fallback)
        const simplePattern = /([^\s]+\.(spec|test)\.(ts|js|tsx|jsx))/i;
        const simpleMatch = output.match(simplePattern);
        if (simpleMatch) {
          testFile = simpleMatch[1];
        }
      }
    }
    
    // Normalizar separadores do caminho
    testFile = testFile.replace(/\\/g, '/');

    // Extrair mensagem de erro
    // Procurar por padrões comuns de erro
    let errorMessage = '';
    
    // Padrão: Error: mensagem
    const errorMatch = output.match(/Error:\s*([^\n]+(?:\n(?!\s*at\s)[^\n]+)*)/i);
    if (errorMatch) {
      errorMessage = errorMatch[1].trim();
    } else {
      // Padrão: FAIL ou FAILED seguido de informações
      const failMatch = output.match(/(?:FAIL|FAILED)[^\n]*\n([^\n]+(?:\n(?!\s{2,})[^\n]+)*)/i);
      if (failMatch) {
        errorMessage = failMatch[1].trim();
      } else {
        // Pegar últimas linhas relevantes antes de "FAIL"
        const failIndex = output.lastIndexOf('FAIL');
        if (failIndex > 0) {
          const context = output.substring(Math.max(0, failIndex - 500), failIndex + 200);
          errorMessage = context.split('\n').slice(-3).join('\n').trim();
        } else {
          errorMessage = 'Erro desconhecido no teste';
        }
      }
    }

    return {
      testFile,
      errorMessage,
      output: this.fullOutput
    };
  }
}

