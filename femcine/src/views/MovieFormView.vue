<template>
  <div class="formview section">
    <div class="container formview__container">
      <StatusMessage v-if="isEdit && !movie" type="error" title="No encontramos esa película">
        No existe ninguna película con el identificador “{{ $route.params.id }}”, así que no se puede editar.
        <template #action>
          <router-link class="btn btn--pink" :to="{ name: 'catalogo' }">Volver al catálogo</router-link>
        </template>
      </StatusMessage>

      <template v-else>
        <DisplayTitle :text="isEdit ? 'Editar película' : 'Agregar película'" tag="h1" tone="pink" size="clamp(2.4rem, 8vw, 4.6rem)" />
        <p class="formview__intro">
          {{ isEdit ? 'Cambiá los datos que necesites. Si cancelás, el registro queda como estaba.' : 'Completá los datos. Los campos con * son obligatorios.' }}
        </p>
        <!-- La clave fuerza un formulario nuevo (y una copia nueva) al cambiar de película. -->
        <MovieForm
          :key="movie ? movie.id : 'nueva'"
          :initial="initial"
          :submit-label="isEdit ? 'Guardar cambios' : 'Agregar película'"
          @submit="save"
          @cancel="cancel"
        />
      </template>
    </div>
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import MovieForm from '@/components/MovieForm.vue';
import { state, getMovieById, addMovie, updateMovie } from '@/store/catalog';

export default {
  name: 'MovieFormView',
  components: { DisplayTitle, StatusMessage, MovieForm },
  data() {
    return { state };
  },
  computed: {
    isEdit() {
      return this.$route.name === 'editar';
    },
    movie() {
      return this.isEdit ? getMovieById(this.$route.params.id) : null;
    },
    // Copia del registro: el formulario nunca toca el original hasta guardar.
    initial() {
      return this.movie ? { ...this.movie } : null;
    }
  },
  methods: {
    save(data) {
      if (this.isEdit) {
        updateMovie(this.movie.id, data);
        this.$router.push({ name: 'detalle', params: { id: this.movie.id } });
      } else {
        const created = addMovie(data);
        this.$router.push({ name: 'detalle', params: { id: created.id } });
      }
    },
    cancel() {
      if (this.isEdit && this.movie) this.$router.push({ name: 'detalle', params: { id: this.movie.id } });
      else this.$router.push({ name: 'catalogo' });
    }
  }
};
</script>

<style scoped>
.formview__container { max-width: 820px; }
.formview__intro { margin: 16px 0 28px; }
</style>
