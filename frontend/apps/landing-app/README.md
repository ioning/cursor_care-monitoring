# Landing App

Посадочная страница продукта Care Monitoring System с возможностью регистрации, входа и перехода в личные кабинеты.

## Технологии

- **Vue 3** с Composition API
- **TypeScript** для типобезопасности
- **Pinia** для state management
- **Vue Router** для навигации
- **Axios** для HTTP запросов
- **Vite** для сборки

## Структура

```
src/
├── api/              # API клиенты
│   ├── client.ts     # Axios клиент с interceptors
│   └── auth.api.ts   # API для аутентификации
├── stores/           # Pinia stores
│   └── auth.ts       # Store для управления аутентификацией
├── views/            # Страницы
│   ├── HomeView.vue  # Главная страница (landing)
│   ├── LoginView.vue # Страница входа
│   └── RegisterView.vue # Страница регистрации
├── router/           # Роутинг
├── App.vue           # Корневой компонент
└── main.ts           # Точка входа
```

## Установка

```bash
npm install
```

## Разработка

```bash
npm run dev
```

Приложение будет доступно на http://localhost:5175

## Сборка

```bash
npm run build
```

## Функциональность

### Главная страница (HomeView)

- **Hero секция** - привлекательный заголовок с CTA кнопками
- **Секция возможностей** - описание ключевых функций продукта
- **Секция тарифов** - три тарифных плана (Basic, Professional, Enterprise)
- **CTA секция** - призыв к действию
- **Footer** - ссылки на личные кабинеты и контакты

### Страница входа (LoginView)

- Форма входа с email и паролем
- Автоматическое перенаправление в соответствующий личный кабинет после входа
- Ссылки на прямые переходы в кабинеты (без входа)

### Страница регистрации (RegisterView)

- Форма регистрации с полями:
  - ФИО
  - Email
  - Телефон (необязательно)
  - Пароль
  - Роль (Опекун, Подопечный, Диспетчер)
- Автоматическое перенаправление в личный кабинет после регистрации

## Переходы в личные кабинеты

После успешного входа/регистрации пользователь автоматически перенаправляется в соответствующий личный кабинет:

- **guardian** → Guardian App (http://localhost:5173)
- **dispatcher** → Dispatcher App (http://localhost:5174)
- **admin** / **organization_admin** → Admin App (http://localhost:5185)

Токен доступа передается через URL параметр для автоматического входа.

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_GUARDIAN_APP_URL=http://localhost:5173
VITE_DISPATCHER_APP_URL=http://localhost:5174
VITE_ADMIN_APP_URL=http://localhost:5185
VITE_PORT=5175
```

## API Интеграция

Landing App интегрируется с Auth Service через API Gateway:

- `POST /api/v1/auth/login` - вход в систему
- `POST /api/v1/auth/register` - регистрация нового пользователя

Токены сохраняются в `localStorage` и автоматически добавляются к каждому запросу.



Посадочная страница продукта Care Monitoring System с возможностью регистрации, входа и перехода в личные кабинеты.

## Технологии

- **Vue 3** с Composition API
- **TypeScript** для типобезопасности
- **Pinia** для state management
- **Vue Router** для навигации
- **Axios** для HTTP запросов
- **Vite** для сборки

## Структура

```
src/
├── api/              # API клиенты
│   ├── client.ts     # Axios клиент с interceptors
│   └── auth.api.ts   # API для аутентификации
├── stores/           # Pinia stores
│   └── auth.ts       # Store для управления аутентификацией
├── views/            # Страницы
│   ├── HomeView.vue  # Главная страница (landing)
│   ├── LoginView.vue # Страница входа
│   └── RegisterView.vue # Страница регистрации
├── router/           # Роутинг
├── App.vue           # Корневой компонент
└── main.ts           # Точка входа
```

## Установка

```bash
npm install
```

## Разработка

```bash
npm run dev
```

Приложение будет доступно на http://localhost:5175

## Сборка

```bash
npm run build
```

## Функциональность

### Главная страница (HomeView)

- **Hero секция** - привлекательный заголовок с CTA кнопками
- **Секция возможностей** - описание ключевых функций продукта
- **Секция тарифов** - три тарифных плана (Basic, Professional, Enterprise)
- **CTA секция** - призыв к действию
- **Footer** - ссылки на личные кабинеты и контакты

### Страница входа (LoginView)

- Форма входа с email и паролем
- Автоматическое перенаправление в соответствующий личный кабинет после входа
- Ссылки на прямые переходы в кабинеты (без входа)

### Страница регистрации (RegisterView)

- Форма регистрации с полями:
  - ФИО
  - Email
  - Телефон (необязательно)
  - Пароль
  - Роль (Опекун, Подопечный, Диспетчер)
- Автоматическое перенаправление в личный кабинет после регистрации

## Переходы в личные кабинеты

После успешного входа/регистрации пользователь автоматически перенаправляется в соответствующий личный кабинет:

- **guardian** → Guardian App (http://localhost:5173)
- **dispatcher** → Dispatcher App (http://localhost:5174)
- **admin** / **organization_admin** → Admin App (http://localhost:5185)

Токен доступа передается через URL параметр для автоматического входа.

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_GUARDIAN_APP_URL=http://localhost:5173
VITE_DISPATCHER_APP_URL=http://localhost:5174
VITE_ADMIN_APP_URL=http://localhost:5185
VITE_PORT=5175
```

## API Интеграция

Landing App интегрируется с Auth Service через API Gateway:

- `POST /api/v1/auth/login` - вход в систему
- `POST /api/v1/auth/register` - регистрация нового пользователя

Токены сохраняются в `localStorage` и автоматически добавляются к каждому запросу.







