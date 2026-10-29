<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <router-link to="/" class="site-header__logo">
        <img :src="logo" alt="FemCine, ir al inicio" width="196" height="53" />
      </router-link>
      <SearchBar v-model="term" class="site-header__search" @submit="goToCatalog" />
      <nav class="site-header__nav" aria-label="Principal">
        <router-link
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="site-header__link"
          :class="{ 'is-active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : null"
        >
          {{ item.label }}
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script>
import SearchBar from '@/components/SearchBar.vue';
import { ASSETS } from '@/data/assets';
import { NAV_ITEMS, isNavActive } from '@/data/navigation';

export default {
  name: 'AppHeader',
  components: { SearchBar },
  data() {
    return { term: '', logo: ASSETS.logo, items: NAV_ITEMS };
  },
  created() {
    // El buscador arranca con el texto que ya esté en la URL (?q=...).
    this.term = this.currentQuery();
  },
  watch: {
    '$route.query.q'() {
      // La URL manda: si cambia desde otro lugar, el buscador se actualiza.
      this.term = this.currentQuery();
    },
    term(value) {
      // En el catálogo, el buscador filtra mientras se escribe.
      if (this.$route.name === 'catalogo' && value !== this.currentQuery()) {
        this.$router.replace({ query: { ...this.$route.query, q: value || undefined } });
      }
    }
  },
  methods: {
    currentQuery() {
      const q = this.$route.query.q;
      return typeof q === 'string' ? q : '';
    },
    goToCatalog() {
      if (this.$route.name !== 'catalogo') {
        this.$router.push({ name: 'catalogo', query: { q: this.term.trim() || undefined } });
      }
    },
    isActive(item) {
      return isNavActive(item, this.$route.path);
    }
  }
};
</script>

<style scoped>
.site-header { background: #0a0a0a var(--img-negro) center / cover; padding-block: 16px; }
.site-header__inner { display: grid; gap: 14px; }
.site-header__logo { display: inline-flex; width: fit-content; min-height: 48px; align-items: center; }
.site-header__logo img { height: 46px; width: auto; display: block; }
.site-header__nav { display: none; }

@media (min-width: 768px) {
  .site-header { padding-block: 20px; }
  .site-header__inner { grid-template-columns: auto minmax(240px, 420px) 1fr; align-items: center; gap: 28px; }
  .site-header__nav { display: flex; justify-content: flex-end; gap: clamp(20px, 4vw, 56px); }
  .site-header__link {
    display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px;
    font-family: var(--font-display); font-weight: 800; font-size: 1.15rem;
    letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; color: var(--white);
    border-bottom: 3px solid transparent;
  }
  .site-header__link:hover { color: var(--pink); }
  .site-header__link.is-active { color: var(--pink); border-bottom-color: var(--pink); }
}
</style>
