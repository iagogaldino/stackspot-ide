import { contextBridge, ipcRenderer } from 'electron';

// Expor APIs seguras para o renderer process (Angular)
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),

  // File System
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
  readDirectory: (path: string) => ipcRenderer.invoke('fs:readDirectory', path),
  listFilesByType: (projectPath: string, extensions?: string[]) => ipcRenderer.invoke('fs:listFilesByType', projectPath, extensions),

  // Angular
  isAngularProject: (path: string) => ipcRenderer.invoke('angular:isAngularProject', path),

  // File watching
  watchDirectory: (path: string) => ipcRenderer.invoke('fs:watchDirectory', path),
  unwatchDirectory: (path: string) => ipcRenderer.invoke('fs:unwatchDirectory', path),

  // Listeners
  onFileChanged: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('file-changed', callback);
  },
  removeFileChangedListener: (callback: (event: any, data: any) => void) => {
    ipcRenderer.removeListener('file-changed', callback);
  },

  // Terminal
  initTerminal: () => {
    ipcRenderer.send('terminal:init');
  },
  sendTerminalData: (data: string) => {
    ipcRenderer.send('terminal:data', data);
  },
  onTerminalData: (callback: (data: string) => void) => {
    ipcRenderer.on('terminal:data', (_, data) => callback(data));
  },
  terminateTerminal: () => {
    ipcRenderer.send('terminal:terminate');
  },
  setTerminalCwd: (cwd: string) => {
    ipcRenderer.send('terminal:setCwd', cwd);
  },

  // Config
  saveConfig: (config: any) => ipcRenderer.invoke('config:save', config),
  loadConfig: () => ipcRenderer.invoke('config:load')
});

