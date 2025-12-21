const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'dist', 'microservices', 'telemetry-service', 'src', 'main.js');
const dst = path.join(__dirname, '..', 'dist', 'main.js');

if (fs.existsSync(src)) {
  fs.writeFileSync(dst, 'require(\'./microservices/telemetry-service/src/main.js\');\n', 'utf8');
  console.log('✓ Created dist/main.js wrapper');
} else {
  console.warn('Source file for main.js wrapper not found:', src);
}

