# Validador de Tags - Extensão MyIDE

Extensão nativa para identificar e marcar tags HTML/XML não fechadas no editor.

## Funcionalidades

- ✅ Identifica tags HTML/XML não fechadas
- ✅ Detecta tags de fechamento órfãs
- ✅ Adiciona marcadores visuais no editor (erros e warnings)
- ✅ Validação automática ao editar (com debounce)
- ✅ Validação ao salvar arquivo
- ✅ Comando manual de validação

## Instalação

A extensão já está instalada em `extensions/tag-validator-extension/`.

Para testar:
1. Compile a extensão: `npm run build` (ou `npx tsc`)
2. A extensão será carregada automaticamente quando a IDE iniciar
3. Abra um arquivo HTML no editor
4. A extensão validará automaticamente as tags

## Uso

### Validação Automática
- A extensão valida automaticamente quando você edita arquivos HTML/XML
- Marcadores aparecem em tempo real (com debounce de 500ms)

### Validação Manual
- Use o comando `Ctrl+Shift+V` (ou `Cmd+Shift+V` no Mac)
- Ou execute o comando "Validar Tags" via palette

### Limpar Marcadores
- Execute o comando "Limpar Marcadores" para remover todos os marcadores

## Configuração

A extensão suporta as seguintes configurações (via `extension.json`):

- `tagValidator.autoValidate`: Validar automaticamente ao editar (padrão: true)
- `tagValidator.validateOnSave`: Validar ao salvar (padrão: true)
- `tagValidator.fileTypes`: Tipos de arquivo para validar (padrão: [".html", ".xml", ".tsx", ".jsx"])

## Exemplo

Arquivo HTML com erro:
```html
<div>
  <p>Conteúdo</p>
  <!-- Falta </div> -->
```

A extensão marcará a tag `<div>` como não fechada.

## Estrutura

```
tag-validator-extension/
├── package.json
├── extension.json
├── tsconfig.json
├── src/
│   └── main.ts
└── dist/
    └── main.js
```

## Desenvolvimento

Para modificar a extensão:

1. Edite `src/main.ts`
2. Compile: `npm run build`
3. Reinicie a IDE para carregar as mudanças

