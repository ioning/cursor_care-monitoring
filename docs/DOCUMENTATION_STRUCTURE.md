# Структура документации

Этот файл описывает организацию всей документации проекта.

## Расположение файлов

### Документация в корне проекта

Следующие файлы остаются в корне для быстрого доступа:
- `README.md` - Главная страница проекта
- `QUICKSTART.md` - Быстрый старт
- `INSTALLATION.md` - Подробная установка (Windows)
- `INSTALLATION_PS.md` - Установка через PowerShell
- `DEVELOPMENT.md` - Руководство разработчика
- `vision_arch.md` - Архитектура системы
- `vision_structure.md` - Структура проекта
- `vision_scen.md` - Сценарии использования
- `vision_scenAI.md` - AI сценарии
- `api.md` - API спецификация
- `db.md` - Схема БД
- `microservice.md` - Описание микросервисов
- `disign_app_*.md` - Дизайн приложений

### Документация в `docs/`

Вся остальная документация организована по категориям:

#### `docs/deployment/`
- `DEPLOYMENT.md` - Краткое руководство по развертыванию
- `DOCKER_DEPLOYMENT.md` - Развертывание в Docker
- `deployment-guide.md` - Детальное руководство по развертыванию

#### `docs/testing/`
- `TESTING.md` - Стратегии тестирования
- `test-data.md` - Тестовые данные

#### `docs/operations/`
- `RUNBOOK.md` - Операционные инструкции
- `TROUBLESHOOTING.md` - Решение проблем

#### `docs/ci-cd/`
- `CI_CD_GUIDE.md` - Настройка CI/CD

#### `docs/database/`
- `MIGRATIONS_GUIDE.md` - Работа с миграциями
- `database-performance-optimizations.md` - Оптимизации производительности

#### `docs/monitoring/`
- `MONITORING_GUIDE.md` - Настройка мониторинга

#### `docs/audit/`
- `FINAL_PROJECT_AUDIT_2025_12_25.md` - Финальный аудит проекта (актуальный)
- `PROJECT_REPORT.md` - Полный отчет
- `MOCKS_AND_STUBS_REPORT.md` - Отчет о заглушках
- `MAP_SERVICE_INTEGRATION_AUDIT.md` - Аудит картографического сервиса
- `CRITICAL_FIXES_COMPLETE.md` - Критические исправления

#### `docs/mobile/`
- `MOBILE_APP_STATUS_REPORT.md` - Статус мобильного приложения
- `guardian-mobile-app.md` - Guardian App документация
- `guardian-mobile-implementation-complete.md` - Реализация
- `mobile-app-build-complete.md` - Сборка

#### `docs/location/`
- `location-tracking-implementation.md` - Реализация геолокации
- `location-implementation-complete.md` - Завершение реализации
- `GEOCODING_IMPLEMENTATION.md` - Реализация геокодинга

#### `docs/architecture/`
- `decision-records.md` - Архитектурные решения (ADR)
- `multi-tenancy.md` - Архитектура Multi-Tenancy
- `complete-multi-tenancy-summary.md` - Сводка Multi-Tenancy
- `WARD_CREATION_FLOW.md` - Процесс создания подопечного
- `ALERTS_CREATION_FLOW.md` - Процесс создания алертов
- `ACCESS_CONTROL_AND_DATA_FLOW_CHECK.md` - Проверка прав доступа и потока данных
- `API_DATA_FLOW_CHECK.md` - Проверка потока данных API
- `DEVICE_AUTO_CONNECTION.md` - Автоподключение устройств
- `GUARDIAN_WARD_ORGANIZATION.md` - Организация опекун-подопечный
- `WARD_SMS_ACCOUNT_SETUP.md` - Настройка SMS аккаунта подопечного

#### `docs/implementation/`
- `multi-tenancy-implementation.md` - Реализация Multi-Tenancy
- `IMPLEMENTATION_COMPLETE.md` - Завершение реализации
- `MICROTENANCY_COMPLETE.md` - Завершение мультитенантности
- `ai-service-improvements.md` - Улучшения AI Service
- `P0_IMPLEMENTATION_SUMMARY.md` - Сводка реализации P0
- `P1_IMPLEMENTATION_SUMMARY.md` - Сводка реализации P1

#### `docs/development/`
- `development-workflow.md` - Процесс разработки
- `DEVELOPMENT.md` - Руководство по разработке
- `CHECKING_SERVICES.md` - Проверка сервисов
- `QUICK_FIXES_CHECKLIST.md` - Чеклист быстрых исправлений

#### `docs/mobile/`
- `MOBILE_APP_STATUS_REPORT.md` - Статус мобильного приложения
- `guardian-mobile-app.md` - Мобильное приложение для опекунов
- `guardian-mobile-implementation-complete.md` - Завершение реализации Guardian App
- `mobile-app-build-complete.md` - Завершение сборки
- `MOBILE_APP_DATA_OUTPUT_CHECK.md` - Проверка вывода данных
- `guardian-mobile-complete-summary.md` - Сводка Guardian App
- `MOBILE_APP_DEVELOPMENT_SUMMARY.md` - Сводка разработки
- `INCOMING_CALLS_IMPLEMENTATION.md` - Реализация входящих вызовов

#### `docs/monitoring/`
- `MONITORING_GUIDE.md` - Руководство по мониторингу
- `MONITORING_SETUP_COMPLETE.md` - Завершение настройки мониторинга

#### `docs/audit/`
- `FINAL_PROJECT_AUDIT_2025_12_25.md` - Финальный аудит проекта (актуальный)
- `PROJECT_REPORT.md` - Отчет о проекте
- `MOCKS_AND_STUBS_REPORT.md` - Отчет о заглушках
- `MAP_SERVICE_INTEGRATION_AUDIT.md` - Аудит картографического сервиса
- `CRITICAL_FIXES_COMPLETE.md` - Критические исправления

#### `docs/events/`
- `rabbitmq-events.md` - События RabbitMQ
- `events.md` - Общие события

#### `docs/integrations/`
- `webhooks.md` - Webhook'и
- `integration-roadmap.md` - Маршрутная карта интеграций
- `critical-integrations-implementation.md` - Критические интеграции
- `integrations.md` - Общие интеграции

#### `docs/frontend/`
- `landing-page-seo.md` - SEO для Landing Page
- `admin-app-startup-flow.md` - Процесс запуска Admin App
- `admin-app-startup-diagram.md` - Диаграмма запуска Admin App
- `frontend-backend-integration-check.md` - Проверка интеграции Frontend-Backend

#### Файлы в корне `docs/`
- `README.md` - **Центральная навигация** ⭐
- `STATUS.md` - Статус проекта
- `SUMMARY.md` - Краткая сводка
- `CHANGELOG.md` - История изменений
- `prompt.md` - Промпт для разработки
- `DOCUMENTATION_STRUCTURE.md` - Структура документации (этот файл)
- `DOCUMENTATION_MIGRATION_SUMMARY.md` - Сводка реорганизации документации
- `DOCUMENTATION_FINAL_CLEANUP.md` - Финальная очистка документации

## Навигация

**Главная точка входа:** [`docs/README.md`](README.md)

Этот файл содержит полную навигацию по всей документации с разбивкой по категориям и быстрым поиском для разных ролей.

## Обновление ссылок

При перемещении файлов документации убедитесь, что обновлены все ссылки:
1. В `README.md` (корневой)
2. В `docs/README.md`
3. В других файлах документации, которые ссылаются на перемещенные файлы
4. В файлах установки (`INSTALLATION.md`, `INSTALLATION_PS.md`)

## Правила добавления новой документации

1. Определите категорию документа
2. Поместите файл в соответствующий подкаталог `docs/`
3. Обновите `docs/README.md`, добавив ссылку в соответствующий раздел
4. Обновите структуру документации в этом файле (если нужно)

