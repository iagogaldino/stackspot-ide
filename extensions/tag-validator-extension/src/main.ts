/**
 * Extensão: Validador de Tags HTML/XML
 * Identifica e marca tags não fechadas no editor
 */

interface ExtensionContext {
  extensionId: string;
  extensionPath: string;
  api: ExtensionAPI;
  subscriptions: Array<{ dispose: () => void }>;
}

interface ExtensionAPI {
  commands: CommandsAPI;
  workspace: WorkspaceAPI;
  editor: EditorAPI;
  events: EventsAPI;
  config: ConfigAPI;
}

interface CommandsAPI {
  registerCommand(command: string, callback: (...args: any[]) => any): { dispose: () => void };
}

interface WorkspaceAPI {
  showMessage(message: string, type?: 'info' | 'warning' | 'error'): Promise<void>;
}

interface EditorAPI {
  getContent(): Promise<string>;
  addMarker(options: MarkerOptions): { dispose: () => void };
}

interface EventsAPI {
  onEditorContentChanged(callback: (content: string) => void): { dispose: () => void };
  onFileChanged(callback: (event: FileChangeEvent) => void): { dispose: () => void };
}

interface ConfigAPI {
  getExtensionConfig<T>(key: string, defaultValue?: T): T;
}

interface MarkerOptions {
  line: number;
  column: number;
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

interface FileChangeEvent {
  path: string;
  type: 'created' | 'modified' | 'deleted';
}

interface TagMatch {
  tag: string;
  line: number;
  column: number;
  isClosing: boolean;
  isSelfClosing: boolean;
}

interface ValidationResult {
  unclosedTags: Array<{
    tag: string;
    line: number;
    column: number;
    message: string;
  }>;
  orphanClosingTags: Array<{
    tag: string;
    line: number;
    column: number;
    message: string;
  }>;
}

/**
 * Ativação da extensão
 */
export async function activate(context: ExtensionContext) {
  console.log('Validador de Tags ativado!');

  let currentMarkers: Array<{ dispose: () => void }> = [];
  let currentFilePath: string | null = null;

  // Obter caminho do arquivo atual do workspace
  context.api.workspace.getProjectPath().then(async (projectPath) => {
    // Tentar obter arquivo atual através de eventos
    // Por enquanto, vamos validar quando o conteúdo mudar
  });

  /**
   * Limpar todos os marcadores
   */
  function clearMarkers() {
    currentMarkers.forEach(marker => marker.dispose());
    currentMarkers = [];
  }

  /**
   * Verificar se o arquivo deve ser validado
   */
  function shouldValidateFile(filePath: string | null): boolean {
    if (!filePath) return false;
    
    const fileTypes = context.api.config.getExtensionConfig<string[]>(
      'tagValidator.fileTypes',
      ['.html', '.xml', '.tsx', '.jsx']
    );

    const extension = filePath.substring(filePath.lastIndexOf('.'));
    return fileTypes.includes(extension);
  }

  /**
   * Extrair tags do conteúdo
   */
  function extractTags(content: string): TagMatch[] {
    const tags: TagMatch[] = [];
    const lines = content.split('\n');

    // Regex para encontrar tags
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\s*\/?>/g;
    
    lines.forEach((line, lineIndex) => {
      let match;
      while ((match = tagRegex.exec(line)) !== null) {
        const fullMatch = match[0];
        const tagName = match[1];
        const column = match.index;
        
        const isClosing = fullMatch.startsWith('</');
        const isSelfClosing = fullMatch.endsWith('/>') || 
                             ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagName.toLowerCase());

        tags.push({
          tag: tagName.toLowerCase(),
          line: lineIndex,
          column: column,
          isClosing,
          isSelfClosing
        });
      }
    });

    return tags;
  }

  /**
   * Validar tags e retornar problemas encontrados
   */
  function validateTags(content: string): ValidationResult {
    const tags = extractTags(content);
    const unclosedTags: ValidationResult['unclosedTags'] = [];
    const orphanClosingTags: ValidationResult['orphanClosingTags'] = [];
    
    // Stack para rastrear tags abertas
    const openTagsStack: Array<{ tag: string; line: number; column: number }> = [];

    tags.forEach(tagMatch => {
      if (tagMatch.isSelfClosing) {
        // Tags auto-fechadas são ignoradas
        return;
      }

      if (tagMatch.isClosing) {
        // Tag de fechamento
        const lastOpen = openTagsStack[openTagsStack.length - 1];
        
        if (!lastOpen) {
          // Tag de fechamento sem abertura correspondente
          orphanClosingTags.push({
            tag: tagMatch.tag,
            line: tagMatch.line,
            column: tagMatch.column,
            message: `Tag de fechamento </${tagMatch.tag}> sem tag de abertura correspondente`
          });
        } else if (lastOpen.tag === tagMatch.tag) {
          // Tag corresponde, remover da stack
          openTagsStack.pop();
        } else {
          // Tag não corresponde - pode ser aninhamento incorreto
          // Vamos procurar na stack se há uma correspondência
          const foundIndex = openTagsStack.findIndex(t => t.tag === tagMatch.tag);
          
          if (foundIndex !== -1) {
            // Encontrou correspondência, mas há tags não fechadas antes
            const unclosedBefore = openTagsStack.splice(foundIndex + 1);
            unclosedBefore.forEach(unclosed => {
              unclosedTags.push({
                tag: unclosed.tag,
                line: unclosed.line,
                column: unclosed.column,
                message: `Tag <${unclosed.tag}> não foi fechada antes de </${tagMatch.tag}>`
              });
            });
            openTagsStack.pop(); // Remove a tag correspondente
          } else {
            // Tag de fechamento não corresponde
            orphanClosingTags.push({
              tag: tagMatch.tag,
              line: tagMatch.line,
              column: tagMatch.column,
              message: `Tag de fechamento </${tagMatch.tag}> não corresponde à tag aberta <${lastOpen.tag}>`
            });
          }
        }
      } else {
        // Tag de abertura
        openTagsStack.push({
          tag: tagMatch.tag,
          line: tagMatch.line,
          column: tagMatch.column
        });
      }
    });

    // Qualquer tag restante na stack não foi fechada
    openTagsStack.forEach(unclosed => {
      unclosedTags.push({
        tag: unclosed.tag,
        line: unclosed.line,
        column: unclosed.column,
        message: `Tag <${unclosed.tag}> não foi fechada`
      });
    });

    return { unclosedTags, orphanClosingTags };
  }

  /**
   * Adicionar marcadores no editor
   */
  async function addMarkers(validationResult: ValidationResult) {
    clearMarkers();

    // Adicionar marcadores para tags não fechadas
    validationResult.unclosedTags.forEach(problem => {
      // Marcar toda a tag, não apenas o início
      const marker = context.api.editor.addMarker({
        line: problem.line + 1, // Monaco usa 1-based indexing
        column: problem.column + 1, // Início da tag
        message: problem.message,
        severity: 'error'
      });
      currentMarkers.push(marker);
    });

    // Adicionar marcadores para tags de fechamento órfãs
    validationResult.orphanClosingTags.forEach(problem => {
      const marker = context.api.editor.addMarker({
        line: problem.line + 1,
        column: problem.column + 1,
        message: problem.message,
        severity: 'error' // Mudar para error em vez de warning para destacar mais
      });
      currentMarkers.push(marker);
    });

    // Mostrar mensagem de resumo
    const totalProblems = validationResult.unclosedTags.length + validationResult.orphanClosingTags.length;
    if (totalProblems > 0) {
      await context.api.workspace.showMessage(
        `Encontrados ${totalProblems} problema(s) de tags: ${validationResult.unclosedTags.length} não fechadas, ${validationResult.orphanClosingTags.length} órfãs`,
        'warning'
      );
    } else {
      await context.api.workspace.showMessage('Todas as tags estão válidas!', 'info');
    }
  }

  /**
   * Executar validação
   */
  async function runValidation() {
    try {
      const content = await context.api.editor.getContent();
      
      // Limpar marcadores se não houver conteúdo
      if (!content || content.trim().length === 0) {
        clearMarkers();
        return;
      }

      // Verificar se parece ser HTML (contém tags)
      const hasTags = /<[a-zA-Z][^>]*>/.test(content);
      if (!hasTags) {
        clearMarkers();
        return;
      }

      const validationResult = validateTags(content);
      await addMarkers(validationResult);
      
      // Log para debug
      if (validationResult.unclosedTags.length > 0 || validationResult.orphanClosingTags.length > 0) {
        console.log('Validação de tags:', {
          unclosed: validationResult.unclosedTags.length,
          orphan: validationResult.orphanClosingTags.length
        });
      }
    } catch (error: any) {
      await context.api.workspace.showMessage(
        `Erro ao validar tags: ${error.message}`,
        'error'
      );
    }
  }

  // Registrar comando de validação
  const validateCommand = context.api.commands.registerCommand(
    'tagValidator.validate',
    runValidation
  );
  context.subscriptions.push(validateCommand);

  // Registrar comando para limpar marcadores
  const clearCommand = context.api.commands.registerCommand(
    'tagValidator.clearMarkers',
    () => {
      clearMarkers();
    }
  );
  context.subscriptions.push(clearCommand);

  // Validação automática ao mudar conteúdo do editor
  // TEMPORARIAMENTE DESABILITADA para evitar travamento do editor
  const autoValidate = context.api.config.getExtensionConfig<boolean>(
    'tagValidator.autoValidate',
    false // Desabilitado por padrão por enquanto
  );

  if (autoValidate) {
    let validationTimeout: any = null;
    let isValidating = false; // Flag para evitar validações simultâneas

    const onContentChanged = context.api.events.onEditorContentChanged(
      async (content: string) => {
        // Debounce: aguardar 1000ms após última mudança (aumentado para evitar validação durante digitação)
        if (validationTimeout) {
          clearTimeout(validationTimeout);
        }

        validationTimeout = setTimeout(async () => {
          // Evitar validação simultânea
          if (isValidating) {
            return;
          }
          
          isValidating = true;
          try {
            // Validar se houver conteúdo HTML
            if (!content || content.trim().length === 0) {
              clearMarkers();
              return;
            }
            
            const hasTags = /<[a-zA-Z][^>]*>/.test(content);
            if (hasTags) {
              const validationResult = validateTags(content);
              await addMarkers(validationResult);
            } else {
              clearMarkers();
            }
          } catch (error: any) {
            console.error('Erro na validação automática:', error);
          } finally {
            isValidating = false;
          }
        }, 1000); // Aumentado para 1 segundo
      }
    );

    context.subscriptions.push(onContentChanged);
  }

  // Validar ao salvar arquivo
  const validateOnSave = context.api.config.getExtensionConfig<boolean>(
    'tagValidator.validateOnSave',
    true
  );

  if (validateOnSave) {
    const onFileChanged = context.api.events.onFileChanged(
      async (event: FileChangeEvent) => {
        if (event.type === 'modified' && event.path === currentFilePath) {
          await runValidation();
        }
      }
    );

    context.subscriptions.push(onFileChanged);
  }

  // Rastrear mudanças no arquivo atual
  const onProjectChanged = context.api.events.onProjectChanged(
    (projectPath: string | null) => {
      // Quando o projeto muda, resetar arquivo atual
      currentFilePath = null;
    }
  );
  context.subscriptions.push(onProjectChanged);

  // Validar imediatamente ao ativar - DESABILITADO TEMPORARIAMENTE
  // setTimeout(async () => {
  //   const content = await context.api.editor.getContent();
  //   if (content) {
  //     // Tentar validar se houver conteúdo
  //     // Por enquanto, vamos validar qualquer conteúdo HTML
  //     const validationResult = validateTags(content);
  //     await addMarkers(validationResult);
  //   }
  // }, 1500);
}

/**
 * Desativação da extensão
 */
export async function deactivate() {
  console.log('Validador de Tags desativado!');
}

