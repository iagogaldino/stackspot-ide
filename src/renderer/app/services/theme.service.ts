import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'dark' | 'light' | 'high-contrast';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<Theme>('dark');
  public currentTheme$: Observable<Theme> = this.currentThemeSubject.asObservable();

  constructor() {
    // Carregar tema salvo do localStorage ou usar padrão
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['dark', 'light', 'high-contrast'].includes(savedTheme)) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('dark');
    }
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme);
    
    // Aplicar tema no documento
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', theme);
    
    // Salvar preferência
    localStorage.setItem('theme', theme);
  }

  toggleTheme(): void {
    const current = this.getCurrentTheme();
    const themes: Theme[] = ['dark', 'light', 'high-contrast'];
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }
}

