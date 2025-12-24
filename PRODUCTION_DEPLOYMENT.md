# Инструкция по развертыванию на сервере с доменом

Полная инструкция по развертыванию Care Monitoring System на production сервере с настройкой домена и SSL сертификатов.

## Предварительные требования

### Серверные требования

- **ОС**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+ (рекомендуется Ubuntu 22.04 LTS)
- **CPU**: 4+ ядер
- **RAM**: 8+ GB (рекомендуется 16 GB)
- **Disk**: 50+ GB SSD
- **Сеть**: Статический IP адрес
- **Домен**: Зарегистрированный домен с возможностью управления DNS записями

### Установленное ПО на сервере

- Docker 20.10+
- Docker Compose 2.0+
- Nginx (для reverse proxy)
- Certbot (для SSL сертификатов)

## Шаг 1: Подготовка сервера

### 1.1. Обновление системы

```bash
# Ubuntu/Debian
sudo apt update
sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 1.2. Установка Docker и Docker Compose

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo apt install docker-compose-plugin  # Ubuntu/Debian
# или
sudo yum install docker-compose-plugin  # CentOS/RHEL

# Перелогиньтесь для применения изменений
exit
# Войдите снова через SSH

# Проверка
docker --version
docker compose version
```

### 1.3. Установка Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y

# Запуск и автозапуск
sudo systemctl start nginx
sudo systemctl enable nginx

# Проверка
sudo systemctl status nginx
```

### 1.4. Установка Certbot (для SSL)

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y
```

### 1.5. Настройка файрвола

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Шаг 2: Настройка DNS

### 2.1. Настройка A-записей

В панели управления DNS вашего домена создайте следующие записи:

```
Тип    Имя              Значение          TTL
A      @                YOUR_SERVER_IP    3600
A      api              YOUR_SERVER_IP    3600
A      guardian         YOUR_SERVER_IP    3600
A      dispatcher       YOUR_SERVER_IP    3600
A      admin            YOUR_SERVER_IP    3600
A      www              YOUR_SERVER_IP    3600
```

**Пример:**
- Домен: `care-monitoring.ru`
- IP сервера: `192.0.2.1`

Записи:
- `care-monitoring.ru` → `192.0.2.1`
- `api.care-monitoring.ru` → `192.0.2.1`
- `guardian.care-monitoring.ru` → `192.0.2.1`
- `dispatcher.care-monitoring.ru` → `192.0.2.1`
- `admin.care-monitoring.ru` → `192.0.2.1`
- `www.care-monitoring.ru` → `192.0.2.1`

### 2.2. Проверка DNS

Дождитесь распространения DNS (обычно 5-60 минут) и проверьте:

```bash
# Проверка DNS записей
nslookup care-monitoring.ru
nslookup api.care-monitoring.ru
nslookup guardian.care-monitoring.ru

# Или
dig care-monitoring.ru
dig api.care-monitoring.ru
```

## Шаг 3: Клонирование и подготовка проекта

### 3.1. Клонирование репозитория

```bash
# Создание директории для проектов
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

# Клонирование репозитория
git clone https://github.com/your-org/care-monitoring.git
cd care-monitoring
```

### 3.2. Создание .env файлов для production

```bash
# Создание всех .env файлов
find . -name "env.example" -type f | while read f; do
    envFile="${f%.example}"
    if [ ! -f "$envFile" ]; then
        cp "$f" "$envFile"
        echo "Created: $envFile"
    fi
done
```

### 3.3. Настройка production переменных окружения

**infrastructure/.env:**
```env
POSTGRES_USER=cms_user
POSTGRES_PASSWORD=CHANGE_TO_STRONG_PASSWORD
POSTGRES_DB=care_monitoring
POSTGRES_PORT=5432

REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_TO_STRONG_PASSWORD

RABBITMQ_DEFAULT_USER=cms
RABBITMQ_DEFAULT_PASS=CHANGE_TO_STRONG_PASSWORD
RABBITMQ_DEFAULT_VHOST=/
RABBITMQ_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672

NETWORK_NAME=care-monitoring-network
ENVIRONMENT=production
```

**api-gateway/.env:**
```env
NODE_ENV=production
PORT=3000
API_VERSION=v1

# КРИТИЧЕСКИ ВАЖНО: Используйте криптографически стойкий случайный ключ!
JWT_SECRET=GENERATE_STRONG_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=GENERATE_STRONG_SECRET_MIN_32_CHARS
JWT_REFRESH_EXPIRES_IN=7d

# Внутри Docker сети используйте имена сервисов
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
DEVICE_SERVICE_URL=http://device-service:3003
TELEMETRY_SERVICE_URL=http://telemetry-service:3004
ALERT_SERVICE_URL=http://alert-service:3005
LOCATION_SERVICE_URL=http://location-service:3006
BILLING_SERVICE_URL=http://billing-service:3007
INTEGRATION_SERVICE_URL=http://integration-service:3008
DISPATCHER_SERVICE_URL=http://dispatcher-service:3009
ANALYTICS_SERVICE_URL=http://analytics-service:3010
AI_PREDICTION_SERVICE_URL=http://ai-prediction-service:3011
ORGANIZATION_SERVICE_URL=http://organization-service:3012

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_TO_STRONG_PASSWORD

CORS_ORIGIN=https://care-monitoring.ru,https://guardian.care-monitoring.ru,https://dispatcher.care-monitoring.ru,https://admin.care-monitoring.ru
CORS_CREDENTIALS=true

LOG_LEVEL=info
LOG_FORMAT=json
```

**Генерация безопасных секретов:**
```bash
# Генерация JWT_SECRET (32 байта в base64)
openssl rand -base64 32

# Генерация паролей
openssl rand -base64 24
```

**Важно:** `JWT_SECRET` и `JWT_REFRESH_SECRET` должны быть одинаковыми во всех сервисах!

**Настройка микросервисов:**

Для каждого микросервиса в `microservices/*/.env`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://cms_user:CHANGE_TO_STRONG_PASSWORD@postgres:5432/auth_db
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_TO_STRONG_PASSWORD
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=cms
RABBITMQ_PASSWORD=CHANGE_TO_STRONG_PASSWORD
JWT_SECRET=SAME_AS_IN_API_GATEWAY
JWT_REFRESH_SECRET=SAME_AS_IN_API_GATEWAY
```

**Настройка frontend приложений:**

Для каждого frontend приложения в `frontend/apps/*/.env`:

```env
VITE_API_URL=https://api.care-monitoring.ru/api/v1
VITE_WS_URL=wss://api.care-monitoring.ru
```

### 3.4. Сборка Docker образов

```bash
# Сборка всех образов
docker compose -f docker-compose.services.yml build

# Или через скрипт (если доступен)
./scripts/build-docker.sh production
```

## Шаг 4: Развертывание инфраструктуры и сервисов

### 4.1. Запуск инфраструктуры

```bash
cd infrastructure
docker compose up -d
cd ..
```

**Проверка:**
```bash
docker ps
```

Должны быть запущены: postgres, redis, rabbitmq

### 4.2. Применение миграций

```bash
# Установка зависимостей (если требуется для миграций)
npm install

# Применение миграций
npm run db:migrate

# Создание дефолтных пользователей (опционально, только для тестирования)
# npm run db:seed
```

### 4.3. Запуск всех сервисов

```bash
docker compose -f docker-compose.services.yml up -d
```

**Проверка:**
```bash
docker ps
docker compose -f docker-compose.services.yml ps
```

Все сервисы должны быть в статусе `Up`.

## Шаг 5: Настройка Nginx reverse proxy

### 5.1. Создание конфигурации Nginx

Создайте файл `/etc/nginx/sites-available/care-monitoring`:

```nginx
# API Gateway
upstream api_gateway {
    server localhost:3000;
}

# Guardian App
upstream guardian_app {
    server localhost:5173;
}

# Dispatcher App
upstream dispatcher_app {
    server localhost:5174;
}

# Admin App
upstream admin_app {
    server localhost:5185;
}

# Landing App
upstream landing_app {
    server localhost:5175;
}

# API Domain (api.care-monitoring.ru)
server {
    listen 80;
    server_name api.care-monitoring.ru;

    # Лимит размера тела запроса (для загрузки файлов)
    client_max_body_size 10M;

    location / {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты для WebSocket
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://api_gateway/health;
        access_log off;
    }
}

# Guardian App (guardian.care-monitoring.ru)
server {
    listen 80;
    server_name guardian.care-monitoring.ru;

    location / {
        proxy_pass http://guardian_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Dispatcher App (dispatcher.care-monitoring.ru)
server {
    listen 80;
    server_name dispatcher.care-monitoring.ru;

    location / {
        proxy_pass http://dispatcher_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin App (admin.care-monitoring.ru)
server {
    listen 80;
    server_name admin.care-monitoring.ru;

    location / {
        proxy_pass http://admin_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Landing Page (care-monitoring.ru и www.care-monitoring.ru)
server {
    listen 80;
    server_name care-monitoring.ru www.care-monitoring.ru;

    location / {
        proxy_pass http://landing_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2. Активация конфигурации

```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/care-monitoring /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (если не нужна)
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

## Шаг 6: Настройка SSL сертификатов (Let's Encrypt)

### 6.1. Получение SSL сертификатов

```bash
# Получение сертификатов для всех доменов
sudo certbot --nginx -d care-monitoring.ru -d www.care-monitoring.ru -d api.care-monitoring.ru -d guardian.care-monitoring.ru -d dispatcher.care-monitoring.ru -d admin.care-monitoring.ru

# Следуйте инструкциям Certbot:
# - Введите email для уведомлений
# - Примите условия использования
# - Выберите, перенаправлять ли HTTP на HTTPS (рекомендуется: Yes)
```

Certbot автоматически обновит конфигурацию Nginx для использования SSL.

### 6.2. Автоматическое обновление сертификатов

Certbot автоматически настроит cron задачу для обновления сертификатов. Проверьте:

```bash
# Проверка автоматического обновления
sudo certbot renew --dry-run
```

## Шаг 7: Настройка автозапуска

### 7.1. Автозапуск Docker контейнеров

Docker Compose по умолчанию использует `restart: unless-stopped` для автозапуска. Проверьте в `docker-compose.services.yml`.

Для создания systemd сервиса:

```bash
# Создание сервиса для инфраструктуры
sudo nano /etc/systemd/system/care-monitoring-infra.service
```

Содержимое:
```ini
[Unit]
Description=Care Monitoring Infrastructure
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/care-monitoring/infrastructure
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Создание сервиса для приложения
sudo nano /etc/systemd/system/care-monitoring-app.service
```

Содержимое:
```ini
[Unit]
Description=Care Monitoring Application
Requires=docker.service care-monitoring-infra.service
After=docker.service care-monitoring-infra.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/care-monitoring
ExecStart=/usr/bin/docker compose -f docker-compose.services.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.services.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Активация сервисов
sudo systemctl daemon-reload
sudo systemctl enable care-monitoring-infra
sudo systemctl enable care-monitoring-app
```

## Шаг 8: Проверка работоспособности

### 8.1. Проверка API

```bash
# Health check
curl https://api.care-monitoring.ru/health

# Проверка через браузер
# https://api.care-monitoring.ru/health
```

### 8.2. Проверка Frontend приложений

Откройте в браузере:
- https://care-monitoring.ru (Landing)
- https://guardian.care-monitoring.ru (Guardian App)
- https://dispatcher.care-monitoring.ru (Dispatcher App)
- https://admin.care-monitoring.ru (Admin App)

### 8.3. Проверка SSL

```bash
# Проверка SSL сертификата
openssl s_client -connect api.care-monitoring.ru:443 -servername api.care-monitoring.ru

# Или используйте онлайн сервисы:
# https://www.ssllabs.com/ssltest/
```

## Шаг 9: Мониторинг и логирование

### 9.1. Просмотр логов

```bash
# Логи всех сервисов
docker compose -f docker-compose.services.yml logs -f

# Логи конкретного сервиса
docker compose -f docker-compose.services.yml logs -f api-gateway

# Логи инфраструктуры
docker compose -f infrastructure/docker-compose.yml logs -f
```

### 9.2. Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
df -h

# Использование памяти
free -h
```

### 9.3. Настройка Prometheus и Grafana (опционально)

Если требуется расширенный мониторинг, см. `monitoring/README.md`.

## Шаг 10: Резервное копирование

### 10.1. Резервное копирование базы данных

Создайте скрипт `/var/www/care-monitoring/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/care-monitoring"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Резервное копирование PostgreSQL
docker exec care-monitoring-postgres pg_dump -U cms_user care_monitoring | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

```bash
# Сделать скрипт исполняемым
chmod +x /var/www/care-monitoring/backup.sh

# Добавить в cron (ежедневно в 2:00)
crontab -e
# Добавить строку:
# 0 2 * * * /var/www/care-monitoring/backup.sh >> /var/log/care-monitoring-backup.log 2>&1
```

## Безопасность

### Рекомендации по безопасности

1. **Измените все дефолтные пароли** на сильные случайные пароли
2. **Используйте firewall** для ограничения доступа
3. **Регулярно обновляйте систему** и Docker образы
4. **Настройте rate limiting** в Nginx
5. **Используйте fail2ban** для защиты от брутфорса
6. **Настройте логирование** и мониторинг
7. **Регулярно делайте резервные копии**
8. **Не храните секреты в Git** - используйте секрет-хранилища

### Установка fail2ban

```bash
# Установка
sudo apt install fail2ban -y  # Ubuntu/Debian
sudo yum install fail2ban -y  # CentOS/RHEL

# Запуск
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Проверка
sudo fail2ban-client status
```

## Обновление приложения

### Процесс обновления

```bash
cd /var/www/care-monitoring

# Получение последних изменений
git pull

# Пересборка образов
docker compose -f docker-compose.services.yml build

# Применение миграций (если есть)
npm run db:migrate

# Перезапуск сервисов
docker compose -f docker-compose.services.yml down
docker compose -f docker-compose.services.yml up -d

# Проверка
docker compose -f docker-compose.services.yml ps
curl https://api.care-monitoring.ru/health
```

## Troubleshooting

### Проблема: Сервисы не запускаются

```bash
# Проверка логов
docker compose -f docker-compose.services.yml logs

# Проверка статуса контейнеров
docker ps -a

# Проверка использования ресурсов
docker stats
df -h
free -h
```

### Проблема: SSL сертификат не работает

```bash
# Проверка конфигурации Nginx
sudo nginx -t

# Проверка сертификатов
sudo certbot certificates

# Обновление сертификатов вручную
sudo certbot renew
sudo systemctl reload nginx
```

### Проблема: 502 Bad Gateway

1. Проверьте, что сервисы запущены: `docker ps`
2. Проверьте логи: `docker compose logs api-gateway`
3. Проверьте, что порты не заняты: `netstat -tlnp | grep 3000`
4. Проверьте конфигурацию Nginx: `sudo nginx -t`

## Полезные команды

```bash
# Остановка всех сервисов
docker compose -f docker-compose.services.yml down
cd infrastructure && docker compose down && cd ..

# Запуск всех сервисов
cd infrastructure && docker compose up -d && cd ..
docker compose -f docker-compose.services.yml up -d

# Перезапуск конкретного сервиса
docker compose -f docker-compose.services.yml restart api-gateway

# Просмотр логов в реальном времени
docker compose -f docker-compose.services.yml logs -f api-gateway

# Вход в контейнер
docker exec -it care-monitoring-api-gateway-1 sh

# Проверка подключения к базе данных
docker exec -it care-monitoring-postgres-1 psql -U cms_user -d care_monitoring
```

## Чеклист развертывания

- [ ] Сервер подготовлен и обновлен
- [ ] Docker и Docker Compose установлены
- [ ] Nginx установлен и настроен
- [ ] DNS записи настроены и проверены
- [ ] Проект склонирован на сервер
- [ ] Все `.env` файлы созданы и настроены
- [ ] Все пароли и секреты изменены на безопасные
- [ ] Инфраструктура запущена (PostgreSQL, Redis, RabbitMQ)
- [ ] Миграции применены
- [ ] Все сервисы запущены через Docker Compose
- [ ] Nginx настроен как reverse proxy
- [ ] SSL сертификаты получены и настроены
- [ ] Автозапуск настроен
- [ ] Резервное копирование настроено
- [ ] Мониторинг настроен (опционально)
- [ ] Firewall настроен
- [ ] Все endpoints проверены и работают
- [ ] Frontend приложения доступны по доменам

---

**Поздравляем! Проект развернут на production сервере! 🎉**

