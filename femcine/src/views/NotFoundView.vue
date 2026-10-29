<template>
  <div class="notfound section">
    <div class="container notfound__inner">
      <p class="notfound__code" aria-hidden="true">404</p>
      <DisplayTitle text="Esta escena no existe" tag="h1" tone="pink" size="clamp(2.4rem, 8vw, 4.6rem)" />
      <p>La página <strong>{{ $route.path }}</strong> no está en FemCine. Puede que el enlace esté mal escrito o que ya no exista.</p>
      <div class="notfound__actions">
        <router-link class="btn btn--pink" to="/">Ir al inicio</router-link>
        <router-link class="btn btn--outline" :to="{ name: 'catalogo' }">Ver películas</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';

export default {
  name: 'NotFoundView',
  components: { DisplayTitle }
};
</script>

<style scoped>
.notfound__inner { display: grid; gap: 18px; justify-items: start; }
.notfound__code { margin: 0; font-family: var(--font-script); font-size: clamp(5rem, 22vw, 11rem); line-height: 0.8; color: var(--white); }
.notfound__inner p { margin: 0; overflow-wrap: anywhere; }
.notfound__actions { display: flex; flex-wrap: wrap; gap: 12px; }
</style>
