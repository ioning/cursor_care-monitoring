<template>
  <main class="article">
    <header class="page-hero">
      <div class="container">
        <div class="page-hero-inner">
          <p class="article-breadcrumbs">
            <RouterLink to="/articles" class="link">База знаний</RouterLink>
            <span class="sep">/</span>
            <span>{{ article?.title || 'Статья' }}</span>
          </p>

          <h1 class="page-title">{{ article?.title || 'Статья не найдена' }}</h1>
          <p v-if="article" class="page-subtitle">{{ article.description }}</p>

          <div v-if="article" class="article-meta">
            <span class="chip">🗓️ {{ article.updatedAt }}</span>
            <span class="chip">⏱️ {{ article.readingTimeMinutes }} мин</span>
          </div>
        </div>
      </div>
    </header>

    <!-- JSON-LD (Article) -->
    <component
      :is="'script'"
      v-if="article"
      type="application/ld+json"
      v-html="articleJsonLd"
    />

    <section v-if="article" class="article-body">
      <div class="container">
        <div class="article-grid">
          <aside class="toc card" v-if="article.sections.length">
            <div class="toc-title">Содержание</div>
            <ol class="toc-list">
              <li v-for="s in article.sections" :key="s.heading">
                <a class="toc-link" :href="`#${slugify(s.heading)}`">{{ s.heading }}</a>
              </li>
            </ol>

            <div class="toc-cta">
              <RouterLink to="/register" class="btn btn-primary btn-block">Попробовать бесплатно</RouterLink>
              <RouterLink to="/articles" class="btn btn-outline btn-block">Все статьи</RouterLink>
            </div>
          </aside>

          <article class="content card">
            <section v-for="s in article.sections" :key="s.heading" class="content-section">
              <h2 :id="slugify(s.heading)">{{ s.heading }}</h2>
              <p v-for="(p, idx) in s.paragraphs" :key="idx">{{ p }}</p>
            </section>

            <section v-if="article.faq?.length" class="content-section">
              <h2>FAQ</h2>
              <div class="faq card" v-for="(f, idx) in article.faq" :key="idx">
                <h3 class="faq-q">{{ f.q }}</h3>
                <p class="faq-a">{{ f.a }}</p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </section>

    <section v-else class="article-body">
      <div class="container">
        <div class="not-found card">
          <p>Такой статьи нет. Посмотрите список материалов в базе знаний.</p>
          <RouterLink to="/articles" class="btn btn-primary">Открыть базу знаний</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { getArticleBySlug } from '@/content/articles';

const route = useRoute();
const slug = computed(() => String(route.params.slug || ''));
const article = computed(() => getArticleBySlug(slug.value));

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');

const articleJsonLd = computed(() => {
  if (!article.value) return '';
  const url = `https://caremonitoring.com/articles/${article.value.slug}`;
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.value.title,
      description: article.value.description,
      dateModified: article.value.updatedAt,
      datePublished: article.value.updatedAt,
      mainEntityOfPage: url,
      author: {
        '@type': 'Organization',
        name: 'Care Monitoring',
        url: 'https://caremonitoring.com',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Care Monitoring',
        url: 'https://caremonitoring.com',
      },
      keywords: article.value.keywords.join(', '),
    },
    null,
    0,
  );
});
</script>

<style scoped>
.article {
  background: var(--bg-light);
}
.article-breadcrumbs {
  margin: 0 0 0.75rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}
.sep {
  margin: 0 0.5rem;
}
.link {
  color: var(--primary);
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
.article-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.article-body {
  padding: 2.5rem 0 4rem;
}
.article-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: start;
}
.toc {
  position: sticky;
  top: 6rem;
}
.toc-title {
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.toc-list {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--text);
}
.toc-link {
  color: var(--text);
  text-decoration: none;
  line-height: 1.8;
}
.toc-link:hover {
  color: var(--primary);
  text-decoration: underline;
}
.toc-cta {
  margin-top: 1rem;
  display: grid;
  gap: 0.75rem;
}
.btn-block {
  width: 100%;
}
.content {
  padding: 2.25rem;
}
.content h2 {
  margin: 2rem 0 0.75rem;
  font-size: 1.5rem;
}
.content p {
  margin: 0 0 1rem;
  line-height: 1.9;
  color: var(--text);
}
.faq {
  margin-top: 1rem;
}
.faq-q {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
}
.faq-a {
  margin: 0;
  color: var(--text-light);
  line-height: 1.8;
}
.not-found {
  margin-top: 2rem;
  text-align: left;
}
@media (max-width: 980px) {
  .article-grid {
    grid-template-columns: 1fr;
  }
  .toc {
    position: static;
  }
}
</style>


