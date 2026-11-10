<template>
  <div class="app">
    <a class="skip-link" href="#contenido" @click.prevent="focusMain">Saltar al contenido</a>
    <AppHeader />

    <div v-if="state.error || authState.error" class="container app__alert">
      <StatusMessage
        type="error"
        :title="state.error ? 'Problema con el catálogo' : 'Autenticación'"
        dismissible
        @dismiss="clearErrors"
      >
        {{ state.error || authState.error }}
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
import { state, initCatalog, dismissError, setUserSession } from '@/store/catalog';
import { authState, initAuth, subscribeAuthChange, dismissAuthError } from '@/store/auth';

export default {
  name: 'App',
  components: { AppHeader, BottomNav, SiteFooter, StatusMessage },
  data() {
    return {
      state,
      authState,
      unsubscribeAuth: null
    };
  },
  created() {
    // 1. Carga inicial del catálogo público compartido
    initCatalog(null);

    // 2. Suscripción a cambios de sesión (ANTES de initAuth para no perder el primer evento)
    this.unsubscribeAuth = subscribeAuthChange(({ user }) => {
      setUserSession(user ? user.id : null);
    });

    // 3. Inicialización de sesión con Google
    initAuth();
  },
  beforeUnmount() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  },
  watch: {
    '$route.path'() {
      this.$nextTick(() => this.focusMain());
    }
  },
  methods: {
    focusMain() {
      if (this.$refs.main) this.$refs.main.focus({ preventScroll: true });
    },
    clearErrors() {
      dismissError();
      dismissAuthError();
    }
  }
};
</script>

<style scoped>
.app__alert { padding-block: 12px; }
</style>
