<template>
  <main class="kb">
    <header class="page-hero">
      <div class="container">
        <div class="page-hero-inner">
          <div class="page-eyebrow">📚 База знаний</div>
          <h1 class="page-title">Полезные статьи о здоровье и безопасности</h1>
          <p class="page-subtitle">
            Практические материалы про мониторинг здоровья, уход за пожилыми, профилактику рисков и настройку
            геозон — простым языком, по шагам.
          </p>
          <div class="kb-actions">
            <label class="kb-search">
              <span class="kb-search-icon" aria-hidden="true">🔎</span>
              <input
                v-model="q"
                class="kb-input"
                type="search"
                placeholder="Поиск по статьям (например: давление, падения, геозона)"
              />
            </label>
            <RouterLink to="/register" class="btn btn-primary">Начать бесплатно</RouterLink>
          </div>
        </div>
      </div>
    </header>

    <section class="kb-body">
      <div class="container">
        <section class="kb-grid">
          <article v-for="a in filtered" :key="a.id" class="kb-card card">
            <h2 class="kb-card-title">
              <RouterLink class="kb-link" :to="`/articles/${a.slug}`">{{ a.title }}</RouterLink>
            </h2>
            <p class="kb-card-desc">{{ a.description }}</p>
            <div class="kb-meta">
              <span class="chip">🗓️ {{ a.updatedAt }}</span>
              <span class="chip">⏱️ {{ a.readingTimeMinutes }} мин</span>
            </div>
            <div class="kb-tags">
              <span v-for="k in a.keywords.slice(0, 4)" :key="k" class="kb-tag">{{ k }}</span>
            </div>
          </article>
        </section>

        <footer class="kb-footer">
          <RouterLink to="/" class="kb-back">← На главную</RouterLink>
        </footer>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { articles } from '@/content/articles';

const q = ref('');
const norm = (s: string) => s.toLowerCase().trim();
const filtered = computed(() => {
  const query = norm(q.value);
  if (!query) return articles;
  return articles.filter((a) => {
    const hay = [a.title, a.description, a.keywords.join(' ')].join(' ');
    return norm(hay).includes(query);
  });
});
</script>

<style scoped>
.kb {
  background: var(--bg-light);
}
.kb-body {
  padding: 2.5rem 0 4rem;
}
.kb-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}
.kb-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.5rem 0.85rem;
  box-shadow: var(--shadow-sm);
  min-width: min(560px, 100%);
}
.kb-search-icon {
  opacity: 0.75;
}
.kb-input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 0.95rem;
  color: var(--text);
}
.kb-input::placeholder {
  color: var(--text-muted);
}
.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}
.kb-card-title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  line-height: 1.35;
}
.kb-link {
  color: var(--text);
  text-decoration: none;
}
.kb-link:hover {
  color: var(--primary);
  text-decoration: underline;
}
.kb-card-desc {
  margin: 0 0 1rem;
  color: var(--text-light);
  line-height: 1.8;
}
.kb-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.kb-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.kb-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.18);
  color: var(--text);
}
.kb-footer {
  margin-top: 3rem;
}
.kb-back {
  color: var(--primary);
  text-decoration: none;
}
.kb-back:hover {
  text-decoration: underline;
}
@media (max-width: 640px) {
  .page-title {
    font-size: 2.2rem;
  }
  .kb-search {
    min-width: 100%;
  }
}
</style>


