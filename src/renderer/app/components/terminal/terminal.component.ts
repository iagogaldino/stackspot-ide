import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TerminalService } from '../../services/terminal.service';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css'
})
export class TerminalComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('terminalContainer', { static: true }) terminalContainer!: ElementRef;
  @Input() projectPath: string | null = null;
  
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;

  constructor(private terminalService: TerminalService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    // Se o projeto mudou e o terminal já está inicializado, atualizar o diretório
    if (changes['projectPath'] && this.projectPath && this.terminal) {
      this.terminalService.setCwd(this.projectPath);
      // O terminal vai mostrar o prompt automaticamente após mudar de diretório
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initTerminal();
    }, 100);
  }

  ngOnDestroy() {
    if (this.terminal) {
      this.terminal.dispose();
    }
    // Não desconectar o terminal quando o componente é destruído, apenas quando o app fecha
  }

  initTerminal() {
    // Criar instância do xterm
    this.terminal = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#ffffff',
        selectionBackground: '#264f78'
      },
      fontSize: 13,
      fontFamily: 'Consolas, "Courier New", monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      disableStdin: false, // Garantir que input está habilitado
      allowProposedApi: true,
      convertEol: true,
      rightClickSelectsWord: false
    });

    // Adicionar addon de fit
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    // Abrir terminal no container
    this.terminal.open(this.terminalContainer.nativeElement);
    
    // Ajustar tamanho e focar
    setTimeout(() => {
      this.fitAddon?.fit();
      // Focar o terminal para aceitar input
      if (this.terminal) {
        this.terminal.focus();
        // Forçar renderização inicial
        this.terminal.refresh(0, this.terminal.rows - 1);
      }
    }, 100);

    // Conectar ao serviço de terminal
    this.terminalService.connect(this.terminal);
    
    // Garantir que o terminal está focado e pode receber input
    setTimeout(() => {
      this.terminal?.focus();
      // Adicionar listener para focar quando clicar no terminal
      this.terminalContainer.nativeElement.addEventListener('click', () => {
        this.terminal?.focus();
      });
    }, 200);

    // Se temos um caminho de projeto, definir como diretório de trabalho
    // Aguardar um pouco mais para o terminal estar totalmente pronto e evitar conflito com input do usuário
    setTimeout(() => {
      if (this.projectPath && this.terminal) {
        this.terminalService.setCwd(this.projectPath);
      }
    }, 500);

    // Ajustar tamanho quando a janela redimensionar
    window.addEventListener('resize', () => {
      setTimeout(() => {
        this.fitAddon?.fit();
      }, 50);
    });

    // Escrever prompt inicial (será substituído quando o terminal conectar)
    // Não escrever aqui, deixar o terminal mostrar o prompt real
  }
}

