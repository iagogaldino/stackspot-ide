import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JSONField } from '../models/json-field.model';
import { TerminalService } from '../../../services/terminal.service';

@Component({
  selector: 'app-scripts-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scripts-field.component.html',
  styleUrl: './scripts-field.component.css'
})
export class ScriptsFieldComponent implements OnInit {
  @Input() field!: JSONField;
  @Input() jsonData!: any;
  @Output() valueChanged = new EventEmitter<any>();

  scripts: Array<{ name: string; command: string }> = [];
  showAddScript = false;
  newScriptName = '';
  newScriptCommand = '';
  editingScript: string | null = null;

  constructor(private terminalService: TerminalService) {}

  ngOnInit() {
    this.loadScripts();
  }

  private loadScripts() {
    if (this.field.value && typeof this.field.value === 'object') {
      this.scripts = Object.entries(this.field.value).map(([name, command]) => ({
        name,
        command: command as string
      }));
    }
  }

  /**
   * Adiciona novo script
   */
  addScript() {
    if (this.newScriptName.trim() && this.newScriptCommand.trim()) {
      if (!this.field.value) {
        this.field.value = {};
      }
      
      this.field.value[this.newScriptName.trim()] = this.newScriptCommand.trim();
      this.loadScripts();
      this.valueChanged.emit(this.field.value);
      
      // Limpar campos
      this.newScriptName = '';
      this.newScriptCommand = '';
      this.showAddScript = false;
    }
  }

  /**
   * Remove script
   */
  removeScript(scriptName: string) {
    if (confirm(`Tem certeza que deseja remover o script "${scriptName}"?`)) {
      delete this.field.value[scriptName];
      this.loadScripts();
      this.valueChanged.emit(this.field.value);
    }
  }

  /**
   * Inicia edição de script
   */
  startEdit(script: { name: string; command: string }) {
    this.editingScript = script.name;
    this.newScriptName = script.name;
    this.newScriptCommand = script.command;
    this.showAddScript = true;
  }

  /**
   * Salva edição de script
   */
  saveEdit() {
    if (this.editingScript && this.newScriptName.trim() && this.newScriptCommand.trim()) {
      // Se o nome mudou, remover o antigo
      if (this.editingScript !== this.newScriptName.trim()) {
        delete this.field.value[this.editingScript];
      }
      
      this.field.value[this.newScriptName.trim()] = this.newScriptCommand.trim();
      this.loadScripts();
      this.valueChanged.emit(this.field.value);
      
      // Limpar
      this.editingScript = null;
      this.newScriptName = '';
      this.newScriptCommand = '';
      this.showAddScript = false;
    }
  }

  /**
   * Cancela edição
   */
  cancelEdit() {
    this.editingScript = null;
    this.newScriptName = '';
    this.newScriptCommand = '';
    this.showAddScript = false;
  }

  /**
   * Executa script
   */
  runScript(script: { name: string; command: string }) {
    // Executar comando no terminal
    // O terminalService precisa do projectPath, mas não temos aqui
    // Por enquanto, apenas mostrar mensagem
    console.log('Executando script:', script.command);
    // TODO: Integrar com terminal service quando tiver acesso ao projectPath
  }
}

