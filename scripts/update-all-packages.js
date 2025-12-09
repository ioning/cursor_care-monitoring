const fs = require('fs');
const path = require('path');

// Список всех микросервисов
const microservices = [
  'auth-service',
  'user-service',
  'device-service',
  'telemetry-service',
  'alert-service',
  'ai-prediction-service',
  'integration-service',
  'location-service',
  'billing-service',
  'analytics-service',
  'organization-service',
  'dispatcher-service',
];

// Список всех frontend приложений
const frontendApps = [
  'guardian-app',
  'admin-app',
  'dispatcher-app',
  'landing-app',
];

const rootDir = path.join(__dirname, '..');

// Обновить все микросервисы
console.log('Updating microservices...');
microservices.forEach(service => {
  const packagePath = path.join(rootDir, 'microservices', service, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    
    // Добавить shared зависимость если её нет
    if (!packageJson.dependencies['@care-monitoring/shared']) {
      packageJson.dependencies['@care-monitoring/shared'] = 'file:../../shared';
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`  ✓ Updated microservices/${service}/package.json`);
    } else {
      console.log(`  - microservices/${service}/package.json already has shared dependency`);
    }
  } else {
    console.log(`  ✗ microservices/${service}/package.json not found`);
  }
});

// Обновить api-gateway
console.log('\nUpdating api-gateway...');
const gatewayPath = path.join(rootDir, 'api-gateway', 'package.json');
if (fs.existsSync(gatewayPath)) {
  const packageJson = JSON.parse(fs.readFileSync(gatewayPath, 'utf8'));
  
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  
  if (!packageJson.dependencies['@care-monitoring/shared']) {
    packageJson.dependencies['@care-monitoring/shared'] = 'file:../shared';
    fs.writeFileSync(gatewayPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('  ✓ Updated api-gateway/package.json');
  } else {
    console.log('  - api-gateway/package.json already has shared dependency');
  }
}

// Обновить frontend приложения
console.log('\nUpdating frontend apps...');
frontendApps.forEach(app => {
  const packagePath = path.join(rootDir, 'frontend', 'apps', app, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    
    // Обновить realtime зависимость если она есть
    if (packageJson.dependencies['@care-monitoring/realtime']) {
      const currentValue = packageJson.dependencies['@care-monitoring/realtime'];
      if (currentValue !== 'file:../../packages/realtime') {
        packageJson.dependencies['@care-monitoring/realtime'] = 'file:../../packages/realtime';
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`  ✓ Updated frontend/apps/${app}/package.json`);
      } else {
        console.log(`  - frontend/apps/${app}/package.json already updated`);
      }
    } else {
      console.log(`  - frontend/apps/${app}/package.json doesn't use realtime`);
    }
  } else {
    console.log(`  ✗ frontend/apps/${app}/package.json not found`);
  }
});

console.log('\n✅ All packages updated!');
console.log('\nNext steps:');
console.log('1. Run "npm install" in shared directory first');
console.log('2. Run "npm install" in each service directory');
console.log('3. Update TypeScript paths in tsconfig.json files if needed');


const path = require('path');

// Список всех микросервисов
const microservices = [
  'auth-service',
  'user-service',
  'device-service',
  'telemetry-service',
  'alert-service',
  'ai-prediction-service',
  'integration-service',
  'location-service',
  'billing-service',
  'analytics-service',
  'organization-service',
  'dispatcher-service',
];

// Список всех frontend приложений
const frontendApps = [
  'guardian-app',
  'admin-app',
  'dispatcher-app',
  'landing-app',
];

const rootDir = path.join(__dirname, '..');

// Обновить все микросервисы
console.log('Updating microservices...');
microservices.forEach(service => {
  const packagePath = path.join(rootDir, 'microservices', service, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    
    // Добавить shared зависимость если её нет
    if (!packageJson.dependencies['@care-monitoring/shared']) {
      packageJson.dependencies['@care-monitoring/shared'] = 'file:../../shared';
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`  ✓ Updated microservices/${service}/package.json`);
    } else {
      console.log(`  - microservices/${service}/package.json already has shared dependency`);
    }
  } else {
    console.log(`  ✗ microservices/${service}/package.json not found`);
  }
});

// Обновить api-gateway
console.log('\nUpdating api-gateway...');
const gatewayPath = path.join(rootDir, 'api-gateway', 'package.json');
if (fs.existsSync(gatewayPath)) {
  const packageJson = JSON.parse(fs.readFileSync(gatewayPath, 'utf8'));
  
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  
  if (!packageJson.dependencies['@care-monitoring/shared']) {
    packageJson.dependencies['@care-monitoring/shared'] = 'file:../shared';
    fs.writeFileSync(gatewayPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('  ✓ Updated api-gateway/package.json');
  } else {
    console.log('  - api-gateway/package.json already has shared dependency');
  }
}

// Обновить frontend приложения
console.log('\nUpdating frontend apps...');
frontendApps.forEach(app => {
  const packagePath = path.join(rootDir, 'frontend', 'apps', app, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }
    
    // Обновить realtime зависимость если она есть
    if (packageJson.dependencies['@care-monitoring/realtime']) {
      const currentValue = packageJson.dependencies['@care-monitoring/realtime'];
      if (currentValue !== 'file:../../packages/realtime') {
        packageJson.dependencies['@care-monitoring/realtime'] = 'file:../../packages/realtime';
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`  ✓ Updated frontend/apps/${app}/package.json`);
      } else {
        console.log(`  - frontend/apps/${app}/package.json already updated`);
      }
    } else {
      console.log(`  - frontend/apps/${app}/package.json doesn't use realtime`);
    }
  } else {
    console.log(`  ✗ frontend/apps/${app}/package.json not found`);
  }
});

console.log('\n✅ All packages updated!');
console.log('\nNext steps:');
console.log('1. Run "npm install" in shared directory first');
console.log('2. Run "npm install" in each service directory');
console.log('3. Update TypeScript paths in tsconfig.json files if needed');







