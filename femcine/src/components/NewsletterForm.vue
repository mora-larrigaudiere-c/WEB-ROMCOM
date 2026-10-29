<template>
  <form class="news-form" novalidate @submit.prevent="onSubmit">
    <label class="news-form__label" for="news-email">Tu correo electrónico</label>
    <input
      id="news-email"
      v-model="email"
      class="news-form__input"
      type="email"
      inputmode="email"
      autocomplete="email"
      placeholder="Escribí tu mail"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="error ? 'news-error' : null"
    />
    <p v-if="error" id="news-error" class="news-form__error">{{ error }}</p>
    <button type="submit" class="btn btn--black">Suscribite</button>
    <p v-if="message" class="news-form__ok" role="status">{{ message }}</p>
  </form>
</template>

<script>
import { validateEmail } from '@/utils/validators';
import { addSubscriber } from '@/services/newsletterService';

export default {
  name: 'NewsletterForm',
  emits: {
    subscribed: (email) => typeof email === 'string'
  },
  data() {
    return { email: '', error: '', message: '' };
  },
  methods: {
    onSubmit() {
      this.message = '';
      this.error = validateEmail(this.email);
      if (this.error) return;
      try {
        const status = addSubscriber(this.email);
        this.message =
          status === 'exists'
            ? 'Ese correo ya estaba guardado en este dispositivo.'
            : 'Listo: guardamos tu correo en este dispositivo para la demostración académica. No se envía ningún correo.';
        this.$emit('subscribed', this.email.trim());
        this.email = '';
      } catch (e) {
        this.error = e && e.message ? e.message : 'No pudimos guardar tu correo en este dispositivo.';
      }
    }
  }
};
</script>

<style scoped>
.news-form { display: grid; gap: 10px; max-width: 460px; }
.news-form__label { font-weight: 700; }
.news-form__input {
  min-height: 48px; padding: 10px 14px; background: #fff; color: var(--black);
  border: 3px solid var(--pink-strong); border-radius: 12px; font: inherit; font-size: 1rem;
}
.news-form__input[aria-invalid='true'] { border-color: #b00020; box-shadow: 0 0 0 3px rgba(176, 0, 32, 0.35); }
.news-form__error { margin: 0; font-weight: 700; color: #7a0016; background: #fff; padding: 6px 10px; border-radius: 8px; }
.news-form__ok { margin: 0; font-weight: 600; background: #fff; padding: 8px 12px; border-radius: 8px; }
.news-form .btn { justify-self: start; }
</style>
