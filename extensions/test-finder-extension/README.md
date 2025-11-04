# Test Finder Extension

Extensão para listar todos os arquivos de teste do projeto Angular.

## Funcionalidades

- Lista automaticamente todos os arquivos `.spec.ts`, `.test.ts`, `.spec.js`, `.test.js` do projeto
- Botão na Activity Bar para acessar a lista de testes
- Interface clicável para abrir arquivos de teste diretamente
- Atualização automática quando o projeto muda

## Como usar

1. Abra um projeto Angular
2. Clique no botão 🧪 na Activity Bar (barra lateral esquerda)
3. Todos os arquivos de teste serão listados
4. Clique em qualquer arquivo para abri-lo no editor

## Instalação

A extensão já está incluída no projeto. Para instalar manualmente:

```bash
npm run install:extension test-finder-extension
```

## Desenvolvimento

Para compilar a extensão:

```bash
cd extensions/test-finder-extension
npm install
npm run build
```

## Estrutura

- `src/main.ts` - Código principal da extensão
- `extension.json` - Manifest da extensão
- `package.json` - Dependências e scripts

