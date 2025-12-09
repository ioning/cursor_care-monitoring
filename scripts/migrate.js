const { execSync } = require('child_process');
const path = require('path');

const command = process.argv[2] || 'up';
const serviceName = process.argv[3];

const tsNodePath = path.join(__dirname, '../node_modules/.bin/ts-node');
const migrateScript = path.join(__dirname, 'migrate.ts');

try {
  execSync(`${tsNodePath} ${migrateScript} ${command} ${serviceName || ''}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}

