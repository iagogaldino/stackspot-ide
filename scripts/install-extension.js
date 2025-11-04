const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');

/**
 * Script para instalar a extensão tag-validator no diretório de extensões do usuário
 */
function installExtension() {
  // Caminho da extensão no projeto
  const sourcePath = path.join(__dirname, '..', 'extensions', 'tag-validator-extension');
  
  // Caminho de destino (userData/extensions)
  const userDataPath = app ? app.getPath('userData') : path.join(process.env.APPDATA || process.env.HOME, 'MyIDE');
  const extensionsPath = path.join(userDataPath, 'extensions');
  const destPath = path.join(extensionsPath, 'tag-validator-extension');
  
  try {
    // Criar diretório de extensões se não existir
    if (!fs.existsSync(extensionsPath)) {
      fs.mkdirSync(extensionsPath, { recursive: true });
      console.log(`Criado diretório: ${extensionsPath}`);
    }
    
    // Copiar extensão
    if (fs.existsSync(sourcePath)) {
      // Remover destino se existir
      if (fs.existsSync(destPath)) {
        fs.removeSync(destPath);
      }
      
      // Copiar arquivos
      fs.copySync(sourcePath, destPath, {
        filter: (src) => {
          // Não copiar node_modules
          return !src.includes('node_modules');
        }
      });
      
      console.log(`✅ Extensão instalada em: ${destPath}`);
      return true;
    } else {
      console.error(`❌ Extensão não encontrada em: ${sourcePath}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao instalar extensão:', error);
    return false;
  }
}

// Se executado diretamente
if (require.main === module) {
  // Para executar sem Electron, precisamos do caminho manual
  const sourcePath = path.join(__dirname, '..', 'extensions', 'tag-validator-extension');
  const userDataPath = process.env.APPDATA || (process.env.HOME ? path.join(process.env.HOME, '.config') : '');
  const extensionsPath = path.join(userDataPath, 'MyIDE', 'extensions');
  const destPath = path.join(extensionsPath, 'tag-validator-extension');
  
  console.log('Instalando extensão...');
  console.log(`Origem: ${sourcePath}`);
  console.log(`Destino: ${destPath}`);
  
  try {
    if (!fs.existsSync(extensionsPath)) {
      fs.mkdirSync(extensionsPath, { recursive: true });
    }
    
    if (fs.existsSync(sourcePath)) {
      if (fs.existsSync(destPath)) {
        fs.removeSync(destPath);
      }
      fs.copySync(sourcePath, destPath, {
        filter: (src) => !src.includes('node_modules')
      });
      console.log('✅ Extensão instalada com sucesso!');
    } else {
      console.error('❌ Extensão não encontrada');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

module.exports = { installExtension };

