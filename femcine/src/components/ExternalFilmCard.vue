<template>
  <li class="ext-card">
    <PosterImage :src="film.image" :alt="`Imagen de ${film.title}`" :title="film.title" />
    <h3 class="ext-card__title">{{ film.title }}</h3>
    <p v-if="film.originalTitle" class="ext-card__orig">{{ film.originalTitle }}</p>
    <dl class="ext-card__data">
      <div v-if="film.year"><dt>Año</dt><dd>{{ film.year }}</dd></div>
      <div v-if="film.director"><dt>Dirección</dt><dd>{{ film.director }}</dd></div>
      <div v-if="film.duration"><dt>Duración</dt><dd>{{ film.duration }} min</dd></div>
    </dl>
  </li>
</template>

<script>
import PosterImage from '@/components/PosterImage.vue';

export default {
  name: 'ExternalFilmCard',
  components: { PosterImage },
  props: {
    film: { type: Object, required: true, validator: (f) => typeof f.id === 'string' && typeof f.title === 'string' }
  }
};
</script>

<style scoped>
.ext-card { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.ext-card__title { margin: 8px 0 0; font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; line-height: 1.15; text-transform: uppercase; }
.ext-card__orig { margin: 0; font-style: italic; }
.ext-card__data { margin: 4px 0 0; display: grid; gap: 2px; }
.ext-card__data div { display: flex; gap: 6px; }
.ext-card__data dt { font-weight: 700; }
.ext-card__data dt::after { content: ':'; }
.ext-card__data dd { margin: 0; }
</style>
