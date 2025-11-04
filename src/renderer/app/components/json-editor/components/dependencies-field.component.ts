import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JSONField } from '../models/json-field.model';

@Component({
  selector: 'app-dependencies-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dependencies-field.component.html',
  styleUrl: './dependencies-field.component.css'
})
export class DependenciesFieldComponent implements OnInit {
  @Input() field!: JSONField;
  @Input() jsonData!: any;
  @Output() valueChanged = new EventEmitter<any>();

  dependencies: Array<{ name: string; version: string }> = [];
  showAddDependency = false;
  newDependencyName = '';
  newDependencyVersion = '';
  editingDependency: string | null = null;

  getFieldTitle(): string {
    if (this.field.isSpecial === 'devDependencies') {
      return 'DevDependencies';
    }
    return 'Dependencies';
  }

  getFieldIcon(): string {
    if (this.field.isSpecial === 'devDependencies') {
      return '🔧';
    }
    return '📚';
  }

  ngOnInit() {
    this.loadDependencies();
  }

  private loadDependencies() {
    if (this.field.value && typeof this.field.value === 'object') {
      this.dependencies = Object.entries(this.field.value).map(([name, version]) => ({
        name,
        version: version as string
      }));
    }
  }

  /**
   * Adiciona nova dependência
   */
  addDependency() {
    if (this.newDependencyName.trim() && this.newDependencyVersion.trim()) {
      if (!this.field.value) {
        this.field.value = {};
      }
      
      this.field.value[this.newDependencyName.trim()] = this.newDependencyVersion.trim();
      this.loadDependencies();
      this.valueChanged.emit(this.field.value);
      
      // Limpar campos
      this.newDependencyName = '';
      this.newDependencyVersion = '';
      this.showAddDependency = false;
    }
  }

  /**
   * Remove dependência
   */
  removeDependency(dependencyName: string) {
    if (confirm(`Tem certeza que deseja remover a dependência "${dependencyName}"?`)) {
      delete this.field.value[dependencyName];
      this.loadDependencies();
      this.valueChanged.emit(this.field.value);
    }
  }

  /**
   * Inicia edição de dependência
   */
  startEdit(dependency: { name: string; version: string }) {
    this.editingDependency = dependency.name;
    this.newDependencyName = dependency.name;
    this.newDependencyVersion = dependency.version;
    this.showAddDependency = true;
  }

  /**
   * Salva edição de dependência
   */
  saveEdit() {
    if (this.editingDependency && this.newDependencyName.trim() && this.newDependencyVersion.trim()) {
      // Se o nome mudou, remover o antigo
      if (this.editingDependency !== this.newDependencyName.trim()) {
        delete this.field.value[this.editingDependency];
      }
      
      this.field.value[this.newDependencyName.trim()] = this.newDependencyVersion.trim();
      this.loadDependencies();
      this.valueChanged.emit(this.field.value);
      
      // Limpar
      this.editingDependency = null;
      this.newDependencyName = '';
      this.newDependencyVersion = '';
      this.showAddDependency = false;
    }
  }

  /**
   * Cancela edição
   */
  cancelEdit() {
    this.editingDependency = null;
    this.newDependencyName = '';
    this.newDependencyVersion = '';
    this.showAddDependency = false;
  }

  /**
   * Atualiza versão de uma dependência
   */
  updateVersion(dependencyName: string, newVersion: string) {
    if (this.field.value && this.field.value[dependencyName]) {
      this.field.value[dependencyName] = newVersion;
      this.loadDependencies();
      this.valueChanged.emit(this.field.value);
    }
  }
}

