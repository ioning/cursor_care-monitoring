const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'dist', 'api-gateway', 'src', 'main.js');
const dst = path.join(__dirname, '..', 'dist', 'main.js');

// Создаем файл сразу, если исходный файл существует
if (fs.existsSync(src)) {
  fs.writeFileSync(dst, "require('./api-gateway/src/main.js');\n", 'utf8');
  console.log('✓ Created dist/main.js wrapper');
}

// Следим за изменениями исходного файла
let lastCheck = Date.now();
const checkInterval = 1000; // Проверяем каждую секунду

const checkAndCreate = () => {
  if (fs.existsSync(src)) {
    const srcStat = fs.statSync(src);
    const srcMtime = srcStat.mtime.getTime();
    
    // Если исходный файл был изменен или файл-обертка не существует
    if (srcMtime > lastCheck || !fs.existsSync(dst)) {
      fs.writeFileSync(dst, "require('./api-gateway/src/main.js');\n", 'utf8');
      lastCheck = Date.now();
    }
  }
};

// Проверяем периодически
const interval = setInterval(checkAndCreate, checkInterval);

// Останавливаем при выходе
process.on('SIGINT', () => {
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(interval);
  process.exit(0);
});

