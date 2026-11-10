<template>
  <div class="admin-view section">
    <div class="container">
      <div class="admin-head">
        <DisplayTitle text="Panel de Creadoras" tag="h1" tone="pink" size="clamp(2.4rem, 8vw, 4.8rem)" />
        <p class="admin-intro">
          Espacio exclusivo para Mora Larrigaudiere Curutchet y Oriana Fuentes: administración del catálogo público y moderación de contenido comunitario.
        </p>

        <!-- VERIFICACIÓN DE SEGURIDAD -->
        <div v-if="!authState.isAdmin" class="admin-lock-card">
          <h2 class="lock-title">Acceso restringido</h2>
          <p class="lock-desc">
            Este panel requiere rol administrativo verificado en base de datos.
            Si sos una de las creadoras, asegurate de haber iniciado sesión con tu cuenta de Google y que tu usuario haya sido inicializado mediante el script de bootstrap admin.
          </p>
          <router-link to="/" class="btn btn--pink">Volver al inicio</router-link>
        </div>
      </div>

      <template v-if="authState.isAdmin">
        <!-- AVISO -->
        <StatusMessage v-if="notice" type="success" dismissible class="admin-alert" @dismiss="notice = ''">
          {{ notice }}
        </StatusMessage>
        <StatusMessage v-if="error" type="error" dismissible class="admin-alert" @dismiss="error = ''">
          {{ error }}
        </StatusMessage>

        <!-- PESTAÑAS ADMIN -->
        <div class="admin-tabs" role="tablist">
          <button
            type="button"
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'moderation' }"
            @click="activeTab = 'moderation'"
          >
            Moderación Comunitaria ({{ pendingCount }})
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'movies' }"
            @click="activeTab = 'movies'"
          >
            Gestión de Películas ({{ catalogState.movies.length }})
          </button>
        </div>

        <!-- CONTENIDO: MODERACIÓN -->
        <div v-if="activeTab === 'moderation'" class="admin-pane">
          <div class="moderation-grid">
            <!-- RESEÑAS PENDIENTES -->
            <section class="mod-section">
              <h2 class="mod-title">
                Reseñas de Películas
                <span class="mod-badge">{{ pendingReviews.length }}</span>
              </h2>

              <div v-if="loading" class="mod-loading">Cargando contenido...</div>
              <div v-else-if="!pendingReviews.length" class="mod-empty">
                No hay reseñas pendientes de aprobación.
              </div>

              <ul v-else class="mod-list">
                <li v-for="rev in pendingReviews" :key="rev.id" class="mod-card">
                  <div class="mod-card__header">
                    <div>
                      <h3 class="mod-card__subject">Sobre <em>{{ rev.movieTitle }}</em></h3>
                      <span class="mod-card__author">Por {{ rev.authorName }}</span>
                    </div>
                    <span class="mod-rating">★ {{ rev.rating }}/5</span>
                  </div>
                  <h4 v-if="rev.title" class="mod-card__sub">{{ rev.title }}</h4>
                  <p class="mod-card__body">{{ rev.content }}</p>
                  <div class="mod-card__actions">
                    <button
                      type="button"
                      class="btn btn--pink btn--sm"
                      @click="moderateItem('review', rev.id, 'approved')"
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      type="button"
                      class="btn btn--outline btn--sm"
                      @click="moderateItem('review', rev.id, 'rejected')"
                    >
                      ✕ Rechazar
                    </button>
                  </div>
                </li>
              </ul>
            </section>

            <!-- PUBLICACIONES COMUNITARIAS PENDIENTES -->
            <section class="mod-section">
              <h2 class="mod-title">
                Publicaciones en el Club
                <span class="mod-badge">{{ pendingPosts.length }}</span>
              </h2>

              <div v-if="loading" class="mod-loading">Cargando contenido...</div>
              <div v-else-if="!pendingPosts.length" class="mod-empty">
                No hay publicaciones pendientes de aprobación.
              </div>

              <ul v-else class="mod-list">
                <li v-for="post in pendingPosts" :key="post.id" class="mod-card">
                  <div class="mod-card__header">
                    <div>
                      <h3 class="mod-card__subject">{{ post.title }}</h3>
                      <span class="mod-card__author">Por {{ post.authorName }} · {{ post.category }}</span>
                    </div>
                  </div>
                  <p class="mod-card__body">{{ post.content }}</p>
                  <div class="mod-card__actions">
                    <button
                      type="button"
                      class="btn btn--pink btn--sm"
                      @click="moderateItem('post', post.id, 'approved')"
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      type="button"
                      class="btn btn--outline btn--sm"
                      @click="moderateItem('post', post.id, 'rejected')"
                    >
                      ✕ Rechazar
                    </button>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>

        <!-- CONTENIDO: GESTIÓN DE CATÁLOGO -->
        <div v-if="activeTab === 'movies'" class="admin-pane">
          <div class="movies-toolbar">
            <router-link to="/peliculas/nueva" class="btn btn--pink">
              + Agregar película pública
            </router-link>
          </div>

          <table class="admin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Año</th>
                <th>Categoría</th>
                <th>Director</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in catalogState.movies" :key="m.id">
                <td class="table-title">
                  <router-link :to="{ name: 'detalle', params: { id: m.id } }">{{ m.title }}</router-link>
                </td>
                <td>{{ m.year }}</td>
                <td><span class="category-tag">{{ m.category }}</span></td>
                <td>{{ m.director }}</td>
                <td class="table-actions">
                  <router-link :to="{ name: 'editar', params: { id: m.id } }" class="btn btn--outline btn--xs">
                    Editar
                  </router-link>
                  <button type="button" class="btn btn--danger btn--xs" @click="handleDeleteMovie(m)">
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import { authState } from '@/store/auth';
import { state as catalogState, removeMovie } from '@/store/catalog';
import { fetchPendingModeration, moderateContent } from '@/services/sharedDataService';

export default {
  name: 'AdminView',
  components: { DisplayTitle, StatusMessage },
  data() {
    return {
      authState,
      catalogState,
      activeTab: 'moderation',
      loading: false,
      reviews: [],
      posts: [],
      notice: '',
      error: '',
      epoch: 0
    };
  },
  computed: {
    pendingReviews() {
      return this.reviews.filter((r) => r.status === 'pending');
    },
    pendingPosts() {
      return this.posts.filter((p) => p.status === 'pending');
    },
    pendingCount() {
      return this.pendingReviews.length + this.pendingPosts.length;
    }
  },
  created() {
    if (this.authState.isAdmin) {
      this.loadModeration();
    }
  },
  watch: {
    'authState.isAdmin'(isAdmin) {
      this.epoch++;
      if (isAdmin) {
        this.loadModeration();
      } else {
        // Al perder rol o salir, limpiar inmediatamente los datos de moderación
        this.reviews = [];
        this.posts = [];
        this.error = '';
        this.notice = '';
      }
    }
  },
  methods: {
    async loadModeration() {
      const currentEpoch = ++this.epoch;
      this.loading = true;
      this.error = '';
      try {
        const { reviews, posts } = await fetchPendingModeration();
        if (this.epoch === currentEpoch) {
          this.reviews = reviews;
          this.posts = posts;
        }
      } catch (err) {
        if (this.epoch === currentEpoch) {
          this.error = 'No se pudieron cargar los elementos de moderación.';
        }
      } finally {
        if (this.epoch === currentEpoch) {
          this.loading = false;
        }
      }
    },
    async moderateItem(type, id, status) {
      try {
        await moderateContent({
          type,
          id,
          status,
          adminUserId: this.authState.user.id
        });
        this.notice = `Elemento marcado como "${status === 'approved' ? 'Aprobado' : 'Rechazado'}".`;
        if (type === 'review') {
          this.reviews = this.reviews.map((r) => (r.id === id ? { ...r, status } : r));
        } else {
          this.posts = this.posts.map((p) => (p.id === id ? { ...p, status } : p));
        }
      } catch (e) {
        this.error = 'No se pudo aplicar la acción de moderación.';
      }
    },
    async handleDeleteMovie(movie) {
      if (!confirm(`¿Eliminar definitivamente “${movie.title}” del catálogo público compartido?`)) return;
      try {
        await removeMovie(movie.id);
        this.notice = `Película “${movie.title}” eliminada del catálogo.`;
      } catch (e) {
        this.error = 'No se pudo eliminar la película.';
      }
    }
  }
};
</script>

<style scoped>
.admin-head {
  margin-bottom: 28px;
}
.admin-intro {
  font-size: 1.15rem;
  max-width: 65ch;
  margin: 12px 0 20px;
}
.admin-alert {
  margin-bottom: 24px;
}

.admin-lock-card {
  padding: 32px;
  background: rgba(255, 0, 204, 0.08);
  border: 2px dashed var(--pink);
  border-radius: var(--radius);
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}
.lock-title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--pink);
  margin: 0;
}
.lock-desc {
  color: #ddd;
  line-height: 1.5;
  margin: 0;
}

.admin-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 28px;
}
.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 12px 18px;
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 1.15rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-btn:hover { color: var(--white); }
.tab-btn.is-active {
  color: var(--pink);
  border-bottom-color: var(--pink);
}

.moderation-grid {
  display: grid;
  gap: 32px;
}
@media (min-width: 900px) {
  .moderation-grid { grid-template-columns: 1fr 1fr; }
}
.mod-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.mod-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--white);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.mod-badge {
  background: var(--pink);
  color: var(--black);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.85rem;
}
.mod-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.mod-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mod-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.mod-card__subject {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--white);
}
.mod-card__author {
  font-size: 0.85rem;
  color: var(--muted);
}
.mod-rating {
  color: var(--pink);
  font-weight: 800;
}
.mod-card__sub {
  margin: 0;
  color: var(--pink-soft);
  font-size: 0.95rem;
}
.mod-card__body {
  margin: 0;
  color: #ddd;
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-line;
}
.mod-card__actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.movies-toolbar {
  margin-bottom: 20px;
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.admin-table th, .admin-table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}
.admin-table th {
  color: var(--pink);
  font-family: var(--font-display);
  text-transform: uppercase;
  font-size: 1rem;
}
.table-title a {
  color: var(--white);
  text-decoration: none;
  font-weight: 700;
}
.category-tag {
  padding: 2px 8px;
  background: rgba(255, 0, 204, 0.15);
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--pink-soft);
  text-transform: uppercase;
}
.table-actions {
  display: flex;
  gap: 8px;
}

.btn--sm { padding: 4px 12px; font-size: 0.82rem; min-height: 36px; }
.btn--xs { padding: 4px 8px; font-size: 0.75rem; min-height: 30px; }
.mod-empty {
  padding: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  color: var(--muted);
}
</style>
