# Усиление защиты пользовательских данных

> Цель документа — зафиксировать дополнительные меры безопасности, которые можно внедрить поверх текущих улучшений (удаление hardcoded секретов, Helmet.js, проверка переменных окружения), чтобы минимизировать риск компрометации пользовательских данных.

## 1. Шифрование данных «на покое»
- **Transparent Data Encryption (TDE)** в PostgreSQL (через pgcrypto/LUKS/ZFS) для баз микроcервисов `user-service`, `location-service`, `telemetry-service`.
- **Полевая криптография** (envelope encryption) для PII: ФИО, адреса, телефоны, координаты; ключи хранить в HSM/Vault.
- **S3/Blob хранилище для аватаров** — включить серверное шифрование и объектные ACL.

## 2. Шифрование данных «в полёте»
- Обязательный **mTLS между microservices** в Service Mesh (Istio/Linkerd).
- HSTS уже включён, но нужно **подписывать TLS сертификаты** через ACME/Let's Encrypt и включить OCSP stapling.
- В мобильном приложении добавить **certificate pinning** (react-native-cert-pinner).

## 3. Управление секретами и доступом
- Перенести чувствительные настройки из `.env` в **HashiCorp Vault / AWS Secrets Manager**, выдавать динамические креды для PostgreSQL/RabbitMQ.
- Ввести **RBAC по принципу наименьших привилегий** для админ-панели и внутренних API (поддержка раздельных ролей «Security Officer», «Support», «Operator»).
- **Регулярная ротация ключей** (JWT, интеграции, платёжные токены) + автоматические напоминания.

## 4. Контроль аномалий и вторжений
- Развернуть **WAF/IDS (OWASP CRS + ModSecurity)** перед API Gateway.
- Включить **анализ логов** (Falco/Sysdig) для Kubernetes и хостов, алерты в Slack/Telegram при подозрительной активности.
- Добавить в mobile/web **поведенческую аналитику** для фиксации необычных действий (массовые экспорт/скачивания).

## 5. Защита конечных устройств и SDK
- Реализовать **device attestation** для мобильных клиентов (Firebase App Check или собственные токены устройства).
- Встроить **root/jailbreak detection** и запретить работу на скомпрометированных устройствах.
- Для guardian/dispatcher приложений включить **Content Security Policy report-uri** и Subresource Integrity.

## 6. План реагирования и обучение
- Подготовить **playbook инцидентов** (кто, что делает в первые 15/60 минут, какие коммуникации отправляются).
- Регулярные **table-top учения** и фишинг-симуляции для сотрудников диспетчерской.
- Вести **аудитные журналы** (immutable storage) для всех операций над данными wards/guardians.

## 7. Технические задачи к внедрению
1. Ввести KMS и envelope encryption в `user-service` для полей контактов.
2. Подготовить Helm чарты для Istio + mTLS, включить PeerAuthentication STRICT.
3. Настроить Vault Agent Injector для подстановки секретов в Pod'ы.
4. Добавить Background job, который сверяет целостность бэкапов и расшифровывает их в «песочнице».
5. Реализовать middleware в API Gateway, записывающее security-headers и детальную аудит-метку (request-id, actor-id, tenant).

## 8. Быстрые выигрыши (Quick Wins)
- Включить **rate limiting/slow-down** на уровне Gateway (nestjs-rate-limiter).
- Добавить **Content-Security-Policy report-to** + Endpoint для сбора отчётов.
- Блокировать входы с TOR/VPN через IP intelligence (ipinfo/ipdata).
- Обновить **password policy** (длина ≥ 12, zxcvbn score) + WebAuthn для staff.

Эти шаги можно реализовывать поэтапно, начиная с самых критичных (Vault + KMS + mTLS), затем переходя к мониторингу, WAF и процедурам реагирования.





