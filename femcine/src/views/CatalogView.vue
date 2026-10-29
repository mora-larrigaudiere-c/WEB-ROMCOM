<template>
  <div class="catalog">
    <section class="catalog__main section">
      <div class="container">
        <div class="catalog__head">
          <DisplayTitle text="Películas" tone="pink" size="clamp(3rem, 12vw, 6.5rem)" tag="h1" />
          <router-link class="btn btn--pink" :to="{ name: 'pelicula-nueva' }">Agregar película</router-link>
        </div>

        <StatusMessage v-if="state.notice" type="success" dismissible class="catalog__notice" @dismiss="clearNotice">
          {{ state.notice }}
        </StatusMessage>

        <CatalogToolbar
          :category="filters.category"
          :sort="filters.sort"
          :categories="categories"
          :sort-options="sortOptions"
          @update:category="setCategory"
          @update:sort="setSort"
        />

        <p class="catalog__count" role="status" aria-live="polite">{{ resultsText }}</p>

        <transition-group v-if="filteredMovies.length" name="grid" tag="ul" class="catalog__grid">
          <MovieCard v-for="movie in filteredMovies" :key="movie.id" :movie="movie" />
        </transition-group>

        <div v-else class="catalog__empty">
          <StatusMessage type="info" :title="emptyTitle">
            {{ emptyText }}
            <template #action>
              <button v-if="hasActiveFilters" type="button" class="btn btn--outline" @click="resetFilters">Limpiar filtros</button>
              <router-link v-else class="btn btn--pink" :to="{ name: 'pelicula-nueva' }">Agregar película</router-link>
            </template>
          </StatusMessage>
        </div>
      </div>
    </section>

    <DiscoverSection />
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import CatalogToolbar from '@/components/CatalogToolbar.vue';
import MovieCard from '@/components/MovieCard.vue';
import DiscoverSection from '@/components/DiscoverSection.vue';
import { state, setNotice } from '@/store/catalog';
import { CATEGORIES } from '@/data/categories';
import { filterAndSort, parseFilters, SORT_OPTIONS, DEFAULT_SORT } from '@/utils/catalogQuery';

export default {
  name: 'CatalogView',
  components: { DisplayTitle, StatusMessage, CatalogToolbar, MovieCard, DiscoverSection },
  data() {
    return { state, categories: CATEGORIES, sortOptions: SORT_OPTIONS };
  },
  computed: {
    // Los filtros viven en la URL (?q=&categoria=&orden=): se pueden compartir y sobreviven a recargar.
    filters() {
      return parseFilters(this.$route.query);
    },
    filteredMovies() {
      return filterAndSort(this.state.movies, this.filters);
    },
    hasActiveFilters() {
      return !!(this.filters.query.trim() || this.filters.category);
    },
    resultsText() {
      const shown = this.filteredMovies.length;
      const total = this.state.movies.length;
      if (!total) return 'El catálogo no tiene películas.';
      if (!this.hasActiveFilters) return `${total} ${total === 1 ? 'película' : 'películas'} en el catálogo.`;
      return `${shown} ${shown === 1 ? 'resultado' : 'resultados'} de ${total} películas.`;
    },
    emptyTitle() {
      return this.state.movies.length ? 'Sin coincidencias' : 'El catálogo está vacío';
    },
    emptyText() {
      return this.state.movies.length
        ? 'No encontramos películas con esa búsqueda y esa categoría. Probá con otro título o limpiá los filtros.'
        : 'Todavía no hay películas guardadas. Podés agregar la primera.';
    }
  },
  created() {
    // Si la URL trae valores inválidos (categoría o orden desconocidos), se normalizan para que la pantalla no mienta.
    const q = this.$route.query;
    const clean = { ...q };
    if (q.categoria && !this.filters.category) delete clean.categoria;
    if (q.orden && this.filters.sort === DEFAULT_SORT && q.orden !== DEFAULT_SORT) delete clean.orden;
    if (Object.keys(clean).length !== Object.keys(q).length) this.$router.replace({ query: clean });
  },
  beforeUnmount() {
    setNotice(null);
  },
  methods: {
    updateQuery(patch) {
      const next = { ...this.$route.query, ...patch };
      Object.keys(next).forEach((key) => {
        if (!next[key]) delete next[key];
      });
      this.$router.replace({ query: next });
    },
    setCategory(id) {
      this.updateQuery({ categoria: id });
    },
    setSort(value) {
      this.updateQuery({ orden: value === DEFAULT_SORT ? '' : value });
    },
    resetFilters() {
      this.$router.replace({ query: {} });
    },
    clearNotice() {
      setNotice(null);
    }
  }
};
</script>

<style scoped>
.catalog__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px; margin-bottom: 28px; }
.catalog__notice { margin-bottom: 20px; }
.catalog__count { margin: 24px 0; font-weight: 700; }
.catalog__grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 32px 16px; grid-template-columns: repeat(2, 1fr); }
.catalog__empty { max-width: 640px; }

/* transition-group: claves estables (movie.id) para que las tarjetas se muevan, entren y salgan sin parpadear */
.grid-move, .grid-enter-active, .grid-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.grid-enter-from, .grid-leave-to { opacity: 0; transform: scale(0.94); }
.grid-leave-active { position: absolute; }

@media (min-width: 640px) { .catalog__grid { grid-template-columns: repeat(3, 1fr); gap: 36px 24px; } }
@media (min-width: 900px) { .catalog__grid { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 1200px) { .catalog__grid { grid-template-columns: repeat(5, 1fr); } }
</style>
