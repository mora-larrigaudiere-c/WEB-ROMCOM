<template>
  <transition name="modal">
    <div v-if="open" class="backdrop" @click.self="$emit('cancel')">
      <div ref="dialog" class="modal" role="alertdialog" aria-modal="true" :aria-labelledby="`${uid}-title`" :aria-describedby="`${uid}-desc`">
        <h2 :id="`${uid}-title`" class="modal__title">{{ title }}</h2>
        <p :id="`${uid}-desc`" class="modal__text">{{ message }}</p>
        <div class="modal__actions">
          <button ref="cancelButton" type="button" class="btn btn--outline" @click="$emit('cancel')">{{ cancelLabel }}</button>
          <button type="button" class="btn btn--pink" @click="$emit('confirm')">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

// Diálogo de confirmación accesible: enfoca el botón seguro al abrir, atrapa el foco,
// se cierra con Escape y devuelve el foco al elemento que lo abrió.
export default {
  name: 'ConfirmModal',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
    message: { type: String, required: true },
    confirmLabel: { type: String, default: 'Confirmar' },
    cancelLabel: { type: String, default: 'Cancelar' }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return { uid: `modal-${Math.random().toString(36).slice(2, 8)}`, previousFocus: null };
  },
  watch: {
    open(isOpen) {
      if (isOpen) this.activate();
      else this.deactivate();
    }
  },
  beforeUnmount() {
    this.deactivate(false);
  },
  methods: {
    activate() {
      this.previousFocus = document.activeElement;
      document.addEventListener('keydown', this.onKeydown);
      document.body.classList.add('modal-open');
      this.$nextTick(() => {
        if (this.$refs.cancelButton) this.$refs.cancelButton.focus();
      });
    },
    deactivate(restoreFocus = true) {
      document.removeEventListener('keydown', this.onKeydown);
      document.body.classList.remove('modal-open');
      if (restoreFocus && this.previousFocus && typeof this.previousFocus.focus === 'function') {
        this.previousFocus.focus();
      }
      this.previousFocus = null;
    },
    onKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.$emit('cancel');
        return;
      }
      if (event.key !== 'Tab' || !this.$refs.dialog) return;
      const items = this.$refs.dialog.querySelectorAll(FOCUSABLE);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
};
</script>

<style scoped>
.backdrop {
  position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 16px;
  background: rgba(0, 0, 0, 0.78);
}
.modal {
  width: min(480px, 100%); padding: 28px 24px; border-radius: 18px;
  background: #111; color: var(--white); border: 3px solid var(--pink);
}
.modal__title { margin: 0 0 12px; font-family: var(--font-display); font-weight: 800; font-size: 1.6rem; text-transform: uppercase; }
.modal__text { margin: 0 0 24px; }
.modal__actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-end; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
