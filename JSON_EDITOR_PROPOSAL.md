# 📋 Proposta: Editor Visual de JSON Interativo

## 🎯 Objetivo
Criar uma interface HTML interativa para visualizar e editar arquivos JSON, ao invés de mostrar código bruto no Monaco Editor.

---

## 📐 Arquitetura Proposta

### 1. **Estrutura de Componentes**

```
EditorComponent (Principal)
├── Verifica configuração (JSONEditorConfigService)
├── Se arquivo JSON está na lista → JSONVisualEditorComponent
├── Se arquivo JSON NÃO está na lista → Monaco Editor
└── Se não é JSON → Monaco Editor (padrão)

JSONEditorConfigService
├── Lista de arquivos configurados
├── Arquivos padrão (package.json, tsconfig.json, etc.)
└── Permite adicionar/remover arquivos da lista

JSONEditorSettingsComponent (Opcional)
├── Interface para gerenciar lista de arquivos
└── Salvar configuração em arquivo de settings
```

JSONVisualEditorComponent
├── JSONFormBuilder (constrói formulário dinamicamente)
├── JSONFieldComponent (campo individual editável)
│   ├── TextFieldComponent
│   ├── NumberFieldComponent
│   ├── BooleanFieldComponent
│   ├── ArrayFieldComponent
│   ├── ObjectFieldComponent
│   └── ScriptsFieldComponent (especial para scripts)
└── JSONActionsBar (salvar, visualizar código, etc.)
```

---

## 🎨 Interface Visual Proposta

### **Exemplo: package.json**

```
┌─────────────────────────────────────────────────────────┐
│ 📄 package.json                    [💾 Salvar] [📄 Ver Código] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📦 Informações do Projeto                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Nome: [my-project-input]                          │ │
│  │ Versão: [1.0.0-input]                             │ │
│  │ Descrição: [textarea]                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ⚙️ Scripts                                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ▶ start      npm run dev        [✏️] [🗑️]        │ │
│  │ ▶ build      npm run build      [✏️] [🗑️]        │ │
│  │ ▶ test       npm test           [✏️] [🗑️]        │ │
│  │                                                      │ │
│  │                                    [+ Adicionar Script] │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  📚 Dependencies                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ @angular/core: [^15.0.0]                          │ │
│  │ @angular/common: [^15.0.0]                         │ │
│  │ typescript: [~5.0.0]                               │ │
│  │                                                      │ │
│  │                                    [+ Adicionar Dep] │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  🔧 DevDependencies                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [mesmo formato das dependencies]                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes Necessários

### **1. JSONEditorConfigService** (Configuração)
- **Responsabilidade**: Gerenciar lista de arquivos JSON que usam interface visual
- **Localização**: `src/renderer/app/services/json-editor-config.service.ts`
- **Features**:
  - Lista de arquivos padrão (package.json, tsconfig.json, angular.json, etc.)
  - Lista de arquivos customizados pelo usuário
  - Métodos para adicionar/remover arquivos
  - Verificar se arquivo deve usar interface visual
  - Salvar configuração em arquivo de settings da IDE

### **2. JSONVisualEditorComponent** (Principal)
- **Responsabilidade**: Renderizar interface baseada no JSON parseado
- **Localização**: `src/renderer/app/components/json-editor/json-visual-editor.component.ts`

### **3. JSONEditorSettingsComponent** (Opcional - UI de Configuração)
- **Responsabilidade**: Interface para gerenciar lista de arquivos
- **Localização**: `src/renderer/app/components/json-editor/settings/json-editor-settings.component.ts`
- **Features**:
  - Lista de arquivos configurados
  - Input para adicionar novo arquivo (ex: "my-config.json")
  - Botão para remover arquivo
  - Toggle para habilitar/desabilitar arquivos padrão
  - Salvar configurações

### **4. JSONFieldComponent** (Genérico)
- **Responsabilidade**: Renderizar campo baseado no tipo
- **Tipos suportados**:
  - `string` → Input text
  - `number` → Input number
  - `boolean` → Toggle/Switch
  - `array` → Lista editável
  - `object` → Seção colapsável com subcampos

### **3. ScriptsFieldComponent** (Especial)
- **Responsabilidade**: Renderizar scripts com botões de ação
- **Features**:
  - Lista de scripts (nome + comando)
  - Botão para adicionar novo script
  - Botão para editar script existente
  - Botão para remover script
  - Botão para executar script (opcional)

### **4. DependenciesFieldComponent** (Especial)
- **Responsabilidade**: Renderizar dependências editáveis
- **Features**:
  - Lista de pacotes com versões
  - Botão para adicionar nova dependência
  - Campo de busca para sugerir pacotes (futuro)

---

## 📋 Estrutura de Dados

### **JSON Parsed Structure**
```typescript
interface JSONField {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  isSpecial?: 'scripts' | 'dependencies' | 'devDependencies';
  path: string; // Caminho no JSON (ex: "scripts.start")
}
```

### **Exemplo de Mapeamento**
```json
{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "start": "npm run dev",
    "build": "npm run build"
  }
}
```

**Vira:**
```typescript
[
  { key: 'name', value: 'my-project', type: 'string', path: 'name' },
  { key: 'version', value: '1.0.0', type: 'string', path: 'version' },
  { key: 'scripts', value: {...}, type: 'object', isSpecial: 'scripts', path: 'scripts' }
]
```

---

## 🎯 Fluxo de Funcionamento

### **1. Detecção e Verificação de Configuração**
```typescript
// No EditorComponent
if (filePath.endsWith('.json')) {
  // Verificar se arquivo está na lista de configuração
  if (this.jsonEditorConfigService.shouldUseVisualEditor(filePath)) {
    // Mostrar JSONVisualEditor
    // Esconder Monaco Editor
  } else {
    // Mostrar Monaco Editor (padrão para JSON não configurado)
  }
} else {
  // Mostrar Monaco Editor (padrão para não-JSON)
}
```

### **1.1. Verificação de Configuração**
```typescript
// JSONEditorConfigService
shouldUseVisualEditor(filePath: string): boolean {
  const fileName = this.getFileName(filePath);
  
  // Verificar arquivos padrão
  if (this.defaultFiles.includes(fileName)) {
    return true;
  }
  
  // Verificar arquivos customizados
  if (this.customFiles.includes(fileName)) {
    return true;
  }
  
  // Verificar por padrão (ex: package.json sempre)
  if (fileName === 'package.json') {
    return true;
  }
  
  return false;
}
```

### **2. Arquivos Padrão Configurados**
```typescript
// JSONEditorConfigService
defaultFiles = [
  'package.json',      // Sempre usar interface visual
  'tsconfig.json',     // Configuração TypeScript
  'angular.json',       // Configuração Angular
  'tsconfig.app.json',  // Config do Angular
  'tsconfig.spec.json', // Config de testes
  'package-lock.json',  // Lock file (talvez não)
  'composer.json',      // PHP Composer
  'bower.json'          // Bower
];

// Arquivos que podem ser adicionados pelo usuário
customFiles: string[] = [];
```

### **3. Parse e Renderização**
```typescript
1. Ler arquivo JSON
2. Parse JSON
3. Identificar campos especiais (scripts, dependencies)
4. Gerar estrutura de campos
5. Renderizar componente apropriado para cada campo
```

### **4. Edição e Salvamento**
```typescript
1. Usuário edita campo
2. Atualizar objeto JSON em memória
3. Usuário clica "Salvar"
4. Converter objeto → JSON string
5. Salvar arquivo
```

### **5. Gerenciamento de Configuração**
```typescript
// Adicionar arquivo à lista
addFile(fileName: string) {
  if (!this.customFiles.includes(fileName)) {
    this.customFiles.push(fileName);
    this.saveConfig();
  }
}

// Remover arquivo da lista
removeFile(fileName: string) {
  this.customFiles = this.customFiles.filter(f => f !== fileName);
  this.saveConfig();
}

// Salvar configuração
saveConfig() {
  // Salvar em arquivo de settings da IDE
  this.electronService.saveConfig({
    jsonEditorFiles: this.customFiles
  });
}
```

---

## 🎨 Design Visual

### **Cores e Estilo**
- **Background**: `#1e1e1e` (escuro, consistente com IDE)
- **Cards**: `#2d2d30` (cinza escuro)
- **Bordas**: `#3e3e42` (cinza médio)
- **Inputs**: `#252526` (fundo escuro)
- **Botões primários**: `#007acc` (azul)
- **Botões ação**: `#28a745` (verde) para adicionar, `#dc3545` (vermelho) para remover

### **Layout**
- **Scroll vertical** para JSONs grandes
- **Seções colapsáveis** para objetos aninhados
- **Spacing consistente** entre campos
- **Responsivo** para diferentes tamanhos de tela

---

## 🔄 Funcionalidades Especiais

### **1. Scripts (package.json)**
- ✅ Listar todos os scripts
- ✅ Botão para executar script diretamente
- ✅ Adicionar novo script (modal ou inline)
- ✅ Editar script existente
- ✅ Remover script

### **2. Dependencies**
- ✅ Listar dependências (nome: versão)
- ✅ Adicionar nova dependência
- ✅ Editar versão
- ✅ Remover dependência
- 🔮 Futuro: Busca de pacotes npm

### **3. Outros Campos**
- ✅ Campos simples: input direto
- ✅ Arrays: lista com botões de adicionar/remover
- ✅ Objetos: seção colapsável com subcampos

---

## 📝 Exemplo de Implementação

### **EditorComponent.ts**
```typescript
constructor(
  private fileService: FileService,
  private jsonEditorConfig: JSONEditorConfigService
) {}

shouldUseVisualEditor(): boolean {
  if (!this.filePath?.endsWith('.json')) {
    return false;
  }
  return this.jsonEditorConfig.shouldUseVisualEditor(this.filePath);
}

// No template
<app-json-visual-editor 
  *ngIf="shouldUseVisualEditor() && jsonData"
  [jsonData]="jsonData"
  [filePath]="filePath">
</app-json-visual-editor>

<monaco-editor 
  *ngIf="!shouldUseVisualEditor()">
</monaco-editor>
```

### **JSONEditorConfigService.ts**
```typescript
@Injectable({ providedIn: 'root' })
export class JSONEditorConfigService {
  // Arquivos padrão que sempre usam interface visual
  private readonly defaultFiles = [
    'package.json',
    'tsconfig.json',
    'angular.json',
    'tsconfig.app.json',
    'tsconfig.spec.json'
  ];
  
  // Arquivos customizados pelo usuário
  private customFiles: string[] = [];
  
  constructor(private electronService: ElectronService) {
    this.loadConfig();
  }
  
  shouldUseVisualEditor(filePath: string): boolean {
    const fileName = this.getFileName(filePath);
    
    // Verificar arquivos padrão
    if (this.defaultFiles.includes(fileName)) {
      return true;
    }
    
    // Verificar arquivos customizados
    if (this.customFiles.includes(fileName)) {
      return true;
    }
    
    return false;
  }
  
  addFile(fileName: string) {
    if (!this.customFiles.includes(fileName)) {
      this.customFiles.push(fileName);
      this.saveConfig();
    }
  }
  
  removeFile(fileName: string) {
    this.customFiles = this.customFiles.filter(f => f !== fileName);
    this.saveConfig();
  }
  
  getCustomFiles(): string[] {
    return [...this.customFiles];
  }
  
  getDefaultFiles(): string[] {
    return [...this.defaultFiles];
  }
  
  private getFileName(filePath: string): string {
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
  }
  
  private loadConfig() {
    this.electronService.loadConfig().subscribe({
      next: (result) => {
        if (result.success && result.config?.jsonEditorFiles) {
          this.customFiles = result.config.jsonEditorFiles;
        }
      }
    });
  }
  
  private saveConfig() {
    this.electronService.saveConfig({
      jsonEditorFiles: this.customFiles
    }).subscribe();
  }
}
```

### **JSONVisualEditorComponent**
```typescript
@Input() jsonData: any;
@Input() filePath: string;

fields: JSONField[] = [];

ngOnInit() {
  this.parseJSON();
  this.buildFields();
}

parseJSON() {
  // Parsear JSON e criar estrutura de campos
}

buildFields() {
  // Gerar array de campos para renderizar
}

saveJSON() {
  // Converter objeto → JSON string e salvar
}
```

---

## ✅ Vantagens da Abordagem

1. **UX Melhor**: Interface visual mais intuitiva que código JSON
2. **Validação**: Pode validar campos antes de salvar
3. **Autocomplete**: Sugestões para scripts e dependências comuns
4. **Ações Rápidas**: Executar scripts diretamente da interface
5. **Menos Erros**: Evita erros de sintaxe JSON

---

## 🚧 Desafios e Considerações

1. **JSONs Complexos**: Para JSONs muito aninhados, pode precisar de scroll/colapsar
2. **Performance**: JSONs muito grandes podem ser lentos
3. **Validação**: Precisar validar antes de salvar
4. **Formatação**: Manter formatação original do JSON (se possível)
5. **Fallback**: Se JSON inválido, mostrar Monaco Editor com erro

---

## 📦 Arquivos a Criar

### **Serviços:**
1. `src/renderer/app/services/json-editor-config.service.ts` ⭐ **NOVO**
   - Gerenciar lista de arquivos configurados
   - Verificar se arquivo deve usar interface visual
   - Salvar/carregar configurações

### **Componentes Principais:**
2. `src/renderer/app/components/json-editor/json-visual-editor.component.ts`
3. `src/renderer/app/components/json-editor/json-visual-editor.component.html`
4. `src/renderer/app/components/json-editor/json-visual-editor.component.css`

### **Componentes de Campos:**
5. `src/renderer/app/components/json-editor/components/scripts-field.component.ts`
6. `src/renderer/app/components/json-editor/components/dependencies-field.component.ts`
7. `src/renderer/app/components/json-editor/components/json-field.component.ts`

### **Componente de Configuração (Opcional):**
8. `src/renderer/app/components/json-editor/settings/json-editor-settings.component.ts` ⭐ **NOVO**
   - Interface para gerenciar lista de arquivos
   - Adicionar/remover arquivos customizados
   - Toggle para arquivos padrão

### **Utilitários:**
9. `src/renderer/app/services/json-parser.service.ts` (utilitário)

---

## 🎯 Próximos Passos

1. ✅ Aprovação da proposta
2. **Implementar JSONEditorConfigService** ⭐
   - Lista de arquivos padrão
   - Métodos de verificação
   - Integração com configuração da IDE
3. **Modificar EditorComponent** ⭐
   - Integrar verificação de configuração
   - Alternar entre Monaco e Visual Editor
4. Implementar estrutura base do JSONVisualEditor
5. Implementar renderização de campos simples
6. Implementar campos especiais (scripts, dependencies)
7. Adicionar funcionalidades de edição
8. Adicionar validação
9. **Criar componente de configuração (opcional)** ⭐
   - Interface para gerenciar lista de arquivos
10. Testes e ajustes

---

## 🎛️ Interface de Configuração (Opcional)

### **Painel de Configurações**
```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Configuração do Editor JSON                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📋 Arquivos Padrão (sempre habilitados)               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ✅ package.json                                     │ │
│  │ ✅ tsconfig.json                                    │ │
│  │ ✅ angular.json                                     │ │
│  │ ✅ tsconfig.app.json                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  📝 Arquivos Customizados                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ✅ my-config.json                    [🗑️]          │ │
│  │ ✅ custom-settings.json              [🗑️]          │ │
│  │                                                      │ │
│  │ Adicionar arquivo: [input]           [+ Adicionar]  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [💾 Salvar Configurações]                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **Onde acessar:**
- Menu de configurações da IDE
- Botão no header do editor JSON
- Atalho de teclado (Ctrl+,)

---

**Esta proposta atende às suas necessidades? Alguma mudança ou adição antes de implementar?**

