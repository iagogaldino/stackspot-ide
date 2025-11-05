# 🧪 Feature: Geração Inteligente de Testes com Cobertura Máxima

## 📋 Visão Geral

Sistema automatizado que, ao abrir um arquivo `.spec.ts`, inicia um ciclo inteligente de geração, execução e refinamento de testes até atingir cobertura máxima do código fonte correspondente.

## 🎯 Objetivo

Automatizar completamente o processo de criação de testes unitários, garantindo:
- Cobertura máxima do código fonte
- Testes que compilam e executam corretamente
- Refinamento iterativo baseado em erros reais de execução
- Feedback claro do progresso para o usuário

---

## 🔄 Fluxo de Funcionamento

### **Trigger (Inicialização) - Comando do Usuário no Chat**
O processo é iniciado quando o usuário **solicita via chat** no `TestPromptComponent`:

1. **Usuário abre arquivo `.spec.ts`** → Chat lateral é exibido automaticamente
2. **Usuário digita comando no chat** para gerar testes:
   - Comandos detectados: "gerar testes", "criar testes", "gerar testes inteligentes", "gerar testes com cobertura máxima", etc.
   - Ou qualquer variação que contenha palavras-chave relacionadas
3. **Sistema detecta o comando** e:
   - Identifica o arquivo fonte correspondente (ex: `component.spec.ts` → `component.ts`)
   - Verifica se o arquivo fonte existe
   - Inicia o processo de geração inteligente
4. **Assistente responde** confirmando o início do processo

### **Etapa 1: Análise e Preparação**
```
1.1. Ler conteúdo do arquivo fonte (.ts)
1.2. Identificar:
    - Classes e métodos públicos
    - Dependências (services, componentes, etc.)
    - Estrutura do código
    - Framework de teste (Jest/Jasmine/Karma)
1.3. Verificar cobertura atual (se houver relatório)
1.4. Preparar contexto para IA
```

### **Etapa 2: Geração Inicial de Testes**
```
2.1. IA recebe:
    - Código completo do arquivo fonte
    - Estrutura do projeto (package.json, imports relacionados)
    - Framework de teste detectado
    - Testes existentes (se o .spec já tiver código)

2.2. IA gera testes com foco em:
    - Cobertura de todos os métodos públicos
    - Casos de sucesso e erro
    - Mocks apropriados para dependências
    - Padrões do framework (Jest/Jasmine)

2.3. Código gerado é salvo no arquivo .spec.ts
```

### **Etapa 3: Execução dos Testes**
```
3.1. Detectar framework de teste (Jest/Jasmine/Karma)
3.2. Executar comando específico:
    - Jest: `npm test -- arquivo.spec.ts`
    - Jasmine/Karma: `ng test --include='**/arquivo.spec.ts'`
3.3. Capturar output completo do terminal
3.4. Aguardar conclusão da execução
```

### **Etapa 4: Validação e Parse**
```
4.1. Analisar output usando TestOutputParserService
4.2. Identificar:
    - Testes que passaram (✓)
    - Testes que falharam (✕)
    - Erros de compilação
    - Erros de runtime
    - Mensagens de erro detalhadas

4.3. Mapear resultados:
    - Nome do teste → Status (passed/failed)
    - Nome do teste → Mensagem de erro (se falhou)
    - Agrupar por describe/it blocks

4.4. Verificar cobertura:
    - Executar comando de cobertura (se disponível)
    - Parse do relatório de cobertura
    - Calcular percentual atual

4.5. Comunicar resultados ao usuário via chat:
    - Exibir resumo dos resultados
    - Listar testes que passaram/falharam
    - Informar próxima ação (correção ou análise de cobertura)
```

### **Etapa 5: Decisão e Ajuste**
```
5.1. Se TODOS os testes passaram:
    → Verificar cobertura
    → Se cobertura < 100%: Continuar para Etapa 6 (análise de cobertura)
    → Se cobertura = 100%: Finalizar com sucesso ✅

5.2. Se HÁ TESTES FALHANDO:
    → Extrair detalhes dos erros:
        - Nome exato do teste que falhou
        - Mensagem de erro completa
        - Stack trace (se relevante)
        - Tipo de erro (compilação, runtime, assertion)
    
    → Preparar contexto para IA:
        - Código do teste atual (apenas os it blocks que falharam)
        - Mensagens de erro detalhadas
        - Código do arquivo fonte relacionado
        - Testes que passaram (para manter)

    → IA corrige apenas os testes que falharam:
        - Mantém todos os it blocks que passaram
        - Regera/corrige apenas os que falharam
        - Aplica correções baseadas nos erros específicos

5.3. Salvar código corrigido
```

### **Etapa 6: Análise de Cobertura (se necessário)**
```
6.1. Se todos os testes passam mas cobertura < 100%:
    → Analisar relatório de cobertura
    → Identificar linhas/caminhos não cobertos
    → Identificar branches não testados
    → Preparar contexto para IA

6.2. IA gera testes adicionais para:
    - Caminhos de código não cobertos
    - Casos edge não testados
    - Branches condicionais faltantes

6.3. Voltar para Etapa 3 (executar novos testes)
```

### **Etapa 7: Loop de Refinamento**
```
7.1. Verificar condições de parada:
    - Todos os testes passam ✓
    - Cobertura >= 100% (ou meta definida) ✓
    - Número máximo de iterações atingido
    - Usuário cancelou

7.2. Se não atingiu meta:
    → Voltar para Etapa 3
    → Incrementar contador de iterações
    → Limitar a N iterações (ex: 10) para evitar loops infinitos

7.3. Se atingiu meta:
    → Finalizar processo
    → Exibir resumo final
```

---

## 🏗️ Arquitetura Técnica

### **🎯 Arquitetura Baseada em Agentes**

A feature será implementada usando um **sistema de agentes especializados**, onde cada agente é responsável por uma etapa específica do processo. Isso proporciona:

- ✅ **Modularidade**: Cada agente é independente e testável
- ✅ **Escalabilidade**: Fácil adicionar novos agentes ou modificar existentes
- ✅ **Manutenibilidade**: Código organizado por responsabilidade
- ✅ **Reutilização**: Agentes podem ser usados em outros contextos
- ✅ **Testabilidade**: Cada agente pode ser testado isoladamente

#### **📐 Visão Geral da Arquitetura**

```
┌─────────────────────────────────────────────────────────────┐
│         IntelligentTestGeneratorOrchestrator                │
│  (Coordena o fluxo e gerencia o estado geral)              │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│   Agentes     │       │   Agentes     │
│  Especializados       │  Especializados
└───────────────┘       └───────────────┘
```

#### **🤖 Agentes Especializados**

1. **SourceCodeAnalyzerAgent** - Analisa código fonte
2. **TestGeneratorAgent** - Gera código de testes via IA
3. **TestExecutorAgent** - Executa testes no terminal
4. **TestValidatorAgent** - Valida e parseia resultados
5. **ErrorAnalyzerAgent** - Analisa erros e prepara correções
6. **CoverageAnalyzerAgent** - Analisa cobertura de código
7. **TestFixerAgent** - Corrige testes falhados via IA
8. **TestEnhancerAgent** - Gera testes adicionais para cobertura

#### **🔄 Fluxo de Comunicação entre Agentes**

```
Orchestrator
    ↓
SourceCodeAnalyzerAgent → SourceAnalysis
    ↓
TestGeneratorAgent → TestCode
    ↓
TestExecutorAgent → ExecutionResult
    ↓
TestValidatorAgent → TestResults
    ↓
[Se houver erros] → ErrorAnalyzerAgent → ErrorAnalysis
    ↓
TestFixerAgent → FixedTestCode
    ↓
[Se cobertura < 100%] → CoverageAnalyzerAgent → CoverageReport
    ↓
TestEnhancerAgent → AdditionalTestCode
```

#### **💬 Sistema de Comunicação entre Agentes no Chat**

Os agentes se comunicam entre si e essas mensagens são exibidas no chat para transparência total do processo:

```
┌─────────────────────────────────────────────────────────┐
│ Agente: SourceCodeAnalyzer                               │
│ → Para: Orchestrator                                     │
│ Mensagem: "Análise concluída. Encontrei 5 métodos       │
│            públicos e 3 dependências no código."         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Agente: TestGenerator                                    │
│ → Para: Orchestrator                                     │
│ Mensagem: "Testes gerados com sucesso. 10 testes        │
│            criados cobrindo todos os métodos."           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Agente: TestExecutor                                     │
│ → Para: TestValidator                                    │
│ Mensagem: "Execução concluída. 8 testes passaram,       │
│            2 falharam. Enviando output completo..."      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Agente: TestValidator                                    │
│ → Para: ErrorAnalyzer                                   │
│ Mensagem: "Validação concluída. Detectei 2 testes        │
│            falhados com erros de assertion. Enviando     │
│            detalhes..."                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Agente: ErrorAnalyzer                                   │
│ → Para: TestFixer                                        │
│ Mensagem: "Análise de erros concluída. Principais        │
│            problemas: undefined value e missing mock.    │
│            Enviando contexto para correção..."           │
└─────────────────────────────────────────────────────────┘
```

---

### **💬 Serviço de Comunicação entre Agentes**

```typescript
@Injectable({ providedIn: 'root' })
export class AgentCommunicationService implements AgentCommunicationService {
  private messagesSubject = new Subject<AgentMessage>();
  public messages$ = this.messagesSubject.asObservable();
  
  /**
   * Envia mensagem entre agentes
   */
  sendMessage(message: AgentMessage): void {
    this.messagesSubject.next(message);
  }
  
  /**
   * Formata mensagem para exibição no chat
   */
  formatMessageForChat(message: AgentMessage): string {
    const icon = this.getIconForType(message.type);
    const from = `**${message.from}**`;
    const to = message.to !== 'Orchestrator' ? ` → **${message.to}**` : '';
    const time = message.timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    return `${icon} ${from}${to} [${time}]\n\n${message.message}`;
  }
  
  private getIconForType(type: AgentMessage['type']): string {
    const icons = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'request': '📤',
      'response': '📥'
    };
    return icons[type] || '💬';
  }
}
```

### **Novo Serviço: IntelligentTestGeneratorOrchestrator**

```typescript
@Injectable({ providedIn: 'root' })
export class IntelligentTestGeneratorOrchestrator {
  // Agentes especializados
  private sourceCodeAnalyzer: SourceCodeAnalyzerAgent;
  private testGenerator: TestGeneratorAgent;
  private testExecutor: TestExecutorAgent;
  private testValidator: TestValidatorAgent;
  private errorAnalyzer: ErrorAnalyzerAgent;
  private coverageAnalyzer: CoverageAnalyzerAgent;
  private testFixer: TestFixerAgent;
  private testEnhancer: TestEnhancerAgent;
  
  // Estados do processo
  private generationState: GenerationState;
  private iterationCount: number = 0;
  private maxIterations: number = 10;
  
  // Subject para progresso
  public progress$: Observable<TestGenerationProgress>;
  
  constructor(
    private sourceCodeAnalyzer: SourceCodeAnalyzerAgent,
    private testGenerator: TestGeneratorAgent,
    private testExecutor: TestExecutorAgent,
    private testValidator: TestValidatorAgent,
    private errorAnalyzer: ErrorAnalyzerAgent,
    private coverageAnalyzer: CoverageAnalyzerAgent,
    private testFixer: TestFixerAgent,
    private testEnhancer: TestEnhancerAgent,
    private communicationService: AgentCommunicationService
  ) {
    // Configurar callbacks de comunicação para todos os agentes
    this.setupAgentCommunication();
  }
  
  private setupAgentCommunication(): void {
    // Todos os agentes podem enviar mensagens via callback
    const agents = [
      this.sourceCodeAnalyzer,
      this.testGenerator,
      this.testExecutor,
      this.testValidator,
      this.errorAnalyzer,
      this.coverageAnalyzer,
      this.testFixer,
      this.testEnhancer
    ];
    
    agents.forEach(agent => {
      if (agent.onMessage) {
        agent.onMessage = (message) => {
          this.communicationService.sendMessage(message);
        };
      }
    });
  }
  
  // Métodos principais
  startIntelligentGeneration(
    testFilePath: string, 
    sourceFilePath: string,
    options?: GenerationOptions
  ): Observable<TestGenerationProgress>;
  
  cancelGeneration(): void;
  
  // Método de orquestração (coordena os agentes)
  private async orchestrateGeneration(
    testFilePath: string,
    sourceFilePath: string,
    options: GenerationOptions
  ): Promise<void> {
    // 1. Analisar código fonte
    const analysis = await this.sourceCodeAnalyzer.analyze(sourceFilePath);
    
    // 2. Gerar testes iniciais
    const testCode = await this.testGenerator.generate(analysis, sourceFilePath);
    
    // 3. Salvar testes
    await this.saveTestFile(testFilePath, testCode);
    
    // 4. Loop de refinamento
    while (this.iterationCount < this.maxIterations) {
      // 5. Executar testes
      const executionResult = await this.testExecutor.execute(testFilePath, options.projectPath!);
      
      // 6. Validar resultados
      const testResults = await this.testValidator.validate(executionResult);
      
      // 7. Se todos passaram, verificar cobertura
      if (testResults.allPassed) {
        const coverage = await this.coverageAnalyzer.analyze(testFilePath, sourceFilePath, options.projectPath!);
        if (coverage.lines >= options.targetCoverage!) {
          break; // Meta atingida
        }
        // Gerar testes adicionais
        const additionalTests = await this.testEnhancer.enhance(coverage, testCode);
        await this.saveTestFile(testFilePath, additionalTests);
      } else {
        // 8. Analisar erros
        const errorAnalysis = await this.errorAnalyzer.analyze(testResults.failedTests);
        
        // 9. Corrigir testes
        const fixedCode = await this.testFixer.fix(errorAnalysis, testCode, testResults);
        await this.saveTestFile(testFilePath, fixedCode);
      }
      
      this.iterationCount++;
    }
  }
}
```

### **🤖 Interfaces dos Agentes**

#### **Interface Base para Agentes**

```typescript
interface TestAgent<TInput, TOutput> {
  /**
   * Nome do agente para logging e debugging
   */
  readonly name: string;
  
  /**
   * Executa a tarefa do agente
   */
  execute(input: TInput): Observable<TOutput>;
  
  /**
   * Verifica se o agente está pronto para executar
   */
  isReady(): boolean;
  
  /**
   * Cancela execução em andamento (se aplicável)
   */
  cancel?(): void;
  
  /**
   * Callback para comunicação entre agentes (opcional)
   * Permite que agentes enviem mensagens que serão exibidas no chat
   */
  onMessage?: (message: AgentMessage) => void;
}

/**
 * Mensagem entre agentes para comunicação e exibição no chat
 */
interface AgentMessage {
  from: string;           // Nome do agente que envia
  to: string;             // Nome do agente que recebe (ou 'Orchestrator' para público)
  message: string;        // Mensagem de texto
  type: 'info' | 'success' | 'warning' | 'error' | 'request' | 'response';
  data?: any;             // Dados adicionais (opcional)
  timestamp: Date;
}

/**
 * Sistema de comunicação entre agentes
 */
interface AgentCommunicationService {
  /**
   * Envia mensagem entre agentes
   */
  sendMessage(message: AgentMessage): void;
  
  /**
   * Observable para escutar mensagens
   */
  messages$: Observable<AgentMessage>;
  
  /**
   * Formata mensagem para exibição no chat
   */
  formatMessageForChat(message: AgentMessage): string;
}
```

#### **1. SourceCodeAnalyzerAgent**

**Responsabilidade**: Analisa o código fonte e extrai informações relevantes.

```typescript
interface SourceCodeAnalyzerAgent extends TestAgent<string, SourceAnalysis> {
  readonly name = 'SourceCodeAnalyzer';
  
  /**
   * Analisa arquivo fonte e retorna análise estruturada
   * @param sourceFilePath Caminho do arquivo fonte
   */
  analyze(sourceFilePath: string): Observable<SourceAnalysis>;
}

interface SourceAnalysis {
  className?: string;
  publicMethods: Array<{
    name: string;
    parameters: string[];
    returnType?: string;
  }>;
  dependencies: Array<{
    name: string;
    type: 'service' | 'component' | 'module' | 'other';
    importPath?: string;
  }>;
  imports: string[];
  complexity: number;
  totalLines: number;
  codeStructure: {
    hasConstructor: boolean;
    hasLifecycleHooks: boolean;
    hasAsyncMethods: boolean;
  };
}
```

#### **2. TestGeneratorAgent**

**Responsabilidade**: Gera código de testes usando IA.

```typescript
interface TestGeneratorAgent extends TestAgent<GenerationContext, string> {
  readonly name = 'TestGenerator';
  
  /**
   * Gera código de testes completo
   * @param context Contexto para geração (análise do código, framework, etc.)
   */
  generate(context: GenerationContext): Observable<string>;
}

interface GenerationContext {
  sourceAnalysis: SourceAnalysis;
  sourceCode: string;
  sourceFilePath: string;
  framework: 'jest' | 'jasmine' | 'karma';
  existingTestCode?: string; // Se houver testes existentes
  projectContext?: string; // Informações do projeto
}
```

#### **3. TestExecutorAgent**

**Responsabilidade**: Executa testes no terminal e captura output.

```typescript
interface TestExecutorAgent extends TestAgent<ExecutionRequest, TestExecutionResult> {
  readonly name = 'TestExecutor';
  
  /**
   * Executa testes e retorna resultado
   * @param request Informações sobre o teste a executar
   */
  execute(request: ExecutionRequest): Observable<TestExecutionResult>;
  
  /**
   * Cancela execução em andamento
   */
  cancel(): void;
}

interface ExecutionRequest {
  testFilePath: string;
  projectPath: string;
  framework: 'jest' | 'jasmine' | 'karma';
  timeout?: number; // Timeout em ms
}

interface TestExecutionResult {
  success: boolean;
  exitCode: number;
  output: string; // Output completo do terminal
  duration: number; // Tempo de execução em ms
  error?: string; // Erro se houver
  command: string; // Comando executado
}
```

#### **4. TestValidatorAgent**

**Responsabilidade**: Valida e parseia resultados dos testes.

```typescript
interface TestValidatorAgent extends TestAgent<TestExecutionResult, TestResults> {
  readonly name = 'TestValidator';
  
  /**
   * Valida output de execução e extrai resultados estruturados
   */
  validate(executionResult: TestExecutionResult): Observable<TestResults>;
}

interface TestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  allPassed: boolean;
  tests: Array<{
    name: string;
    describeName?: string;
    status: 'passed' | 'failed' | 'skipped';
    duration?: number;
    errorMessage?: string;
    errorType?: 'compilation' | 'runtime' | 'assertion';
    stackTrace?: string;
  }>;
  summary: {
    hasCompilationErrors: boolean;
    hasRuntimeErrors: boolean;
    hasAssertionErrors: boolean;
  };
}
```

#### **5. ErrorAnalyzerAgent**

**Responsabilidade**: Analisa erros e prepara contexto para correção.

```typescript
interface ErrorAnalyzerAgent extends TestAgent<TestResults, ErrorAnalysis> {
  readonly name = 'ErrorAnalyzer';
  
  /**
   * Analisa testes falhados e prepara análise detalhada
   */
  analyze(testResults: TestResults): Observable<ErrorAnalysis>;
}

interface ErrorAnalysis {
  failedTests: Array<{
    name: string;
    describeName?: string;
    errorMessage: string;
    errorType: 'compilation' | 'runtime' | 'assertion';
    stackTrace?: string;
    itBlockCode?: string; // Código do it block que falhou
    suggestions?: string[]; // Sugestões de correção
  }>;
  passedTests: Array<{
    name: string;
    describeName?: string;
  }>; // Para garantir que não sejam modificados
  errorPatterns: {
    commonIssues: string[];
    potentialFixes: Array<{
      issue: string;
      fix: string;
    }>;
  };
}
```

#### **6. CoverageAnalyzerAgent**

**Responsabilidade**: Analisa cobertura de código e identifica gaps.

```typescript
interface CoverageAnalyzerAgent extends TestAgent<CoverageRequest, CoverageReport> {
  readonly name = 'CoverageAnalyzer';
  
  /**
   * Analisa cobertura e identifica áreas não cobertas
   */
  analyze(request: CoverageRequest): Observable<CoverageReport>;
}

interface CoverageRequest {
  testFilePath: string;
  sourceFilePath: string;
  projectPath: string;
  framework: 'jest' | 'jasmine' | 'karma';
}

interface CoverageReport {
  statements: number;      // %
  branches: number;         // %
  functions: number;        // %
  lines: number;            // %
  uncoveredLines: Array<{
    line: number;
    code: string;
    context?: string; // Código ao redor para contexto
  }>;
  uncoveredBranches: Array<{
    line: number;
    type: 'if' | 'switch' | 'ternary' | 'logical';
    condition: string;
  }>;
  uncoveredFunctions: Array<{
    name: string;
    line: number;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    suggestedTest: string;
  }>;
}
```

#### **7. TestFixerAgent**

**Responsabilidade**: Corrige testes falhados usando IA.

```typescript
interface TestFixerAgent extends TestAgent<FixContext, string> {
  readonly name = 'TestFixer';
  
  /**
   * Corrige testes falhados mantendo os que passaram
   */
  fix(context: FixContext): Observable<string>;
}

interface FixContext {
  errorAnalysis: ErrorAnalysis;
  currentTestCode: string;
  sourceCode: string;
  sourceFilePath: string;
  framework: 'jest' | 'jasmine' | 'karma';
  passedTests: Array<{
    name: string;
    itBlockCode: string;
  }>; // Garantir que não sejam alterados
}
```

#### **8. TestEnhancerAgent**

**Responsabilidade**: Gera testes adicionais para aumentar cobertura.

```typescript
interface TestEnhancerAgent extends TestAgent<EnhancementContext, string> {
  readonly name = 'TestEnhancer';
  
  /**
   * Gera testes adicionais baseados em gaps de cobertura
   */
  enhance(context: EnhancementContext): Observable<string>;
}

interface EnhancementContext {
  coverageReport: CoverageReport;
  currentTestCode: string;
  sourceCode: string;
  sourceFilePath: string;
  sourceAnalysis: SourceAnalysis;
  framework: 'jest' | 'jasmine' | 'karma';
  targetCoverage: number;
}
```

---

### **Interfaces e Tipos Comuns**

```typescript
interface GenerationState {
  phase: 'analyzing' | 'generating' | 'executing' | 'validating' | 'fixing' | 'coverage-analysis' | 'enhancing' | 'completed' | 'error';
  iteration: number;
  testFilePath: string;
  sourceFilePath: string;
  currentTestCode?: string;
  testResults?: TestResults;
  coverageReport?: CoverageReport;
  activeAgent?: string; // Nome do agente ativo
}

interface TestExecutionResult {
  success: boolean;
  output: string;
  exitCode: number;
  duration: number;
}

interface TestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  tests: Array<{
    name: string;
    describeName?: string;
    status: 'passed' | 'failed' | 'skipped';
    errorMessage?: string;
    errorType?: 'compilation' | 'runtime' | 'assertion';
    stackTrace?: string;
  }>;
}

interface FailedTest {
  name: string;
  describeName?: string;
  errorMessage: string;
  errorType: 'compilation' | 'runtime' | 'assertion';
  stackTrace?: string;
  itBlockCode?: string; // Código do it block específico
}

interface CoverageReport {
  statements: number;      // %
  branches: number;         // %
  functions: number;        // %
  lines: number;            // %
  uncoveredLines: number[]; // Linhas não cobertas
  uncoveredBranches: Array<{
    line: number;
    type: 'if' | 'switch' | 'ternary' | 'logical';
  }>;
}

interface SourceAnalysis {
  className?: string;
  publicMethods: string[];
  dependencies: string[];
  imports: string[];
  complexity: number;
  totalLines: number;
}

interface GenerationOptions {
  maxIterations?: number;
  targetCoverage?: number; // 0-100, padrão 100
  framework?: 'jest' | 'jasmine' | 'karma';
  projectPath?: string; // Caminho do projeto (necessário para execução)
  // autoStart removido - sempre iniciado via comando do usuário no chat
}

interface TestGenerationProgress {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  currentFilePath?: string;
  fileStatus: 'pending' | 'analyzing' | 'generating' | 'testing' | 'validating' | 'refining' | 'coverage-analysis' | 'completed' | 'error';
  iteration: number;
  error?: string;
  overallProgress?: number; // Percentual de progresso geral (0-100)
  testResults?: TestResults; // Resultados dos testes na última execução
  coverageReport?: CoverageReport; // Relatório de cobertura atual
  message?: string; // Mensagem de status para o chat
}
```

### **🔧 Implementação dos Agentes**

#### **Exemplo: TestExecutorAgent com Comunicação**

```typescript
@Injectable({ providedIn: 'root' })
export class TestExecutorAgent implements TestExecutorAgent {
  readonly name = 'TestExecutor';
  
  private currentProcess?: { process: any; cancel: () => void };
  public onMessage?: (message: AgentMessage) => void;
  
  constructor(
    private terminalService: TerminalService,
    private testFrameworkService: TestFrameworkService,
    private communicationService: AgentCommunicationService
  ) {}
  
  isReady(): boolean {
    return true; // Sempre pronto
  }
  
  execute(request: ExecutionRequest): Observable<TestExecutionResult> {
    return new Observable(observer => {
      // Enviar mensagem de início
      this.sendMessage({
        from: this.name,
        to: 'Orchestrator',
        message: `Iniciando execução dos testes em ${request.testFilePath}...`,
        type: 'info',
        timestamp: new Date()
      });
      
      // Detectar framework
      this.testFrameworkService.detectTestFramework(request.projectPath)
        .pipe(
          switchMap(framework => {
            const command = framework.testFileCommand(request.testFilePath, request.projectPath);
            
            // Informar qual comando será executado
            this.sendMessage({
              from: this.name,
              to: 'Orchestrator',
              message: `Executando comando: ${command}`,
              type: 'info',
              timestamp: new Date()
            });
            
            // Executar comando via terminal
            return this.executeCommand(command, request.projectPath, request.timeout);
          })
        )
        .subscribe({
          next: (result) => {
            // Enviar resultado para TestValidator
            const statusMessage = result.success 
              ? `Execução concluída com sucesso! Exit code: ${result.exitCode}`
              : `Execução falhou. Exit code: ${result.exitCode}`;
            
            this.sendMessage({
              from: this.name,
              to: 'TestValidator',
              message: `${statusMessage}\n\nOutput capturado (${result.output.length} caracteres). Enviando para análise...`,
              type: result.success ? 'success' : 'error',
              data: { exitCode: result.exitCode, outputLength: result.output.length },
              timestamp: new Date()
            });
            
            observer.next(result);
          },
          error: (error) => {
            this.sendMessage({
              from: this.name,
              to: 'Orchestrator',
              message: `Erro durante execução: ${error.message}`,
              type: 'error',
              timestamp: new Date()
            });
            observer.error(error);
          },
          complete: () => observer.complete()
        });
    });
  }
  
  private sendMessage(message: AgentMessage): void {
    if (this.onMessage) {
      this.onMessage(message);
    }
    // Também enviar via serviço de comunicação
    this.communicationService.sendMessage(message);
  }
  
  cancel(): void {
    if (this.currentProcess) {
      this.sendMessage({
        from: this.name,
        to: 'Orchestrator',
        message: 'Cancelando execução de testes...',
        type: 'warning',
        timestamp: new Date()
      });
      this.currentProcess.cancel();
      this.currentProcess = undefined;
    }
  }
  
  private executeCommand(
    command: string, 
    cwd: string, 
    timeout?: number
  ): Observable<TestExecutionResult> {
    // Implementar execução de comando
    // Capturar output, timeout, etc.
  }
}
```

#### **Exemplo: TestValidatorAgent com Comunicação**

```typescript
@Injectable({ providedIn: 'root' })
export class TestValidatorAgent implements TestValidatorAgent {
  readonly name = 'TestValidator';
  
  public onMessage?: (message: AgentMessage) => void;
  
  constructor(
    private testOutputParser: TestOutputParserService,
    private communicationService: AgentCommunicationService
  ) {}
  
  isReady(): boolean {
    return true;
  }
  
  validate(executionResult: TestExecutionResult): Observable<TestResults> {
    return new Observable(observer => {
      // Enviar mensagem de início
      this.sendMessage({
        from: this.name,
        to: 'TestExecutor',
        message: 'Recebi o output da execução. Iniciando análise dos resultados...',
        type: 'info',
        timestamp: new Date()
      });
      
      // Parse output linha por linha
      const lines = executionResult.output.split('\n');
      const testResults: TestResults = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        allPassed: false,
        tests: [],
        summary: {
          hasCompilationErrors: false,
          hasRuntimeErrors: false,
          hasAssertionErrors: false
        }
      };
      
      lines.forEach(line => {
        const results = this.testOutputParser.parseOutputLine(line);
        results.forEach(result => {
          testResults.tests.push({
            name: result.testName,
            describeName: result.describeName,
            status: result.status,
            errorMessage: result.errorMessage
          });
          
          if (result.status === 'passed') {
            testResults.passed++;
          } else if (result.status === 'failed') {
            testResults.failed++;
            // Detectar tipo de erro
            if (result.errorMessage?.includes('Expected')) {
              testResults.summary.hasAssertionErrors = true;
            } else if (result.errorMessage?.includes('Cannot find') || result.errorMessage?.includes('is not defined')) {
              testResults.summary.hasCompilationErrors = true;
            } else {
              testResults.summary.hasRuntimeErrors = true;
            }
          } else {
            testResults.skipped++;
          }
        });
      });
      
      testResults.total = testResults.tests.length;
      testResults.allPassed = testResults.failed === 0 && testResults.total > 0;
      
      // Enviar resultado da validação
      if (testResults.allPassed) {
        this.sendMessage({
          from: this.name,
          to: 'CoverageAnalyzer',
          message: `✅ Todos os testes passaram! (${testResults.passed}/${testResults.total})\n\nSolicitando análise de cobertura...`,
          type: 'success',
          data: testResults,
          timestamp: new Date()
        });
      } else {
        const errorTypes = [];
        if (testResults.summary.hasCompilationErrors) errorTypes.push('compilação');
        if (testResults.summary.hasRuntimeErrors) errorTypes.push('runtime');
        if (testResults.summary.hasAssertionErrors) errorTypes.push('assertion');
        
        this.sendMessage({
          from: this.name,
          to: 'ErrorAnalyzer',
          message: `❌ Validação concluída: ${testResults.failed} teste(s) falharam de ${testResults.total} total.\n\nTipos de erro detectados: ${errorTypes.join(', ')}\n\nEnviando detalhes dos erros para análise...`,
          type: 'error',
          data: testResults,
          timestamp: new Date()
        });
      }
      
      observer.next(testResults);
      observer.complete();
    });
  }
  
  private sendMessage(message: AgentMessage): void {
    if (this.onMessage) {
      this.onMessage(message);
    }
    this.communicationService.sendMessage(message);
  }
}
```

#### **Exemplo: TestGeneratorAgent**

```typescript
@Injectable({ providedIn: 'root' })
export class TestGeneratorAgent implements TestGeneratorAgent {
  readonly name = 'TestGenerator';
  
  constructor(
    private agentService: AgentService
  ) {}
  
  isReady(): boolean {
    return this.agentService.isConfigured();
  }
  
  generate(context: GenerationContext): Observable<string> {
    return new Observable(observer => {
      const prompt = this.buildGenerationPrompt(context);
      
      const options: AgentRequestOptions = {
        currentFile: context.sourceFilePath,
        currentFileContent: context.sourceCode,
        projectContext: context.projectContext
      };
      
      this.agentService.sendMessage([{
        role: 'user',
        content: prompt
      }], options).subscribe({
        next: (response) => {
          const testCode = this.extractTestCode(response.content);
          observer.next(testCode);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }
  
  private buildGenerationPrompt(context: GenerationContext): string {
    // Construir prompt detalhado para IA
    return `...`;
  }
  
  private extractTestCode(response: string): string {
    // Extrair código de teste da resposta
    const codeBlockRegex = /```(?:typescript|ts)?\n([\s\S]*?)```/g;
    const match = codeBlockRegex.exec(response);
    return match ? match[1].trim() : response;
  }
}
```

---

### **Integração com Componentes Existentes**

#### **Modificar TestPromptComponent**

```typescript
// No TestPromptComponent
export class TestPromptComponent implements OnInit, OnDestroy {
  @Input() testFilePath: string | null = null;
  
  private intelligentGeneratorSubscription?: Subscription;
  
  constructor(
    private intelligentTestGeneratorOrchestrator: IntelligentTestGeneratorOrchestrator,
    private communicationService: AgentCommunicationService,
    // ... outros serviços
  ) {}
  
  async sendMessage() {
    if (!this.userMessage.trim()) return;
    
    const message = this.userMessage.trim();
    this.userMessage = '';
    
    // Adicionar mensagem do usuário ao chat
    this.addUserMessage(message);
    
    // Verificar se é comando de geração
    if (this.detectGenerationCommand(message)) {
      await this.startIntelligentGeneration();
    } else {
      // Processar como mensagem normal do chat
      await this.processNormalChatMessage(message);
    }
  }
  
  private detectGenerationCommand(message: string): boolean {
    const generationCommands = [
      /gerar\s+testes/i,
      /criar\s+testes/i,
      /fazer\s+testes/i,
      /gerar\s+testes\s+inteligentes/i,
      /gerar\s+testes\s+com\s+cobertura/i,
      /criar\s+testes\s+unitários/i,
      /testes\s+para\s+(?:este|o|a)\s+arquivo/i,
      /generate\s+tests/i,
      /create\s+tests/i,
      /(?:gerar|criar|fazer)\s+.*testes?/i
    ];
    
    return generationCommands.some(pattern => pattern.test(message));
  }
  
  private async startIntelligentGeneration() {
    // Validar API key antes de iniciar
    if (!this.agentService.isConfigured()) {
      this.addAssistantMessage('Por favor, configure sua API key no painel de chat primeiro.');
      return;
    }
    
    if (!this.testFilePath) {
      this.addAssistantMessage('Erro: Nenhum arquivo de teste está aberto.');
      return;
    }
    
    // Obter caminho do projeto (necessário para execução de testes)
    const projectPath = this.getProjectPath(); // Implementar método para obter caminho do projeto
    if (!projectPath) {
      this.addAssistantMessage('Erro: Não foi possível determinar o caminho do projeto.');
      return;
    }
    
    // Encontrar arquivo fonte
    const sourceFile = await this.findSourceFile(this.testFilePath);
    if (!sourceFile) {
      this.addAssistantMessage(
        'Não foi possível encontrar o arquivo fonte correspondente. ' +
        'Por favor, verifique se existe um arquivo .ts correspondente ao arquivo de teste.'
      );
      return;
    }
    
    // Mensagem inicial
    this.addAssistantMessage(
      `Perfeito! Vou gerar testes inteligentes com cobertura máxima para o arquivo ${this.getFileName(sourceFile)}.`
    );
    
    // Configurar listener de comunicação entre agentes
    this.setupAgentCommunicationListener();
    
    // Iniciar processo e escutar progresso
    this.intelligentGeneratorSubscription = this.intelligentTestGeneratorOrchestrator
      .startIntelligentGeneration(this.testFilePath, sourceFile, {
        projectPath: projectPath
      })
      .subscribe({
        next: (progress) => {
          // Atualizar mensagens no chat com o progresso
          this.updateProgressInChat(progress);
        },
        error: (error) => {
          this.addAssistantMessage(`Erro durante a geração: ${error.message}`);
        },
        complete: () => {
          this.addAssistantMessage('✅ Processo de geração concluído!');
        }
      });
  }
  
  private updateProgressInChat(progress: TestGenerationProgress) {
    // Atualizar ou criar mensagem de progresso no chat
    let progressMessage = this.getProgressMessage(progress);
    
    // Estratégia: Se a última mensagem é do assistente e é de progresso, atualizar
    // Caso contrário, criar nova mensagem
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content.includes('[Fase:')) {
      // Atualizar mensagem existente
      lastMessage.content = progressMessage;
    } else {
      // Criar nova mensagem
      this.addAssistantMessage(progressMessage);
    }
    
    // Atualizar editor se arquivo foi modificado
    if (progress.fileStatus === 'generating' || progress.fileStatus === 'refining') {
      this.refreshEditorIfTestFileOpen();
    }
  }
  
  /**
   * Escuta mensagens entre agentes e exibe no chat
   */
  private setupAgentCommunicationListener() {
    this.communicationService.messages$.subscribe(message => {
      this.displayAgentMessage(message);
    });
  }
  
  /**
   * Exibe mensagem de comunicação entre agentes no chat
   */
  private displayAgentMessage(agentMessage: AgentMessage) {
    const formattedMessage = this.formatAgentMessage(agentMessage);
    
    // Adicionar como mensagem do assistente (agente)
    this.addAssistantMessage(formattedMessage, 'agent');
  }
  
  /**
   * Formata mensagem de agente para exibição no chat
   */
  private formatAgentMessage(message: AgentMessage): string {
    const icon = this.getIconForMessageType(message.type);
    const fromAgent = `**${message.from}**`;
    const toAgent = message.to !== 'Orchestrator' ? ` → **${message.to}**` : '';
    const timestamp = message.timestamp.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    return `${icon} ${fromAgent}${toAgent} [${timestamp}]\n\n${message.message}`;
  }
  
  private getIconForMessageType(type: AgentMessage['type']): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'request': return '📤';
      case 'response': return '📥';
      default: return '💬';
    }
  }
  
  private refreshEditorIfTestFileOpen() {
    // Notificar editor para recarregar arquivo se estiver aberto
    if (this.testFilePath) {
      // Emitir evento ou usar serviço para atualizar editor
      // Exemplo: this.monacoEditorService.refreshFile(this.testFilePath);
    }
  }
  
  private getProgressMessage(progress: TestGenerationProgress): string {
    let message = '';
    
    switch (progress.fileStatus) {
      case 'analyzing':
        message = '[Fase: Análise do código]\n';
        message += `✓ Agente ativo: ${progress.activeAgent || 'SourceCodeAnalyzer'}\n`;
        message += '✓ Analisando arquivo fonte...\n';
        break;
        
      case 'generating':
        message = '[Fase: Geração inicial]\n';
        message += `✓ Agente ativo: ${progress.activeAgent || 'TestGenerator'}\n`;
        message += '✓ Gerando testes com IA...\n';
        break;
        
      case 'testing':
        message = '[Fase: Execução]\n';
        message += `✓ Agente ativo: ${progress.activeAgent || 'TestExecutor'}\n`;
        message += '✓ Executando testes...\n';
        break;
        
      case 'validating':
        message = '[Fase: Validação]\n';
        message += `✓ Agente ativo: ${progress.activeAgent || 'TestValidator'}\n`;
        if (progress.testResults) {
          message += `✓ ${progress.testResults.passed} testes passaram ✅\n`;
          if (progress.testResults.failed > 0) {
            message += `✕ ${progress.testResults.failed} testes falharam\n`;
          }
        }
        break;
        
      case 'refining':
        message = `[Fase: Correção - Iteração ${progress.iteration}]\n`;
        message += `✓ Agente ativo: ${progress.activeAgent || 'TestFixer'}\n`;
        message += '✓ Corrigindo testes falhados...\n';
        break;
        
      case 'enhancing':
        message = `[Fase: Melhorando cobertura - Iteração ${progress.iteration}]\n`;
        message += `✓ Agente ativo: ${progress.activeAgent || 'TestEnhancer'}\n`;
        message += '✓ Gerando testes adicionais...\n';
        break;
        
      case 'completed':
        message = '[Fase: Finalização]\n';
        message += '✅ Processo concluído com sucesso!\n';
        break;
    }
    
    return message;
  }
  
  private async findSourceFile(testFilePath: string): Promise<string | null> {
    // Implementar lógica de encontrar arquivo fonte
    // component.spec.ts → component.ts
    const baseName = testFilePath.replace(/\.(spec|test)\.(ts|js)$/, '');
    const possibleExtensions = ['.ts', '.js'];
    
    // Tentar encontrar arquivo fonte
    for (const ext of possibleExtensions) {
      const sourcePath = baseName + ext;
      const exists = await this.fileService.fileExists(sourcePath).toPromise();
      if (exists) {
        return sourcePath;
      }
    }
    
    return null;
  }
  
  ngOnDestroy() {
    if (this.intelligentGeneratorSubscription) {
      this.intelligentGeneratorSubscription.unsubscribe();
    }
  }
}
```

#### **Usar Serviços Existentes**
- `AgentService` - Para comunicação com IA
- `FileService` - Para ler/escrever arquivos
- `TestFrameworkService` - Para detectar framework
- `TestOutputParserService` - Para parse de resultados
- `TerminalService` - Para executar testes (ou criar método específico)

---

## 🔧 Detalhes de Implementação

### **1. Detecção de Comando no Chat**

```typescript
// No TestPromptComponent
private detectGenerationCommand(message: string): boolean {
  const generationCommands = [
    /gerar\s+testes/i,
    /criar\s+testes/i,
    /fazer\s+testes/i,
    /gerar\s+testes\s+inteligentes/i,
    /gerar\s+testes\s+com\s+cobertura/i,
    /criar\s+testes\s+unitários/i,
    /testes\s+para\s+(?:este|o|a)\s+arquivo/i,
    /generate\s+tests/i,
    /create\s+tests/i,
    /(?:gerar|criar|fazer)\s+.*testes?/i
  ];
  
  return generationCommands.some(pattern => pattern.test(message));
}

// Ao detectar comando:
async onUserMessage(message: string) {
  if (this.detectGenerationCommand(message)) {
    // Iniciar processo de geração inteligente
    const sourceFile = this.findSourceFile(this.testFilePath);
    if (sourceFile) {
      await this.intelligentTestGenerator.startIntelligentGeneration(
        this.testFilePath,
        sourceFile
      );
    } else {
      this.showMessage('Arquivo fonte não encontrado. Por favor, verifique se o arquivo .spec tem um arquivo fonte correspondente.');
    }
  } else {
    // Processar mensagem normal do chat
    this.processNormalMessage(message);
  }
}
```

### **2. Detecção do Arquivo Fonte**

```typescript
private async findSourceFile(testFilePath: string): Promise<string | null> {
  // Exemplo: component.spec.ts → component.ts
  const baseName = testFilePath.replace(/\.(spec|test)\.(ts|js)$/, '');
  const possibleExtensions = ['.ts', '.js'];
  
  for (const ext of possibleExtensions) {
    const sourcePath = baseName + ext;
    const exists = await this.fileService.fileExists(sourcePath).toPromise();
    if (exists) {
      return sourcePath;
    }
  }
  
  return null;
}
```

### **3. Geração de Testes com IA**

```typescript
private async generateTestsWithAI(
  sourceCode: string,
  sourceFilePath: string,
  existingTests?: string,
  failedTests?: FailedTest[]
): Promise<string> {
  const prompt = failedTests 
    ? this.buildFixPrompt(failedTests, existingTests, sourceCode)
    : this.buildInitialPrompt(sourceCode, sourceFilePath);
  
  const options: AgentRequestOptions = {
    currentFile: sourceFilePath,
    currentFileContent: sourceCode,
    projectContext: `Gerando testes para ${sourceFilePath}`
  };
  
  const response = await this.agentService.sendMessage([{
    role: 'user',
    content: prompt
  }], options).toPromise();
  
  return this.extractTestCode(response.content);
}
```

### **4. Execução de Testes**

```typescript
private async executeTests(
  testFilePath: string,
  projectPath: string
): Promise<TestExecutionResult> {
  const framework = await this.testFrameworkService
    .detectTestFramework(projectPath).toPromise();
  
  const command = framework.testFileCommand(testFilePath, projectPath);
  
  // Executar via terminal service ou processo isolado
  return this.runTestCommand(command, projectPath);
}
```

### **5. Parse de Erros para Correção**

```typescript
private buildFixPrompt(
  failedTests: FailedTest[],
  currentTestCode: string,
  sourceCode: string
): string {
  return `
Você está corrigindo testes que falharam. Mantenha TODOS os testes que passaram intactos.

Código fonte:
\`\`\`typescript
${sourceCode}
\`\`\`

Código atual do teste:
\`\`\`typescript
${currentTestCode}
\`\`\`

Testes que FALHARAM (corrigir apenas estes):
${failedTests.map(test => `
- Teste: "${test.name}"
  Erro: ${test.errorMessage}
  Tipo: ${test.errorType}
  ${test.stackTrace ? `Stack: ${test.stackTrace}` : ''}
`).join('\n')}

INSTRUÇÕES:
1. Mantenha TODOS os it() blocks que passaram EXATAMENTE como estão
2. Corrija APENAS os it() blocks listados acima
3. Baseie a correção nas mensagens de erro fornecidas
4. Retorne o código completo do arquivo de teste corrigido
`;
}
```

### **6. Verificação de Cobertura**

```typescript
private async checkCoverage(
  testFilePath: string,
  sourceFilePath: string,
  projectPath: string
): Promise<CoverageReport> {
  // Executar comando de cobertura
  // Jest: npm test -- --coverage --collectCoverageFrom="sourceFilePath"
  // Parse do relatório (JSON ou texto)
  // Retornar CoverageReport
}
```

### **7. Obter Caminho do Projeto**

```typescript
// No TestPromptComponent ou IntelligentTestGeneratorService
private getProjectPath(testFilePath: string): string | null {
  // Estratégia 1: Procurar por angular.json ou package.json subindo diretórios
  let currentPath = testFilePath;
  
  // Extrair diretório do arquivo
  const pathParts = currentPath.split(/[\/\\]/);
  pathParts.pop(); // Remover nome do arquivo
  
  // Subir diretórios até encontrar angular.json ou package.json
  for (let i = pathParts.length; i > 0; i--) {
    const dirPath = pathParts.slice(0, i).join('/');
    const packageJsonPath = `${dirPath}/package.json`;
    const angularJsonPath = `${dirPath}/angular.json`;
    
    // Verificar se existe (pode usar fileExists ou readDirectory)
    if (this.fileExistsSync(packageJsonPath) || this.fileExistsSync(angularJsonPath)) {
      return dirPath;
    }
  }
  
  // Fallback: Usar diretório do arquivo
  return pathParts.join('/');
}

// Alternativa: Usar WorkspaceService se disponível
private getProjectPathFromWorkspace(): string | null {
  // Se houver WorkspaceService, usar ele
  // return this.workspaceService.getProjectPath();
  return null;
}
```

---

## 📊 Interface do Usuário

### **Componente de Progresso**

```
┌─────────────────────────────────────────┐
│ 🧪 Gerando Testes Inteligentes          │
├─────────────────────────────────────────┤
│                                         │
│ Iteração: 2/10                          │
│ Fase: Corrigindo testes falhados       │
│                                         │
│ Progresso: ████████░░░░ 75%             │
│                                         │
│ ✓ 8 testes passaram                    │
│ ✕ 2 testes falharam                    │
│                                         │
│ Testes que falharam:                   │
│ • "should handle error case"           │
│   Erro: Expected undefined to be defined│
│ • "should validate input"              │
│   Erro: Cannot read property 'value'   │
│                                         │
│ Cobertura atual: 85%                   │
│ Meta: 100%                             │
│                                         │
│ [Cancelar]                              │
└─────────────────────────────────────────┘
```

### **Mensagens no Chat (TestPromptComponent)**

#### **Exemplo de Conversa Completa:**

```
Usuário: gerar testes inteligentes para este arquivo

Assistente: Perfeito! Vou gerar testes inteligentes com cobertura máxima para o arquivo component.ts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **SourceCodeAnalyzer** → **Orchestrator** [14:32:15]

Analisando arquivo fonte component.ts...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **SourceCodeAnalyzer** → **Orchestrator** [14:32:18]

Análise concluída com sucesso!
• 5 métodos públicos identificados
• 3 dependências encontradas (UserService, Router, HttpClient)
• Framework detectado: Jest
• Complexidade: Média
• Total de linhas: 145

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **TestGenerator** → **Orchestrator** [14:32:19]

Recebi a análise do código. Gerando testes com IA...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **TestGenerator** → **Orchestrator** [14:32:45]

Testes gerados com sucesso! 10 testes criados cobrindo:
• Todos os métodos públicos
• Casos de sucesso e erro
• Mocks configurados para dependências
• Testes salvos no arquivo component.spec.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **TestExecutor** → **Orchestrator** [14:32:46]

Iniciando execução dos testes em component.spec.ts...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **TestExecutor** → **Orchestrator** [14:32:47]

Executando comando: npm test -- component.spec.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **TestExecutor** → **TestValidator** [14:33:12]

Execução concluída com sucesso! Exit code: 0

Output capturado (3247 caracteres). Enviando para análise...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **TestValidator** → **TestExecutor** [14:33:13]

Recebi o output da execução. Iniciando análise dos resultados...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ **TestValidator** → **ErrorAnalyzer** [14:33:14]

Validação concluída: 2 teste(s) falharam de 10 total.

Tipos de erro detectados: assertion, runtime

Enviando detalhes dos erros para análise:

• "should handle error case"
  Erro: Expected undefined to be defined
  Tipo: assertion
  
• "should validate input"
  Erro: Cannot read property 'value' of undefined
  Tipo: runtime

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **ErrorAnalyzer** → **TestFixer** [14:33:15]

Recebi os erros. Analisando padrões e preparando contexto para correção...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **ErrorAnalyzer** → **TestFixer** [14:33:16]

Análise de erros concluída:

Principais problemas identificados:
1. Valor undefined não está sendo tratado corretamente
2. Propriedade 'value' acessada antes de validação
3. Mocks não estão retornando valores esperados

Contexto preparado para correção. Mantendo 8 testes que passaram intactos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **TestFixer** → **ErrorAnalyzer** [14:33:17]

Recebi o contexto de erros. Gerando correções via IA...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **TestFixer** → **Orchestrator** [14:33:42]

Correções aplicadas com sucesso! Os 2 testes falhados foram corrigidos mantendo os 8 que passaram.
Testes corrigidos salvos no arquivo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **TestExecutor** → **Orchestrator** [14:33:43]

Re-executando testes corrigidos...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **TestExecutor** → **TestValidator** [14:34:05]

Execução concluída com sucesso! Exit code: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **TestValidator** → **CoverageAnalyzer** [14:34:06]

✅ Todos os testes passaram! (10/10)

Solicitando análise de cobertura...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **CoverageAnalyzer** → **TestValidator** [14:34:07]

Recebi a solicitação. Executando análise de cobertura...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **CoverageAnalyzer** → **TestEnhancer** [14:34:15]

Análise de cobertura concluída:
• Cobertura atual: 95%
• Linhas não cobertas: 3 (linhas 42, 67, 89)
• Branches não cobertos: 1 (if na linha 67)

Enviando relatório detalhado para geração de testes adicionais...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **TestEnhancer** → **CoverageAnalyzer** [14:34:16]

Recebi o relatório de cobertura. Gerando testes adicionais para atingir 100%...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **TestEnhancer** → **Orchestrator** [14:34:38]

3 testes adicionais gerados para cobrir:
• Linha 42: Caso edge de validação
• Linha 67: Branch condicional não testado
• Linha 89: Método privado não testado

Testes salvos no arquivo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **TestValidator** → **Orchestrator** [14:35:02]

✅ Todos os testes passaram! (13/13)

Cobertura final: 100% ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Fase: Finalização]
✅ Processo concluído com sucesso!
📊 Resumo:
   • Iterações: 2
   • Testes criados: 13
   • Testes que passam: 13/13
   • Cobertura final: 100%
   • Tempo total: 2m 47s
```

#### **Detecção de Comandos no Chat:**

O sistema deve detectar os seguintes padrões de comando do usuário:

```typescript
// Padrões de detecção
const generationCommands = [
  /gerar\s+testes/i,
  /criar\s+testes/i,
  /fazer\s+testes/i,
  /gerar\s+testes\s+inteligentes/i,
  /gerar\s+testes\s+com\s+cobertura/i,
  /criar\s+testes\s+unitários/i,
  /testes\s+para\s+(?:este|o|a)\s+arquivo/i,
  /generate\s+tests/i,
  /create\s+tests/i,
  /(?:gerar|criar|fazer)\s+.*testes?/i
];

// Exemplos de comandos que serão detectados:
// ✅ "gerar testes"
// ✅ "criar testes para este arquivo"
// ✅ "gerar testes inteligentes"
// ✅ "fazer testes com cobertura máxima"
// ✅ "gerar testes para component.ts"
// ✅ "criar testes unitários"
// ✅ "generate tests"
```

---

## ⚙️ Configurações e Opções

### **Configurações do Usuário**

```typescript
interface UserSettings {
  // Geração
  autoStartOnOpen: boolean;        // OBSOLETO - sempre iniciado via comando do chat
  maxIterations: number;           // Máximo de iterações (padrão: 10)
  targetCoverage: number;          // Meta de cobertura (padrão: 100)
  
  // IA
  aiModel: string;                  // Modelo a usar (gpt-4, gpt-3.5-turbo, etc.)
  aiTemperature: number;           // Criatividade (0-1)
  
  // Execução
  testTimeout: number;              // Timeout por teste (ms)
  useCoverageReport: boolean;       // Usar relatório de cobertura
  frameworkOverride?: 'jest' | 'jasmine' | 'karma'; // Forçar framework
  
  // Notificações
  showProgressNotifications: boolean;
  playSoundOnComplete: boolean;
}
```

---

## 🚨 Tratamento de Erros e Edge Cases

### **Cenários de Erro**

1. **Arquivo fonte não encontrado**
   - Mensagem: "Não foi possível encontrar o arquivo fonte correspondente"
   - Ação: Permitir seleção manual ou cancelar

2. **Framework não detectado**
   - Mensagem: "Não foi possível detectar o framework de teste"
   - Ação: Perguntar ao usuário ou usar padrão (Jest)

3. **Testes não compilam**
   - Ação: IA recebe erros de compilação e corrige

4. **Loop infinito (muitas iterações)**
   - Ação: Parar após N iterações e mostrar o que foi possível

5. **IA não consegue gerar código válido**
   - Ação: Tentar novamente com prompt mais específico
   - Fallback: Mostrar erro e permitir edição manual

6. **Cobertura não pode ser verificada**
   - Ação: Continuar mesmo assim (testes passando é mais importante)

7. **Timeout na execução**
   - Ação: Cancelar execução e tentar novamente
   
8. **API Key não configurada**
   - Ação: Verificar antes de iniciar e informar usuário
   - Mensagem: "Por favor, configure sua API key primeiro"

9. **Caminho do projeto não encontrado**
   - Ação: Tentar detectar automaticamente a partir do arquivo aberto
   - Fallback: Perguntar ao usuário ou usar diretório atual

10. **Editor não atualizado após salvar testes**
    - Ação: Notificar editor para recarregar arquivo quando testes são salvos
    - Usar serviço de notificação ou eventos

---

## 📈 Métricas e Feedback

### **Relatório Final**

```
✅ Geração Inteligente Concluída

📊 Estatísticas:
   • Iterações: 3
   • Tempo total: 2m 15s
   • Testes criados: 15
   • Testes que passam: 15/15
   • Cobertura final: 100%

📝 Testes por Categoria:
   • Métodos públicos: 8 testes
   • Casos de erro: 4 testes
   • Casos edge: 3 testes

🔄 Correções Aplicadas:
   • Iteração 1: 2 testes corrigidos
   • Iteração 2: 1 teste corrigido
   • Iteração 3: Nenhum erro (concluído)

🎯 Cobertura por Arquivo:
   • component.ts: 100% (45/45 linhas)
   • service.ts: 100% (32/32 linhas)
```

---

## 🔄 Fluxograma Visual

```
[Abrir arquivo .spec]
        ↓
[Chat lateral aberto]
        ↓
[Usuário digita comando no chat]
        ↓
[Detectar comando de geração]
        ↓
[Arquivo fonte existe?]
    N → [Mensagem: "Arquivo fonte não encontrado"]
    ↓ S
[Detectar framework]
        ↓
[Análise do código fonte]
        ↓
[Geração inicial de testes]
        ↓
[Executar testes]
        ↓
[Parse resultados]
        ↓
[Todos passaram?]
    S → [Verificar cobertura]
    |       ↓
    |   [Cobertura >= 100%?]
    |       S → [✅ Sucesso!]
    |       N → [Gerar testes adicionais] ─┐
    |                                       │
    N → [Corrigir testes falhados] ────────┘
            ↓
        [Salvar correções]
            ↓
        [Iteração < Max?]
            S → [Voltar para Executar]
            N → [⚠️ Parar com aviso]
```

---

## 🎯 Priorização de Implementação

### **Fase 1: MVP (Funcionalidade Básica)**
1. ✅ Detecção de arquivo fonte
2. ✅ Geração inicial de testes
3. ✅ Execução de testes
4. ✅ Parse de resultados básico
5. ✅ Correção de testes falhados (1 iteração)
6. ✅ Interface básica de progresso

### **Fase 2: Refinamento**
1. ✅ Loop completo de iterações
2. ✅ Análise de cobertura
3. ✅ Geração de testes adicionais baseada em cobertura
4. ✅ Interface detalhada de progresso
5. ✅ Relatório final

### **Fase 3: Melhorias**
1. ⚙️ Configurações avançadas
2. ⚙️ Histórico de gerações
3. ⚙️ Comparação de cobertura antes/depois
4. ⚙️ Exportação de relatórios
5. ⚙️ Integração com CI/CD

---

## 🤔 Perguntas para Refinamento

1. **Início automático**: ✅ **RESOLVIDO** - O processo inicia quando o usuário solicita via chat

2. **Limite de iterações**: Qual número máximo de iterações? (sugestão: 10)

3. **Cobertura mínima**: Deve aceitar menos que 100%? (ex: 95% é suficiente?)

4. **Testes existentes**: ✅ **DEFINIDO** - Se o .spec já tiver código:
   - **Estratégia**: Substituir completamente com testes novos gerados
   - **Razão**: Garantir consistência e evitar duplicação
   - **Alternativa futura**: Permitir opção "melhorar existentes" via configuração

5. **Cancelamento**: ✅ **DEFINIDO** - Permitir cancelar em qualquer momento. Ao cancelar:
   - Parar processo atual
   - Salvar testes gerados até o momento (se houver)
   - Exibir resumo do que foi feito
   - Manter arquivo .spec com o estado atual

6. **Múltiplos arquivos**: Deve processar múltiplos arquivos .spec em paralelo ou sequencial?

7. **Notificações**: Como notificar o usuário quando concluir? (toast, som, badge)

---

## 📝 Notas de Implementação

- **Performance**: Processo pode levar tempo (várias chamadas à IA + execuções)
- **Custos**: Múltiplas chamadas à API podem aumentar custos
- **Rate Limiting**: Considerar limites da API da IA
- **Paralelismo**: Execução de testes pode ser lenta, considerar timeout
- **Persistência**: Salvar estado para permitir resumir após fechar/reabrir
- **Sincronização com Editor**: Quando testes são salvos, atualizar editor se arquivo estiver aberto
- **Caminho do Projeto**: Sempre passar caminho do projeto para execução de testes
- **Validação prévia**: Verificar API key e arquivo fonte antes de iniciar processo

---

## ✅ Checklist de Validação

- [ ] Detecta arquivo fonte corretamente
- [ ] Gera testes válidos que compilam
- [ ] Executa testes e captura output
- [ ] Identifica testes que passaram/falharam
- [ ] Corrige testes falhados mantendo os que passaram
- [ ] Verifica cobertura quando disponível
- [ ] Gera testes adicionais para aumentar cobertura
- [ ] Para quando atinge meta ou máximo de iterações
- [ ] Exibe progresso claro para o usuário
- [ ] Permite cancelamento
- [ ] Trata erros graciosamente
- [ ] Funciona com Jest, Jasmine e Karma
- [ ] Atualiza editor quando testes são salvos
- [ ] Valida API key antes de iniciar
- [ ] Detecta caminho do projeto corretamente
- [ ] Permite cancelamento e salva progresso
- [ ] Agentes funcionam independentemente
- [ ] Agentes podem ser testados isoladamente
- [ ] Orquestrador coordena fluxo corretamente
- [ ] Comunicação entre agentes funciona

