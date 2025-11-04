export interface TestFileStructure {
  imports: ImportStatement[];
  describeBlocks: DescribeBlock[];
  // Código não parseado (comentários, helpers, etc.)
  rawCode: string;
  // Código antes dos describes (setup, mocks, etc.)
  preDescribeCode: string;
  // Código após os describes (helpers, exports, etc.)
  postDescribeCode: string;
}

export interface ImportStatement {
  id: string; // ID único para tracking
  defaultImport?: string;
  namedImports?: string[];
  namespaceImport?: string;
  from: string;
  originalLine: number;
  originalText: string; // Texto original para preservar formatação
}

export interface DescribeBlock {
  id: string; // ID único para tracking
  name: string;
  originalLine: number;
  beforeEach?: string;
  afterEach?: string;
  beforeAll?: string;
  afterAll?: string;
  itBlocks: ItBlock[];
  // Código adicional dentro do describe (helpers, etc.)
  additionalCode: string;
}

export type TestStatus = 'not-run' | 'running' | 'passed' | 'failed';

export interface ItBlock {
  id: string; // ID único para tracking
  name: string;
  originalLine: number;
  body: string;
  // Flag para indicar se é test() ou it()
  isTest: boolean;
  // Status do teste (para visualização em tempo real)
  status?: TestStatus;
  // Mensagem de erro se falhou
  errorMessage?: string;
}

