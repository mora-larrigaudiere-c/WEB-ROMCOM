<template>
  <form class="movie-form" novalidate @submit.prevent="onSubmit">
    <StatusMessage v-if="errorCount" type="error" class="movie-form__summary">
      Revisá los datos: {{ errorCount === 1 ? 'hay 1 campo' : `hay ${errorCount} campos` }} para corregir.
    </StatusMessage>

    <FormField id="f-title" label="Título" :error="errors.title" required>
      <input id="f-title" v-model="form.title" class="input" type="text" autocomplete="off"
        :aria-invalid="errors.title ? 'true' : 'false'" :aria-describedby="describedBy('title')" @blur="validateField('title')" />
    </FormField>

    <div class="movie-form__row">
      <FormField id="f-year" label="Año" hint="Cuatro cifras, por ejemplo 1999." :error="errors.year" required>
        <input id="f-year" v-model="form.year" class="input" type="text" inputmode="numeric" autocomplete="off"
          :aria-invalid="errors.year ? 'true' : 'false'" :aria-describedby="describedBy('year')" @blur="validateField('year')" />
      </FormField>
      <FormField id="f-duration" label="Duración (minutos)" :error="errors.duration" required>
        <input id="f-duration" v-model="form.duration" class="input" type="text" inputmode="numeric" autocomplete="off"
          :aria-invalid="errors.duration ? 'true' : 'false'" :aria-describedby="describedBy('duration')" @blur="validateField('duration')" />
      </FormField>
    </div>

    <FormField id="f-director" label="Dirección" :error="errors.director" required>
      <input id="f-director" v-model="form.director" class="input" type="text" autocomplete="off"
        :aria-invalid="errors.director ? 'true' : 'false'" :aria-describedby="describedBy('director')" @blur="validateField('director')" />
    </FormField>

    <div class="movie-form__row">
      <FormField id="f-genre" label="Género" hint="Género cinematográfico, por ejemplo “Comedia romántica”." :error="errors.genre" required>
        <input id="f-genre" v-model="form.genre" class="input" type="text" autocomplete="off"
          :aria-invalid="errors.genre ? 'true' : 'false'" :aria-describedby="describedBy('genre')" @blur="validateField('genre')" />
      </FormField>
      <FormField id="f-category" label="Categoría editorial" hint="Colección de FemCine donde se muestra." :error="errors.category" required>
        <select id="f-category" v-model="form.category" class="select"
          :aria-invalid="errors.category ? 'true' : 'false'" :aria-describedby="describedBy('category')" @change="validateField('category')">
          <option value="" disabled>Elegí una categoría</option>
          <option v-for="item in categories" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </FormField>
    </div>

    <fieldset class="movie-form__poster">
      <legend class="field__label">Póster <span aria-hidden="true">*</span></legend>
      <div class="movie-form__modes">
        <label class="radio"><input v-model="form.posterMode" type="radio" value="manifest" @change="clearPosterError" /> Elegir de la galería</label>
        <label class="radio"><input v-model="form.posterMode" type="radio" value="url" @change="clearPosterError" /> Usar una URL</label>
      </div>
      <div class="movie-form__poster-body">
        <div class="movie-form__poster-controls">
          <div v-if="form.posterMode === 'manifest'" class="field">
            <label class="field__label" for="f-poster-key">Póster de la galería</label>
            <select id="f-poster-key" v-model="form.posterKey" class="select"
              :aria-invalid="errors.poster ? 'true' : 'false'" :aria-describedby="describedBy('poster', 'f-poster')" @change="validateField('poster')">
              <option value="" disabled>Elegí un póster</option>
              <option v-for="option in posterOptions" :key="option.key" :value="option.key">{{ option.label }}</option>
            </select>
          </div>
          <div v-else class="field">
            <label class="field__label" for="f-poster-url">URL de la imagen</label>
            <input id="f-poster-url" v-model="form.posterUrl" class="input" type="url" placeholder="https://..." autocomplete="off"
              :aria-invalid="errors.poster ? 'true' : 'false'" :aria-describedby="describedBy('poster', 'f-poster')" @blur="validateField('poster')" />
          </div>
          <p v-if="errors.poster" id="f-poster-error" class="field__error">{{ errors.poster }}</p>
        </div>
        <div class="movie-form__preview">
          <p class="field__hint">Vista previa</p>
          <PosterImage v-if="previewSrc" :src="previewSrc" :alt="`Vista previa del póster de ${form.title || 'la película'}`" :title="form.title" />
          <p v-else class="field__hint">Todavía no hay un póster elegido.</p>
        </div>
      </div>
    </fieldset>

    <FormField id="f-synopsis" label="Sinopsis" :hint="`Entre 20 y 600 caracteres (${form.synopsis.trim().length}).`" :error="errors.synopsis" required>
      <textarea id="f-synopsis" v-model="form.synopsis" class="textarea"
        :aria-invalid="errors.synopsis ? 'true' : 'false'" :aria-describedby="describedBy('synopsis')" @blur="validateField('synopsis')"></textarea>
    </FormField>

    <div class="movie-form__actions">
      <button type="submit" class="btn btn--pink">{{ submitLabel }}</button>
      <button type="button" class="btn btn--outline" @click="$emit('cancel')">Cancelar</button>
    </div>
  </form>
</template>

<script>
import FormField from '@/components/FormField.vue';
import PosterImage from '@/components/PosterImage.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import { CATEGORIES } from '@/data/categories';
import { POSTERS, POSTER_KEYS, POSTER_OPTIONS } from '@/data/assets';
import { validateMovie, hasErrors, isValidUrl } from '@/utils/validators';
import { movieToForm, formToMovie } from '@/utils/movieForm';

const HINTED = ['year', 'genre', 'category', 'synopsis'];

// Un solo formulario para alta y edición. Trabaja siempre sobre una COPIA del registro
// (form), de modo que cancelar no modifica nada.
export default {
  name: 'MovieForm',
  components: { FormField, PosterImage, StatusMessage },
  props: {
    initial: { type: Object, default: null },
    submitLabel: { type: String, default: 'Guardar' }
  },
  emits: {
    submit: (movie) => movie !== null && typeof movie === 'object',
    cancel: null
  },
  data() {
    return {
      form: movieToForm(this.initial, POSTER_KEYS),
      errors: {},
      categories: CATEGORIES,
      posterOptions: POSTER_OPTIONS
    };
  },
  computed: {
    errorCount() {
      return Object.keys(this.errors).length;
    },
    // Vista previa del póster elegido (galería o URL válida).
    previewSrc() {
      if (this.form.posterMode === 'url') {
        return isValidUrl(this.form.posterUrl) ? this.form.posterUrl.trim() : '';
      }
      return POSTERS[this.form.posterKey] ? POSTERS[this.form.posterKey].src : '';
    }
  },
  methods: {
    runValidation() {
      return validateMovie(this.form, { posterKeys: POSTER_KEYS });
    },
    validateField(name) {
      const all = this.runValidation();
      const next = { ...this.errors };
      if (all[name]) next[name] = all[name];
      else delete next[name];
      this.errors = next;
    },
    clearPosterError() {
      const next = { ...this.errors };
      delete next.poster;
      this.errors = next;
    },
    describedBy(name, idBase) {
      const base = idBase || `f-${name}`;
      const ids = [];
      if (HINTED.includes(name)) ids.push(`${base}-hint`);
      if (this.errors[name]) ids.push(`${base}-error`);
      return ids.length ? ids.join(' ') : null;
    },
    onSubmit() {
      this.errors = this.runValidation();
      if (hasErrors(this.errors)) {
        this.$nextTick(() => {
          const firstInvalid = this.$el.querySelector('[aria-invalid="true"]');
          if (firstInvalid) firstInvalid.focus();
        });
        return;
      }
      this.$emit('submit', formToMovie(this.form));
    }
  }
};
</script>

<style scoped>
.movie-form { display: block; }
.movie-form__summary { margin-bottom: 24px; }
.movie-form__row { display: grid; gap: 0 20px; }
.movie-form__poster { border: 2px solid var(--white); border-radius: var(--radius); padding: 16px 18px 6px; margin: 0 0 20px; min-width: 0; }
.movie-form__poster legend { padding: 0 8px; }
.movie-form__modes { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-bottom: 14px; }
.radio { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; cursor: pointer; }
.radio input { width: 22px; height: 22px; accent-color: var(--pink); }
.movie-form__poster-body { display: grid; gap: 16px; }
.movie-form__preview { max-width: 180px; }
.movie-form__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
@media (min-width: 640px) {
  .movie-form__row { grid-template-columns: 1fr 1fr; }
  .movie-form__poster-body { grid-template-columns: 1fr 180px; align-items: start; }
}
</style>
