import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JSONField } from '../models/json-field.model';

@Component({
  selector: 'app-json-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './json-field.component.html',
  styleUrl: './json-field.component.css'
})
export class JSONFieldComponent {
  @Input() field!: JSONField;
  @Output() valueChanged = new EventEmitter<any>();

  isExpanded = false;

  /**
   * Atualiza valor do campo
   */
  updateValue(newValue: any) {
    // Converter string para número se necessário
    if (this.field.type === 'number' && typeof newValue === 'string') {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        newValue = numValue;
      }
    }
    
    // Converter string para boolean se necessário
    if (this.field.type === 'boolean' && typeof newValue === 'string') {
      newValue = newValue === 'true' || newValue === '1';
    }
    
    this.valueChanged.emit(newValue);
  }

  /**
   * Atualiza item do array
   */
  updateArrayItem(index: number, newValue: any) {
    if (Array.isArray(this.field.value)) {
      this.field.value[index] = newValue;
      this.valueChanged.emit([...this.field.value]);
    }
  }

  /**
   * Remove item do array
   */
  removeArrayItem(index: number) {
    if (Array.isArray(this.field.value)) {
      this.field.value.splice(index, 1);
      this.valueChanged.emit([...this.field.value]);
    }
  }

  /**
   * Adiciona item ao array
   */
  addArrayItem() {
    if (!Array.isArray(this.field.value)) {
      this.field.value = [];
    }
    this.field.value.push('');
    this.valueChanged.emit([...this.field.value]);
  }

  /**
   * Obtém tipo de input baseado no tipo do campo
   */
  getInputType(): string {
    if (this.field.type === 'number') {
      return 'number';
    }
    return 'text';
  }

  /**
   * Verifica se campo é editável diretamente
   */
  isDirectlyEditable(): boolean {
    return ['string', 'number', 'boolean'].includes(this.field.type);
  }

  /**
   * Verifica se campo é array
   */
  isArray(): boolean {
    return this.field.type === 'array';
  }

  /**
   * Verifica se campo é objeto
   */
  isObject(): boolean {
    return this.field.type === 'object';
  }

  /**
   * Obtém número de chaves do objeto
   */
  getObjectKeyCount(): number {
    if (this.field.type === 'object' && this.field.value) {
      return Object.keys(this.field.value).length;
    }
    return 0;
  }

  /**
   * Alterna expansão do objeto
   */
  toggleObject() {
    this.isExpanded = !this.isExpanded;
  }
}

