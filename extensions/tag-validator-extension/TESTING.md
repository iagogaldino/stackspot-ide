# Como Testar a Extensão Tag Validator

## Pré-requisitos

1. A extensão deve estar compilada (`dist/main.js` existe)
2. A extensão deve estar no diretório de extensões da IDE

## Localização da Extensão

A IDE procura extensões em:
- **Windows**: `%APPDATA%/MyIDE/extensions/`
- **Linux**: `~/.config/MyIDE/extensions/`
- **macOS**: `~/Library/Application Support/MyIDE/extensions/`

## Instalação Manual

1. Copie a pasta `tag-validator-extension` para o diretório de extensões:
   ```bash
   # Windows PowerShell
   $userData = [System.Environment]::GetFolderPath('ApplicationData')
   $extPath = Join-Path $userData "MyIDE\extensions"
   New-Item -ItemType Directory -Force -Path $extPath
   Copy-Item -Recurse -Force "extensions\tag-validator-extension" "$extPath\"
   ```

2. Reinicie a IDE

## Como Testar

1. **Inicie a IDE**
   - A extensão será carregada automaticamente (activationEvents: "onStart")
   - Verifique o console do DevTools para ver "Validador de Tags ativado!"

2. **Abra um arquivo HTML**
   - Crie ou abra um arquivo `.html`
   - Use o arquivo `test.html` incluído na extensão como exemplo

3. **Verifique a validação**
   - A extensão deve validar automaticamente após 1.5 segundos
   - Tags não fechadas aparecerão com marcadores de erro (vermelho)
   - Tags órfãs aparecerão com marcadores de warning (amarelo)

4. **Teste validação manual**
   - Pressione `Ctrl+Shift+V` (ou `Cmd+Shift+V` no Mac)
   - Ou use o comando "Validar Tags"

5. **Teste validação automática**
   - Edite o arquivo HTML
   - Adicione ou remova tags
   - A validação deve ocorrer automaticamente após 500ms

## Arquivo de Teste

Use o arquivo `test.html` incluído que contém:
- Tag `<div>` não fechada
- Tag `</span>` órfã (sem abertura)
- Tag `<li>` não fechada
- Tags válidas para comparação

## Verificando se Funcionou

✅ **Sucesso**: Você verá:
- Marcadores vermelhos nas tags não fechadas
- Marcadores amarelos nas tags órfãs
- Mensagens no console
- Mensagens de feedback (via showMessage)

❌ **Problema**: Se não funcionar:
1. Verifique o console do DevTools (F12)
2. Verifique se a extensão está no diretório correto
3. Verifique se o `dist/main.js` existe
4. Verifique se o `extension.json` está correto
5. Verifique o gerenciador de extensões na Activity Bar

## Debug

Para ver logs da extensão:
1. Abra DevTools (F12)
2. Procure por mensagens como:
   - "Validador de Tags ativado!"
   - "Encontrados X problema(s) de tags"
   - Qualquer erro de validação

