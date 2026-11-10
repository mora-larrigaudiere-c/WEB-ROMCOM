<template>
  <div class="auth-box">
    <!-- Modo cuando Supabase no está configurado -->
    <div v-if="!authState.isConfigured" class="auth-box__offline" title="FemCine está funcionando en modo offline autónomo.">
      <span class="auth-box__offline-tag">Modo Offline</span>
    </div>

    <!-- Cargando sesión -->
    <div v-else-if="authState.loading" class="auth-box__loading">
      <span class="auth-box__dot"></span>
      <span class="sr-only">Verificando...</span>
    </div>

    <!-- Usuario autenticado con Google -->
    <div v-else-if="authState.user" class="auth-box__user">
      <router-link to="/perfil" class="auth-box__user-link" title="Ir a Mi Perfil y Actividad">
        <img
          v-if="userAvatar"
          :src="userAvatar"
          :alt="userDisplayName"
          class="auth-box__avatar"
          referrerpolicy="no-referrer"
        />
        <div v-else class="auth-box__avatar-fallback">
          {{ userInitial }}
        </div>
        <div class="auth-box__details">
          <span class="auth-box__name">{{ userDisplayName }}</span>
          <span v-if="authState.isAdmin" class="auth-box__role-tag">★ Creadora</span>
          <span v-else class="auth-box__member-tag">Cinéfila</span>
        </div>
      </router-link>

      <!-- Enlace directo al panel de control si es administradora -->
      <router-link
        v-if="authState.isAdmin"
        to="/admin"
        class="btn btn--outline auth-box__admin-btn"
        title="Panel de moderación y administración"
      >
        Panel Admin
      </router-link>

      <button
        type="button"
        class="btn btn--outline auth-box__logout-btn"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        @click="handleLogout"
      >
        Salir
      </button>
    </div>

    <!-- Invitada (no autenticada) -->
    <div v-else class="auth-box__guest">
      <button
        type="button"
        class="btn btn--pink auth-box__login-btn"
        :disabled="isLoggingIn"
        @click="handleLogin"
      >
        <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.99 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>{{ isLoggingIn ? 'Conectando...' : 'Entrar con Google' }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { authState, login, logout } from '@/store/auth';

export default {
  name: 'AuthButton',
  data() {
    return {
      authState,
      isLoggingIn: false
    };
  },
  computed: {
    userDisplayName() {
      const u = this.authState.user;
      if (!u) return '';
      return (
        this.authState.profile?.display_name ||
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        'Cinéfila'
      );
    },
    userAvatar() {
      return (
        this.authState.profile?.avatar_url ||
        this.authState.user?.user_metadata?.avatar_url ||
        this.authState.user?.user_metadata?.picture ||
        ''
      );
    },
    userInitial() {
      const name = this.userDisplayName || 'F';
      return name.charAt(0).toUpperCase();
    }
  },
  methods: {
    async handleLogin() {
      this.isLoggingIn = true;
      try {
        await login();
      } catch (err) {
        console.error('Error al iniciar sesión:', err);
      } finally {
        this.isLoggingIn = false;
      }
    },
    async handleLogout() {
      try {
        await logout();
        if (this.$route.name === 'admin' || this.$route.name === 'perfil') {
          this.$router.push({ name: 'inicio' });
        }
      } catch (err) {
        console.error('Error al cerrar sesión:', err);
      }
    }
  }
};
</script>

<style scoped>
.auth-box {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.auth-box__offline-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--muted);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.auth-box__loading {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}

.auth-box__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--pink);
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.4; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1.15); }
}

.auth-box__user {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.auth-box__user-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 0, 204, 0.4);
  border-radius: 999px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.auth-box__user-link:hover {
  background: rgba(255, 0, 204, 0.15);
  border-color: var(--pink);
}

.auth-box__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--pink);
}

.auth-box__avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--pink);
  color: var(--black);
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.9rem;
}

.auth-box__details {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  text-align: left;
}

.auth-box__name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--white);
  max-width: 110px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.auth-box__role-tag {
  font-size: 0.68rem;
  color: var(--pink);
  font-weight: 800;
  text-transform: uppercase;
}

.auth-box__member-tag {
  font-size: 0.68rem;
  color: var(--pink-soft);
  font-weight: 600;
}

.auth-box__admin-btn {
  padding: 4px 10px;
  font-size: 0.8rem;
  min-height: 36px;
  border-color: var(--pink);
  color: var(--pink);
}

.auth-box__logout-btn {
  min-height: 36px;
  padding: 4px 12px;
  font-size: 0.85rem;
}

.auth-box__login-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 16px;
  font-size: 0.9rem;
}

.google-icon {
  background: #fff;
  border-radius: 50%;
  padding: 1px;
  flex-shrink: 0;
}
</style>
