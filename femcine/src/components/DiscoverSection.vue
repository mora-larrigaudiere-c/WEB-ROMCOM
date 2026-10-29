<template>
  <section class="discover" aria-labelledby="discover-title">
    <div class="container">
      <p class="discover__tag">Fuente externa: Studio Ghibli API</p>
      <DisplayTitle id="discover-title" text="Más cine para descubrir" tone="dark" size="clamp(2.2rem, 7vw, 4rem)" />
      <p class="discover__intro">
        Esta sección se carga en vivo con Fetch desde un servicio externo. No forma parte de tu catálogo y no se guarda en el dispositivo.
      </p>

      <StatusMessage v-if="status === 'loading'" type="loading">Cargando películas del servicio externo…</StatusMessage>

      <StatusMessage v-else-if="status === 'error'" type="error" title="No pudimos traer las películas">
        {{ errorMessage }}
        <template #action>
          <button type="button" class="btn btn--black" @click="load">Reintentar</button>
        </template>
      </StatusMessage>

      <template v-else-if="status === 'success'">
        <p v-if="!films.length" class="discover__intro">El servicio respondió bien, pero no devolvió películas.</p>
        <template v-else>
          <p class="discover__count" role="status">Mostrando {{ visibleFilms.length }} de {{ films.length }} películas.</p>
          <ul class="discover__grid">
            <ExternalFilmCard v-for="film in visibleFilms" :key="film.id" :film="film" />
          </ul>
          <button v-if="films.length > limit" type="button" class="btn btn--outline-dark" @click="showAll = !showAll">
            {{ showAll ? 'Mostrar menos' : 'Mostrar todas' }}
          </button>
        </template>
      </template>
    </div>
  </section>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import ExternalFilmCard from '@/components/ExternalFilmCard.vue';
import { fetchGhibliFilms } from '@/services/ghibliService';

export default {
  name: 'DiscoverSection',
  components: { DisplayTitle, StatusMessage, ExternalFilmCard },
  data() {
    return { films: [], status: 'idle', errorMessage: '', showAll: false, limit: 8, controller: null };
  },
  computed: {
    visibleFilms() {
      return this.showAll ? this.films : this.films.slice(0, this.limit);
    }
  },
  mounted() {
    // Se pide al montarse, cuando el estado "cargando" ya puede verse en pantalla.
    this.load();
  },
  beforeUnmount() {
    if (this.controller) this.controller.abort();
  },
  methods: {
    async load() {
      if (this.controller) this.controller.abort();
      this.controller = new AbortController();
      const { signal } = this.controller;
      this.status = 'loading';
      this.errorMessage = '';
      try {
        const films = await fetchGhibliFilms({ signal });
        if (signal.aborted) return;
        this.films = films;
        this.status = 'success';
      } catch (e) {
        if (e && e.name === 'AbortError') return; // el usuario salió de la pantalla
        this.films = [];
        this.status = 'error';
        this.errorMessage = e && e.message ? e.message : 'Ocurrió un error inesperado.';
      }
    }
  }
};
</script>

<style scoped>
.discover { background: var(--pink-strong) var(--img-rosa) center / cover; color: var(--black); padding-block: clamp(40px, 7vw, 88px); }
.discover__tag { display: inline-block; margin: 0 0 12px; padding: 4px 12px; background: var(--black); color: var(--white); border-radius: 999px; font-weight: 700; }
.discover__intro { max-width: 62ch; margin: 14px 0 24px; }
.discover__count { margin: 0 0 16px; font-weight: 700; }
.discover__grid { list-style: none; margin: 0 0 24px; padding: 0; display: grid; gap: 28px 18px; grid-template-columns: repeat(2, 1fr); }
@media (min-width: 640px) { .discover__grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1000px) { .discover__grid { grid-template-columns: repeat(4, 1fr); } }
</style>
