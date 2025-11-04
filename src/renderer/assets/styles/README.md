# Design Tokens - Sistema de Design Centralizado

Este diretório contém o sistema de design tokens centralizado do projeto.

## 📁 Estrutura

```
assets/styles/
├── design-tokens.css    # Variáveis CSS principais
└── README.md           # Este arquivo
```

## 🎨 Como Usar

### 1. Importar no seu componente CSS

```css
/* As variáveis já estão disponíveis globalmente após importar em styles.css */
.my-component {
  background-color: var(--color-bg-primary);
  padding: var(--spacing-lg);
  font-size: var(--font-size-md);
  border-radius: var(--border-radius-md);
}
```

### 2. Usar no TypeScript (com ThemeService)

```typescript
import { ThemeService } from '../services/theme.service';

constructor(private themeService: ThemeService) {}

// Mudar tema
this.themeService.setTheme('light');

// Obter tema atual
const currentTheme = this.themeService.getCurrentTheme();

// Alternar tema
this.themeService.toggleTheme();
```

## 🎯 Variáveis Disponíveis

### Cores
- `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-tertiary`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`
- `--color-accent-primary`, `--color-accent-primary-hover`
- `--color-border-primary`, `--color-border-hover`
- `--color-success`, `--color-error`, `--color-warning`

### Espaçamentos
- `--spacing-xs` (2px) até `--spacing-7xl` (40px)

### Tipografia
- `--font-size-xs` (10px) até `--font-size-6xl` (36px)
- `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`
- `--font-family-primary`, `--font-family-mono`

### Bordas
- `--border-radius-xs` até `--border-radius-xl`
- `--border-width-thin`, `--border-width-medium`, `--border-width-thick`

### Transições
- `--transition-fast` (0.1s)
- `--transition-normal` (0.15s)
- `--transition-slow` (0.2s)

## 🔄 Mudando Tema

### Método 1: Via CSS (Recomendado)
Edite o arquivo `design-tokens.css` e altere os valores nas seções `:root` ou `[data-theme="light"]`.

### Método 2: Via ThemeService
```typescript
this.themeService.setTheme('light');
```

### Método 3: Direto no HTML
```html
<html data-theme="light">
```

## 📝 Exemplos de Uso

### Botão Padrão
```css
.btn {
  padding: var(--button-padding-y-md) var(--button-padding-x-md);
  background-color: var(--color-accent-primary);
  color: var(--color-text-white);
  border-radius: var(--button-border-radius);
  font-size: var(--button-font-size-md);
  transition: background-color var(--transition-normal);
}

.btn:hover {
  background-color: var(--color-accent-primary-hover);
}
```

### Card
```css
.card {
  background-color: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding-y) var(--card-padding-x);
}
```

### Input
```css
.input {
  padding: var(--input-padding-y) var(--input-padding-x);
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--input-border-radius);
  font-size: var(--input-font-size);
  color: var(--color-text-primary);
}

.input:focus {
  border-color: var(--color-border-focus);
  outline: none;
}
```

## 🚀 Próximos Passos

1. **Migrar todos os componentes** para usar variáveis CSS
2. **Implementar temas completos** (light, high-contrast)
3. **Adicionar mais variáveis** conforme necessário
4. **Criar documentação visual** com exemplos de cada componente

## 📚 Referências

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Design Tokens (W3C)](https://www.w3.org/community/design-tokens/)

