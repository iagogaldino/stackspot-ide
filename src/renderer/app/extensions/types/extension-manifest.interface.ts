/**
 * Interface para o manifest de uma extensão
 */
export interface ExtensionManifest {
  /** Nome único da extensão (ID) */
  name: string;
  
  /** Nome de exibição */
  displayName: string;
  
  /** Versão da extensão */
  version: string;
  
  /** Descrição da extensão */
  description?: string;
  
  /** Editor/publisher da extensão */
  publisher?: string;
  
  /** Requisitos de versão da IDE */
  engines: {
    myide: string;
  };
  
  /** Ponto de entrada principal */
  main: string;
  
  /** Eventos que ativam a extensão */
  activationEvents?: string[];
  
  /** Contribuições da extensão */
  contributes?: ExtensionContributes;
  
  /** Ícone da extensão */
  icon?: string;
}

/**
 * Contribuições que uma extensão pode fazer
 */
export interface ExtensionContributes {
  /** Comandos registrados pela extensão */
  commands?: ExtensionCommand[];
  
  /** Atalhos de teclado */
  keybindings?: ExtensionKeybinding[];
  
  /** Menus onde os comandos aparecem */
  menus?: ExtensionMenus;
  
  /** Configurações da extensão */
  configuration?: ExtensionConfiguration[];
  
  /** Provedores de IA (se aplicável) */
  aiProviders?: ExtensionAIProvider[];
}

/**
 * Comando registrado por uma extensão
 */
export interface ExtensionCommand {
  /** ID único do comando */
  command: string;
  
  /** Título do comando */
  title: string;
  
  /** Categoria do comando */
  category?: string;
  
  /** Ícone do comando */
  icon?: string;
}

/**
 * Atalho de teclado
 */
export interface ExtensionKeybinding {
  /** Comando a ser executado */
  command: string;
  
  /** Tecla no Windows/Linux */
  key: string;
  
  /** Tecla no Mac */
  mac?: string;
  
  /** Quando o atalho está ativo */
  when?: string;
}

/**
 * Menus onde comandos aparecem
 */
export interface ExtensionMenus {
  /** Menu de contexto do editor */
  'editor/context'?: ExtensionMenuItem[];
  
  /** Menu de contexto da árvore de arquivos */
  'explorer/context'?: ExtensionMenuItem[];
  
  /** Menu principal */
  'commandPalette'?: ExtensionMenuItem[];
}

/**
 * Item de menu
 */
export interface ExtensionMenuItem {
  /** Comando a executar */
  command: string;
  
  /** Quando o item aparece */
  when?: string;
  
  /** Grupo do menu */
  group?: string;
}

/**
 * Configuração da extensão
 */
export interface ExtensionConfiguration {
  /** ID da configuração */
  id: string;
  
  /** Título da configuração */
  title: string;
  
  /** Tipo da configuração */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  
  /** Valor padrão */
  default?: any;
  
  /** Descrição */
  description?: string;
}

/**
 * Provedor de IA
 */
export interface ExtensionAIProvider {
  /** ID do provedor */
  id: string;
  
  /** Nome do provedor */
  name: string;
  
  /** Descrição */
  description?: string;
}

