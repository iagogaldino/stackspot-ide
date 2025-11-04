# MyIDE - IDE para Projetos Angular

Uma IDE simples inspirada no VS Code, focada em projetos Angular. Construída com Electron + Angular + Monaco Editor.

## 🚀 Tecnologias

- **Electron** - Desktop app framework
- **Angular 18** - Framework UI
- **Monaco Editor** - Editor de código (mesmo do VS Code)
- **TypeScript** - Linguagem principal

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Angular CLI (será instalado como dependência)

## 🛠️ Instalação

1. Instalar dependências:
```bash
npm install
```

2. Compilar o preload do Electron:
```bash
# Compilar TypeScript do main process
npx tsc -p tsconfig.main.json
```

3. Rodar em desenvolvimento:
```bash
npm run electron:dev
```

Isso vai:
- Iniciar o servidor Angular (http://localhost:4200)
- Abrir a aplicação Electron automaticamente

## 📦 Build para Produção

1. Build do Angular:
```bash
npm run build
```

2. Compilar Electron main process:
```bash
npx tsc -p tsconfig.main.json
```

3. Copiar preload.js para dist:
```bash
# Copiar preload.js compilado
cp dist/main/preload.js dist/renderer/
```

4. Criar executável:
```bash
npm run electron:pack
```

## 🎯 Funcionalidades MVP

- ✅ Abrir projeto Angular existente
- ✅ Visualizar estrutura de arquivos
- ✅ Editar arquivos TypeScript, HTML, CSS
- ✅ Syntax highlighting
- ✅ Auto-save

## 🔧 Estrutura do Projeto

```
MyIDE/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts
│   │   └── preload.ts
│   └── renderer/          # Angular app
│       ├── app/
│       │   ├── components/
│       │   │   ├── editor/
│       │   │   ├── file-tree/
│       │   │   └── project-panel/
│       │   └── services/
│       └── main.ts
├── package.json
└── angular.json
```

## 📝 Scripts Disponíveis

- `npm start` - Inicia servidor Angular
- `npm run build` - Build do Angular
- `npm run electron` - Inicia Electron (precisa build primeiro)
- `npm run electron:dev` - Inicia em modo desenvolvimento
- `npm run electron:pack` - Cria executável

## 🐛 Troubleshooting

### Monaco Editor não aparece
- Verifique se o Monaco Editor está instalado: `npm list monaco-editor`
- Certifique-se de que o componente Editor está importando corretamente

### Erro ao abrir projeto
- Verifique se o projeto tem `angular.json`
- Certifique-se de que o Electron tem permissão para acessar a pasta

### Preload não funciona
- Compile o preload: `npx tsc -p tsconfig.main.json`
- Verifique se `preload.js` está em `dist/main/`

## 🔄 Próximos Passos

- [ ] Terminal integrado
- [ ] Executar `ng serve` automaticamente
- [ ] Busca em arquivos
- [ ] Git integrado
- [ ] Temas customizados

## 📄 Licença

MIT

