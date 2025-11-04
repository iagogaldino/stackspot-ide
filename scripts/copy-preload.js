const fs = require('fs');
const path = require('path');

// Copiar preload.js para dist/renderer
const src = path.join(__dirname, '../dist/main/preload.js');
const destDir = path.join(__dirname, '../dist/renderer');
const dest = path.join(destDir, 'preload.js');

// Criar diretório se não existir
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('✓ preload.js copiado para dist/renderer/');
} else {
  console.error('✗ preload.js não encontrado em dist/main/');
  process.exit(1);
}

