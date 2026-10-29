<template>
  <section class="drama" aria-roledescription="carrusel" aria-labelledby="drama-title" @keydown.left="prev" @keydown.right="next">
    <div class="container drama__inner">
      <DisplayTitle id="drama-title" text="Drama semanal" tone="dark" size="clamp(2.2rem, 7vw, 4rem)" />

      <StatusMessage v-if="!movies.length" type="info" title="Todavía no hay películas en el catálogo">
        <p>Agregá la primera para que aparezca acá.</p>
        <template #action><router-link class="btn btn--black" to="/peliculas/nueva">Agregar película</router-link></template>
      </StatusMessage>

      <div v-else class="drama__stage">
        <button type="button" class="drama__arrow drama__arrow--prev" aria-label="Película anterior" @click="prev">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>

        <div class="drama__slides" aria-live="polite">
          <transition name="slide" mode="out-in">
            <article :key="current.id" class="drama__slide" :aria-label="`${index + 1} de ${movies.length}: ${current.title}`">
              <div class="drama__poster">
                <PosterImage :src="posterSrc" :alt="`Póster de ${current.title}`" :title="current.title" />
              </div>
              <div class="drama__info">
                <h3 class="drama__title">{{ current.title }}</h3>
                <p class="drama__meta">{{ current.year }} · {{ current.genre }}</p>
                <p class="drama__tag">{{ categoryName }}</p>
                <router-link class="btn btn--black" :to="{ name: 'detalle', params: { id: current.id } }">Ver ficha</router-link>
              </div>
            </article>
          </transition>
        </div>

        <button type="button" class="drama__arrow drama__arrow--next" aria-label="Película siguiente" @click="next">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="m9 4 8 8-8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
      </div>

      <div v-if="movies.length > 1" class="drama__dots" role="group" aria-label="Elegir película del carrusel">
        <button
          v-for="(movie, i) in movies"
          :key="movie.id"
          type="button"
          class="drama__dot"
          :aria-label="`Ir a ${movie.title}`"
          :aria-current="i === index ? 'true' : null"
          @click="go(i)"
        >
          <span class="drama__dot-mark" :class="{ 'is-on': i === index }"></span>
        </button>
      </div>
    </div>
  </section>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import PosterImage from '@/components/PosterImage.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import { resolvePoster } from '@/utils/poster';
import { categoryLabel } from '@/data/categories';

export default {
  name: 'DramaCarousel',
  components: { DisplayTitle, PosterImage, StatusMessage },
  props: {
    movies: { type: Array, required: true }
  },
  emits: ['change'],
  data() {
    return { index: 0 };
  },
  computed: {
    current() {
      return this.movies[this.index] || this.movies[0];
    },
    posterSrc() {
      return this.current ? resolvePoster(this.current.poster) : '';
    },
    categoryName() {
      return this.current ? categoryLabel(this.current.category) : '';
    }
  },
  watch: {
    movies(list) {
      // Si el catálogo cambia (por ejemplo, se elimina una película), el índice no puede quedar fuera de rango.
      if (this.index >= list.length) this.index = Math.max(0, list.length - 1);
    }
  },
  methods: {
    go(i) {
      this.index = i;
      this.$emit('change', this.movies[i]);
    },
    next() {
      if (this.movies.length) this.go((this.index + 1) % this.movies.length);
    },
    prev() {
      if (this.movies.length) this.go((this.index - 1 + this.movies.length) % this.movies.length);
    }
  }
};
</script>

<style scoped>
.drama { background: var(--pink-strong) var(--img-rosa) center / cover; color: var(--black); padding-block: clamp(36px, 6vw, 80px); }
.drama__inner { display: grid; gap: 24px; }
.drama__stage { display: grid; grid-template-columns: 48px 1fr 48px; align-items: center; gap: 8px; }
.drama__arrow {
  width: 48px; height: 48px; display: grid; place-items: center; cursor: pointer;
  background: var(--black); color: var(--white); border: 0; border-radius: 12px;
}
.drama__arrow:hover { background: #2a2a2a; }
.drama__slide { display: grid; gap: 20px; justify-items: center; text-align: center; }
.drama__poster { width: min(62vw, 260px); }
.drama__title { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: clamp(1.8rem, 6vw, 3.4rem); line-height: 1; text-transform: uppercase; }
.drama__meta { margin: 6px 0 0; font-weight: 600; }
.drama__tag { margin: 4px 0 16px; font-family: var(--font-display); font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
.drama__dots { display: flex; justify-content: center; flex-wrap: wrap; }
.drama__dot { width: 44px; height: 44px; display: grid; place-items: center; background: transparent; border: 0; cursor: pointer; }
.drama__dot-mark { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--black); background: transparent; }
.drama__dot-mark.is-on { background: var(--black); }

.slide-enter-active, .slide-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.slide-enter-from { opacity: 0; transform: translateX(24px); }
.slide-leave-to { opacity: 0; transform: translateX(-24px); }

@media (min-width: 900px) {
  .drama__stage { grid-template-columns: 56px 1fr 56px; }
  .drama__slide { grid-template-columns: 1.2fr 0.8fr; align-items: center; text-align: left; justify-items: stretch; }
  .drama__poster { order: 2; width: min(100%, 340px); justify-self: center; }
  .drama__info { order: 1; }
  .drama__title { font-size: clamp(2.6rem, 5vw, 4.6rem); }
}
</style>
