const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');

// Copiar preload.js para dist/renderer e dist/main
const src = path.join(__dirname, '../dist/main/main/preload.js');
const destDir = path.join(__dirname, '../dist/renderer');
const dest = path.join(destDir, 'preload.js');
const destMain = path.join(__dirname, '../dist/main/preload.js');

// Copiar main.js compilado para o local correto
const mainSrc = path.join(__dirname, '../dist/main/main/main.js');
const mainDest = path.join(__dirname, '../dist/main/main.js');

// Criar diretório se não existir
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(src)) {
  // Copiar para dist/renderer (para dev server)
  fs.copyFileSync(src, dest);
  console.log('✓ preload.js copiado para dist/renderer/');
  
  // Copiar para dist/main (para electron usar)
  if (!fs.existsSync(path.dirname(destMain))) {
    fs.mkdirSync(path.dirname(destMain), { recursive: true });
  }
  fs.copyFileSync(src, destMain);
  console.log('✓ preload.js copiado para dist/main/');
} else {
  console.error('✗ preload.js não encontrado em dist/main/main/');
  process.exit(1);
}

// Copiar main.js compilado para o local correto (onde o Electron espera)
if (fs.existsSync(mainSrc)) {
  fs.copyFileSync(mainSrc, mainDest);
  console.log('✓ main.js copiado para dist/main/');
  
  // Copiar também a pasta extensions que contém extension-loader
  const extensionsSrc = path.join(__dirname, '../dist/main/main/extensions');
  const extensionsDest = path.join(__dirname, '../dist/main/extensions');
  
  if (fs.existsSync(extensionsSrc)) {
      // Remover destino se existir
      if (fs.existsSync(extensionsDest)) {
        fsExtra.removeSync(extensionsDest);
      }
      // Copiar toda a pasta
      fsExtra.copySync(extensionsSrc, extensionsDest);
    console.log('✓ extensions copiado para dist/main/');
  }
} else {
  console.error('✗ main.js não encontrado em dist/main/main/');
  process.exit(1);
}

