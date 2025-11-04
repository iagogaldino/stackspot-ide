import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Serviço para controlar a visibilidade do terminal
 */
@Injectable({
  providedIn: 'root'
})
export class TerminalVisibilityService {
  private showTerminalSubject = new Subject<boolean>();
  public showTerminal$ = this.showTerminalSubject.asObservable();

  /**
   * Abre o terminal
   */
  openTerminal() {
    this.showTerminalSubject.next(true);
  }

  /**
   * Fecha o terminal
   */
  closeTerminal() {
    this.showTerminalSubject.next(false);
  }

  /**
   * Alterna a visibilidade do terminal
   */
  toggleTerminal() {
    this.showTerminalSubject.next(true); // Sempre abrir quando alternar
  }
}

