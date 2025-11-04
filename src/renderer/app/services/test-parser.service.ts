import { Injectable } from '@angular/core';
import { TestFileStructure, ImportStatement, DescribeBlock, ItBlock } from '../components/test-editor/models/test-file-structure.model';

@Injectable({
  providedIn: 'root'
})
export class TestParserService {
  
  /**
   * Parse um arquivo de teste e retorna estrutura
   */
  parseTestFile(content: string): TestFileStructure {
    const lines = content.split('\n');
    
    const imports: ImportStatement[] = [];
    const describeBlocks: DescribeBlock[] = [];
    let preDescribeCode = '';
    let postDescribeCode = '';
    let rawCode = '';
    
    let currentSection: 'pre' | 'describe' | 'post' = 'pre';
    let i = 0;
    
    // Parse imports
    i = this.parseImports(lines, imports, i);
    
    // Código antes dos describes
    const preLines: string[] = [];
    while (i < lines.length && !this.isDescribeLine(lines[i])) {
      preLines.push(lines[i]);
      i++;
    }
    preDescribeCode = preLines.join('\n');
    
    // Parse describe blocks
    while (i < lines.length) {
      const describeResult = this.parseDescribeBlock(lines, i);
      if (describeResult) {
        describeBlocks.push(describeResult.block);
        i = describeResult.nextIndex;
      } else {
        // Código após os describes
        postDescribeCode += lines[i] + '\n';
        i++;
      }
    }
    
    postDescribeCode = postDescribeCode.trim();
    
    return {
      imports,
      describeBlocks,
      rawCode: content,
      preDescribeCode,
      postDescribeCode
    };
  }
  
  /**
   * Parse imports do arquivo
   */
  private parseImports(lines: string[], imports: ImportStatement[], startIndex: number): number {
    let i = startIndex;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Verificar se é um import
      if (line.startsWith('import ')) {
        const importStatement = this.parseImportLine(line, i);
        if (importStatement) {
          imports.push(importStatement);
        }
      } else if (line && !line.startsWith('//') && !line.startsWith('/*')) {
        // Se não é import e não é comentário, parar de procurar imports
        break;
      }
      
      i++;
    }
    
    return i;
  }
  
  /**
   * Parse uma linha de import
   */
  private parseImportLine(line: string, lineNumber: number): ImportStatement | null {
    // Padrão: import { X, Y } from 'z';
    // Padrão: import X from 'y';
    // Padrão: import * as X from 'y';
    
    const importMatch = line.match(/import\s+(?:(?:\{([^}]+)\})|(\*)\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/);
    
    if (!importMatch) {
      return null;
    }
    
    const id = `import_${lineNumber}_${Date.now()}`;
    const namedImportsStr = importMatch[1];
    const isNamespace = importMatch[2] === '*';
    const namespaceName = importMatch[3];
    const defaultImport = importMatch[4];
    const from = importMatch[5];
    
    const namedImports = namedImportsStr 
      ? namedImportsStr.split(',').map(imp => imp.trim()).filter(Boolean)
      : undefined;
    
    return {
      id,
      defaultImport: defaultImport || undefined,
      namedImports,
      namespaceImport: isNamespace ? namespaceName : undefined,
      from,
      originalLine: lineNumber,
      originalText: line
    };
  }
  
  /**
   * Verifica se uma linha é um describe
   */
  private isDescribeLine(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('describe(') || trimmed.startsWith('describe.skip(') || trimmed.startsWith('describe.only(');
  }
  
  /**
   * Parse um bloco describe completo
   */
  private parseDescribeBlock(lines: string[], startIndex: number): { block: DescribeBlock; nextIndex: number } | null {
    let i = startIndex;
    
    // Encontrar linha do describe
    while (i < lines.length && !this.isDescribeLine(lines[i])) {
      i++;
    }
    
    if (i >= lines.length) {
      return null;
    }
    
    const describeLine = lines[i];
    const describeMatch = describeLine.match(/describe\s*(?:\.(skip|only))?\s*\(\s*['"`]([^'"`]+)['"`]/);
    
    if (!describeMatch) {
      return null;
    }
    
    const describeName = describeMatch[2];
    const id = `describe_${i}_${Date.now()}`;
    
    const block: DescribeBlock = {
      id,
      name: describeName,
      originalLine: i,
      beforeEach: undefined,
      afterEach: undefined,
      beforeAll: undefined,
      afterAll: undefined,
      itBlocks: [],
      additionalCode: ''
    };
    
    // Encontrar início do bloco (a linha com o { do describe)
    i++;
    let braceCount = 0;
    let inBlock = false;
    let describeOpenLine = -1;
    let blockStart = i;
    
    // Encontrar o início do bloco (a linha com o { do describe)
    while (i < lines.length) {
      const line = lines[i];
      if (line.includes('{')) {
        const openingBraces = (line.match(/\{/g) || []).length;
        const closingBraces = (line.match(/\}/g) || []).length;
        braceCount = openingBraces - closingBraces;
        inBlock = true;
        describeOpenLine = i; // Guardar a linha onde o { foi encontrado
        blockStart = i; // Começar a partir desta linha para poder detectar beforeEach/afterEach/it
        break;
      }
      i++;
    }
    
    if (!inBlock) {
      return { block, nextIndex: i };
    }
    
    // Parse conteúdo do describe - começar da linha do { para detectar beforeEach/it que podem estar logo depois
    i = blockStart;
    let currentBlockContent: string[] = [];
    let currentItBlock: { name: string; body: string[]; line: number; isTest: boolean; itBraceCount: number } | null = null;
    
    while (i < lines.length && braceCount > 0) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // PRIMEIRO: Verificar se é beforeEach/afterEach/it ANTES de qualquer outra coisa
      // Isso é crítico porque essas linhas podem estar na mesma linha do { do describe
      // IMPORTANTE: Verificar ANTES de pular a linha do {
      
      // Verificar se é beforeEach/afterEach/it mesmo se for a linha do { do describe
      if (!currentItBlock && this.isBeforeEachLine(line)) {
        const beforeEachEnd = this.skipToBlockEnd(lines, i);
        block.beforeEach = this.extractBlockContent(lines, i);
        // Pular completamente o beforeEach, não contar suas braces para o describe
        i = beforeEachEnd;
        continue;
      }
      
      if (!currentItBlock && this.isAfterEachLine(line)) {
        const afterEachEnd = this.skipToBlockEnd(lines, i);
        block.afterEach = this.extractBlockContent(lines, i);
        i = afterEachEnd;
        continue;
      }
      
      if (!currentItBlock && this.isBeforeAllLine(line)) {
        const beforeAllEnd = this.skipToBlockEnd(lines, i);
        block.beforeAll = this.extractBlockContent(lines, i);
        i = beforeAllEnd;
        continue;
      }
      
      if (!currentItBlock && this.isAfterAllLine(line)) {
        const afterAllEnd = this.skipToBlockEnd(lines, i);
        block.afterAll = this.extractBlockContent(lines, i);
        i = afterAllEnd;
        continue;
      }
      
      // Verificar se é it() ou test() ANTES de contar braces
      const itMatch = line.match(/(it|test)\s*(?:\.(skip|only))?\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (itMatch && !currentItBlock) {
        currentItBlock = {
          name: itMatch[3],
          body: [],
          line: i,
          isTest: itMatch[1] === 'test',
          itBraceCount: 0
        };
        
        // Verificar se o { está na mesma linha
        const bracesInLine = (line.match(/\{/g) || []).length;
        const closingBracesInLine = (line.match(/\}/g) || []).length;
        
        if (bracesInLine > 0) {
          // O { está na mesma linha
          currentItBlock.itBraceCount = bracesInLine - closingBracesInLine;
        }
        
        i++;
        continue;
      }
      
      // Se esta é a linha do { do describe E não é um beforeEach/afterEach/it, pular ela
      if (i === describeOpenLine) {
        // Esta linha tem o { do describe, pular para a próxima
        i++;
        continue;
      }
      
      // Se estamos dentro de um it block, processar o conteúdo
      if (currentItBlock) {
        const openingBraces = (line.match(/\{/g) || []).length;
        const closingBraces = (line.match(/\}/g) || []).length;
        
        // Se ainda não encontramos o { inicial (itBraceCount === 0)
        if (currentItBlock.itBraceCount === 0) {
          if (openingBraces > 0) {
            // Encontramos o { inicial nesta linha
            currentItBlock.itBraceCount = openingBraces - closingBraces;
            
            // Se a linha só tem o {, não adicionar ao body e pular
            if (trimmedLine === '{' || trimmedLine === '') {
              i++;
              continue;
            }
            
            // Se tem conteúdo além do {, adicionar ao body
            // Mas já contamos as braces, então só adicionar ao body
            currentItBlock.body.push(line);
            i++;
            continue;
          } else {
            // Ainda não encontramos o {, esta linha é parte da declaração (async, arrow function, etc)
            i++;
            continue;
          }
        }
        
        // Já estamos dentro do it block (itBraceCount > 0), processar normalmente
        // Contar braces do it block
        currentItBlock.itBraceCount += openingBraces;
        currentItBlock.itBraceCount -= closingBraces;
        
        // Adicionar linha ao body
        currentItBlock.body.push(line);
        
        // Se o it block fechou (braceCount <= 0)
        if (currentItBlock.itBraceCount <= 0) {
          block.itBlocks.push({
            id: `it_${currentItBlock.line}_${Date.now()}`,
            name: currentItBlock.name,
            originalLine: currentItBlock.line,
            body: currentItBlock.body.join('\n'),
            isTest: currentItBlock.isTest
          });
          currentItBlock = null;
        }
        
        i++;
        continue;
      }
      
      
      // AGORA contar braces do describe (apenas para linhas que não são blocos aninhados)
      // As braces dos blocos aninhados (beforeEach, afterEach, it) já foram processadas e puladas
      const describeOpeningBraces = (line.match(/\{/g) || []).length;
      const describeClosingBraces = (line.match(/\}/g) || []).length;
      
      // Só contar braces para o describe se não estamos dentro de um it block
      // (os blocos beforeEach/afterEach já foram pulados acima)
      if (!currentItBlock) {
        braceCount += describeOpeningBraces;
        braceCount -= describeClosingBraces;
      }
      
      // Não é um it block nem um hook, adicionar ao código adicional
      if (!currentItBlock) {
        currentBlockContent.push(line);
      }
      i++;
    }
    
    // Adicionar último it block se existir
    if (currentItBlock) {
      block.itBlocks.push({
        id: `it_${currentItBlock.line}_${Date.now()}`,
        name: currentItBlock.name,
        originalLine: currentItBlock.line,
        body: currentItBlock.body.join('\n'),
        isTest: currentItBlock.isTest
      });
    }
    
    block.additionalCode = currentBlockContent.join('\n');
    
    return { block, nextIndex: i };
  }
  
  private isBeforeEachLine(line: string): boolean {
    const trimmed = line.trim();
    // Pode ser: beforeEach( ou beforeEach(waitForAsync(() => {
    // Verificar se a linha contém beforeEach( no início (pode ter espaços antes)
    return /^\s*beforeEach\s*\(/.test(trimmed);
  }
  
  private isAfterEachLine(line: string): boolean {
    return line.trim().startsWith('afterEach(');
  }
  
  private isBeforeAllLine(line: string): boolean {
    return line.trim().startsWith('beforeAll(');
  }
  
  private isAfterAllLine(line: string): boolean {
    return line.trim().startsWith('afterAll(');
  }
  
  private extractBlockContent(lines: string[], startIndex: number): string {
    let i = startIndex;
    let braceCount = 0;
    const content: string[] = [];
    
    // Encontrar início do bloco
    while (i < lines.length && !lines[i].includes('{')) {
      i++;
    }
    // Contar o { da linha inicial
    if (i < lines.length && lines[i].includes('{')) {
      braceCount = 1;
    }
    i++; // Pular linha com {
    
    // Extrair conteúdo até fechar o bloco
    while (i < lines.length && braceCount > 0) {
      const line = lines[i];
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (braceCount <= 0) {
        break;
      }
      
      content.push(line);
      i++;
    }
    
    return content.join('\n');
  }
  
  private skipToBlockEnd(lines: string[], startIndex: number): number {
    let i = startIndex;
    let braceCount = 0;
    
    // Encontrar o { inicial
    while (i < lines.length && !lines[i].includes('{')) {
      i++;
    }
    // Contar o { da linha inicial
    if (i < lines.length && lines[i].includes('{')) {
      braceCount = 1;
    }
    i++; // Pular linha com {
    
    // Avançar até fechar o bloco
    while (i < lines.length && braceCount > 0) {
      const line = lines[i];
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (braceCount <= 0) {
        return i + 1;
      }
      
      i++;
    }
    
    return i;
  }
  
  /**
   * Gera código TypeScript a partir da estrutura
   */
  generateCode(structure: TestFileStructure): string {
    const lines: string[] = [];
    
    // Imports
    structure.imports.forEach(imp => {
      lines.push(this.generateImportLine(imp));
    });
    
    // Linha em branco após imports
    if (structure.imports.length > 0) {
      lines.push('');
    }
    
    // Código pré-describe
    if (structure.preDescribeCode.trim()) {
      lines.push(structure.preDescribeCode);
      lines.push('');
    }
    
    // Describe blocks
    structure.describeBlocks.forEach((describe, index) => {
      lines.push(this.generateDescribeBlock(describe));
      if (index < structure.describeBlocks.length - 1) {
        lines.push('');
      }
    });
    
    // Código pós-describe
    if (structure.postDescribeCode.trim()) {
      lines.push('');
      lines.push(structure.postDescribeCode);
    }
    
    return lines.join('\n');
  }
  
  private generateImportLine(imp: ImportStatement): string {
    if (imp.namespaceImport) {
      return `import * as ${imp.namespaceImport} from '${imp.from}';`;
    }
    
    if (imp.defaultImport && imp.namedImports && imp.namedImports.length > 0) {
      return `import ${imp.defaultImport}, { ${imp.namedImports.join(', ')} } from '${imp.from}';`;
    }
    
    if (imp.defaultImport) {
      return `import ${imp.defaultImport} from '${imp.from}';`;
    }
    
    if (imp.namedImports && imp.namedImports.length > 0) {
      return `import { ${imp.namedImports.join(', ')} } from '${imp.from}';`;
    }
    
    return `import {} from '${imp.from}';`;
  }
  
  private generateDescribeBlock(describe: DescribeBlock): string {
    const lines: string[] = [];
    
    lines.push(`describe('${describe.name}', () => {`);
    
    // beforeEach
    if (describe.beforeEach) {
      const beforeEachLines = describe.beforeEach.split('\n');
      const firstLine = beforeEachLines.find(line => line.trim());
      
      // Verificar se é waitForAsync ou async
      if (firstLine && firstLine.includes('waitForAsync')) {
        lines.push('  beforeEach(waitForAsync(() => {');
        beforeEachLines.forEach((line, index) => {
          if (line.trim() && !line.includes('waitForAsync')) {
            lines.push('    ' + line);
          }
        });
        lines.push('  }));');
      } else {
        lines.push('  beforeEach(() => {');
        beforeEachLines.forEach(line => {
          if (line.trim()) {
            lines.push('    ' + line);
          }
        });
        lines.push('  });');
      }
      lines.push('');
    }
    
    // afterEach
    if (describe.afterEach) {
      lines.push('  afterEach(() => {');
      const afterEachLines = describe.afterEach.split('\n');
      afterEachLines.forEach(line => {
        lines.push('    ' + line);
      });
      lines.push('  });');
      lines.push('');
    }
    
    // beforeAll
    if (describe.beforeAll) {
      lines.push('  beforeAll(() => {');
      const beforeAllLines = describe.beforeAll.split('\n');
      beforeAllLines.forEach(line => {
        lines.push('    ' + line);
      });
      lines.push('  });');
      lines.push('');
    }
    
    // afterAll
    if (describe.afterAll) {
      lines.push('  afterAll(() => {');
      const afterAllLines = describe.afterAll.split('\n');
      afterAllLines.forEach(line => {
        lines.push('    ' + line);
      });
      lines.push('  });');
      lines.push('');
    }
    
    // Código adicional
    if (describe.additionalCode.trim()) {
      const additionalLines = describe.additionalCode.split('\n');
      additionalLines.forEach(line => {
        if (line.trim()) {
          lines.push('  ' + line);
        }
      });
      if (describe.itBlocks.length > 0) {
        lines.push('');
      }
    }
    
    // It blocks
    describe.itBlocks.forEach((it, index) => {
      const bodyLines = it.body.split('\n').filter(line => line.trim());
      const firstBodyLine = bodyLines[0] || '';
      
      // Verificar se o body original tinha async na declaração
      // Se o body não tem conteúdo ou começa com código normal, usar formato padrão
      if (firstBodyLine.includes('async') && firstBodyLine.includes('=>')) {
        // Se já tem async () => { no body, usar diretamente
        lines.push(`  ${it.isTest ? 'test' : 'it'}('${it.name}', async () => {`);
        bodyLines.forEach((line, lineIndex) => {
          // Pular a primeira linha se já contém a declaração async
          if (lineIndex === 0 && (line.includes('async') || line.includes('=>'))) {
            // Não incluir esta linha
          } else {
            lines.push('    ' + line);
          }
        });
      } else {
        // Formato padrão
        lines.push(`  ${it.isTest ? 'test' : 'it'}('${it.name}', () => {`);
        bodyLines.forEach(line => {
          lines.push('    ' + line);
        });
      }
      lines.push('  });');
      if (index < describe.itBlocks.length - 1) {
        lines.push('');
      }
    });
    
    lines.push('});');
    
    return lines.join('\n');
  }
}

