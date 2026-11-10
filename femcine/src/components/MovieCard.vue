<template>
  <li class="movie-card">
    <div class="movie-card__wrapper">
      <router-link class="movie-card__link" :to="{ name: 'detalle', params: { id: movie.id } }">
        <div class="movie-card__poster-box">
          <PosterImage :src="posterSrc" :alt="`Póster de ${movie.title}`" :title="movie.title" />
          <button
            type="button"
            class="movie-card__fav-btn"
            :class="{ 'movie-card__fav-btn--active': movie.isFavorite }"
            :aria-label="movie.isFavorite ? `Quitar ${movie.title} de favoritas` : `Agregar ${movie.title} a favoritas`"
            :aria-pressed="movie.isFavorite ? 'true' : 'false'"
            @click.prevent.stop="onToggleFavorite"
          >
            <span class="movie-card__fav-icon" aria-hidden="true">{{ movie.isFavorite ? '♥' : '♡' }}</span>
          </button>
        </div>
        <span class="movie-card__title">{{ movie.title }}</span>
        <span class="movie-card__meta">{{ movie.year }} · {{ categoryName }}</span>
        <div v-if="movie.userRating > 0" class="movie-card__rating" aria-label="Calificación personal">
          <span class="movie-card__rating-star" aria-hidden="true">★</span>
          <span class="movie-card__rating-text">{{ movie.userRating }}/5</span>
        </div>
        <span class="movie-card__cta">Ver detalle</span>
      </router-link>
    </div>
  </li>
</template>

<script>
import PosterImage from '@/components/PosterImage.vue';
import { resolvePoster } from '@/utils/poster';
import { categoryLabel } from '@/data/categories';
import { toggleFavorite } from '@/store/catalog';

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
  },
  methods: {
    onToggleFavorite() {
      toggleFavorite(this.movie.id);
    }
  }
};
</script>

<style scoped>
.movie-card { list-style: none; }
.movie-card__wrapper { height: 100%; position: relative; }
.movie-card__link {
  display: flex; flex-direction: column; gap: 6px; height: 100%;
  color: var(--white); text-decoration: none;
}
.movie-card__poster-box { position: relative; width: 100%; }
.movie-card__link :deep(.poster) { transition: transform 0.2s ease; }
.movie-card__link:hover :deep(.poster) { transform: translateY(-4px); }

.movie-card__fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 10, 0.75);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  color: var(--white);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);
}
.movie-card__fav-btn:hover {
  background: var(--pink-strong);
  color: var(--black);
  border-color: var(--pink-strong);
  transform: scale(1.1);
}
.movie-card__fav-btn--active {
  background: var(--pink-strong);
  color: var(--black);
  border-color: var(--pink-strong);
}

.movie-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--pink-strong);
}
.movie-card__rating-star {
  font-size: 1rem;
}
.movie-card__rating-text {
  font-family: var(--font-body);
}

.movie-card__title { margin-top: 6px; font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; line-height: 1.15; text-transform: uppercase; }
.movie-card__meta { color: var(--pink-soft); font-weight: 600; }
.movie-card__cta { margin-top: auto; padding-top: 4px; min-height: 44px; display: inline-flex; align-items: center; text-decoration: underline; text-underline-offset: 4px; }
</style>
