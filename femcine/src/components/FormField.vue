<template>
  <div class="field">
    <label class="field__label" :for="id">
      {{ label }}<span v-if="required" class="field__req" aria-hidden="true"> *</span>
    </label>
    <slot />
    <p v-if="hint" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="field__error">{{ error }}</p>
  </div>
</template>

<script>
// Envuelve un control: etiqueta visible, ayuda y mensaje de error junto al campo.
export default {
  name: 'FormField',
  props: {
    id: { type: String, required: true },
    label: { type: String, required: true },
    hint: { type: String, default: '' },
    error: { type: String, default: '' },
    required: { type: Boolean, default: false }
  }
};
</script>
