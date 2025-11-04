import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

declare global {
  interface Window {
    electronAPI: {
      openDirectory: () => Promise<string | null>;
      readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      readDirectory: (path: string) => Promise<{ success: boolean; items?: any[]; error?: string }>;
      listFilesByType: (projectPath: string, extensions?: string[]) => Promise<{ success: boolean; files?: string[]; count?: number; error?: string }>;
      isAngularProject: (path: string) => Promise<{ success: boolean; isAngular?: boolean; error?: string }>;
      watchDirectory: (path: string) => Promise<{ success: boolean; error?: string }>;
      unwatchDirectory: (path: string) => Promise<{ success: boolean; error?: string }>;
      onFileChanged: (callback: (event: any, data: any) => void) => void;
      removeFileChangedListener: (callback: (event: any, data: any) => void) => void;
      // Terminal methods
      initTerminal: () => void;
      sendTerminalData: (data: string) => void;
      onTerminalData: (callback: (data: string) => void) => void;
      terminateTerminal: () => void;
      setTerminalCwd: (cwd: string) => void;
      // Config methods
      saveConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
      loadConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private isElectron = typeof window !== 'undefined' && window.electronAPI;

  openDirectory(): Observable<string | null> {
    return new Observable(observer => {
      if (!this.isElectron) {
        observer.error('Electron API não disponível');
        return;
      }

      window.electronAPI.openDirectory()
        .then(path => {
          observer.next(path);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  readFile(filePath: string): Observable<{ success: boolean; content?: string; error?: string }> {
    return new Observable(observer => {
      if (!this.isElectron) {
        observer.error('Electron API não disponível');
        return;
      }

      window.electronAPI.readFile(filePath)
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  writeFile(filePath: string, content: string): Observable<{ success: boolean; error?: string }> {
    return new Observable(observer => {
      if (!this.isElectron) {
        observer.error('Electron API não disponível');
        return;
      }

      window.electronAPI.writeFile(filePath, content)
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  readDirectory(dirPath: string): Observable<{ success: boolean; items?: any[]; error?: string }> {
    return new Observable(observer => {
      if (!this.isElectron) {
        observer.error('Electron API não disponível');
        return;
      }

      window.electronAPI.readDirectory(dirPath)
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  isAngularProject(projectPath: string): Observable<{ success: boolean; isAngular?: boolean; error?: string }> {
    return new Observable(observer => {
      if (!this.isElectron) {
        observer.error('Electron API não disponível');
        return;
      }

      window.electronAPI.isAngularProject(projectPath)
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  watchDirectory(dirPath: string): Observable<{ success: boolean; error?: string }> {
    return new Observable(observer => {
      if (!this.isElectron) {
        observer.error('Electron API não disponível');
        return;
      }

      window.electronAPI.watchDirectory(dirPath)
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  saveConfig(config: any): Observable<{ success: boolean; error?: string }> {
    return new Observable(observer => {
      if (!this.isElectron) {
        observer.error('Electron API não disponível');
        return;
      }

      window.electronAPI.saveConfig(config)
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  loadConfig(): Observable<{ success: boolean; config?: any; error?: string }> {
    return new Observable(observer => {
      if (!this.isElectron) {
        observer.error('Electron API não disponível');
        return;
      }

      window.electronAPI.loadConfig()
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  listFilesByType(projectPath: string, extensions?: string[]): Observable<{ success: boolean; files?: string[]; count?: number; error?: string }> {
    return new Observable(observer => {
      if (!this.isElectron) {
        observer.error('Electron API não disponível');
        return;
      }

      window.electronAPI.listFilesByType(projectPath, extensions)
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }
}

