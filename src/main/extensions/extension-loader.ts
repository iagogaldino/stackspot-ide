import * as path from 'path';
import * as fs from 'fs-extra';
import { ExtensionManifest } from '../../renderer/app/extensions/types/extension-manifest.interface';

/**
 * Carrega e valida extensões
 */
export class ExtensionLoader {
  /**
   * Obtém o caminho do diretório de extensões
   */
  static getExtensionsPath(): string {
    const app = require('electron').app;
    const userDataPath = app.getPath('userData');
    const extensionsPath = path.join(userDataPath, 'extensions');
    
    // Criar diretório se não existir
    if (!fs.existsSync(extensionsPath)) {
      fs.mkdirSync(extensionsPath, { recursive: true });
    }
    
    return extensionsPath;
  }

  /**
   * Lista todas as extensões instaladas
   */
  static async listExtensions(): Promise<string[]> {
    try {
      const extensionsPath = this.getExtensionsPath();
      const items = await fs.readdir(extensionsPath, { withFileTypes: true });
      
      return items
        .filter(item => item.isDirectory())
        .map(item => path.join(extensionsPath, item.name));
    } catch (error) {
      console.error('Erro ao listar extensões:', error);
      return [];
    }
  }

  /**
   * Carrega o manifest de uma extensão
   */
  static async loadManifest(extensionPath: string): Promise<ExtensionManifest | null> {
    try {
      // Tentar primeiro extension.json
      let manifestPath = path.join(extensionPath, 'extension.json');
      if (!(await fs.pathExists(manifestPath))) {
        // Tentar package.json como fallback
        manifestPath = path.join(extensionPath, 'package.json');
        if (!(await fs.pathExists(manifestPath))) {
          return null;
        }
      }

      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content) as ExtensionManifest;
      
      return manifest;
    } catch (error) {
      console.error(`Erro ao carregar manifest de ${extensionPath}:`, error);
      return null;
    }
  }

  /**
   * Valida o manifest de uma extensão
   */
  static validateManifest(manifest: ExtensionManifest): { valid: boolean; error?: string } {
    if (!manifest.name) {
      return { valid: false, error: 'Manifest deve ter um campo "name"' };
    }

    if (!manifest.version) {
      return { valid: false, error: 'Manifest deve ter um campo "version"' };
    }

    if (!manifest.main) {
      return { valid: false, error: 'Manifest deve ter um campo "main"' };
    }

    if (!manifest.engines || !manifest.engines.myide) {
      return { valid: false, error: 'Manifest deve ter engines.myide definido' };
    }

    // Validar versão do engine (simplificado)
    const requiredVersion = manifest.engines.myide;
    // Por enquanto, aceitar qualquer versão >= 1.0.0
    if (!requiredVersion.match(/^[\^~]?\d+\.\d+\.\d+/)) {
      return { valid: false, error: 'Versão do engine inválida' };
    }

    return { valid: true };
  }

  /**
   * Carrega o módulo JavaScript da extensão
   */
  static async loadExtensionModule(extensionPath: string, mainPath: string): Promise<any> {
    try {
      const fullPath = path.resolve(extensionPath, mainPath);
      
      // Verificar se o arquivo existe
      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`Arquivo principal não encontrado: ${fullPath}`);
      }

      // Carregar o módulo usando require
      // Nota: Em produção, isso pode precisar de sandboxing
      delete require.cache[fullPath];
      const module = require(fullPath);
      
      return module;
    } catch (error: any) {
      console.error(`Erro ao carregar módulo da extensão ${extensionPath}:`, error);
      throw error;
    }
  }

  /**
   * Obtém informações de uma extensão
   */
  static async getExtensionInfo(extensionPath: string): Promise<{
    path: string;
    manifest: ExtensionManifest | null;
    valid: boolean;
    error?: string;
  }> {
    const manifest = await this.loadManifest(extensionPath);
    
    if (!manifest) {
      return {
        path: extensionPath,
        manifest: null,
        valid: false,
        error: 'Manifest não encontrado'
      };
    }

    const validation = this.validateManifest(manifest);
    
    return {
      path: extensionPath,
      manifest,
      valid: validation.valid,
      error: validation.error
    };
  }
}

