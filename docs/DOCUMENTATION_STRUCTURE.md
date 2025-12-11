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
- `FINAL_PROJECT_AUDIT.md` - Комплексный аудит
- `PROJECT_REPORT.md` - Полный отчет
- `MOCKS_AND_STUBS_REPORT.md` - Отчет о заглушках
- `MAP_SERVICE_INTEGRATION_AUDIT.md` - Аудит картографического сервиса

#### `docs/mobile/`
- `MOBILE_APP_STATUS_REPORT.md` - Статус мобильного приложения
- `guardian-mobile-app.md` - Guardian App документация
- `guardian-mobile-implementation-complete.md` - Реализация
- `mobile-app-build-complete.md` - Сборка

#### `docs/location/`
- `location-tracking-implementation.md` - Реализация геолокации
- `location-implementation-complete.md` - Завершение реализации
- `GEOCODING_IMPLEMENTATION.md` - Реализация геокодинга

#### Файлы в корне `docs/`
- `README.md` - **Центральная навигация** ⭐
- `STATUS.md` - Статус проекта
- `SUMMARY.md` - Краткая сводка
- `CHANGELOG.md` - История изменений
- `prompt.md` - Промпт для разработки
- `ai-service-improvements.md` - Улучшения AI Service
- `CRITICAL_FIXES_COMPLETE.md` - Критические исправления
- `QUICK_FIXES_CHECKLIST.md` - Чеклист исправлений
- `events.md` - Общие события
- `integrations.md` - Общие интеграции

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

