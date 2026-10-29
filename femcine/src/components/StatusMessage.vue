<template>
  <div class="status" :class="`status--${type}`" :role="type === 'error' ? 'alert' : 'status'">
    <div class="status__body">
      <p v-if="title" class="status__title">{{ title }}</p>
      <div class="status__text"><slot /></div>
      <div v-if="$slots.action" class="status__action"><slot name="action" /></div>
    </div>
    <button v-if="dismissible" type="button" class="status__close" aria-label="Cerrar aviso" @click="$emit('dismiss')">
      <span aria-hidden="true">×</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'StatusMessage',
  props: {
    type: { type: String, default: 'info', validator: (v) => ['info', 'error', 'success', 'loading'].includes(v) },
    title: { type: String, default: '' },
    dismissible: { type: Boolean, default: false }
  },
  emits: ['dismiss']
};
</script>

<style scoped>
.status {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 16px 18px; border-radius: var(--radius); border: 2px solid var(--white);
  background: rgba(0, 0, 0, 0.82); color: var(--white);
}
.status--error { border-color: var(--danger); }
.status--success { border-color: var(--pink); }
.status--loading { border-style: dashed; }
.status__title { margin: 0 0 4px; font-weight: 700; font-size: 1.1rem; }
.status__text { margin: 0; }
.status__text :deep(p) { margin: 0; }
.status__action { margin-top: 12px; }
.status__close {
  flex: none; min-width: 44px; min-height: 44px; margin: -8px -8px 0 0;
  background: transparent; color: inherit; border: 0; font-size: 1.8rem; line-height: 1; cursor: pointer;
}
</style>
