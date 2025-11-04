# Exemplos de Extensões

Este diretório contém exemplos práticos de extensões para a MyIDE.

## Exemplos Disponíveis

### 1. Formatador de Código (Básico)
**Arquivo**: `EXAMPLE_EXTENSION.md`

Extensão simples que demonstra:
- Estrutura básica de uma extensão
- Registro de comandos
- Uso das APIs básicas (Editor, Workspace)
- Listeners de eventos

**Ideal para**: Começar a aprender sobre extensões

---

### 2. Validador de Tags ⭐
**Arquivo**: `TAG_VALIDATOR_EXTENSION.md`

Extensão completa e funcional que:
- ✅ **Identifica tags HTML/XML não fechadas**
- ✅ Detecta tags de fechamento órfãs
- ✅ Adiciona marcadores visuais no editor (erros e warnings)
- ✅ Validação automática ao editar (com debounce)
- ✅ Validação ao salvar arquivo
- ✅ Configurações personalizáveis
- ✅ Suporte a múltiplos tipos de arquivo (.html, .xml, .tsx, .jsx)

**Funcionalidades**:
- Análise de código usando regex
- Rastreamento de stack de tags abertas
- Detecção de aninhamento incorreto
- Marcadores visuais no Monaco Editor
- Mensagens de feedback ao usuário

**Ideal para**: 
- Aprender análise de código
- Ver integração com Editor API
- Entender eventos e listeners
- Exemplo de extensão real e útil

---

## Como Usar os Exemplos

1. **Escolha um exemplo** que se adequa ao que você quer aprender
2. **Copie a estrutura** de arquivos
3. **Siga as instruções** no arquivo do exemplo
4. **Compile** a extensão (`npm run build`)
5. **Instale** copiando para `extensions/`
6. **Teste** na IDE

## Próximos Exemplos Planejados

- [ ] Extensão de Auto-complete customizado
- [ ] Integração com Git
- [ ] Formatação com Prettier
- [ ] Linter com ESLint
- [ ] Provedor de IA customizado
- [ ] Painel customizado na sidebar

## Contribuindo

Sinta-se à vontade para criar novos exemplos e adicionar aqui!

