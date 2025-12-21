const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'dist', 'api-gateway', 'src', 'main.js');
const dst = path.join(__dirname, '..', 'dist', 'main.js');

// Проверяем, существует ли исходный файл
if (fs.existsSync(src)) {
  // Создаем обертку
  fs.writeFileSync(dst, "require('./api-gateway/src/main.js');\n", 'utf8');
  console.log('✓ Created dist/main.js wrapper');
} else {
  console.warn('⚠ Source file not found:', src);
  console.warn('⚠ Run "npm run build" first');
}

