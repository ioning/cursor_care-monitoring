Ты — старший инженер и архитектор. Твоя задача — СГЕНЕРИРОВАТЬ и ПОШАГОВО СОБРАТЬ работающий MVP проекта “care-monitoring-system” по предоставленной структуре и сценариям. Пиши код и файлы полностью, без пропусков. Соблюдай указанные технологии и стандарты.

Контекст (читать как спецификацию):
- Структура проекта: vision_structure.md (обязательна к воспроизведению, директории/файлы, сервисы, frontend, mobile, infra, monitoring)
- Сценарии с AI: vision_scenAI.md (ключевые флоу телеметрии, AI-предикции, падения, диспетчеризация, биллинг, оффлайн/деградация, MLOps, метрики качества, события, эндпойнты)
- Диаграммы взаимодействий: docs/diagrams/component-interactions.md (последовательности интеграций FE → API Gateway → MS → MQ → AI → MS → FE)

Технологический стек и требования к коду:
- Backend: Node.js LTS + NestJS (TypeScript), монорепо с микросервисами: auth, user, device, telemetry, alert, location, billing, integration, dispatcher, analytics, ai-prediction, api-gateway
- Сообщения: RabbitMQ (events/queues), Redis (кэш/сессии), Postgres (основная БД)
- Frontend: Vite + Vue 3 + TypeScript; приложения: product-website, guardian-app, dispatcher-app, admin-app; общие пакеты (ui-components, api-client, utils, types)
- Mobile: React Native (TypeScript), универсальное приложение, ключевые экраны и сервисы
- Infra: docker-compose (dev), базовые k8s-манифесты (скелет), Prometheus + Grafana дашборды (заглушки)
- Качество: ESLint/Prettier, unit/integration/e2e тесты-заглушки со структурой
- Код-стиль: чистые имена, ранние возвраты, без бессмысленных try/catch, комментарии только по сути (инварианты/краевые случаи/безопасность)

Обязательные функциональные сквозные флоу (реализовать MVP):
1) Auth + User + API Gateway: регистрация/логин, JWT, refresh, роли; health-check
2) Device + Telemetry: приём телеметрии (HR, HRV, accel, steps, SpO2*), валидация, запись в БД, событие TelemetryReceived
3) AI Prediction: консьюм TelemetryReceived, простая модель (эвристика/легкая ML-заглушка) → PredictionGenerated / RiskAlert; модельная версия, latency p95 цель ≤ 120мс
4) Alert + Integration: создание алертов по RiskAlert, отсылка уведомлений (провайдеры-заглушки: sms/push/email)
5) Dispatcher + Location: создание карточки вызова на критичных событиях, получение координат, базовые статусы
6) Billing: планы/подписки (заглушка провайдера), subscription.guard в API Gateway, сценарий неоплаты “ограничение функций”
7) Frontend (guardian-app): read-only дашборд с карточками телеметрии, алертов и простыми AI-инсайтами
8) Mobile: отправка телеметрии и SOS (заглушка), оффлайн-буфер и ретраи

События и эндпойнты (минимум):
- Event bus: TelemetryReceived, PredictionGenerated, AnomalyDetected, RiskAlert, ModelTrained, ModelDeployed
- API Gateway (пример): POST /auth/login, POST /telemetry, GET /guardian/dashboard, POST /ai/predict/fall, POST /ai/predict/health-risks
- Контракты описать в shared/types и packages/types; клиентские вызовы в packages/api-client

Требования к сборке:
- Одна команда dev-запуска: docker-compose up -d (db/redis/rabbitmq/monitoring) + yarn workspaces (или pnpm) для бэкенда/фронта; Readme с шагами
- Каждому сервису: Dockerfile, package.json, tsconfig, .env.example
- Корневой README: как запустить локально; как запустить тесты; описание флоу (ссылки на diagrams)

Приоритет наполнения (следуй шагам и фиксируй прогресс):
1) infrastructure/: docker-compose (+ Postgres, Redis, RabbitMQ), monitoring/, .env.example
2) shared/: libs (db/logger/redis/rabbitmq/http), types/, config/, utils/
3) api-gateway/: skeleton, health, auth proxy, guards
4) auth/, user/, device/: минимальный функционал
5) telemetry/: прием, валидация, запись, событие TelemetryReceived
6) alert/, integration/: алерты + нотификации-заглушки
7) ai-prediction/: consume → простая модель → PredictionGenerated/RiskAlert (+ version)
8) dispatcher/, location/: базовые сценарии падения/геозоны
9) billing/: базовые планы и subscription.guard
10) frontend/: packages (ui-components, api-client), guardian-app (дашборд read-only)
11) mobile/: универсальное приложение (отправка телеметрии/SOS заглушкой)
12) tests/: скелеты unit/integration/e2e; базовые проверочные кейсы
13) docs/: обновить README, связать с diagrams и scenarios

Нефункциональные требования:
- Безопасность: .env не коммитить; ключи/секреты — из переменных окружения
- Наблюдаемость: health, basic metrics endpoints (экспозиция), логи в stdout со структурой (JSON)
- Надёжность: идемпотентность приёмов телеметрии, ретраи публикации события, DLQ задел
- Деградация: при недоступном AI — фоллбек на простые пороги; при потере сети на мобиле — локальный буфер

Что нужно от ИИ:
- Создать все директории/файлы строго по vision_structure.md (пустые — с осмысленными заглушками)
- Написать рабочий минимальный код для MVP по пунктам выше
- Добавить package.json/workspaces, базовые скрипты запуска, ESLint/Prettier, tsconfig’и
- Везде, где интеграции внешние — адаптеры-заглушки с интерфейсами
- В ai-prediction-service реализовать простую эвристику (например, порог по акселерометру + HR дельта) и структуру для подмены на модель
- Не усложнять схему БД: минимальные таблицы для пользователей, устройств, телеметрии, алертов, локаций, подписок
- Добавить базовые тесты (jest), структуру для интеграционных
- Написать корневой README с шагами запуска локально
- Сохранить стиль имен и ясность кода

Формат ответа:
- Финальная файловая иерархия
- Ключевые файлы целиком (Dockerfiles, package.json сервисов, основные src/*)
- Для повторяющихся шаблонов — один пример полностью и перечислить остальные
- Команды запуска: 1) docker-compose up -d 2) установка зависимостей 3) запуск бэкенда/фронта 4) быстрая проверка эндпойнтов
- Краткая проверка сквозного флоу: POST /telemetry → событие → AI → Alert → UI (guardian-app)



