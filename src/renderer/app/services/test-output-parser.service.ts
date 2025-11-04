import { Injectable } from '@angular/core';

export interface TestResult {
  testName: string;
  describeName?: string;
  status: 'passed' | 'failed' | 'running';
  errorMessage?: string;
}

/**
 * Serviço para parsear output de testes e identificar resultados
 */
@Injectable({
  providedIn: 'root'
})
export class TestOutputParserService {
  private accumulatedOutput = '';

  /**
   * Remove códigos ANSI de cores do texto
   */
  private stripAnsiCodes(text: string): string {
    // Remove códigos ANSI (ex: [31m, [39m, [2m, [22m, etc.)
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }

  /**
   * Processa uma linha de output do terminal e retorna resultados de testes encontrados
   */
  parseOutputLine(line: string): TestResult[] {
    // Acumular output para análise
    this.accumulatedOutput += line + '\n';

    const results: TestResult[] = [];
    
    // Remover códigos ANSI antes de processar
    const cleanedLine = this.stripAnsiCodes(line);
    const trimmedLine = cleanedLine.trim();

    // Padrões mais específicos para Jest
    // Jest geralmente tem: "✓ nome do teste" ou "✕ nome do teste" ou "× nome do teste"
    // Ou linhas com "● describe › test" (que indica um teste que falhou)
    const jestPassPattern = /✓|√/;
    const jestFailPattern = /✕|×|✗|●/; // ● também indica falha no Jest
    
    // Padrões para Karma/Jasmine
    const karmaPassPattern = /SUCCESS|✓|PASS/i;
    const karmaFailPattern = /FAILED|✕|FAIL/i;

    // Ignorar linhas que são claramente comandos ou mensagens de sistema
    if (trimmedLine.match(/^(npm|cd|C:\\|>|ts-jest|Test Suites|Tests:|Snapshots:|Time:|Ran all|at |Unexpected|However|You might|See |node_modules|Error:|Cannot find)/i)) {
      return results;
    }

    // Ignorar linhas que são parte de stack traces ou mensagens de erro detalhadas
    if (trimmedLine.match(/^\s*(at |>|at node_modules|at Object\.|at Function\.|at _)/)) {
      return results;
    }

    // Verificar se a linha contém símbolos de pass/fail
    const hasPassSymbol = jestPassPattern.test(trimmedLine) || karmaPassPattern.test(trimmedLine);
    const hasFailSymbol = jestFailPattern.test(trimmedLine) || karmaFailPattern.test(trimmedLine);
    
    // Linhas com ● geralmente têm o formato "● describe › test" e indicam falha
    const hasBulletPoint = /●/.test(trimmedLine) && /›/.test(trimmedLine);

    // Log apenas para testes detectados (reduzir ruído)
    // console.log('[TestParser] Processando linha relevante:', trimmedLine);

    if (hasPassSymbol && !hasFailSymbol && !hasBulletPoint) {
      // Tentar extrair nome do teste
      const testNameMatch = this.extractTestName(trimmedLine);
      if (testNameMatch && testNameMatch.testName) {
        // console.log('[TestParser] Teste passou:', testNameMatch);
        results.push({
          testName: testNameMatch.testName,
          describeName: testNameMatch.describeName,
          status: 'passed'
        });
      }
    } else if (hasFailSymbol || hasBulletPoint) {
      // Teste falhou - pode ser linha com × ou linha com ●
      const testNameMatch = this.extractTestName(trimmedLine);
      if (testNameMatch && testNameMatch.testName) {
        // console.log('[TestParser] Teste falhou:', testNameMatch);
        // Tentar extrair mensagem de erro das linhas seguintes
        const errorMsg = this.extractErrorMessage(this.accumulatedOutput, testNameMatch.testName);
        
        results.push({
          testName: testNameMatch.testName,
          describeName: testNameMatch.describeName,
          status: 'failed',
          errorMessage: errorMsg
        });
      }
    }

    // Limitar acumulação para evitar uso excessivo de memória
    if (this.accumulatedOutput.length > 50000) {
      this.accumulatedOutput = this.accumulatedOutput.slice(-25000);
    }

    return results;
  }

  /**
   * Extrai o nome do teste de uma linha de output
   */
  private extractTestName(line: string): { testName: string; describeName?: string } | null {
    // Remover símbolos de pass/fail e tempo
    let cleaned = line
      .replace(/[✓√✕×✗●]/g, '')
      .replace(/PASS|FAIL|passed|failed/gi, '')
      .replace(/\(\d+ms?\)/g, '')
      .replace(/\(\d+\.\d+s?\)/g, '')
      .replace(/^\s+/, '')
      .trim();

    // Padrão 1: "describe › test" (com símbolo ›)
    // Exemplo: "main bootstrap › should bootstrap without throwing error"
    const describeArrowMatch = cleaned.match(/(.+?)\s*›\s*(.+)/);
    if (describeArrowMatch && describeArrowMatch[2]) {
      const testName = describeArrowMatch[2].trim();
      // Remover informações adicionais do nome do teste
      const cleanTestName = testName.split(/\(|\[/)[0].trim();
      return {
        describeName: describeArrowMatch[1].trim(),
        testName: cleanTestName
      };
    }

    // Padrão 2: "describe > test" (com >)
    const describeMatch = cleaned.match(/(.+?)\s*>\s*(.+)/);
    if (describeMatch && describeMatch[2]) {
      const testName = describeMatch[2].trim();
      const cleanTestName = testName.split(/\(|\[/)[0].trim();
      return {
        describeName: describeMatch[1].trim(),
        testName: cleanTestName
      };
    }

    // Padrão 3: "should ..." ou "test ..." (apenas o nome do teste)
    // Exemplo: "should bootstrap without throwing error (25 ms)"
    const shouldMatch = cleaned.match(/^(should\s+.+?)(?:\s*\(|$)/i);
    if (shouldMatch && shouldMatch[1]) {
      return {
        testName: shouldMatch[1].trim()
      };
    }

    // Padrão 4: "describe test name" (sem separador)
    // Exemplo: "main bootstrap should bootstrap without throwing error"
    const parts = cleaned.split(/\s+/);
    const shouldIndex = parts.findIndex(p => p.toLowerCase().startsWith('should'));
    if (shouldIndex > 0) {
      return {
        describeName: parts.slice(0, shouldIndex).join(' '),
        testName: parts.slice(shouldIndex).join(' ').split(/\(|\[/)[0].trim()
      };
    }

    // Padrão 5: Tentar extrair qualquer texto que pareça nome de teste
    const testNameMatch = cleaned.match(/^(.+?)(?:\s*\(|\s*\[|$)/);
    if (testNameMatch && testNameMatch[1].trim()) {
      const extracted = testNameMatch[1].trim();
      // Se contém "should" ou "test", provavelmente é um nome de teste
      if (extracted.toLowerCase().includes('should') || extracted.toLowerCase().includes('test')) {
        return {
          testName: extracted
        };
      }
    }

    return null;
  }

  /**
   * Extrai mensagem de erro relacionada a um teste
   */
  private extractErrorMessage(output: string, testName: string): string | undefined {
    // Procurar por mensagens de erro após o nome do teste
    const lines = output.split('\n');
    let foundTest = false;
    let errorLines: string[] = [];

    for (const line of lines) {
      if (line.includes(testName)) {
        foundTest = true;
        continue;
      }

      if (foundTest) {
        // Parar quando encontrar próximo teste ou fim da seção de erro
        if (line.match(/[✓√✕×]|PASS|FAIL|Test Suites|Tests:/i)) {
          break;
        }
        
        // Coletar linhas de erro (geralmente contêm "Error:", "Expected:", "Received:", etc.)
        if (line.match(/Error|Expected|Received|at |AssertionError/i)) {
          errorLines.push(line.trim());
        }
      }
    }

    return errorLines.length > 0 ? errorLines.join(' ') : undefined;
  }

  /**
   * Faz match entre o nome do teste no código e o resultado do output
   * Isso é necessário porque o nome pode ter variações (aspas simples vs duplas, escape, etc.)
   */
  matchTestName(codeName: string, outputName: string): boolean {
    // Normalizar nomes: remover aspas, espaços extras, etc.
    const normalize = (name: string) => {
      return name
        .replace(/['"]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    };

    const normalizedCode = normalize(codeName);
    const normalizedOutput = normalize(outputName);

    // Match exato
    if (normalizedCode === normalizedOutput) {
      return true;
    }

    // Match parcial (output pode ter informações adicionais)
    // Exemplo: "should bootstrap" vs "should bootstrap without throwing error"
    if (normalizedOutput.includes(normalizedCode)) {
      return true;
    }
    
    // Match reverso (código pode ter mais informações)
    if (normalizedCode.includes(normalizedOutput)) {
      return true;
    }

    // Match por palavras-chave: se ambos contêm "should" e palavras similares
    const codeWords = normalizedCode.split(/\s+/).filter(w => w.length > 2);
    const outputWords = normalizedOutput.split(/\s+/).filter(w => w.length > 2);
    
    // Se pelo menos 2 palavras-chave coincidem, considerar match
    const commonWords = codeWords.filter(w => outputWords.includes(w));
    if (commonWords.length >= 2 && codeWords.length >= 2) {
      return true;
    }

    return false;
  }

  /**
   * Limpa o buffer acumulado
   */
  clearBuffer() {
    this.accumulatedOutput = '';
  }
}

