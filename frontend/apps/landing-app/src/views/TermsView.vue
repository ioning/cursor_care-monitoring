<template>
  <main class="legal">
    <div class="container">
      <header class="legal-header">
        <h1 class="legal-title">Пользовательское соглашение</h1>
        <p class="legal-subtitle">
          Условия использования сервиса Care Monitoring. Текст является шаблоном и должен быть
          адаптирован под юридические требования вашей компании.
        </p>
      </header>

      <section class="legal-section">
        <h2>1. Термины</h2>
        <p>
          <strong>Сервис</strong> — программный комплекс Care Monitoring (веб‑приложения и мобильные приложения).
          <strong>Пользователь</strong> — лицо, использующее сервис.
        </p>
      </section>

      <section class="legal-section">
        <h2>2. Предмет</h2>
        <p>
          Сервис предоставляет инструменты мониторинга показателей и уведомлений. Care Monitoring не является
          медицинской организацией и не заменяет консультацию врача. При ухудшении самочувствия необходимо
          обращаться к медицинским специалистам.
        </p>
      </section>

      <section class="legal-section">
        <h2>3. Регистрация и доступ</h2>
        <ul>
          <li>Пользователь обязуется предоставлять достоверные данные при регистрации.</li>
          <li>Пользователь отвечает за сохранность учетных данных и токенов доступа.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>4. Ограничения ответственности</h2>
        <p>
          Мы не гарантируем отсутствие технических сбоев и не несем ответственности за последствия,
          вызванные некорректной настройкой устройств, отсутствием связи, отключением датчиков,
          либо предоставлением неверных данных.
        </p>
      </section>

      <section class="legal-section">
        <h2>5. Интеллектуальная собственность</h2>
        <p>
          Все права на программное обеспечение, дизайн и материалы сайта принадлежат правообладателю.
          Запрещено копирование и распространение без разрешения.
        </p>
      </section>

      <section class="legal-section">
        <h2>6. Обработка персональных данных</h2>
        <p>
          Порядок обработки данных описан в документе
          <RouterLink to="/privacy" class="link">«Политика конфиденциальности»</RouterLink>.
        </p>
      </section>

      <section class="legal-section">
        <h2>7. Контакты</h2>
        <p>
          По вопросам использования сервиса: <a href="mailto:support@caremonitoring.ru">support@caremonitoring.ru</a>
        </p>
      </section>

      <footer class="legal-footer">
        <RouterLink to="/" class="link">← На главную</RouterLink>
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.legal {
  padding: 7rem 0 4rem;
  background: #fff;
}
.legal-header {
  margin-bottom: 2rem;
}
.legal-title {
  font-size: 2.25rem;
  line-height: 1.2;
  margin: 0 0 0.75rem;
}
.legal-subtitle {
  color: var(--text-light);
  margin: 0;
  line-height: 1.7;
}
.legal-section {
  margin: 2rem 0;
}
.legal-section h2 {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
}
.legal-section p,
.legal-section li {
  line-height: 1.8;
  color: var(--text);
}
.legal-section ul {
  padding-left: 1.25rem;
}
.legal-footer {
  margin-top: 3rem;
}
.link {
  color: var(--primary);
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
</style>


