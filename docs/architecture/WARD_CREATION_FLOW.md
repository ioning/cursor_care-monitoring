# Процесс добавления подопечного (Ward Creation Flow)

## Обзор

Процесс добавления подопечного проходит через несколько слоев: Frontend → API Gateway → User Service → Database.

## Полный поток создания подопечного

### 1. Frontend (Guardian App)

**Файл:** `frontend/apps/guardian-app/src/views/WardsView.vue`

Пользователь заполняет форму в модальном окне:
- **Полное имя** (обязательное поле)
- **Дата рождения** (опционально)
- **Пол** (опционально: male, female, other)
- **Медицинская информация** (опционально)
- **Экстренный контакт** (опционально)

```vue
const handleSubmit = async () => {
  await wardsStore.createWard(form);
};
```

### 2. Store (Pinia)

**Файл:** `frontend/apps/guardian-app/src/stores/wards.ts`

Store вызывает API метод:

```typescript
const createWard = async (data: CreateWardDto) => {
  const response = await wardsApi.createWard(data);
  wards.value.push(response.data);
  return response.data;
};
```

### 3. API Client

**Файл:** `frontend/apps/guardian-app/src/api/wards.api.ts`

Выполняется POST запрос к API Gateway:

```typescript
createWard: async (data: CreateWardDto) => {
  const response = await apiClient.post('/users/wards', data);
  return response.data;
}
```

**Endpoint:** `POST /api/v1/users/wards`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

### 4. API Gateway

**Файл:** `api-gateway/src/controllers/user.controller.ts`

Gateway проксирует запрос в User Service:

```typescript
@Post('wards')
async createWard(@Request() req: any, @Body() createDto: any) {
  const userServiceUrl = this.gatewayConfig.getUserServiceUrl();
  const response = await firstValueFrom(
    this.httpService.post(`${userServiceUrl}/users/wards`, createDto, {
      headers: { Authorization: req.headers.authorization },
    }),
  );
  return response.data;
}
```

**Проверки:**
- JWT токен валиден (через `JwtAuthGuard`)
- Пользователь имеет роль `guardian`

### 5. User Service - Controller

**Файл:** `microservices/user-service/src/infrastructure/controllers/user.controller.ts`

Контроллер вызывает сервис:

```typescript
@Post('wards')
async createWard(@Request() req: any, @Body() createWardDto: CreateWardDto) {
  return this.wardService.create(req.user.id, createWardDto);
}
```

**Извлекается:**
- `guardianId` из JWT токена (`req.user.id`)
- Данные подопечного из тела запроса

### 6. User Service - Service Layer

**Файл:** `microservices/user-service/src/application/services/ward.service.ts`

#### Шаг 6.1: Генерация UUID

```typescript
const wardId = randomUUID();
```

#### Шаг 6.2: Получение информации об опекуне

```typescript
const guardian = await this.userRepository.findById(guardianId);
if (!guardian) {
  throw new NotFoundException('Guardian not found');
}
```

**Получается:**
- `organizationId` опекуна (для изоляции tenant'ов)

#### Шаг 6.3: Создание записи подопечного в БД

```typescript
const ward = await this.wardRepository.create({
  id: wardId,
  ...createWardDto,
  organizationId: guardian.organizationId,
});
```

**Вставляется в таблицу `wards`:**
- `id` (UUID)
- `full_name`
- `date_of_birth`
- `gender`
- `medical_info`
- `emergency_contact`
- `organization_id`
- `status` (по умолчанию 'active')
- `created_at`, `updated_at`

#### Шаг 6.4: Создание связи опекун-подопечный

```typescript
await this.guardianWardRepository.create({
  guardianId,
  wardId,
  relationship: createWardDto.relationship || 'ward',
});
```

**Вставляется в таблицу `guardian_wards`:**
- `guardian_id`
- `ward_id`
- `relationship` (по умолчанию 'ward')
- `created_at`

#### Шаг 6.5: Опционально - создание аккаунта для подопечного

**Если указан телефон (`createWardDto.phone`):**

1. **Генерация временного пароля:**
   ```typescript
   temporaryPassword = this.generateTemporaryPassword();
   ```

2. **Создание пользователя в Auth Service:**
   ```typescript
   await this.authServiceClient.createWardUser({
     id: wardId,
     fullName: createWardDto.fullName,
     phone: createWardDto.phone,
     password: temporaryPassword,
     organizationId: guardian.organizationId,
   });
   ```
   
   **Создается пользователь в `auth.users`:**
   - `id` (тот же UUID, что у подопечного)
   - `email` (генерируется из телефона)
   - `password_hash` (хэшированный временный пароль)
   - `role` = 'ward'
   - `organization_id`

3. **Отправка SMS с учетными данными:**
   ```typescript
   await this.integrationServiceClient.sendSms({
     to: createWardDto.phone,
     message: smsMessage, // Содержит временный пароль
   });
   ```

**Важно:** Если создание аккаунта или отправка SMS не удались, создание подопечного все равно завершается успешно (ошибка логируется, но не прерывает процесс).

#### Шаг 6.6: Возврат результата

```typescript
return {
  success: true,
  data: ward,
  message: 'Ward created successfully',
  accountCreated, // true, если аккаунт создан
  // В development режиме также возвращается temporaryPassword
};
```

### 7. База данных

**Таблицы, которые изменяются:**

1. **`user_db.wards`**
   ```sql
   INSERT INTO wards (
     id, full_name, date_of_birth, gender, 
     medical_info, emergency_contact, organization_id, status
   ) VALUES (...)
   ```

2. **`user_db.guardian_wards`**
   ```sql
   INSERT INTO guardian_wards (
     guardian_id, ward_id, relationship
   ) VALUES (...)
   ```

3. **`auth_db.users`** (опционально, если указан телефон)
   ```sql
   INSERT INTO auth.users (
     id, email, password_hash, phone, full_name, role, organization_id
   ) VALUES (...)
   ```

## Валидация данных

**На уровне DTO (`CreateWardDto`):**
- `fullName`: обязательное поле, строка
- `phone`: опционально, формат `+7XXXXXXXXXX` (валидируется через regex)
- `dateOfBirth`: опционально, формат ISO date string
- `gender`: опционально, enum ['male', 'female', 'other']
- `relationship`: опционально, enum ['ward', 'parent', 'relative']
- `medicalInfo`: опционально, строка
- `emergencyContact`: опционально, строка

## Особенности

### 1. Tenant Isolation

Подопечный создается с `organizationId` опекуна для изоляции данных между организациями.

### 2. Связь опекун-подопечный

Создается связь в таблице `guardian_wards`, которая позволяет:
- Опекуну видеть всех своих подопечных
- Подопечному видеть всех своих опекунов
- Настраивать права доступа

### 3. Опциональное создание аккаунта

Если указан телефон, автоматически:
- Создается пользователь в Auth Service с ролью 'ward'
- Генерируется временный пароль
- Отправляется SMS с учетными данными

### 4. Отказоустойчивость

Если создание аккаунта или отправка SMS не удались, подопечный все равно создается успешно. Это позволяет опекуну создать аккаунт позже.

### 5. Development режим

В development режиме (`NODE_ENV=development`) в ответе возвращается `temporaryPassword` для упрощения тестирования.

## Пример запроса

```http
POST /api/v1/users/wards
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "fullName": "Иванов Иван Иванович",
  "dateOfBirth": "1950-01-15",
  "gender": "male",
  "medicalInfo": "Гипертония, требует регулярный контроль давления",
  "emergencyContact": "+79991234567"
}
```

## Пример ответа

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Иванов Иван Иванович",
    "dateOfBirth": "1950-01-15",
    "gender": "male",
    "medicalInfo": "Гипертония, требует регулярный контроль давления",
    "emergencyContact": "+79991234567",
    "organizationId": "org-123",
    "status": "active",
    "createdAt": "2025-12-25T19:00:00Z",
    "updatedAt": "2025-12-25T19:00:00Z"
  },
  "message": "Ward created successfully",
  "accountCreated": false
}
```

## Связанные сервисы

- **Auth Service**: создание пользователя для подопечного (если указан телефон)
- **Integration Service**: отправка SMS с учетными данными
- **User Service**: основная логика создания подопечного

