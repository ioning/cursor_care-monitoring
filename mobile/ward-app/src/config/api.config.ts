/**
 * Конфигурация API для мобильного приложения
 * 
 * Порт API Gateway соответствует порту, указанному в api-gateway/.env (PORT=3000)
 * 
 * Для изменения порта отредактируйте значение API_PORT ниже
 * или установите переменную окружения REACT_NATIVE_API_PORT
 */

// Порт API Gateway (по умолчанию 3000, как в api-gateway/.env и api-gateway/src/main.ts)
// Можно переопределить через переменную окружения REACT_NATIVE_API_PORT
// 
// ВАЖНО: Убедитесь, что порт соответствует порту API Gateway на вашей машине
// Проверьте: api-gateway/.env (переменная PORT) или api-gateway/src/main.ts
export const API_PORT = (typeof process !== 'undefined' && process.env?.REACT_NATIVE_API_PORT) 
  ? parseInt(process.env.REACT_NATIVE_API_PORT, 10) 
  : 3000; // Порт по умолчанию (соответствует api-gateway/.env)

// Базовый путь API (обычно /api/v1)
export const API_PATH = '/api/v1';

// Production URL
export const PRODUCTION_API_URL = 'https://api.caremonitoring.com/api/v1';

