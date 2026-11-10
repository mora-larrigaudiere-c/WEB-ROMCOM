<template>
  <div class="formview section">
    <div class="container formview__container">
      <!-- GUARDA DE ACCESO: Solo administradoras si Supabase está configurado -->
      <StatusMessage
        v-if="isAccessDenied"
        type="error"
        title="Acceso restringido a creadoras"
      >
        El catálogo público compartido de FemCine solo puede ser modificado por sus creadoras (Mora Larrigaudiere Curutchet y Oriana Fuentes). Iniciá sesión con una cuenta administradora para continuar.
        <template #action>
          <router-link class="btn btn--pink" :to="{ name: 'catalogo' }">Volver al catálogo</router-link>
        </template>
      </StatusMessage>

      <StatusMessage v-else-if="isEdit && !movie" type="error" title="No encontramos esa película">
        No existe ninguna película con el identificador “{{ $route.params.id }}”, así que no se puede editar.
        <template #action>
          <router-link class="btn btn--pink" :to="{ name: 'catalogo' }">Volver al catálogo</router-link>
        </template>
      </StatusMessage>

      <template v-else>
        <DisplayTitle :text="isEdit ? 'Editar película' : 'Agregar película pública'" tag="h1" tone="pink" size="clamp(2.4rem, 8vw, 4.6rem)" />
        <p class="formview__intro">
          {{ isEdit ? 'Cambiá los datos que necesites. Si cancelás, el registro queda como estaba.' : 'Completá los datos para sumar una película al catálogo público. Los campos con * son obligatorios.' }}
        </p>

        <!-- AVISO DE ERROR VISIBLE -->
        <StatusMessage v-if="saveError" type="error" dismissible class="formview__error" @dismiss="saveError = ''">
          {{ saveError }}
        </StatusMessage>

        <div v-if="saving" class="formview__saving-banner">
          Guardando cambios en el catálogo público...
        </div>

        <MovieForm
          :key="movie ? movie.id : 'nueva'"
          :initial="initial"
          :submit-label="submitButtonText"
          :disabled="saving"
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
import { authState } from '@/store/auth';

export default {
  name: 'MovieFormView',
  components: { DisplayTitle, StatusMessage, MovieForm },
  data() {
    return {
      state,
      authState,
      saving: false,
      saveError: ''
    };
  },
  computed: {
    isEdit() {
      return this.$route.name === 'editar';
    },
    movie() {
      return this.isEdit ? getMovieById(this.$route.params.id) : null;
    },
    initial() {
      return this.movie ? { ...this.movie } : null;
    },
    // Si Supabase está configurado, solo admins tienen permiso de CRUD
    isAccessDenied() {
      if (!this.authState.isConfigured) return false; // En modo local offline se permite demo
      return !this.authState.isAdmin;
    },
    submitButtonText() {
      if (this.saving) return 'Guardando película...';
      return this.isEdit ? 'Guardar cambios' : 'Agregar película al catálogo';
    }
  },
  methods: {
    async save(data) {
      if (this.saving) return; // Prevenir doble envío
      this.saving = true;
      this.saveError = '';

      try {
        if (this.isEdit) {
          const targetId = this.movie.id;
          await updateMovie(targetId, data);
          this.$router.push({ name: 'detalle', params: { id: targetId } });
        } else {
          const created = await addMovie(data);
          const newId = created?.id || data.id;
          this.$router.push({ name: 'detalle', params: { id: newId } });
        }
      } catch (err) {
        console.error('[FemCine] Error al guardar película:', err);
        this.saveError = err?.message || 'No se pudo guardar la película. Verificá tus permisos de administración o tu conexión.';
      } finally {
        this.saving = false;
      }
    },
    cancel() {
      if (this.isEdit && this.movie) {
        this.$router.push({ name: 'detalle', params: { id: this.movie.id } });
      } else {
        this.$router.push({ name: 'catalogo' });
      }
    }
  }
};
</script>

<style scoped>
.formview__container { max-width: 820px; }
.formview__intro { margin: 16px 0 24px; font-size: 1.05rem; }
.formview__error { margin-bottom: 20px; }
.formview__saving-banner {
  padding: 12px 18px;
  background: rgba(255, 0, 204, 0.15);
  border: 1px solid var(--pink);
  border-radius: var(--radius);
  color: var(--pink-soft);
  font-weight: 700;
  margin-bottom: 20px;
}
</style>
