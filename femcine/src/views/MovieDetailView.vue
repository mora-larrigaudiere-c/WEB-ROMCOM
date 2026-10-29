<template>
  <div class="detail section">
    <div v-if="!deleted" class="container">
      <StatusMessage v-if="!movie" type="error" title="No encontramos esa película">
        No existe ninguna película con el identificador “{{ $route.params.id }}”. Puede que se haya eliminado.
        <template #action>
          <router-link class="btn btn--pink" :to="{ name: 'catalogo' }">Volver al catálogo</router-link>
        </template>
      </StatusMessage>

      <article v-else class="detail__layout">
        <div class="detail__poster">
          <PosterImage :src="posterSrc" :alt="`Póster de ${movie.title}`" :title="movie.title" />
        </div>

        <div class="detail__info">
          <router-link class="link-underline" :to="{ name: 'catalogo' }">← Volver al catálogo</router-link>
          <DisplayTitle :text="movie.title" tag="h1" tone="pink" size="clamp(2.2rem, 7vw, 4.4rem)" />

          <dl class="detail__facts">
            <div><dt>Año</dt><dd>{{ movie.year }}</dd></div>
            <div><dt>Dirección</dt><dd>{{ movie.director }}</dd></div>
            <div><dt>Duración</dt><dd>{{ duration }}</dd></div>
            <div><dt>Género</dt><dd>{{ movie.genre }}</dd></div>
            <div>
              <dt>Categoría editorial</dt>
              <dd>
                <router-link class="link-underline" :to="{ name: 'catalogo', query: { categoria: movie.category } }">{{ categoryName }}</router-link>
              </dd>
            </div>
          </dl>

          <h2 class="detail__syn-title">Sinopsis</h2>
          <p class="detail__synopsis">{{ movie.synopsis }}</p>

          <div class="detail__actions">
            <router-link class="btn btn--pink" :to="{ name: 'editar', params: { id: movie.id } }">Editar</router-link>
            <button type="button" class="btn btn--danger" @click="askDelete">Eliminar</button>
          </div>
        </div>
      </article>
    </div>

    <ConfirmModal
      :open="confirming"
      title="¿Eliminar esta película?"
      :message="`Vas a eliminar “${movie ? movie.title : ''}” del catálogo guardado en este dispositivo. Esta acción no se puede deshacer.`"
      confirm-label="Sí, eliminar"
      cancel-label="Cancelar"
      @confirm="doDelete"
      @cancel="confirming = false"
    />
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import PosterImage from '@/components/PosterImage.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { getMovieById, removeMovie, setNotice, state } from '@/store/catalog';
import { categoryLabel } from '@/data/categories';
import { resolvePoster, formatDuration } from '@/utils/poster';

export default {
  name: 'MovieDetailView',
  components: { DisplayTitle, PosterImage, StatusMessage, ConfirmModal },
  data() {
    return { confirming: false, deleted: false, state };
  },
  computed: {
    // Se busca en el estado cada vez que cambia el id de la ruta o el catálogo.
    movie() {
      return getMovieById(this.$route.params.id);
    },
    posterSrc() {
      return this.movie ? resolvePoster(this.movie.poster) : '';
    },
    categoryName() {
      return this.movie ? categoryLabel(this.movie.category) : '';
    },
    duration() {
      return this.movie ? formatDuration(this.movie.duration) : '';
    }
  },
  methods: {
    askDelete() {
      this.confirming = true;
    },
    doDelete() {
      const title = this.movie ? this.movie.title : 'La película';
      this.confirming = false;
      this.deleted = true; // evita mostrar "no encontrada" durante la transición de salida
      removeMovie(this.$route.params.id);
      setNotice(`Se eliminó “${title}” del catálogo.`);
      this.$router.push({ name: 'catalogo' });
    }
  }
};
</script>

<style scoped>
.detail__layout { display: grid; gap: 28px; }
.detail__poster { width: min(70vw, 320px); }
.detail__info { display: grid; gap: 18px; align-content: start; justify-items: start; }
.detail__facts { margin: 0; display: grid; gap: 10px; width: 100%; }
.detail__facts div { display: grid; grid-template-columns: 11rem 1fr; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.3); }
.detail__facts dt { font-weight: 700; color: var(--pink-soft); }
.detail__facts dd { margin: 0; }
.detail__syn-title { margin: 8px 0 0; font-family: var(--font-display); font-weight: 800; font-size: 1.6rem; text-transform: uppercase; }
.detail__synopsis { margin: 0; max-width: 62ch; }
.detail__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
@media (min-width: 800px) {
  .detail__layout { grid-template-columns: minmax(240px, 360px) 1fr; gap: 56px; align-items: start; }
  .detail__poster { width: 100%; }
}
</style>
