<template>
  <div class="app">
    <a class="skip-link" href="#contenido" @click.prevent="focusMain">Saltar al contenido</a>
    <AppHeader />

    <div v-if="state.error" class="container app__alert">
      <StatusMessage type="error" title="Problema con el almacenamiento local" dismissible @dismiss="clearError">
        {{ state.error }}
      </StatusMessage>
    </div>

    <main id="contenido" ref="main" tabindex="-1">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <SiteFooter />
    <BottomNav />
  </div>
</template>

<script>
import AppHeader from '@/components/AppHeader.vue';
import BottomNav from '@/components/BottomNav.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import { state, initCatalog, dismissError } from '@/store/catalog';

export default {
  name: 'App',
  components: { AppHeader, BottomNav, SiteFooter, StatusMessage },
  data() {
    return { state };
  },
  created() {
    // Se carga el catálogo antes de dibujar las vistas, para que todas encuentren los datos listos.
    initCatalog();
  },
  watch: {
    // Al cambiar de pantalla (no al cambiar filtros), el foco pasa al contenido para teclado y lectores de pantalla.
    '$route.path'() {
      this.$nextTick(() => this.focusMain());
    }
  },
  methods: {
    focusMain() {
      if (this.$refs.main) this.$refs.main.focus({ preventScroll: true });
    },
    clearError() {
      dismissError();
    }
  }
};
</script>

<style scoped>
.app__alert { padding-block: 12px; }
</style>
