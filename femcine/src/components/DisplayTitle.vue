<template>
  <component :is="tag" class="display-title" :class="`tone-${tone}`" :style="size ? { '--dt-size': size } : null">
    <span class="dt-first">{{ first }}</span>{{ rest }}
  </component>
</template>

<script>
// Título editorial: serif de alto contraste en mayúsculas con la inicial caligráfica.
export default {
  name: 'DisplayTitle',
  props: {
    text: { type: String, required: true },
    tag: { type: String, default: 'h2' },
    tone: { type: String, default: 'light', validator: (v) => ['light', 'pink', 'dark'].includes(v) },
    size: { type: String, default: '' }
  },
  computed: {
    // La inicial caligráfica solo se aplica si es una letra (no a números como en "10 cosas...").
    // Si el título empieza con "¿" o "¡", la inicial es la letra siguiente.
    parts() {
      const lead = this.text.match(/^[¿¡]*/)[0].length;
      const letter = this.text.charAt(lead);
      if (!/\p{L}/u.test(letter)) return { first: '', rest: this.text };
      return { first: this.text.slice(0, lead + 1), rest: this.text.slice(lead + 1) };
    },
    first() {
      return this.parts.first;
    },
    rest() {
      return this.parts.rest;
    }
  }
};
</script>

<style scoped>
.display-title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--dt-size, clamp(2.4rem, 9vw, 5rem));
  line-height: 1;
  letter-spacing: -0.005em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}
.dt-first {
  font-family: var(--font-script);
  font-weight: 400;
  font-size: 1.4em;
  line-height: 0.7;
  text-transform: none;
  padding-right: 0.03em;
}
.tone-light { color: var(--white); }
.tone-pink { color: var(--pink); }
.tone-dark { color: var(--black); }
</style>
