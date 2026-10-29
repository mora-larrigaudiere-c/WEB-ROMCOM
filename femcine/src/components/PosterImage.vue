<template>
  <img v-if="src && !failed" class="poster" :src="src" :alt="alt" loading="lazy" decoding="async" @error="failed = true" />
  <div v-else class="poster poster--missing" role="img" :aria-label="`${alt} (imagen no disponible)`">
    <span>{{ title || 'Sin póster' }}</span>
  </div>
</template>

<script>
// Muestra el póster completo (sin recortar). Si la imagen no carga, muestra un bloque de texto.
export default {
  name: 'PosterImage',
  props: {
    src: { type: String, default: '' },
    alt: { type: String, required: true },
    title: { type: String, default: '' }
  },
  data() {
    return { failed: false };
  },
  watch: {
    src() {
      this.failed = false;
    }
  }
};
</script>

<style scoped>
.poster { display: block; width: 100%; height: auto; border-radius: 12px; }
.poster--missing {
  aspect-ratio: 2 / 3;
  display: flex; align-items: center; justify-content: center; padding: 16px;
  background: #1c1c1c; border: 2px dashed var(--pink); color: var(--white);
  font-family: var(--font-display); font-weight: 800; text-align: center; text-transform: uppercase;
}
</style>
