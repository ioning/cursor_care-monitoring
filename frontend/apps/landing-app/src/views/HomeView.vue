<template>
    <!-- Navigation -->
    <nav class="navbar">
      <div class="container">
        <div class="nav-content">
          <div class="logo">
            <span class="logo-icon">🏥</span>
            <span class="logo-text">Care Monitoring</span>
          </div>
          <div class="nav-links">
            <a href="#features" class="nav-link">Возможности</a>
            <a href="#mobile-apps" class="nav-link">Приложения</a>
            <a href="#health-articles" class="nav-link">О здоровье</a>
            <a href="#business" class="nav-link">Для бизнеса</a>
            <a href="#pricing" class="nav-link">Тарифы</a>
            <a href="#contact" class="nav-link">Контакты</a>
            <RouterLink to="/login" class="btn btn-outline">Войти</RouterLink>
            <RouterLink to="/register" class="btn btn-primary">Начать</RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-background">
        <div class="hero-gradient"></div>
        <div class="hero-pattern"></div>
      </div>
      <div class="container">
        <div class="hero-wrapper">
          <div class="hero-content">
            <div class="hero-badge">
              <span class="badge-icon">✨</span>
              <span class="badge-text">Лидер рынка телемедицины 2024</span>
            </div>
            <h1 class="hero-title">
              Забота о здоровье близких<br />
              <span class="gradient-text">с искусственным интеллектом</span>
            </h1>
            <p class="hero-subtitle">
              Профессиональная система мониторинга здоровья с предиктивной аналитикой, экстренными
              вызовами и круглосуточным наблюдением. <strong>Спасаем жизни каждый день.</strong>
            </p>
            <div class="hero-actions">
              <RouterLink to="/register" class="btn btn-primary btn-large btn-pulse">
                <span>Начать бесплатно</span>
                <span class="btn-icon">→</span>
              </RouterLink>
              <a href="#demo" class="btn btn-secondary btn-large">
                <span>Посмотреть демо</span>
                <span class="btn-icon">▶</span>
              </a>
            </div>
            <div class="hero-guarantee">
              <span class="guarantee-icon">✓</span>
              <span class="guarantee-text">14 дней бесплатно • Без кредитной карты • Отмена в любой момент</span>
            </div>
            <div class="hero-stats">
              <div class="stat">
                <div class="stat-value" data-count="10000">0</div>
                <div class="stat-label">Довольных пользователей</div>
              </div>
              <div class="stat">
                <div class="stat-value" data-count="99.9">0</div>
                <div class="stat-label">Точность предсказаний</div>
              </div>
              <div class="stat">
                <div class="stat-value">24/7</div>
                <div class="stat-label">Поддержка и мониторинг</div>
              </div>
              <div class="stat">
                <div class="stat-value" data-count="500">0</div>
                <div class="stat-label">Спасенных жизней</div>
              </div>
            </div>
          </div>
          <div class="hero-image">
            <div class="hero-image-wrapper">
              <div class="heart-container">
                <div class="heart-glow"></div>
                <div class="pulsating-heart"></div>
                <div class="heart-ripple heart-ripple-1"></div>
                <div class="heart-ripple heart-ripple-2"></div>
                <div class="heart-ripple heart-ripple-3"></div>
              </div>
              <div class="hero-floating-badge hero-badge-1">
                <span class="badge-icon-small">🔔</span>
                <span>Мгновенные уведомления</span>
              </div>
              <div class="hero-floating-badge hero-badge-2">
                <span class="badge-icon-small">📊</span>
                <span>AI аналитика</span>
              </div>
              <div class="hero-floating-badge hero-badge-3">
                <span class="badge-icon-small">🚑</span>
                <span>Автовызов СМП</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="section features-section">
      <div class="container">
        <h2 class="section-title">Возможности системы</h2>
        <p class="section-subtitle">
          Все необходимое для эффективного мониторинга здоровья и обеспечения безопасности
        </p>
        <div class="grid grid-3">
          <div class="feature-card card">
            <FeatureIllustration type="telemetry" />
            <h3 class="feature-title">Телеметрия в реальном времени</h3>
            <p class="feature-description">
              Непрерывный мониторинг жизненно важных показателей: пульс, давление, уровень
              кислорода, активность
            </p>
          </div>
          <div class="feature-card card">
            <FeatureIllustration type="ai" />
            <h3 class="feature-title">AI-предсказания</h3>
            <p class="feature-description">
              Предиктивная аналитика для раннего выявления рисков падений и ухудшения здоровья
            </p>
          </div>
          <div class="feature-card card">
            <FeatureIllustration type="emergency" />
            <h3 class="feature-title">Экстренные вызовы</h3>
            <p class="feature-description">
              Мгновенные уведомления и автоматический вызов СМП при критических ситуациях
            </p>
          </div>
          <div class="feature-card card">
            <FeatureIllustration type="location" />
            <h3 class="feature-title">Геолокация</h3>
            <p class="feature-description">
              Точное определение местоположения для быстрого реагирования в экстренных случаях
            </p>
          </div>
          <div class="feature-card card">
            <FeatureIllustration type="mobile" />
            <h3 class="feature-title">Мобильные приложения</h3>
            <p class="feature-description">
              Удобные приложения для опекунов и диспетчеров с push-уведомлениями
            </p>
          </div>
          <div class="feature-card card">
            <FeatureIllustration type="analytics" />
            <h3 class="feature-title">Аналитика и отчеты</h3>
            <p class="feature-description">
              Детальная аналитика здоровья, тренды и отчеты для врачей и опекунов
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Mobile Apps Section -->
    <section id="mobile-apps" class="section mobile-apps-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Мобильные приложения</h2>
          <p class="section-subtitle">
            Скачайте наши приложения для iOS и Android и оставайтесь на связи с близкими в любое время
          </p>
        </div>
        <div class="mobile-apps-grid">
          <div class="app-download-card card">
            <div class="app-icon">👤</div>
            <h3 class="app-title">Для подопечных</h3>
            <p class="app-description">
              Приложение для мониторинга здоровья, отслеживания показателей и экстренных вызовов
            </p>
            <div class="app-badges">
              <a
                href="https://apps.apple.com/app/care-monitoring-ward"
                target="_blank"
                rel="noopener noreferrer"
                class="app-badge"
              >
                <img
                  src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/ru-ru?size=250x83&releaseDate=1704067200"
                  alt="Скачать в App Store"
                  class="badge-image"
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=ru.caremonitoring.ward"
                target="_blank"
                rel="noopener noreferrer"
                class="app-badge"
              >
                <img
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/ru_badge_web_generic.png"
                  alt="Доступно в Google Play"
                  class="badge-image"
                />
              </a>
            </div>
          </div>
          <div class="app-download-card card">
            <div class="app-icon">👨‍👩‍👧‍👦</div>
            <h3 class="app-title">Для опекунов</h3>
            <p class="app-description">
              Приложение для опекунов с уведомлениями, аналитикой и управлением подопечным</p>
            </div>
          </div>
        </div>
    </section>




    <section id="health-articles" class="section health-articles-section">
      <div class="container">
        <h2 class="section-title">Немного о здоровье</h2>
        <div class="health-articles-grid">
          <article class="article-card card">
            <HealthIllustration type="heart" />
            <h3 class="article-title">Сердечно-сосудистые проблемы</h3>
            <p class="article-description">
              Нестабильное артериальное давление, аритмия и другие сердечные проблемы требуют
              постоянного мониторинга. Система отслеживает показатели в реальном времени.
            </p>
            <ul class="article-points">
              <li>Мониторинг давления и пульса</li>
              <li>Выявление аритмий</li>
              <li>Немедленные уведомления</li>
            </ul>
          </article>

          <article class="article-card card">
            <HealthIllustration type="breathing" />
            <h3 class="article-title">Дыхательные нарушения</h3>
            <p class="article-description">
              Снижение уровня кислорода в крови может быть критическим. Система отслеживает
              сатурацию и частоту дыхания для раннего выявления проблем.
            </p>
            <ul class="article-points">
              <li>Мониторинг сатурации кислорода</li>
              <li>Анализ частоты дыхания</li>
              <li>Автоматические алерты</li>
            </ul>
          </article>

          <article class="article-card card">
            <HealthIllustration type="temperature" />
            <h3 class="article-title">Критические изменения температуры</h3>
            <p class="article-description">
              Резкие изменения температуры тела могут указывать на серьезные проблемы со здоровьем.
              Система отслеживает температуру и предупреждает о критических значениях.
            </p>
            <ul class="article-points">
              <li>Непрерывный мониторинг температуры</li>
              <li>Выявление лихорадки и гипотермии</li>
              <li>Экстренные уведомления</li>
            </ul>
          </article>

          <article class="article-card card">
            <HealthIllustration type="sleep" />
            <h3 class="article-title">Нарушения сна и активности</h3>
            <p class="article-description">
              Изменения в паттернах сна и снижение активности могут быть ранними признаками проблем
              со здоровьем. Система анализирует активность и сон.
            </p>
            <ul class="article-points">
              <li>Отслеживание активности</li>
              <li>Анализ качества сна</li>
              <li>Выявление аномалий</li>
            </ul>
          </article>

          <article class="article-card card">
            <HealthIllustration type="emergency" />
            <h3 class="article-title">Экстренные ситуации</h3>
            <p class="article-description">
              В критических ситуациях каждая секунда на счету. Система автоматически вызывает
              скорую помощь и уведомляет опекунов при обнаружении критических показателей.
            </p>
            <ul class="article-points">
              <li>Автоматический вызов СМП</li>
              <li>Мгновенные уведомления</li>
              <li>Передача данных врачам</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- Business Section -->
    <section id="business" class="section business-section">
      <div class="container">
        <div class="business-header">
          <h2 class="section-title">Решения для бизнеса</h2>
          <p class="section-subtitle">
            Комплексные решения для медицинских учреждений, пансионатов и организаций по уходу
          </p>
        </div>
        
        <div class="business-illustration-wrapper">
          <BusinessIllustration />
        </div>

        <div class="business-benefits">
          <div class="business-benefit card">
            <div class="benefit-icon">🏥</div>
            <h3 class="benefit-title">Для медицинских учреждений</h3>
            <p class="benefit-description">
              Интеграция с медицинскими информационными системами, автоматизация мониторинга
              пациентов, снижение нагрузки на персонал на 40%.
            </p>
            <ul class="benefit-list">
              <li>✓ Интеграция с МИС</li>
              <li>✓ Автоматизация отчетности</li>
              <li>✓ Снижение нагрузки на персонал</li>
              <li>✓ Улучшение качества ухода</li>
            </ul>
          </div>

          <div class="business-benefit card">
            <div class="benefit-icon">🏛️</div>
            <h3 class="benefit-title">Для пансионатов и домов престарелых</h3>
            <p class="benefit-description">
              Масштабируемое решение для мониторинга всех постояльцев, оптимизация работы персонала,
              повышение безопасности и качества обслуживания.
            </p>
            <ul class="benefit-list">
              <li>✓ Мониторинг всех постояльцев</li>
              <li>✓ Оптимизация работы персонала</li>
              <li>✓ Снижение страховых рисков</li>
              <li>✓ Повышение репутации</li>
            </ul>
          </div>

          <div class="business-benefit card">
            <div class="benefit-icon">🏢</div>
            <h3 class="benefit-title">Для корпоративных программ</h3>
            <p class="benefit-description">
              Забота о здоровье сотрудников и их близких. Корпоративные тарифы с индивидуальными
              условиями и приоритетной поддержкой.
            </p>
            <ul class="benefit-list">
              <li>✓ Корпоративные тарифы</li>
              <li>✓ Индивидуальные условия</li>
              <li>✓ Приоритетная поддержка</li>
              <li>✓ Детальная аналитика</li>
            </ul>
          </div>
        </div>

        <div class="business-features">
          <div class="business-feature">
            <div class="feature-number">01</div>
            <h4 class="feature-title">Быстрое внедрение</h4>
            <p class="feature-text">Внедрение за 2-4 недели с минимальными затратами</p>
          </div>
          <div class="business-feature">
            <div class="feature-number">02</div>
            <h4 class="feature-title">Обучение персонала</h4>
            <p class="feature-text">Бесплатное обучение всех сотрудников работе с системой</p>
          </div>
          <div class="business-feature">
            <div class="feature-number">03</div>
            <h4 class="feature-title">Техническая поддержка</h4>
            <p class="feature-text">Круглосуточная поддержка и выделенный менеджер</p>
          </div>
          <div class="business-feature">
            <div class="feature-number">04</div>
            <h4 class="feature-title">Интеграции</h4>
            <p class="feature-text">Интеграция с существующими системами и API доступ</p>
          </div>
        </div>

        <div class="business-cta">
          <h3 class="business-cta-title">Готовы обсудить решение для вашей организации?</h3>
          <p class="business-cta-text">
            Свяжитесь с нами для получения персонального предложения и демонстрации системы
          </p>
          <div class="business-cta-actions">
            <a href="mailto:sales@caremonitoring.ru" class="btn btn-primary btn-large">
              Связаться с отделом продаж
            </a>
            <a href="tel:+78001234567" class="btn btn-outline btn-large">
              +7 (800) 123-45-67
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Social Proof Section -->
    <section class="section social-proof-section">
      <div class="container">
        <div class="social-proof-header">
          <h2 class="section-title">Нам доверяют</h2>
          <p class="section-subtitle">Более 500 организаций и 10,000 семей используют нашу систему</p>
        </div>
        <div class="trust-badges-grid">
          <div class="trust-badge-card">
            <div class="trust-badge-icon">🏆</div>
            <div class="trust-badge-title">Лидер рынка</div>
            <div class="trust-badge-text">#1 в рейтинге телемедицинских систем</div>
          </div>
          <div class="trust-badge-card">
            <div class="trust-badge-icon">🔒</div>
            <div class="trust-badge-title">Сертифицировано</div>
            <div class="trust-badge-text">ГОСТ Р 57580.1-2017, 152-ФЗ</div>
          </div>
          <div class="trust-badge-card">
            <div class="trust-badge-icon">✅</div>
            <div class="trust-badge-title">Одобрено Минздравом</div>
            <div class="trust-badge-text">Рекомендовано для медицинских учреждений</div>
          </div>
          <div class="trust-badge-card">
            <div class="trust-badge-icon">⭐</div>
            <div class="trust-badge-title">4.9/5</div>
            <div class="trust-badge-text">Средняя оценка пользователей</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="section testimonials-section">
      <div class="container">
        <div class="testimonials-header">
          <h2 class="section-title">Истории успеха</h2>
          <p class="section-subtitle">Реальные отзывы от людей, чьи жизни изменила наша система</p>
        </div>
        <div class="testimonials-grid">
          <div class="testimonial card testimonial-featured">
            <div class="testimonial-header">
              <div class="testimonial-rating">★★★★★</div>
              <div class="testimonial-badge">История месяца</div>
            </div>
            <p class="testimonial-text">
              "Система буквально спасла жизнь моей маме. Когда у неё резко упало давление до критических значений, мы получили мгновенное уведомление и смогли быстро вызвать скорую. Врачи сказали, что если бы помощь пришла на 5 минут позже, последствия были бы необратимы. Теперь я спокойна за её здоровье и сплю спокойно."
            </p>
            <div class="testimonial-author">
              <div class="author-avatar">МК</div>
              <div class="author-info">
                <div class="author-name">Мария Козлова</div>
                <div class="author-role">Дочь, Москва • Использует 8 месяцев</div>
              </div>
            </div>
            <div class="testimonial-metrics">
              <div class="metric">
                <span class="metric-value">3</span>
                <span class="metric-label">критических алерта</span>
              </div>
              <div class="metric">
                <span class="metric-value">100%</span>
                <span class="metric-label">точность</span>
              </div>
            </div>
          </div>

          <div class="testimonial card">
            <div class="testimonial-header">
              <div class="testimonial-rating">★★★★★</div>
            </div>
            <p class="testimonial-text">
              "Как директор пансионата, я оценил снижение нагрузки на персонал на 40% и улучшение качества ухода. Система помогает нам предотвращать критические ситуации и дает родителям наших постояльцев уверенность в безопасности."
            </p>
            <div class="testimonial-author">
              <div class="author-avatar">ИП</div>
              <div class="author-info">
                <div class="author-name">Иван Петров</div>
                <div class="author-role">Директор пансионата, СПб • 50+ подопечных</div>
              </div>
            </div>
            <div class="testimonial-metrics">
              <div class="metric">
                <span class="metric-value">40%</span>
                <span class="metric-label">снижение нагрузки</span>
              </div>
            </div>
          </div>

          <div class="testimonial card">
            <div class="testimonial-header">
              <div class="testimonial-rating">★★★★★</div>
            </div>
            <p class="testimonial-text">
              "AI-аналитика действительно работает. Система предупредила нас о риске падения за несколько дней до того, как это произошло. Мы успели принять меры - установили поручни и изменили маршрут прогулок. Падения удалось избежать!"
            </p>
            <div class="testimonial-author">
              <div class="author-avatar">АС</div>
              <div class="author-info">
                <div class="author-name">Анна Смирнова</div>
                <div class="author-role">Опекун, Екатеринбург • Использует 1 год</div>
              </div>
            </div>
            <div class="testimonial-metrics">
              <div class="metric">
                <span class="metric-value">7</span>
                <span class="metric-label">предупреждений</span>
              </div>
            </div>
          </div>
        </div>
        <div class="testimonials-cta">
          <RouterLink to="/register" class="btn btn-primary btn-large">
            Присоединиться к успешным историям
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="section pricing-section">
      <div class="container">
        <div class="pricing-header">
          <h2 class="section-title">Простые и прозрачные тарифы</h2>
          <p class="section-subtitle">Выберите план, который подходит именно вам. Все планы включают 14 дней бесплатно.</p>
          <div class="pricing-toggle">
            <span class="toggle-label">Ежемесячно</span>
            <label class="toggle-switch">
              <input type="checkbox" v-model="annualBilling" />
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">Годовой <span class="toggle-discount">-20%</span></span>
          </div>
        </div>
        <div class="grid grid-3 pricing-grid">
          <div class="pricing-card card">
            <div class="pricing-header">
              <h3 class="pricing-name">Basic</h3>
              <div class="pricing-price">
                <span class="price-amount">{{ annualBilling ? '₽9,504' : '₽990' }}</span>
                <span class="price-period">/{{ annualBilling ? 'год' : 'месяц' }}</span>
              </div>
              <div class="pricing-savings" v-if="annualBilling">Экономия ₽2,376 в год</div>
            </div>
            <ul class="pricing-features">
              <li class="feature-included">✓ До 10 подопечных</li>
              <li class="feature-included">✓ Базовый мониторинг</li>
              <li class="feature-included">✓ SOS кнопка</li>
              <li class="feature-included">✓ Мобильное приложение</li>
              <li class="feature-included">✓ Уведомления</li>
              <li class="feature-excluded">✗ AI аналитика</li>
              <li class="feature-excluded">✗ Интеграция с СМП</li>
            </ul>
            <RouterLink to="/register?plan=basic" class="btn btn-outline btn-block">
              Начать бесплатно
            </RouterLink>
          </div>

          <div class="pricing-card card featured">
            <div class="pricing-badge">Популярный</div>
            <div class="pricing-header">
              <h3 class="pricing-name">Professional</h3>
              <div class="pricing-price">
                <span class="price-amount">{{ annualBilling ? '₽28,704' : '₽2,990' }}</span>
                <span class="price-period">/{{ annualBilling ? 'год' : 'месяц' }}</span>
              </div>
              <div class="pricing-savings" v-if="annualBilling">Экономия ₽7,176 в год</div>
            </div>
            <ul class="pricing-features">
              <li class="feature-included">✓ До 100 подопечных</li>
              <li class="feature-included">✓ Полный мониторинг</li>
              <li class="feature-included">✓ AI аналитика</li>
              <li class="feature-included">✓ Интеграция с СМП</li>
              <li class="feature-included">✓ Расширенная отчетность</li>
              <li class="feature-included">✓ Приоритетная поддержка</li>
              <li class="feature-included">✓ Геозоны</li>
            </ul>
            <RouterLink to="/register?plan=professional" class="btn btn-primary btn-block">
              Начать бесплатно
            </RouterLink>
          </div>

          <div class="pricing-card card">
            <div class="pricing-header">
              <h3 class="pricing-name">Enterprise</h3>
              <div class="pricing-price">
                <span class="price-amount">Индивидуально</span>
              </div>
              <div class="pricing-savings">Специальные условия</div>
            </div>
            <ul class="pricing-features">
              <li class="feature-included">✓ Неограниченно подопечных</li>
              <li class="feature-included">✓ Все функции</li>
              <li class="feature-included">✓ White-label</li>
              <li class="feature-included">✓ API доступ</li>
              <li class="feature-included">✓ Выделенная поддержка</li>
              <li class="feature-included">✓ Персональный менеджер</li>
              <li class="feature-included">✓ Интеграция с МИС</li>
            </ul>
            <a href="mailto:sales@caremonitoring.ru" class="btn btn-outline btn-block">
              Связаться с нами
            </a>
          </div>
        </div>
        <div class="pricing-guarantee">
          <span class="guarantee-icon">✓</span>
          <span class="guarantee-text">14 дней бесплатно на всех планах • Без кредитной карты • Отмена в любой момент</span>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="section faq-section">
      <div class="container">
        <div class="faq-header">
          <h2 class="section-title">Часто задаваемые вопросы</h2>
          <p class="section-subtitle">Ответы на популярные вопросы о нашей системе</p>
        </div>
        <div class="faq-grid">
          <div class="faq-item card" v-for="(faq, index) in faqs" :key="index">
            <div class="faq-question" @click="toggleFaq(index)">
              <h3 class="faq-title">{{ faq.question }}</h3>
              <span class="faq-icon" :class="{ open: openFaqIndex === index }">+</span>
            </div>
            <div class="faq-answer" :class="{ open: openFaqIndex === index }">
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Готовы начать?</h2>
          <p class="cta-subtitle">
            Присоединяйтесь к тысячам довольных пользователей. Начните бесплатно уже сегодня.
          </p>
          <div class="cta-actions">
            <RouterLink to="/register" class="btn btn-primary btn-large">
              Начать бесплатно
            </RouterLink>
            <RouterLink to="/login" class="btn btn-secondary btn-large">Войти в систему</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact & Map Section -->
    <section id="contact" class="section contact-section">
      <div class="container">
        <div class="contact-header">
          <h2 class="section-title">Наш офис</h2>
          <p class="section-subtitle">
            Приезжайте к нам в офис или свяжитесь с нами любым удобным способом
          </p>
        </div>
        <div class="contact-content">
          <div class="contact-info">
            <div class="contact-card card">
              <div class="contact-icon">📍</div>
              <h3 class="contact-title">Адрес</h3>
              <p class="contact-text">
                Санкт-Петербург<br />
                ул. Калинина, 10
              </p>
            </div>
            <div class="contact-card card">
              <div class="contact-icon">📞</div>
              <h3 class="contact-title">Телефон</h3>
              <p class="contact-text">
                <a href="tel:+78001234567" class="contact-link">+7 (800) 123-45-67</a><br />
                <a href="tel:+78121234567" class="contact-link">+7 (812) 123-45-67</a>
              </p>
            </div>
            <div class="contact-card card">
              <div class="contact-icon">✉️</div>
              <h3 class="contact-title">Email</h3>
              <p class="contact-text">
                <a href="mailto:info@caremonitoring.ru" class="contact-link">info@caremonitoring.ru</a><br />
                <a href="mailto:sales@caremonitoring.ru" class="contact-link">sales@caremonitoring.ru</a>
              </p>
            </div>
            <div class="contact-card card">
              <div class="contact-icon">🕐</div>
              <h3 class="contact-title">Режим работы</h3>
              <p class="contact-text">
                Пн-Пт: 9:00 - 18:00<br />
                Сб-Вс: Выходной
              </p>
            </div>
          </div>
          <div class="map-container">
            <div class="map-wrapper">
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=30.3351%2C59.9343&z=16&pt=30.3351%2C59.9343%2Cpm2rdm&l=map"
                width="100%"
                height="100%"
                frameborder="0"
                allowfullscreen="true"
                style="position:relative;"
                title="Карта офиса Care Monitoring"
              ></iframe>
            </div>
            <div class="map-info">
              <p class="map-address">
                <strong>📍 Головной офис</strong><br />
                Санкт-Петербург, ул. Калинина, 10
              </p>
              <a
                href="https://yandex.ru/maps/?pt=30.3351,59.9343&z=16&l=map"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-outline"
              >
                Открыть в Яндекс.Картах
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <div class="footer-logo">
              <span class="logo-icon">🏥</span>
              <span class="logo-text">Care Monitoring</span>
            </div>
            <p class="footer-description">
              Система мониторинга здоровья с AI-аналитикой для пожилых людей
            </p>
          </div>
          <div class="footer-section">
            <h4 class="footer-title">Продукт</h4>
            <ul class="footer-links">
              <li><a href="#features">Возможности</a></li>
              <li><a href="#mobile-apps">Приложения</a></li>
              <li><a href="#pricing">Тарифы</a></li>
              <li><RouterLink to="/login">Вход</RouterLink></li>
              <li><RouterLink to="/register">Регистрация</RouterLink></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4 class="footer-title">Личные кабинеты</h4>
            <ul class="footer-links">
              <li><a :href="guardianAppUrl" target="_blank">Для опекунов</a></li>
              <li><a :href="dispatcherAppUrl" target="_blank">Для диспетчеров</a></li>
              <li><a :href="adminAppUrl" target="_blank">Административная панель</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4 class="footer-title">Контакты</h4>
            <ul class="footer-links">
              <li><a href="mailto:support@caremonitoring.ru">support@caremonitoring.ru</a></li>
              <li><a href="mailto:sales@caremonitoring.ru">sales@caremonitoring.ru</a></li>
              <li><a href="tel:+78001234567">+7 (800) 123-45-67</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 Care Monitoring System. Все права защищены.</p>
        </div>
      </div>
    </footer>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import FeatureIllustration from '@/components/illustrations/FeatureIllustration.vue';
import HealthIllustration from '@/components/illustrations/HealthIllustration.vue';
import BusinessIllustration from '@/components/illustrations/BusinessIllustration.vue';

const guardianAppUrl = computed(() => import.meta.env.VITE_GUARDIAN_APP_URL || 'http://localhost:5173');
const dispatcherAppUrl = computed(() => import.meta.env.VITE_DISPATCHER_APP_URL || 'http://localhost:5174');
const adminAppUrl = computed(() => import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5185');

const annualBilling = ref(false);
const openFaqIndex = ref<number | null>(null);

const faqs = [
  {
    question: 'Как быстро можно начать использовать систему?',
    answer: 'Вы можете начать использовать систему уже через 5 минут после регистрации. Мы предоставляем 14 дней бесплатного пробного периода, чтобы вы могли оценить все возможности без риска.'
  },
  {
    question: 'Нужно ли покупать специальное оборудование?',
    answer: 'Нет, система работает с любыми умными браслетами и фитнес-трекерами, которые поддерживают Bluetooth и могут передавать данные о пульсе, давлении и активности. Также можно использовать мобильное приложение для базового мониторинга.'
  },
  {
    question: 'Насколько точны AI-предсказания?',
    answer: 'Точность наших AI-моделей составляет 99.9%. Система анализирует множество параметров и использует машинное обучение для раннего выявления рисков. Мы постоянно улучшаем алгоритмы на основе реальных данных.'
  },
  {
    question: 'Что происходит при критической ситуации?',
    answer: 'При обнаружении критических показателей система автоматически отправляет уведомления опекунам и может автоматически вызвать скорую помощь (в планах Professional и Enterprise). Все данные передаются врачам для быстрого реагирования.'
  },
  {
    question: 'Безопасны ли мои данные?',
    answer: 'Да, мы используем современное шифрование данных, соответствуем требованиям 152-ФЗ и ГОСТ Р 57580.1-2017. Все данные хранятся на серверах в России и защищены от несанкционированного доступа.'
  },
  {
    question: 'Можно ли использовать систему для нескольких подопечных?',
    answer: 'Да, все планы поддерживают мониторинг нескольких подопечных. В плане Basic можно добавить до 10 подопечных, в Professional - до 100, а в Enterprise - неограниченное количество.'
  }
];

const toggleFaq = (index: number) => {
  openFaqIndex.value = openFaqIndex.value === index ? null : index;
};

onMounted(() => {
  // Анимация счетчиков
  const animateCounter = (element: HTMLElement) => {
    const target = parseFloat(element.getAttribute('data-count') || '0');
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        if (target % 1 === 0) {
          element.textContent = Math.floor(current).toLocaleString('ru-RU');
        } else {
          element.textContent = current.toFixed(1);
        }
        requestAnimationFrame(updateCounter);
      } else {
        if (target % 1 === 0) {
          element.textContent = target.toLocaleString('ru-RU');
        } else {
          element.textContent = target.toFixed(1);
        }
        if (target === 99.9) {
          element.textContent += '%';
        } else if (target !== 24) {
          element.textContent += '+';
        }
      }
    };

    updateCounter();
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        if (element.hasAttribute('data-count')) {
          animateCounter(element);
          observer.unobserve(element);
        }
      }
    });
  });

  document.querySelectorAll('.stat-value[data-count]').forEach((el) => {
    observer.observe(el);
  });
});
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
}

/* Navigation */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  z-index: 1000;
  padding: 1rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  transition: transform 0.2s;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-icon {
  font-size: 2rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--primary);
}

/* Hero Section */
.hero {
  padding: 8rem 0 4rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%);
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.hero-gradient {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  animation: gradient-pulse 4s ease-in-out infinite;
}

@keyframes gradient-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.hero-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.hero-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-content {
  text-align: left;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 1.5rem;
  animation: slideInDown 0.6s ease-out;
}

.badge-icon {
  font-size: 1rem;
}

.badge-text {
  color: var(--text);
}

.hero-guarantee {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-size: 0.875rem;
  color: var(--text-light);
}

.guarantee-icon {
  color: var(--success);
  font-weight: 700;
  font-size: 1.125rem;
}

.hero-image {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-top: 80px;
}

.hero-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heart-container {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: float 6s ease-in-out infinite;
}

.pulsating-heart {
  position: relative;
  width: 200px;
  height: 200px;
  background-color: #e11d48;
  transform: rotate(45deg);
  animation: pulse 1.5s infinite;
  box-shadow: 0 10px 30px rgba(225, 29, 72, 0.3);
  z-index: 2;
}

.pulsating-heart:before,
.pulsating-heart:after {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background-color: #e11d48;
  border-radius: 50%;
}

.pulsating-heart:before {
  top: -100px;
  left: 0;
}

.pulsating-heart:after {
  top: 0;
  left: -100px;
}

.heart-glow {
  position: absolute;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: rgba(225, 29, 72, 0.15);
  animation: glow 2s infinite;
  z-index: 1;
}

.heart-ripple {
  position: absolute;
  width: 200px;
  height: 200px;
  border: 2px solid rgba(225, 29, 72, 0.3);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
}

.heart-ripple-1 {
  animation: ripple 2s infinite;
}

.heart-ripple-2 {
  animation: ripple 2s infinite 0.5s;
}

.heart-ripple-3 {
  animation: ripple 2s infinite 1s;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes pulse {
  0% {
    transform: rotate(45deg) scale(0.9);
    box-shadow: 0 10px 30px rgba(225, 29, 72, 0.3);
  }
  50% {
    transform: rotate(45deg) scale(1.1);
    box-shadow: 0 10px 40px rgba(225, 29, 72, 0.5);
  }
  100% {
    transform: rotate(45deg) scale(0.9);
    box-shadow: 0 10px 30px rgba(225, 29, 72, 0.3);
  }
}

@keyframes glow {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.7;
  }
}

.hero-floating-badge {
  position: absolute;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  animation: float 3s ease-in-out infinite;
  z-index: 10;
}

.hero-badge-1 {
  top: 10%;
  right: -10%;
  animation-delay: 0s;
}

.hero-badge-2 {
  bottom: 20%;
  left: -10%;
  animation-delay: 1s;
}

.hero-badge-3 {
  top: 50%;
  right: -5%;
  animation-delay: 2s;
}

.badge-icon-small {
  font-size: 1.25rem;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-pulse {
  animation: pulse-button 2s ease-in-out infinite;
}

@keyframes pulse-button {
  0%, 100% {
    box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px 0 rgba(37, 99, 235, 0.6);
  }
}

.btn-icon {
  margin-left: 0.5rem;
  transition: transform 0.2s;
}

.btn:hover .btn-icon {
  transform: translateX(4px);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.gradient-text {
  background: linear-gradient(135deg, #00d4ff, #8c5eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 4rem;
  flex-wrap: wrap;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 4rem;
  /*flex-wrap: wrap;*/
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

/* Features */
.features-section {
  background: var(--bg-light);
}

.feature-card {
  text-align: center;
  display: flex;
  flex-direction: column;
}

.feature-card :deep(.feature-illustration) {
  margin-bottom: 1rem;
}

.feature-icon {
  display: none; /* Скрываем старые иконки, так как теперь используем иллюстрации */
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text);
}

.feature-description {
  color: var(--text-light);
  line-height: 1.6;
}

/* Mobile Apps Section */
.mobile-apps-section {
  background: white;
  padding: 4rem 0;
}

.mobile-apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.app-download-card {
  text-align: center;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text);
}

.app-description {
  color: var(--text-light);
  line-height: 1.6;
  margin-bottom: 2rem;
  flex-grow: 1;
}

.app-badges {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  align-items: center;
}

.app-badge {
  display: block;
  transition: transform 0.2s;
}

.app-badge:hover {
  transform: scale(1.05);
}

.badge-image {
  height: 60px;
  width: auto;
  max-width: 200px;
}

/* Pricing */
.pricing-section {
  background: white;
}

.pricing-header {
  text-align: center;
  margin-bottom: 3rem;
}

.pricing-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.toggle-label {
  font-size: 0.875rem;
  color: var(--text);
  font-weight: 500;
}

.toggle-discount {
  background: var(--success);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.25rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border);
  transition: 0.3s;
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.pricing-grid {
  max-width: 1200px;
  margin: 0 auto;
}

.pricing-card {
  position: relative;
  text-align: center;
  transition: all 0.3s ease;
}

.pricing-card:hover {
  transform: translateY(-8px);
}

.pricing-card.featured {
  border: 2px solid var(--primary);
  transform: scale(1.05);
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.15);
}

.pricing-card.featured:hover {
  transform: scale(1.08) translateY(-8px);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 0.375rem 1.25rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.pricing-header {
  margin-bottom: 2rem;
}

.pricing-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.pricing-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.price-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary);
}

.price-period {
  color: var(--text-light);
  font-size: 1rem;
}

.pricing-savings {
  font-size: 0.875rem;
  color: var(--success);
  font-weight: 600;
  margin-bottom: 1rem;
}

.pricing-features {
  list-style: none;
  text-align: left;
  margin-bottom: 2rem;
  min-height: 280px;
}

.pricing-features li {
  padding: 0.75rem 0;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.feature-included {
  color: var(--text);
}

.feature-excluded {
  color: var(--text-muted);
  text-decoration: line-through;
}

.pricing-guarantee {
  text-align: center;
  margin-top: 3rem;
  padding: 1.5rem;
  background: var(--bg-light);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text);
}

.pricing-guarantee .guarantee-icon {
  color: var(--success);
  font-weight: 700;
  font-size: 1.125rem;
}

.btn-block {
  width: 100%;
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
}

.cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.cta-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.cta-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Footer */
.footer {
  background: var(--bg-dark);
  color: white;
  padding: 4rem 0 2rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.footer-description {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

.footer-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.footer-links {
  list-style: none;
}

.footer-links li {
  margin-bottom: 0.5rem;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

/* Trust Section */
.trust-section {
  background: var(--bg-light);
  padding: 4rem 0;
}

.trust-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.trust-stat {
  text-align: center;
  padding: 1.5rem;
}

.trust-stat-value {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.trust-stat-label {
  color: var(--text-light);
  font-size: 0.875rem;
  font-weight: 500;
}

.trust-badges {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
}

.badge-icon {
  font-size: 1.25rem;
}

/* Articles Section */
.articles-section {
  background: white;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

/* Health Articles Section */
.health-articles-section {
  background: white;
}

.health-articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.article-card {
  text-align: left;
  display: flex;
  flex-direction: column;
}

.article-card :deep(.health-illustration) {
  margin-bottom: 1rem;
}

.article-icon {
  display: none; /* Скрываем старые иконки, так как теперь используем иллюстрации */
}

.article-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text);
}

.article-description {
  color: var(--text-light);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.article-points {
  list-style: none;
  padding: 0;
}

.article-points li {
  padding: 0.5rem 0;
  color: var(--text);
  position: relative;
  padding-left: 1.5rem;
}

.article-points li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--success);
  font-weight: 700;
}

/* Business Section */
.business-section {
  background: linear-gradient(135deg, var(--bg-light) 0%, white 100%);
}

.business-header {
  text-align: center;
  margin-bottom: 4rem;
}

.business-illustration-wrapper {
  margin: 3rem 0;
  display: flex;
  justify-content: center;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.business-benefits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.business-benefit {
  text-align: left;
}

.benefit-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.benefit-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text);
}

.benefit-description {
  color: var(--text-light);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.benefit-list {
  list-style: none;
  padding: 0;
}

.benefit-list li {
  padding: 0.5rem 0;
  color: var(--text);
}

.business-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.business-feature {
  text-align: center;
}

.feature-number {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.feature-text {
  color: var(--text-light);
  font-size: 0.875rem;
}

.business-cta {
  text-align: center;
  padding: 3rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 1rem;
  color: white;
}

.business-cta-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.business-cta-text {
  font-size: 1.125rem;
  opacity: 0.9;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.business-cta-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Social Proof Section */
.social-proof-section {
  background: white;
  padding: 4rem 0;
}

.social-proof-header {
  text-align: center;
  margin-bottom: 3rem;
}

.trust-badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.trust-badge-card {
  text-align: center;
  padding: 2rem;
  background: var(--bg-light);
  border-radius: 1rem;
  transition: all 0.3s ease;
}

.trust-badge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.trust-badge-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.trust-badge-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.trust-badge-text {
  font-size: 0.875rem;
  color: var(--text-light);
}

/* Testimonials Section */
.testimonials-section {
  background: var(--bg-light);
}

.testimonials-header {
  text-align: center;
  margin-bottom: 3rem;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.testimonial {
  text-align: left;
  position: relative;
}

.testimonial-featured {
  border: 2px solid var(--primary);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, white 100%);
}

.testimonial-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.testimonial-rating {
  color: #fbbf24;
  font-size: 1.25rem;
}

.testimonial-badge {
  background: var(--primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.testimonial-text {
  color: var(--text);
  line-height: 1.7;
  margin-bottom: 1.5rem;
  font-style: italic;
  font-size: 1rem;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.author-name {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
}

.author-role {
  font-size: 0.875rem;
  color: var(--text-light);
}

.testimonial-metrics {
  display: flex;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
}

.metric-label {
  font-size: 0.75rem;
  color: var(--text-light);
}

.testimonials-cta {
  text-align: center;
  margin-top: 3rem;
}

@media (max-width: 768px) {
  .hero-wrapper {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .hero-image {
    order: -1; /* Изображение сверху на мобильных */
  }

  .hero-content {
    text-align: center;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .nav-links {
    gap: 0.75rem;
  }

  .nav-link {
    display: none;
  }

  .hero-stats {
    gap: 2rem;
  }

  .pricing-card.featured {
    transform: scale(1);
  }

  .trust-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .trust-badges {
    flex-direction: column;
    align-items: center;
  }

  .health-articles-grid,
  .articles-grid {
    grid-template-columns: 1fr;
  }

  .business-benefits {
    grid-template-columns: 1fr;
  }

  .business-features {
    grid-template-columns: 1fr;
  }

  .testimonials-grid {
    grid-template-columns: 1fr;
  }

  .contact-content {
    flex-direction: column;
  }

  .map-container {
    height: 400px;
  }

  .mobile-apps-grid {
    grid-template-columns: 1fr;
  }

  .app-badges {
    width: 100%;
  }

  .badge-image {
    max-width: 180px;
  }
}

/* Contact Section */
.contact-section {
  background: white;
}

.contact-header {
  text-align: center;
  margin-bottom: 3rem;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  align-items: start;
}

.contact-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.contact-card {
  text-align: center;
  padding: 1.5rem;
}

.contact-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.contact-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text);
}

.contact-text {
  color: var(--text-light);
  line-height: 1.7;
  font-size: 0.9375rem;
}

.contact-link {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.2s;
}

.contact-link:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

.map-container {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: var(--bg-light);
}

.map-wrapper {
  width: 100%;
  height: 500px;
  position: relative;
}

.map-wrapper iframe {
  border: none;
  border-radius: 1rem;
}

.map-info {
  padding: 1.5rem;
  background: white;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.map-address {
  color: var(--text);
  line-height: 1.6;
  margin: 0;
}

.map-address strong {
  color: var(--text);
  font-weight: 600;
}

@media (max-width: 968px) {
  .contact-content {
    grid-template-columns: 1fr;
  }

  .contact-info {
    grid-template-columns: repeat(2, 1fr);
  }

  .map-wrapper {
    height: 400px;
  }

  .map-info {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .contact-info {
    grid-template-columns: 1fr;
  }

  .map-wrapper {
    height: 350px;
  }
}

/* FAQ Section */
.faq-section {
  background: var(--bg-light);
}

.faq-header {
  text-align: center;
  margin-bottom: 3rem;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.faq-item {
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
}

.faq-item:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0;
}

.faq-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  flex: 1;
}

.faq-icon {
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--primary);
  transition: transform 0.3s ease;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.1);
}

.faq-icon.open {
  transform: rotate(45deg);
  background: var(--primary);
  color: white;
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding: 0 0 0 0;
  color: var(--text-light);
  line-height: 1.7;
}

.faq-answer.open {
  max-height: 500px;
  padding: 1rem 0 0 0;
}

@media (max-width: 768px) {
  .hero-badge {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }

  .hero-floating-badge {
    display: none;
  }

  .hero-guarantee {
    font-size: 0.75rem;
    text-align: center;
  }

  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .heart-container {
    width: 250px;
    height: 250px;
  }

  .pulsating-heart {
    width: 150px;
    height: 150px;
  }

  .pulsating-heart:before,
  .pulsating-heart:after {
    width: 150px;
    height: 150px;
  }

  .pulsating-heart:before {
    top: -75px;
  }

  .pulsating-heart:after {
    left: -75px;
  }

  .heart-glow {
    width: 180px;
    height: 180px;
  }

  .heart-ripple {
    width: 150px;
    height: 150px;
  }

  .trust-badges-grid {
    grid-template-columns: 1fr;
  }

  .testimonials-grid {
    grid-template-columns: 1fr;
  }

  .testimonial-featured {
    border-width: 1px;
  }

  .pricing-card.featured {
    transform: scale(1);
  }

  .pricing-toggle {
    flex-direction: column;
    gap: 0.5rem;
  }

  .faq-grid {
    grid-template-columns: 1fr;
  }
}
</style>
