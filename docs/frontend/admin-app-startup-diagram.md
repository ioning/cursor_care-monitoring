# Схема запуска Admin App - Краткий обзор

## Визуальная схема потока запуска

```
┌─────────────────────────────────────────────────────────────────┐
│                        ЗАПУСК ПРИЛОЖЕНИЯ                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   index.html    │
                    │  Загрузка HTML  │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    main.ts      │
                    │  Точка входа    │
                    └────────┬────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Pinia Store  │   │  Vue Router   │   │  Vue App      │
│  (состояние)  │   │  (маршруты)   │   │  (компоненты) │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                     │
        └───────────────────┼─────────────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │    App.vue      │
                    │  Корневой       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  MainLayout.vue  │
                    │  Основной layout │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  AppSidebar   │   │  RouterView   │   │ ContextPanel  │
│  (навигация)  │   │  (контент)    │   │ (действия)    │
└───────────────┘   └───────┬───────┘   └───────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │  DashboardView   │
                    │  (или другой)    │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  onMounted    │   │  useShortcuts │   │ useRealtime   │
│  (инициализ.) │   │  (горячие     │   │ (WebSocket)   │
│               │   │   клавиши)    │   │               │
└───────┬───────┘   └───────────────┘   └───────┬───────┘
        │                                        │
        ▼                                        ▼
┌───────────────┐                      ┌───────────────┐
│ Store Actions │                      │  WebSocket    │
│  bootstrap()  │                      │  connect()     │
│  load()       │                      │  subscribe()   │
└───────┬───────┘                      └───────┬───────┘
        │                                        │
        └────────────────┬───────────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   API Client    │
                │   (Axios)       │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  API Gateway    │
                │  :3000          │
                └────────┬────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Auth Service  │ │ User Service  │ │ Other Services│
│    :3001      │ │    :3002      │ │   :3003+      │
└───────────────┘ └───────────────┘ └───────────────┘
```

## Компоненты и их роли

### 1. Инициализация (main.ts)
```
┌─────────────────────────────────────┐
│ createPinia()                        │
│   └─ pinia-plugin-persistedstate    │
│                                      │
│ createApp(App)                       │
│   ├─ app.use(pinia)                  │
│   ├─ app.use(router)                 │
│   └─ app.use(VueApexCharts)          │
│                                      │
│ app.mount('#app')                    │
│                                      │
│ realtimeClient.connect()             │
└─────────────────────────────────────┘
```

### 2. API Client (api/client.ts)
```
┌─────────────────────────────────────┐
│ axios.create()                       │
│   baseURL: /api/v1/admin            │
│                                      │
│ Request Interceptor:                 │
│   ├─ Authorization: Bearer {token}   │
│   └─ X-Tenant-Id: {tenant}          │
│                                      │
│ Response Interceptor:                │
│   ├─ 401 → refresh token            │
│   └─ refresh fail → /login           │
└─────────────────────────────────────┘
```

### 3. WebSocket Client (services/realtime.service.ts)
```
┌─────────────────────────────────────┐
│ createRealtimeClient()               │
│   url: ws://localhost:3000/ws/admin  │
│   query: { token, tenant }           │
│                                      │
│ connect()                            │
│   ├─ buildUrl()                      │
│   ├─ new WebSocket()                 │
│   ├─ handleOpen()                    │
│   ├─ handleMessage()                 │
│   ├─ handleError()                   │
│   └─ handleClose() → reconnect      │
└─────────────────────────────────────┘
```

### 4. Store (stores/system.ts)
```
┌─────────────────────────────────────┐
│ defineStore('system')                │
│                                      │
│ State:                               │
│   ├─ health: SystemHealthResponse    │
│   ├─ trends: PerformanceTrend[]      │
│   ├─ alerts: AlertItem[]             │
│   └─ loading: boolean                │
│                                      │
│ Actions:                             │
│   bootstrap() →                      │
│     ├─ fetchSystemHealth()          │
│     ├─ fetchPerformanceTrends()      │
│     └─ fetchCriticalAlerts()        │
└─────────────────────────────────────┘
```

## Поток данных

### При загрузке страницы:
```
User → Browser → index.html
                ↓
            main.ts
                ↓
        ┌───────┴───────┐
        │               │
    App.vue      realtimeClient.connect()
        │               │
    MainLayout          WebSocket
        │               │
    RouterView          │
        │               │
    DashboardView       │
        │               │
    onMounted()         │
        │               │
    systemStore.bootstrap()
        │               │
    API Requests ───────┘
        │
    API Gateway
        │
    Microservices
        │
    Database
```

### При получении realtime события:
```
WebSocket Server
    ↓
realtimeClient.handleMessage()
    ↓
useRealtimeChannel('system.health')
    ↓
Handler function
    ↓
systemStore.bootstrap()
    ↓
API Request
    ↓
UI Update (реактивно)
```

## Взаимодействие с бэкендом

```
┌─────────────────────────────────────────────────────────┐
│                    Admin App (Frontend)                  │
│                    Port: 5185                            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ HTTP API    │ │ WebSocket   │ │ LocalStorage│
│ (Axios)     │ │ (Realtime)  │ │ (State)     │
└──────┬──────┘ └──────┬───────┘ └─────────────┘
       │               │
       └───────┬───────┘
               │
               ▼
    ┌──────────────────────┐
    │    API Gateway       │
    │    Port: 3000        │
    │    /api/v1/admin     │
    └──────────┬───────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Auth   │ │ User   │ │ Other  │
│ :3001  │ │ :3002  │ │ :3003+ │
└────────┘ └────────┘ └────────┘
```

## Ключевые моменты

1. **Инициализация происходит синхронно**, но данные загружаются асинхронно
2. **WebSocket подключается сразу** после монтирования приложения
3. **Stores загружают данные** только когда компонент их запрашивает (lazy loading)
4. **Все API запросы** проходят через единый API Gateway
5. **Авторизация** обрабатывается автоматически через interceptors
6. **Realtime обновления** триггерят перезагрузку данных через stores



## Визуальная схема потока запуска

```
┌─────────────────────────────────────────────────────────────────┐
│                        ЗАПУСК ПРИЛОЖЕНИЯ                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   index.html    │
                    │  Загрузка HTML  │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    main.ts      │
                    │  Точка входа    │
                    └────────┬────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Pinia Store  │   │  Vue Router   │   │  Vue App      │
│  (состояние)  │   │  (маршруты)   │   │  (компоненты) │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                     │
        └───────────────────┼─────────────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │    App.vue      │
                    │  Корневой       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  MainLayout.vue  │
                    │  Основной layout │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  AppSidebar   │   │  RouterView   │   │ ContextPanel  │
│  (навигация)  │   │  (контент)    │   │ (действия)    │
└───────────────┘   └───────┬───────┘   └───────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │  DashboardView   │
                    │  (или другой)    │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  onMounted    │   │  useShortcuts │   │ useRealtime   │
│  (инициализ.) │   │  (горячие     │   │ (WebSocket)   │
│               │   │   клавиши)    │   │               │
└───────┬───────┘   └───────────────┘   └───────┬───────┘
        │                                        │
        ▼                                        ▼
┌───────────────┐                      ┌───────────────┐
│ Store Actions │                      │  WebSocket    │
│  bootstrap()  │                      │  connect()     │
│  load()       │                      │  subscribe()   │
└───────┬───────┘                      └───────┬───────┘
        │                                        │
        └────────────────┬───────────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   API Client    │
                │   (Axios)       │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  API Gateway    │
                │  :3000          │
                └────────┬────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Auth Service  │ │ User Service  │ │ Other Services│
│    :3001      │ │    :3002      │ │   :3003+      │
└───────────────┘ └───────────────┘ └───────────────┘
```

## Компоненты и их роли

### 1. Инициализация (main.ts)
```
┌─────────────────────────────────────┐
│ createPinia()                        │
│   └─ pinia-plugin-persistedstate    │
│                                      │
│ createApp(App)                       │
│   ├─ app.use(pinia)                  │
│   ├─ app.use(router)                 │
│   └─ app.use(VueApexCharts)          │
│                                      │
│ app.mount('#app')                    │
│                                      │
│ realtimeClient.connect()             │
└─────────────────────────────────────┘
```

### 2. API Client (api/client.ts)
```
┌─────────────────────────────────────┐
│ axios.create()                       │
│   baseURL: /api/v1/admin            │
│                                      │
│ Request Interceptor:                 │
│   ├─ Authorization: Bearer {token}   │
│   └─ X-Tenant-Id: {tenant}          │
│                                      │
│ Response Interceptor:                │
│   ├─ 401 → refresh token            │
│   └─ refresh fail → /login           │
└─────────────────────────────────────┘
```

### 3. WebSocket Client (services/realtime.service.ts)
```
┌─────────────────────────────────────┐
│ createRealtimeClient()               │
│   url: ws://localhost:3000/ws/admin  │
│   query: { token, tenant }           │
│                                      │
│ connect()                            │
│   ├─ buildUrl()                      │
│   ├─ new WebSocket()                 │
│   ├─ handleOpen()                    │
│   ├─ handleMessage()                 │
│   ├─ handleError()                   │
│   └─ handleClose() → reconnect      │
└─────────────────────────────────────┘
```

### 4. Store (stores/system.ts)
```
┌─────────────────────────────────────┐
│ defineStore('system')                │
│                                      │
│ State:                               │
│   ├─ health: SystemHealthResponse    │
│   ├─ trends: PerformanceTrend[]      │
│   ├─ alerts: AlertItem[]             │
│   └─ loading: boolean                │
│                                      │
│ Actions:                             │
│   bootstrap() →                      │
│     ├─ fetchSystemHealth()          │
│     ├─ fetchPerformanceTrends()      │
│     └─ fetchCriticalAlerts()        │
└─────────────────────────────────────┘
```

## Поток данных

### При загрузке страницы:
```
User → Browser → index.html
                ↓
            main.ts
                ↓
        ┌───────┴───────┐
        │               │
    App.vue      realtimeClient.connect()
        │               │
    MainLayout          WebSocket
        │               │
    RouterView          │
        │               │
    DashboardView       │
        │               │
    onMounted()         │
        │               │
    systemStore.bootstrap()
        │               │
    API Requests ───────┘
        │
    API Gateway
        │
    Microservices
        │
    Database
```

### При получении realtime события:
```
WebSocket Server
    ↓
realtimeClient.handleMessage()
    ↓
useRealtimeChannel('system.health')
    ↓
Handler function
    ↓
systemStore.bootstrap()
    ↓
API Request
    ↓
UI Update (реактивно)
```

## Взаимодействие с бэкендом

```
┌─────────────────────────────────────────────────────────┐
│                    Admin App (Frontend)                  │
│                    Port: 5185                            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ HTTP API    │ │ WebSocket   │ │ LocalStorage│
│ (Axios)     │ │ (Realtime)  │ │ (State)     │
└──────┬──────┘ └──────┬───────┘ └─────────────┘
       │               │
       └───────┬───────┘
               │
               ▼
    ┌──────────────────────┐
    │    API Gateway       │
    │    Port: 3000        │
    │    /api/v1/admin     │
    └──────────┬───────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Auth   │ │ User   │ │ Other  │
│ :3001  │ │ :3002  │ │ :3003+ │
└────────┘ └────────┘ └────────┘
```

## Ключевые моменты

1. **Инициализация происходит синхронно**, но данные загружаются асинхронно
2. **WebSocket подключается сразу** после монтирования приложения
3. **Stores загружают данные** только когда компонент их запрашивает (lazy loading)
4. **Все API запросы** проходят через единый API Gateway
5. **Авторизация** обрабатывается автоматически через interceptors
6. **Realtime обновления** триггерят перезагрузку данных через stores







