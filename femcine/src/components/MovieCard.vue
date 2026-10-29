<template>
  <li class="movie-card">
    <router-link class="movie-card__link" :to="{ name: 'detalle', params: { id: movie.id } }">
      <PosterImage :src="posterSrc" :alt="`Póster de ${movie.title}`" :title="movie.title" />
      <span class="movie-card__title">{{ movie.title }}</span>
      <span class="movie-card__meta">{{ movie.year }} · {{ categoryName }}</span>
      <span class="movie-card__cta">Ver detalle</span>
    </router-link>
  </li>
</template>

<script>
import PosterImage from '@/components/PosterImage.vue';
import { resolvePoster } from '@/utils/poster';
import { categoryLabel } from '@/data/categories';

export default {
  name: 'MovieCard',
  components: { PosterImage },
  props: {
    movie: {
      type: Object,
      required: true,
      validator: (m) => typeof m.id === 'string' && typeof m.title === 'string'
    }
  },
  computed: {
    posterSrc() {
      return resolvePoster(this.movie.poster);
    },
    categoryName() {
      return categoryLabel(this.movie.category);
    }
  }
};
</script>

<style scoped>
.movie-card { list-style: none; }
.movie-card__link {
  display: flex; flex-direction: column; gap: 6px; height: 100%;
  color: var(--white); text-decoration: none;
}
.movie-card__link :deep(.poster) { transition: transform 0.2s ease; }
.movie-card__link:hover :deep(.poster) { transform: translateY(-4px); }
.movie-card__title { margin-top: 6px; font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; line-height: 1.15; text-transform: uppercase; }
.movie-card__meta { color: var(--pink-soft); font-weight: 600; }
.movie-card__cta { margin-top: auto; padding-top: 4px; min-height: 44px; display: inline-flex; align-items: center; text-decoration: underline; text-underline-offset: 4px; }
</style>
