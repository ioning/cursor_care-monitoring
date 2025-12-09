const { execSync } = require('child_process');
const path = require('path');

const tsNodePath = path.join(__dirname, '../node_modules/.bin/ts-node');
const seedScript = path.join(__dirname, 'seed.ts');

try {
  execSync(`${tsNodePath} ${seedScript}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exit(1);
}

