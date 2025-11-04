# Guia de Migração para Design Tokens

Este guia ajuda você a migrar componentes existentes para usar as variáveis CSS centralizadas.

## 🔄 Passo a Passo da Migração

### 1. Identificar valores hardcoded

Procure por valores como:
- Cores: `#1e1e1e`, `#252526`, `#007acc`, etc.
- Espaçamentos: `8px`, `12px`, `16px`, etc.
- Fontes: `12px`, `13px`, `14px`, etc.
- Border-radius: `2px`, `4px`, `6px`, etc.

### 2. Substituir por variáveis

#### Antes:
```css
.my-component {
  background-color: #2d2d30;
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 3px;
  color: #cccccc;
}
```

#### Depois:
```css
.my-component {
  background-color: var(--color-bg-tertiary);
  padding: var(--spacing-lg) var(--spacing-2xl);
  font-size: var(--font-size-md);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
}
```

## 📋 Mapeamento Rápido

### Cores de Background
- `#1e1e1e` → `var(--color-bg-primary)`
- `#252526` → `var(--color-bg-secondary)`
- `#2d2d30` → `var(--color-bg-tertiary)`
- `#2a2d2e` → `var(--color-bg-hover)`
- `#37373d` → `var(--color-bg-active)`

### Cores de Texto
- `#cccccc` → `var(--color-text-primary)`
- `#858585` → `var(--color-text-secondary)`
- `#808080` → `var(--color-text-tertiary)`
- `#ffffff` → `var(--color-text-white)`

### Cores de Accent
- `#007acc` → `var(--color-accent-primary)`
- `#005a9e` → `var(--color-accent-primary-hover)`

### Bordas
- `#3e3e42` → `var(--color-border-primary)`
- `1px solid` → `var(--border-width-thin) solid`

### Espaçamentos
- `2px` → `var(--spacing-xs)`
- `4px` → `var(--spacing-sm)`
- `6px` → `var(--spacing-md)`
- `8px` → `var(--spacing-lg)`
- `10px` → `var(--spacing-xl)`
- `12px` → `var(--spacing-2xl)`
- `16px` → `var(--spacing-3xl)`
- `20px` → `var(--spacing-4xl)`

### Fontes
- `10px` → `var(--font-size-xs)`
- `11px` → `var(--font-size-sm)`
- `12px` → `var(--font-size-md)`
- `13px` → `var(--font-size-lg)`
- `14px` → `var(--font-size-xl)`

### Border Radius
- `1px` → `var(--border-radius-xs)`
- `2px` → `var(--border-radius-sm)`
- `3px` → `var(--border-radius-md)`
- `4px` → `var(--border-radius-lg)`
- `6px` → `var(--border-radius-xl)`

### Transições
- `0.1s` → `var(--transition-fast)`
- `0.15s` → `var(--transition-normal)`
- `0.2s` → `var(--transition-slow)`

## ✅ Checklist de Migração

- [ ] Atualizar cores de background
- [ ] Atualizar cores de texto
- [ ] Atualizar espaçamentos (padding, margin, gap)
- [ ] Atualizar tamanhos de fonte
- [ ] Atualizar border-radius
- [ ] Atualizar transições
- [ ] Testar visualmente
- [ ] Verificar responsividade

## 🎯 Exemplos Completos

### Componente de Botão
```css
/* Antes */
.btn {
  background-color: #007acc;
  color: white;
  padding: 6px 12px;
  border-radius: 3px;
  font-size: 12px;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #005a9e;
}

/* Depois */
.btn {
  background-color: var(--color-accent-primary);
  color: var(--color-text-white);
  padding: var(--button-padding-y-md) var(--button-padding-x-md);
  border-radius: var(--button-border-radius);
  font-size: var(--button-font-size-md);
  transition: background-color var(--transition-slow);
}

.btn:hover {
  background-color: var(--color-accent-primary-hover);
}
```

### Componente de Card
```css
/* Antes */
.card {
  background-color: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 12px;
}

/* Depois */
.card {
  background-color: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-primary);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding-y) var(--card-padding-x);
  margin-bottom: var(--spacing-2xl);
}
```

## 🚨 Problemas Comuns

### Problema: Variável não encontrada
**Solução**: Verifique se a variável existe em `design-tokens.css`. Se não existir, adicione ou use uma variável similar.

### Problema: Valor não está mudando
**Solução**: Certifique-se de que o tema está aplicado corretamente. Verifique se `data-theme` está no elemento `<html>`.

### Problema: Cores diferentes após migração
**Solução**: Verifique o mapeamento de cores. Alguns valores podem ter sido aproximados.

## 📚 Próximos Passos

1. Migrar componentes um por um
2. Testar cada componente após migração
3. Documentar variáveis customizadas específicas do componente
4. Criar componentes de exemplo para referência

