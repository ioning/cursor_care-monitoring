# Улучшения основного экрана диспетчера

**Дата**: 2024-01-15  
**Версия**: 0.2.0

## Обзор изменений

Основной экран диспетчера был значительно улучшен для большей информативности и добавлен новый раздел для управления контрактными СМП и стоимостью услуг.

## Новые возможности

### 1. Расширенная статистика

Добавлены дополнительные статистические карточки:
- **Всего вызовов** - с индикатором новых вызовов
- **Критичные** - с предупреждением о необходимости внимания
- **Активные** - с количеством вызовов в работе
- **Завершено** - с количеством завершенных сегодня
- **Высокий приоритет** - количество вызовов с высоким приоритетом
- **Назначено** - количество назначенных вызовов

### 2. Раздел контрактных СМП и стоимости услуг

Новый раздел включает:

#### Общая статистика
- Общее количество СМП-провайдеров
- Количество активных провайдеров
- Общее количество вызовов
- **Общая стоимость услуг** (выделена отдельно)

#### Стоимость по компаниям
- Таблица с детализацией по каждой компании-провайдеру
- Количество вызовов по каждой компании
- Общая стоимость услуг по компании
- Визуализация доли в общих затратах (процентная шкала)
- Возможность раскрыть детали по типам услуг

#### Детализация по типам услуг
При раскрытии деталей компании отображается:
- Разбивка по типам услуг (экстренный вызов, скорая помощь, консультация и т.д.)
- Количество вызовов каждого типа
- Стоимость по каждому типу услуг
- Период отчетности

#### База стоимости услуг
- Справочник всех типов услуг
- Базовая стоимость каждой услуги
- Единица измерения (вызов, час, км и т.д.)
- Описание услуги
- Статус активности услуги

### 3. Фильтрация по периодам

Доступны следующие периоды для анализа:
- Сегодня
- Неделя
- Месяц (по умолчанию)
- Квартал
- Год
- Произвольный период (с выбором дат)

## Созданные файлы

### API
- `src/api/smp.api.ts` - API клиент для работы с СМП и стоимостью услуг

### Stores
- `src/stores/smp.ts` - Pinia store для управления состоянием СМП данных

### Components
- `src/components/SMPCostSummary.vue` - Компонент отображения контрактных СМП и стоимости

## Типы данных

### SMPProvider
```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contractNumber?: string;
  contractDate?: string;
  isActive: boolean;
  serviceArea?: string;
  rating?: number;
}
```

### ServicePrice
```typescript
{
  id: string;
  serviceType: string;
  serviceName: string;
  basePrice: number;
  currency: string;
  unit: string; // 'per_call', 'per_hour', 'per_km', etc.
  description?: string;
  isActive: boolean;
}
```

### SMPCall
```typescript
{
  id: string;
  callId: string;
  smpProviderId: string;
  serviceType: string;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  calledAt: string;
  completedAt?: string;
  notes?: string;
  smpProvider?: SMPProvider;
}
```

### SMPStats
```typescript
{
  totalProviders: number;
  activeProviders: number;
  totalCalls: number;
  totalCost: number;
  period: {
    from: string;
    to: string;
  };
  byProvider: SMPCostSummary[];
}
```

## API Endpoints (требуют реализации на backend)

### Получение провайдеров СМП
```
GET /api/v1/dispatcher/smp/providers
GET /api/v1/dispatcher/smp/providers/:id
```

### Управление стоимостью услуг
```
GET /api/v1/dispatcher/smp/service-prices
GET /api/v1/dispatcher/smp/service-prices/:serviceType
```

### Вызовы СМП
```
GET /api/v1/dispatcher/smp/calls
POST /api/v1/dispatcher/smp/calls
```

### Статистика стоимости
```
GET /api/v1/dispatcher/smp/cost-summary
Query params:
  - from: string (YYYY-MM-DD)
  - to: string (YYYY-MM-DD)
  - providerId?: string
```

## Следующие шаги

Для полной функциональности необходимо:

1. **Backend реализация**:
   - Создать таблицы для СМП провайдеров, стоимости услуг и вызовов СМП
   - Реализовать API endpoints в dispatcher-service
   - Добавить логику расчета стоимости и статистики

2. **Миграции БД**:
   ```sql
   CREATE TABLE dispatcher.smp_providers (...);
   CREATE TABLE dispatcher.service_prices (...);
   CREATE TABLE dispatcher.smp_calls (...);
   ```

3. **Интеграция**:
   - Связать вызовы диспетчера с вызовами СМП
   - Автоматически создавать записи о вызовах СМП при эскалации
   - Рассчитывать стоимость на основе прайс-листа

## Использование

Компонент `SMPCostSummary` автоматически загружается на главном экране диспетчера (`DashboardView`).

При первом открытии компонент:
1. Загружает базу стоимости услуг
2. Запрашивает статистику за текущий месяц
3. Отображает данные в удобном табличном формате

Пользователь может:
- Выбрать период для анализа
- Раскрыть детали по каждой компании
- Просмотреть базу стоимости услуг
- Видеть визуализацию распределения затрат

## Стилизация

Все компоненты используют CSS переменные для темизации:
- `--card-bg` - фон карточек
- `--primary-color` - основной цвет
- `--text-secondary` - вторичный текст
- `--border-color` - цвет границ
- `--shadow` - тени



**Дата**: 2024-01-15  
**Версия**: 0.2.0

## Обзор изменений

Основной экран диспетчера был значительно улучшен для большей информативности и добавлен новый раздел для управления контрактными СМП и стоимостью услуг.

## Новые возможности

### 1. Расширенная статистика

Добавлены дополнительные статистические карточки:
- **Всего вызовов** - с индикатором новых вызовов
- **Критичные** - с предупреждением о необходимости внимания
- **Активные** - с количеством вызовов в работе
- **Завершено** - с количеством завершенных сегодня
- **Высокий приоритет** - количество вызовов с высоким приоритетом
- **Назначено** - количество назначенных вызовов

### 2. Раздел контрактных СМП и стоимости услуг

Новый раздел включает:

#### Общая статистика
- Общее количество СМП-провайдеров
- Количество активных провайдеров
- Общее количество вызовов
- **Общая стоимость услуг** (выделена отдельно)

#### Стоимость по компаниям
- Таблица с детализацией по каждой компании-провайдеру
- Количество вызовов по каждой компании
- Общая стоимость услуг по компании
- Визуализация доли в общих затратах (процентная шкала)
- Возможность раскрыть детали по типам услуг

#### Детализация по типам услуг
При раскрытии деталей компании отображается:
- Разбивка по типам услуг (экстренный вызов, скорая помощь, консультация и т.д.)
- Количество вызовов каждого типа
- Стоимость по каждому типу услуг
- Период отчетности

#### База стоимости услуг
- Справочник всех типов услуг
- Базовая стоимость каждой услуги
- Единица измерения (вызов, час, км и т.д.)
- Описание услуги
- Статус активности услуги

### 3. Фильтрация по периодам

Доступны следующие периоды для анализа:
- Сегодня
- Неделя
- Месяц (по умолчанию)
- Квартал
- Год
- Произвольный период (с выбором дат)

## Созданные файлы

### API
- `src/api/smp.api.ts` - API клиент для работы с СМП и стоимостью услуг

### Stores
- `src/stores/smp.ts` - Pinia store для управления состоянием СМП данных

### Components
- `src/components/SMPCostSummary.vue` - Компонент отображения контрактных СМП и стоимости

## Типы данных

### SMPProvider
```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contractNumber?: string;
  contractDate?: string;
  isActive: boolean;
  serviceArea?: string;
  rating?: number;
}
```

### ServicePrice
```typescript
{
  id: string;
  serviceType: string;
  serviceName: string;
  basePrice: number;
  currency: string;
  unit: string; // 'per_call', 'per_hour', 'per_km', etc.
  description?: string;
  isActive: boolean;
}
```

### SMPCall
```typescript
{
  id: string;
  callId: string;
  smpProviderId: string;
  serviceType: string;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  calledAt: string;
  completedAt?: string;
  notes?: string;
  smpProvider?: SMPProvider;
}
```

### SMPStats
```typescript
{
  totalProviders: number;
  activeProviders: number;
  totalCalls: number;
  totalCost: number;
  period: {
    from: string;
    to: string;
  };
  byProvider: SMPCostSummary[];
}
```

## API Endpoints (требуют реализации на backend)

### Получение провайдеров СМП
```
GET /api/v1/dispatcher/smp/providers
GET /api/v1/dispatcher/smp/providers/:id
```

### Управление стоимостью услуг
```
GET /api/v1/dispatcher/smp/service-prices
GET /api/v1/dispatcher/smp/service-prices/:serviceType
```

### Вызовы СМП
```
GET /api/v1/dispatcher/smp/calls
POST /api/v1/dispatcher/smp/calls
```

### Статистика стоимости
```
GET /api/v1/dispatcher/smp/cost-summary
Query params:
  - from: string (YYYY-MM-DD)
  - to: string (YYYY-MM-DD)
  - providerId?: string
```

## Следующие шаги

Для полной функциональности необходимо:

1. **Backend реализация**:
   - Создать таблицы для СМП провайдеров, стоимости услуг и вызовов СМП
   - Реализовать API endpoints в dispatcher-service
   - Добавить логику расчета стоимости и статистики

2. **Миграции БД**:
   ```sql
   CREATE TABLE dispatcher.smp_providers (...);
   CREATE TABLE dispatcher.service_prices (...);
   CREATE TABLE dispatcher.smp_calls (...);
   ```

3. **Интеграция**:
   - Связать вызовы диспетчера с вызовами СМП
   - Автоматически создавать записи о вызовах СМП при эскалации
   - Рассчитывать стоимость на основе прайс-листа

## Использование

Компонент `SMPCostSummary` автоматически загружается на главном экране диспетчера (`DashboardView`).

При первом открытии компонент:
1. Загружает базу стоимости услуг
2. Запрашивает статистику за текущий месяц
3. Отображает данные в удобном табличном формате

Пользователь может:
- Выбрать период для анализа
- Раскрыть детали по каждой компании
- Просмотреть базу стоимости услуг
- Видеть визуализацию распределения затрат

## Стилизация

Все компоненты используют CSS переменные для темизации:
- `--card-bg` - фон карточек
- `--primary-color` - основной цвет
- `--text-secondary` - вторичный текст
- `--border-color` - цвет границ
- `--shadow` - тени







