# 🚀 Guia Rápido de Início

## Passo a Passo para Rodar o MVP

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Compilar o Main Process do Electron

```bash
npm run build:main
```

Isso compila o TypeScript do Electron (main.ts e preload.ts) e copia o preload.js para o lugar certo.

### 3️⃣ Rodar em Modo Desenvolvimento

```bash
npm run electron:dev
```

Este comando vai:
- Compilar o main process
- Iniciar o servidor Angular (porta 4200)
- Abrir a aplicação Electron automaticamente

### 4️⃣ Testar a IDE

1. Quando a aplicação abrir, clique em **"Abrir Projeto Angular"**
2. Selecione uma pasta que contenha um projeto Angular (com `angular.json`)
3. A árvore de arquivos aparecerá na sidebar
4. Clique em um arquivo para abrir no editor Monaco
5. Edite o arquivo - ele será salvo automaticamente

## 📁 Estrutura Criada

```
MyIDE/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts       # Gerencia janelas e IPC
│   │   └── preload.ts    # Bridge seguro para Angular
│   └── renderer/          # Angular app
│       ├── app/
│       │   ├── components/
│       │   │   ├── editor/        # Componente Monaco Editor
│       │   │   ├── file-tree/     # Árvore de arquivos
│       │   │   └── project-panel/ # Tela inicial
│       │   └── services/
│       │       ├── electron.service.ts  # Comunicação IPC
│       │       └── file.service.ts      # Operações de arquivo
│       └── main.ts
├── package.json
└── angular.json
```

## 🔧 Troubleshooting

### Erro: "Cannot find module 'electron'"
```bash
npm install
```

### Monaco Editor não aparece
- Verifique o console do navegador (DevTools)
- Certifique-se de que o Monaco está instalado: `npm list monaco-editor`

### Preload não funciona
- Execute: `npm run build:main`
- Verifique se existe `dist/main/preload.js`

### Angular não compila
```bash
npm install @angular/cli -g
ng version
```

## ✅ Funcionalidades Implementadas

- ✅ Abrir projeto Angular
- ✅ Visualizar estrutura de arquivos
- ✅ Abrir arquivos no editor
- ✅ Editar com Monaco Editor
- ✅ Syntax highlighting
- ✅ Auto-save
- ✅ Detecção de linguagem (TS, HTML, CSS, etc.)

## 🎯 Próximos Passos

- [ ] Terminal integrado
- [ ] Executar `ng serve` via botão
- [ ] Busca em arquivos
- [ ] Múltiplas abas de arquivos
- [ ] Navegação rápida (Ctrl+P)

## 💡 Dicas

- Use `Ctrl+Shift+I` no Electron para abrir DevTools
- Os logs aparecem no terminal onde você rodou `npm run electron:dev`
- Para parar, use `Ctrl+C` no terminal

---

**Pronto para começar!** 🎉

