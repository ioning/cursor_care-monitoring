const fs = require('fs');
const path = require('path');

// Найти все package.json файлы
function findPackageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Пропустить node_modules и другие служебные папки
      if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(file)) {
        findPackageFiles(filePath, fileList);
      }
    } else if (file === 'package.json' && dir !== '.') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Вычислить относительный путь от одного пакета к другому
function getRelativePath(from, to) {
  const relative = path.relative(path.dirname(from), to);
  return relative.replace(/\\/g, '/'); // Нормализовать для Windows
}

console.log('Starting migration from workspaces to file: protocol...\n');

// 1. Обновить корневой package.json
console.log('1. Updating root package.json...');
const rootPackagePath = path.join(__dirname, '..', 'package.json');
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

// Удалить workspaces
if (rootPackage.workspaces) {
  delete rootPackage.workspaces;
  console.log('   ✓ Removed workspaces from root package.json');
}

fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2) + '\n');
console.log('   ✓ Root package.json updated\n');

// 2. Найти все package.json файлы
const packageFiles = findPackageFiles(path.join(__dirname, '..'));

// 3. Обновить shared/package.json
console.log('2. Updating shared/package.json...');
const sharedPackagePath = path.join(__dirname, '..', 'shared', 'package.json');
if (fs.existsSync(sharedPackagePath)) {
  const sharedPackage = JSON.parse(fs.readFileSync(sharedPackagePath, 'utf8'));
  
  // Добавить exports если их нет
  if (!sharedPackage.exports) {
    sharedPackage.exports = {
      '.': './index.ts',
      './libs/*': './libs/*',
      './guards/*': './guards/*',
      './middleware/*': './middleware/*',
      './types/*': './types/*',
    };
  }
  
  if (!sharedPackage.main) {
    sharedPackage.main = 'index.ts';
  }
  
  if (!sharedPackage.types) {
    sharedPackage.types = 'index.ts';
  }
  
  fs.writeFileSync(sharedPackagePath, JSON.stringify(sharedPackage, null, 2) + '\n');
  console.log('   ✓ Shared package.json updated\n');
}

// 4. Создать shared/index.ts если его нет
console.log('3. Creating shared/index.ts...');
const sharedIndexPath = path.join(__dirname, '..', 'shared', 'index.ts');
if (!fs.existsSync(sharedIndexPath)) {
  const indexContent = `// Re-export all shared modules
export * from './libs/database';
export * from './libs/logger';
export * from './libs/redis';
export * from './libs/rabbitmq';
export * from './libs/retry';
export * from './libs/circuit-breaker';
export * from './libs/health-check';
export * from './libs/metrics';
export * from './guards/jwt-auth.guard';
export * from './guards/tenant.guard';
export * from './middleware/tenant.middleware';
export * from './types/common.types';
export * from './types/event.types';
`;
  fs.writeFileSync(sharedIndexPath, indexContent);
  console.log('   ✓ Created shared/index.ts\n');
} else {
  console.log('   ✓ shared/index.ts already exists\n');
}

// 5. Обновить все микросервисы и api-gateway
console.log('4. Updating microservices and api-gateway...');
let updatedCount = 0;

packageFiles.forEach(filePath => {
  const dir = path.dirname(filePath);
  const relativeDir = path.relative(path.join(__dirname, '..'), dir);
  
  // Проверить, является ли это микросервисом или api-gateway
  if (relativeDir.startsWith('microservices/') || relativeDir === 'api-gateway') {
    const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Добавить shared зависимость
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    
    const sharedPath = getRelativePath(filePath, path.join(__dirname, '..', 'shared'));
    packageJson.dependencies['@care-monitoring/shared'] = `file:${sharedPath}`;
    
    fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`   ✓ Updated ${relativeDir}/package.json`);
    updatedCount++;
  }
});

console.log(`\n   ✓ Updated ${updatedCount} microservices/api-gateway\n`);

// 6. Обновить frontend приложения
console.log('5. Updating frontend apps...');
updatedCount = 0;

packageFiles.forEach(filePath => {
  const dir = path.dirname(filePath);
  const relativeDir = path.relative(path.join(__dirname, '..'), dir);
  
  // Проверить, является ли это frontend приложением
  if (relativeDir.startsWith('frontend/apps/')) {
    const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Добавить realtime зависимость если её нет
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    
    // Проверить, используется ли realtime
    if (packageJson.dependencies['@care-monitoring/realtime']) {
      const realtimePath = getRelativePath(
        filePath,
        path.join(__dirname, '..', 'frontend', 'packages', 'realtime')
      );
      packageJson.dependencies['@care-monitoring/realtime'] = `file:${realtimePath}`;
      
      fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`   ✓ Updated ${relativeDir}/package.json`);
      updatedCount++;
    }
  }
});

console.log(`\n   ✓ Updated ${updatedCount} frontend apps\n`);

// 7. Обновить realtime package.json
console.log('6. Updating realtime package.json...');
const realtimePackagePath = path.join(__dirname, '..', 'frontend', 'packages', 'realtime', 'package.json');
if (fs.existsSync(realtimePackagePath)) {
  const realtimePackage = JSON.parse(fs.readFileSync(realtimePackagePath, 'utf8'));
  
  if (!realtimePackage.exports) {
    realtimePackage.exports = {
      '.': './src/index.ts',
      './vue': './src/vue.ts',
    };
  }
  
  fs.writeFileSync(realtimePackagePath, JSON.stringify(realtimePackage, null, 2) + '\n');
  console.log('   ✓ Realtime package.json updated\n');
}

console.log('Migration complete! ✅\n');
console.log('Next steps:');
console.log('1. Run "npm install" in each service directory');
console.log('2. Update TypeScript paths in tsconfig.json files');
console.log('3. Update imports to use @care-monitoring/shared instead of relative paths');


const path = require('path');

// Найти все package.json файлы
function findPackageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Пропустить node_modules и другие служебные папки
      if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(file)) {
        findPackageFiles(filePath, fileList);
      }
    } else if (file === 'package.json' && dir !== '.') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Вычислить относительный путь от одного пакета к другому
function getRelativePath(from, to) {
  const relative = path.relative(path.dirname(from), to);
  return relative.replace(/\\/g, '/'); // Нормализовать для Windows
}

console.log('Starting migration from workspaces to file: protocol...\n');

// 1. Обновить корневой package.json
console.log('1. Updating root package.json...');
const rootPackagePath = path.join(__dirname, '..', 'package.json');
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

// Удалить workspaces
if (rootPackage.workspaces) {
  delete rootPackage.workspaces;
  console.log('   ✓ Removed workspaces from root package.json');
}

fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2) + '\n');
console.log('   ✓ Root package.json updated\n');

// 2. Найти все package.json файлы
const packageFiles = findPackageFiles(path.join(__dirname, '..'));

// 3. Обновить shared/package.json
console.log('2. Updating shared/package.json...');
const sharedPackagePath = path.join(__dirname, '..', 'shared', 'package.json');
if (fs.existsSync(sharedPackagePath)) {
  const sharedPackage = JSON.parse(fs.readFileSync(sharedPackagePath, 'utf8'));
  
  // Добавить exports если их нет
  if (!sharedPackage.exports) {
    sharedPackage.exports = {
      '.': './index.ts',
      './libs/*': './libs/*',
      './guards/*': './guards/*',
      './middleware/*': './middleware/*',
      './types/*': './types/*',
    };
  }
  
  if (!sharedPackage.main) {
    sharedPackage.main = 'index.ts';
  }
  
  if (!sharedPackage.types) {
    sharedPackage.types = 'index.ts';
  }
  
  fs.writeFileSync(sharedPackagePath, JSON.stringify(sharedPackage, null, 2) + '\n');
  console.log('   ✓ Shared package.json updated\n');
}

// 4. Создать shared/index.ts если его нет
console.log('3. Creating shared/index.ts...');
const sharedIndexPath = path.join(__dirname, '..', 'shared', 'index.ts');
if (!fs.existsSync(sharedIndexPath)) {
  const indexContent = `// Re-export all shared modules
export * from './libs/database';
export * from './libs/logger';
export * from './libs/redis';
export * from './libs/rabbitmq';
export * from './libs/retry';
export * from './libs/circuit-breaker';
export * from './libs/health-check';
export * from './libs/metrics';
export * from './guards/jwt-auth.guard';
export * from './guards/tenant.guard';
export * from './middleware/tenant.middleware';
export * from './types/common.types';
export * from './types/event.types';
`;
  fs.writeFileSync(sharedIndexPath, indexContent);
  console.log('   ✓ Created shared/index.ts\n');
} else {
  console.log('   ✓ shared/index.ts already exists\n');
}

// 5. Обновить все микросервисы и api-gateway
console.log('4. Updating microservices and api-gateway...');
let updatedCount = 0;

packageFiles.forEach(filePath => {
  const dir = path.dirname(filePath);
  const relativeDir = path.relative(path.join(__dirname, '..'), dir);
  
  // Проверить, является ли это микросервисом или api-gateway
  if (relativeDir.startsWith('microservices/') || relativeDir === 'api-gateway') {
    const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Добавить shared зависимость
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    
    const sharedPath = getRelativePath(filePath, path.join(__dirname, '..', 'shared'));
    packageJson.dependencies['@care-monitoring/shared'] = `file:${sharedPath}`;
    
    fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`   ✓ Updated ${relativeDir}/package.json`);
    updatedCount++;
  }
});

console.log(`\n   ✓ Updated ${updatedCount} microservices/api-gateway\n`);

// 6. Обновить frontend приложения
console.log('5. Updating frontend apps...');
updatedCount = 0;

packageFiles.forEach(filePath => {
  const dir = path.dirname(filePath);
  const relativeDir = path.relative(path.join(__dirname, '..'), dir);
  
  // Проверить, является ли это frontend приложением
  if (relativeDir.startsWith('frontend/apps/')) {
    const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Добавить realtime зависимость если её нет
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    
    // Проверить, используется ли realtime
    if (packageJson.dependencies['@care-monitoring/realtime']) {
      const realtimePath = getRelativePath(
        filePath,
        path.join(__dirname, '..', 'frontend', 'packages', 'realtime')
      );
      packageJson.dependencies['@care-monitoring/realtime'] = `file:${realtimePath}`;
      
      fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`   ✓ Updated ${relativeDir}/package.json`);
      updatedCount++;
    }
  }
});

console.log(`\n   ✓ Updated ${updatedCount} frontend apps\n`);

// 7. Обновить realtime package.json
console.log('6. Updating realtime package.json...');
const realtimePackagePath = path.join(__dirname, '..', 'frontend', 'packages', 'realtime', 'package.json');
if (fs.existsSync(realtimePackagePath)) {
  const realtimePackage = JSON.parse(fs.readFileSync(realtimePackagePath, 'utf8'));
  
  if (!realtimePackage.exports) {
    realtimePackage.exports = {
      '.': './src/index.ts',
      './vue': './src/vue.ts',
    };
  }
  
  fs.writeFileSync(realtimePackagePath, JSON.stringify(realtimePackage, null, 2) + '\n');
  console.log('   ✓ Realtime package.json updated\n');
}

console.log('Migration complete! ✅\n');
console.log('Next steps:');
console.log('1. Run "npm install" in each service directory');
console.log('2. Update TypeScript paths in tsconfig.json files');
console.log('3. Update imports to use @care-monitoring/shared instead of relative paths');







