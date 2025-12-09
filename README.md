# Care Monitoring System (MVP)

Это репозиторий MVP системы мониторинга и предиктивной аналитики здоровья.

**Версия:** 0.1.0  
**Готовность:** 95%  
**Статус:** Готов к staging развертыванию (критические замечания устранены)

## 🚀 Быстрый старт

```bash
# 1. Клонирование
git clone <repository-url>
cd care-monitoring

# 2. Установка зависимостей
# Используйте скрипт для автоматической установки всех пакетов
# Linux/macOS:
chmod +x scripts/install-all.sh && ./scripts/install-all.sh
# Windows (PowerShell):
# .\scripts\install-all.ps1

# Или установите вручную (сначала shared, затем каждый сервис):
cd shared && npm install && cd ..
cd api-gateway && npm install && cd ..
# и т.д. для каждого сервиса

# 3. Запуск инфраструктуры
npm run dev:infra

# 4. Применение миграций
npm run db:migrate

# 5. Запуск всех сервисов
npm run dev:all
```

> ⚠️ Шаблоны переменных окружения находятся в файлах `env.example` внутри каждого сервиса и фронтенд-приложения. Репозиторий блокирует коммиты файлов с именем `.env*`, поэтому после клонирования скопируйте соответствующий `env.example` в `.env` (или `.env.local`) и задайте собственные значения.

**Подробная инструкция:** [DEPLOYMENT.md](DEPLOYMENT.md)

## 📚 Документация

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Полное руководство по развертыванию ⭐
- **[QUICKSTART.md](QUICKSTART.md)** - Быстрый старт
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Руководство по разработке
- **[CI_CD_GUIDE.md](CI_CD_GUIDE.md)** - Руководство по CI/CD
- **[MONITORING_GUIDE.md](MONITORING_GUIDE.md)** - Руководство по мониторингу
- **[MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md)** - Руководство по миграциям
- **[PROJECT_REPORT.md](PROJECT_REPORT.md)** - Полный отчет о проекте
- **[STATUS.md](STATUS.md)** - Текущий статус проекта
- **[SUMMARY.md](SUMMARY.md)** - Краткая сводка
- **[docs/FINAL_AUDIT_AND_RECOMMENDATIONS.md](docs/FINAL_AUDIT_AND_RECOMMENDATIONS.md)** - Финальная проверка и рекомендации ⭐ НОВОЕ
- **[docs/QUICK_FIXES_CHECKLIST.md](docs/QUICK_FIXES_CHECKLIST.md)** - Быстрый чеклист критических исправлений ⭐ НОВОЕ
- **[docs/security/user-data-hardening.md](docs/security/user-data-hardening.md)** - Дополнительные меры защиты данных ⭐ НОВОЕ

### Multi-Tenancy (B2B)

- **[Multi-Tenancy Architecture](docs/architecture/multi-tenancy.md)** - Архитектура изолированных аккаунтов
- **[Multi-Tenancy Implementation](docs/implementation/multi-tenancy-implementation.md)** - Полная реализация
- **[Multi-Tenancy Setup](docs/quickstart/multi-tenancy-setup.md)** - Быстрый старт для B2B

## Архитектура и сценарии

- Сценарии AI: `vision_scenAI.md`
- Диаграммы взаимодействия: `docs/diagrams/component-interactions.md`
- Структура проекта: `vision_structure.md`
- Промпт генерации: `docs/prompt.md`

## Документация

Полная документация находится в директории `docs/`:

- **[Документация для разработчиков](docs/README.md)** - Централизованная документация
- **[API примеры](docs/api/examples.md)** - Примеры использования API
- **[События RabbitMQ](docs/events/rabbitmq-events.md)** - Спецификация всех событий
- **[Webhook'и и интеграции](docs/integrations/webhooks.md)** - Внешние интеграции
- **[Маршрутная карта интеграций](docs/integrations/integration-roadmap.md)** - План интеграции со внешними сервисами
- **[Переменные окружения](docs/configuration/environment-variables.md)** - Конфигурация
- **[Руководство по развертыванию](docs/deployment/deployment-guide.md)** - Развертывание системы
- **[Тестовые данные](docs/testing/test-data.md)** - Seed-данные и моки
- **[Процесс разработки](docs/development/development-workflow.md)** - Workflow команды

## Прогресс реализации

### ✅ Реализовано

- [x] Инфраструктура (docker-compose) — Postgres, Redis, RabbitMQ
- [x] Shared libs — базовые библиотеки (db/logger/redis/rabbitmq)
- [x] API Gateway — проксирование, health, auth proxy
- [x] Auth Service — регистрация, логин, JWT, refresh tokens
- [x] User Service — CRUD пользователей, подопечные
- [x] Device Service — регистрация устройств, API ключи
- [x] Telemetry Service — прием данных, события, история
- [x] AI Prediction Service — обработка событий, простые модели
- [x] Alert Service — создание алертов, управление статусами
- [x] Integration Service — Email, SMS, Push, Telegram уведомления
- [x] Dispatcher Service — диспетчеризация экстренных вызовов
- [x] Location Service — геолокация, geofencing
- [x] Billing Service — подписки, платежи, счета
- [x] Analytics Service — отчеты и статистика
- [x] Organization Service — multi-tenancy, B2B функциональность
- [x] Frontend (guardian-app, dispatcher-app, admin-app, landing-app) — Vue 3, TypeScript, Pinia
- [x] Mobile App — React Native для iOS и Android
- [x] Dockerfile для всех микросервисов
- [x] env.example файлы с шаблонами переменных окружения
- [x] Безопасность: удалены hardcoded секреты, добавлен Helmet.js

### ⚠️ В разработке

- [x] Mobile app — React Native приложение (базовая версия)
- [x] Tests — Unit, Integration, E2E тесты (базовая структура)
- [x] CI/CD — GitHub Actions, автоматический деплой
- [x] Мониторинг — Prometheus, Grafana, Loki, Alertmanager
- [x] Миграции БД — SQL миграции для всех сервисов

**Подробный отчет:** [PROJECT_REPORT.md](PROJECT_REPORT.md)

## Структура проекта

```
care-monitoring-system/
├── infrastructure/          # Docker, K8s конфигурации
├── api-gateway/            # API Gateway (NestJS)
├── microservices/          # Микросервисы
│   ├── auth-service/
│   ├── user-service/
│   ├── device-service/
│   ├── telemetry-service/
│   ├── ai-prediction-service/
│   └── ...
├── shared/                 # Общие библиотеки и типы
├── frontend/               # Frontend приложения
├── mobile/                 # Mobile приложение
└── docs/                   # Документация
```

## 🛠 Технологический стек

### Backend
- **Runtime**: Node.js 18+, TypeScript
- **Framework**: NestJS
- **Базы данных**: PostgreSQL 14+, Redis 7+
- **Message Broker**: RabbitMQ 3.12+
- **API**: REST, GraphQL (опционально)

### Frontend
- **Framework**: Vue.js 3, Composition API
- **State Management**: Pinia
- **Build Tool**: Vite
- **Charts**: Chart.js

### Mobile
- **Framework**: React Native
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation

### Инфраструктура
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Мониторинг**: Prometheus, Grafana, Loki
- **Логирование**: Winston, Loki

## 🚀 Разработка

### Команды

```bash
# Разработка
npm run dev:all          # Запуск всех сервисов
npm run dev:gateway      # Только API Gateway
npm run dev:services     # Только микросервисы
npm run dev:frontend     # Только frontend

# Тестирование
npm test                 # Все тесты
npm run test:coverage    # С покрытием

# Миграции
npm run db:migrate       # Применить миграции
npm run db:seed          # Заполнить тестовыми данными

# Сборка
npm run build            # Сборка всех сервисов
```

**Подробнее:** [DEVELOPMENT.md](DEVELOPMENT.md)

## Лицензия

Proprietary
