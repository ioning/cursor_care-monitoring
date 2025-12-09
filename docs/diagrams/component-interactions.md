# Диаграммы взаимодействия компонентов

Ниже представлены ключевые взаимодействия компонентов системы согласно сценариям. Диаграммы используют условные обозначения:
- FE: фронтенд-приложения (`product-website`, `guardian-app`, `dispatcher-app`, `admin-app`)
- API Gateway: единая точка входа в backend
- MS: микросервисы (auth, user, device, telemetry, alert, location, billing, integration, dispatcher, analytics, ai-prediction)
- Infra: брокер сообщений (RabbitMQ), кеш (Redis), БД (Postgres), мониторинг

## 1) Аутентификация и загрузка дашборда опекуна

```mermaid
sequenceDiagram
autonumber
actor User as Guardian User
participant FE as Guardian App (FE)
participant API as API Gateway
participant AUTH as Auth Service (MS)
participant USER as User Service (MS)
participant DEV as Device Service (MS)
participant TEL as Telemetry Service (MS)
participant ALR as Alert Service (MS)
participant REDIS as Redis (Cache)
participant DB as Postgres (DB)

User->>FE: Login (email/password)
FE->>API: POST /auth/login
API->>AUTH: validate credentials
AUTH->>DB: query user, session, tokens
DB-->>AUTH: user found
AUTH-->>API: JWT + refresh token
API-->>FE: 200 OK (tokens)

FE->>API: GET /guardian/dashboard (JWT)
API->>REDIS: get cached dashboard
alt cache miss
  API->>USER: get wards, relationships
  API->>DEV: get devices for wards
  API->>TEL: get latest telemetry
  API->>ALR: get recent alerts
  USER->>DB: query wards
  DEV->>DB: query devices
  TEL->>DB: query telemetry
  ALR->>DB: query alerts
  DB-->>USER: wards
  DB-->>DEV: devices
  DB-->>TEL: telemetry
  DB-->>ALR: alerts
  API->>REDIS: set dashboard cache (TTL)
end
API-->>FE: dashboard payload
```

## 2) Поток телеметрии от носимого устройства и предикция ИИ

```mermaid
sequenceDiagram
autonumber
participant Device as Wearable/Phone
participant FE_M as Ward Mobile App (FE)
participant API as API Gateway
participant TEL as Telemetry Service (MS)
participant MQ as RabbitMQ (Event Bus)
participant AI as AI Prediction Service (MS)
participant ALR as Alert Service (MS)
participant DB as Postgres (DB)

Device->>FE_M: sensor data (HR, steps, fall?)
FE_M->>API: POST /telemetry (JWT)
API->>TEL: store-telemetry
TEL->>DB: insert telemetry row
TEL->>MQ: publish TelemetryReceived

MQ->>AI: consume TelemetryReceived
AI->>AI: feature extraction, inference
AI->>DB: save prediction/risk
AI->>MQ: publish PredictionGenerated / AnomalyDetected

MQ->>ALR: consume Prediction/Anomaly
ALR->>DB: create alert if threshold exceeded
ALR->>Integration: send notifications (SMS/Push/Telegram)
```

## 3) Обработка аварийного события (падение) и диспетчеризация

```mermaid
sequenceDiagram
autonumber
participant Device as Wearable/Phone
participant FE_M as Ward Mobile App
participant API as API Gateway
participant TEL as Telemetry Service
participant AI as AI Prediction Service
participant ALR as Alert Service
participant DSP as Dispatcher Service
participant LOC as Location Service
participant MQ as RabbitMQ
participant DB as Postgres

Device->>FE_M: sudden accelerometer pattern (fall)
FE_M->>API: POST /telemetry (fall flag)
API->>TEL: store + emit event
TEL->>MQ: TelemetryReceived(fall=1)
MQ->>AI: analyze (fall prediction ↑severity)
AI->>MQ: RiskAlert(event=fall, score, severity)
MQ->>ALR: create alert
ALR->>DB: persist alert
ALR->>DSP: notify dispatcher (RPC/HTTP)
DSP->>LOC: get last known location
LOC->>DB: query location
DB-->>LOC: coords
DSP-->>ALR: dispatch created
ALR->>Integration: notify guardian (priority)
```

## 4) Отслеживание местоположения и геозоны

```mermaid
sequenceDiagram
autonumber
participant FE_M as Ward Mobile App
participant API as API Gateway
participant LOC as Location Service
participant DB as Postgres
participant MQ as RabbitMQ
participant ALR as Alert Service

FE_M->>API: POST /location (coords)
API->>LOC: track-location
LOC->>DB: upsert location
LOC->>LOC: geofence check
alt geofence breach
  LOC->>MQ: LocationUpdated(breach)
  MQ->>ALR: create geofence alert
  ALR->>DB: persist alert
end
API-->>FE_M: 200 OK
```

## 5) Выставление счетов и оплата

```mermaid
sequenceDiagram
autonumber
actor User as Guardian/Admin
participant FE as Frontend App
participant API as API Gateway
participant BILL as Billing Service
participant PAY as Payment Provider (ЮKassa/Tinkoff)
participant DB as Postgres
participant MQ as RabbitMQ
participant INT as Integration Service

User->>FE: Upgrade plan / Pay invoice
FE->>API: POST /billing/checkout
API->>BILL: create payment intent
BILL->>DB: persist payment (pending)
BILL->>PAY: init payment session
PAY-->>BILL: payment url/status
BILL-->>API: return redirect url
API-->>FE: payment url

PAY-->>BILL: webhook(payment succeeded)
BILL->>DB: update payment status (succeeded)
BILL->>MQ: PaymentProcessed
MQ->>INT: send receipt/notification
```

## 6) Админ: тренировка и деплой ML‑модели

```mermaid
sequenceDiagram
autonumber
actor Admin as Admin User
participant FE_A as Admin App (FE)
participant API as API Gateway
participant AI as AI Prediction Service
participant DB as Postgres
participant MQ as RabbitMQ
participant MON as Monitoring (Prometheus/Grafana)

Admin->>FE_A: Start training (model X, dataset, params)
FE_A->>API: POST /ai/train
API->>AI: train-model command
AI->>DB: fetch training dataset
AI->>AI: training job (versioning, metrics)
AI->>DB: save model version, metrics
AI->>MQ: ModelTrained(version, metrics)
MQ->>AI: trigger deployment orchestrator
AI->>AI: deploy to serving (TF/PyTorch/custom)
AI->>MON: expose inference metrics
API-->>FE_A: training started + status endpoint
```

## 7) Веб‑сайт продукта: заявка и контакты

```mermaid
sequenceDiagram
autonumber
actor Visitor as Site Visitor
participant FE_W as Product Website (FE)
participant API as API Gateway
participant INT as Integration Service
participant DB as Postgres

Visitor->>FE_W: Submit contact form
FE_W->>API: POST /integration/contact
API->>INT: enqueue message
INT->>DB: persist lead
INT->>Providers: send email/telegram/slack
API-->>FE_W: success message
```

---

Карта взаимодействий покрывает критические пользовательские сценарии: аутентификация, поток телеметрии, предиктивная аналитика/тревоги, геозоны, биллинг, ML‑жизненный цикл и лендинг. При необходимости расширю детализацию (конкретные эндпойнты, схемы событий, payload’ы, ретраи и деградационные сценарии).
*** End Patch*** }```}



