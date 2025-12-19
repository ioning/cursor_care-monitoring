<template>
  <main class="legal">
    <div class="container">
      <header class="legal-header">
        <h1 class="legal-title">Политика конфиденциальности</h1>
        <p class="legal-subtitle">
          Документ описывает, какие данные мы собираем, как их используем и какие у вас есть права.
        </p>
      </header>

      <section class="legal-section">
        <h2>1. Общие положения</h2>
        <p>
          Care Monitoring — сервис мониторинга здоровья и безопасности. Мы обрабатываем персональные данные
          в соответствии с применимым законодательством. Этот текст предназначен для ознакомления и может
          быть уточнён вашей юридической службой перед публикацией.
        </p>
      </section>

      <section class="legal-section">
        <h2>2. Какие данные мы обрабатываем</h2>
        <ul>
          <li><strong>Регистрационные данные</strong>: email, номер телефона, ФИО (если указано).</li>
          <li><strong>Данные аккаунта</strong>: роль пользователя, идентификаторы организаций/подопечных.</li>
          <li><strong>Технические данные</strong>: cookies, IP-адрес, user-agent, логи ошибок.</li>
          <li>
            <strong>Данные здоровья (если предоставлены)</strong>: показатели телеметрии (пульс, давление,
            сатурация, температура), события (алерты), история активности.
          </li>
          <li><strong>Геоданные (если включены)</strong>: координаты, геозоны, история перемещений.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>3. Цели обработки</h2>
        <ul>
          <li>предоставление функций сервиса и поддержка пользователей;</li>
          <li>уведомления о критических событиях и повышение безопасности;</li>
          <li>улучшение качества продукта, аналитика и диагностика ошибок;</li>
          <li>соблюдение требований безопасности и предотвращение злоупотреблений.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>4. Передача данных третьим лицам</h2>
        <p>
          Мы можем передавать данные подрядчикам (хостинг, уведомления, аналитика) исключительно в объёме,
          необходимом для работы сервиса. Передача медицинских данных возможна только при наличии
          законных оснований и/или согласия субъекта данных.
        </p>
      </section>

      <section class="legal-section">
        <h2>5. Безопасность</h2>
        <p>
          Мы используем организационные и технические меры защиты: разграничение доступа, аудит,
          шифрование при передаче данных и мониторинг инцидентов.
        </p>
      </section>

      <section class="legal-section">
        <h2>6. Ваши права</h2>
        <ul>
          <li>получать информацию об обработке ваших данных;</li>
          <li>требовать исправления неточностей;</li>
          <li>отзывать согласие (если применимо);</li>
          <li>запрашивать удаление данных в случаях, предусмотренных законом.</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>7. Контакты</h2>
        <p>
          По вопросам обработки данных: <a href="mailto:privacy@caremonitoring.ru">privacy@caremonitoring.ru</a>
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


