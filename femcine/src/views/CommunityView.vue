<template>
  <div class="community-view section">
    <div class="container">
      <div class="community-head">
        <DisplayTitle text="Club del Drama" tag="h1" tone="pink" size="clamp(2.4rem, 8vw, 5rem)" />
        <p class="community-intro">
          El rincón donde comentamos obsesiones cinematográficas, debatimos finales y compartimos recomendaciones sin juicio.
        </p>

        <div class="community-actions-bar">
          <button
            type="button"
            class="btn btn--pink"
            @click="toggleNewPostForm"
          >
            {{ showForm ? 'Cerrar formulario' : '✍ Publicar en el club' }}
          </button>
        </div>
      </div>

      <!-- AVISO DE ACCIÓN -->
      <StatusMessage v-if="notice" type="success" dismissible class="community-alert" @dismiss="notice = ''">
        {{ notice }}
      </StatusMessage>
      <StatusMessage v-if="error" type="error" dismissible class="community-alert" @dismiss="error = ''">
        {{ error }}
      </StatusMessage>

      <!-- FORMULARIO DE NUEVA PUBLICACIÓN -->
      <transition name="fade">
        <div v-if="showForm" class="community-form-card">
          <h2 class="form-card-title">Nueva publicación comunitaria</h2>
          <p class="form-card-sub">
            Las publicaciones nuevas o editadas quedan en revisión para cuidar a la comunidad antes de mostrarse a todo el público.
          </p>

          <div v-if="!authState.user" class="community-login-prompt">
            <p>Necesitás iniciar sesión con Google para participar de la comunidad.</p>
          </div>

          <form v-else novalidate class="community-form" @submit.prevent="submitPost">
            <div class="field">
              <label class="field__label" for="post-title">Título del tema *</label>
              <input
                id="post-title"
                v-model="form.title"
                type="text"
                class="input"
                placeholder="Ej. Por qué 10 cosas que odio de ti es la mejor adaptación de Shakespeare"
                autocomplete="off"
                :aria-invalid="formErrors.title ? 'true' : 'false'"
              />
              <p v-if="formErrors.title" class="field__error">{{ formErrors.title }}</p>
            </div>

            <div class="field">
              <label class="field__label" for="post-category">Categoría</label>
              <select id="post-category" v-model="form.category" class="select">
                <option value="debate">Debate & Teorías</option>
                <option value="recomendacion">Recomendación</option>
                <option value="personajes">Personajes Icónicos</option>
                <option value="general">Charla General</option>
              </select>
            </div>

            <div class="field">
              <label class="field__label" for="post-content">Tu publicación (mínimo 20 caracteres) *</label>
              <textarea
                id="post-content"
                v-model="form.content"
                class="textarea"
                rows="5"
                placeholder="Compartí tus pensamientos, escenas favoritas o desahogos cinematográficos..."
                :aria-invalid="formErrors.content ? 'true' : 'false'"
              ></textarea>
              <p v-if="formErrors.content" class="field__error">{{ formErrors.content }}</p>
            </div>

            <div class="form-buttons">
              <button type="submit" class="btn btn--pink" :disabled="submitting">
                {{ submitting ? 'Enviando...' : 'Publicar aporte' }}
              </button>
              <button type="button" class="btn btn--outline" @click="showForm = false">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </transition>

      <!-- FEED DE PUBLICACIONES APROBADAS -->
      <div class="community-feed">
        <h2 class="feed-title">Publicaciones recientes</h2>

        <div v-if="loading" class="feed-loading">
          Cargando publicaciones de la comunidad...
        </div>

        <div v-else-if="!posts.length" class="feed-empty">
          <p>Todavía no hay publicaciones aprobadas en la comunidad.</p>
          <p class="feed-empty-sub">¡Sé la primera en abrir la conversación!</p>
        </div>

        <transition-group v-else name="feed" tag="ul" class="feed-list">
          <li v-for="post in posts" :key="post.id" class="feed-item">
            <div class="feed-item__header">
              <div class="feed-item__author">
                <img
                  v-if="post.authorAvatar"
                  :src="post.authorAvatar"
                  :alt="post.authorName"
                  class="author-avatar"
                  referrerpolicy="no-referrer"
                />
                <div v-else class="author-avatar-fallback">
                  {{ (post.authorName || 'C').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h3 class="author-name">{{ post.authorName }}</h3>
                  <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                </div>
              </div>
              <span class="post-category-tag">{{ post.category }}</span>
            </div>

            <h4 class="post-title">{{ post.title }}</h4>
            <p class="post-content">{{ post.content }}</p>

            <!-- Acciones si es autora o administradora -->
            <div v-if="isOwner(post) || authState.isAdmin" class="post-owner-actions">
              <span v-if="post.status !== 'approved'" class="status-pill status--pending">En revisión</span>
              <button
                type="button"
                class="btn btn--danger post-delete-btn"
                @click="deletePostItem(post.id)"
              >
                Eliminar
              </button>
            </div>
          </li>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import { authState } from '@/store/auth';
import {
  fetchCommunityPosts,
  createPost,
  deletePost
} from '@/services/sharedDataService';

export default {
  name: 'CommunityView',
  components: { DisplayTitle, StatusMessage },
  data() {
    return {
      authState,
      posts: [],
      loading: false,
      showForm: false,
      submitting: false,
      notice: '',
      error: '',
      epoch: 0,
      form: {
        title: '',
        content: '',
        category: 'debate'
      },
      formErrors: {}
    };
  },
  watch: {
    'authState.user'(newUser) {
      this.epoch++;
      if (!newUser) {
        this.showForm = false;
        this.form = { title: '', content: '', category: 'debate' };
        this.formErrors = {};
      }
    }
  },
  created() {
    this.loadPosts();
  },
  methods: {
    async loadPosts() {
      const currentEpoch = ++this.epoch;
      this.loading = true;
      this.error = '';
      try {
        const loaded = await fetchCommunityPosts();
        if (this.epoch === currentEpoch) {
          this.posts = loaded;
        }
      } catch (err) {
        if (this.epoch === currentEpoch) {
          this.error = 'No se pudieron cargar las publicaciones comunitarias.';
        }
      } finally {
        if (this.epoch === currentEpoch) {
          this.loading = false;
        }
      }
    },
    toggleNewPostForm() {
      this.showForm = !this.showForm;
      this.formErrors = {};
    },
    formatDate(iso) {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        return '';
      }
    },
    isOwner(post) {
      return this.authState.user && this.authState.user.id === post.userId;
    },
    validate() {
      const errs = {};
      if (!this.form.title.trim()) errs.title = 'Escribí un título para tu publicación.';
      else if (this.form.title.trim().length < 4) errs.title = 'El título debe tener al menos 4 caracteres.';

      if (!this.form.content.trim()) errs.content = 'Escribí el texto de tu publicación.';
      else if (this.form.content.trim().length < 20) errs.content = 'La publicación debe tener al menos 20 caracteres.';

      this.formErrors = errs;
      return Object.keys(errs).length === 0;
    },
    async submitPost() {
      if (!this.validate()) return;
      this.submitting = true;
      this.notice = '';
      this.error = '';

      try {
        await createPost(this.authState.user.id, {
          title: this.form.title,
          content: this.form.content,
          category: this.form.category
        });
        this.notice = '¡Publicación enviada! Queda en revisión por las creadoras y estará visible ni bien sea aprobada.';
        this.form = { title: '', content: '', category: 'debate' };
        this.showForm = false;
        await this.loadPosts();
      } catch (err) {
        this.error = 'No se pudo enviar la publicación. Revisá tu conexión.';
      } finally {
        this.submitting = false;
      }
    },
    async deletePostItem(postId) {
      if (!confirm('¿Segura que querés eliminar esta publicación?')) return;
      try {
        await deletePost(postId, this.authState.user?.id, this.authState.isAdmin);
        this.notice = 'Publicación eliminada correctamente.';
        this.posts = this.posts.filter((p) => p.id !== postId);
      } catch (err) {
        this.error = 'No se pudo eliminar la publicación.';
      }
    }
  }
};
</script>

<style scoped>
.community-head {
  margin-bottom: 32px;
}
.community-intro {
  font-size: 1.15rem;
  max-width: 65ch;
  margin: 12px 0 20px;
}
.community-actions-bar {
  margin-top: 16px;
}
.community-alert {
  margin-bottom: 24px;
}

.community-form-card {
  background: rgba(18, 18, 20, 0.9);
  border: 2px solid var(--pink);
  border-radius: var(--radius);
  padding: clamp(20px, 4vw, 32px);
  margin-bottom: 36px;
  box-shadow: 0 8px 30px rgba(255, 0, 204, 0.2);
}
.form-card-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--white);
  margin: 0 0 4px;
}
.form-card-sub {
  color: var(--pink-soft);
  font-size: 0.95rem;
  margin-bottom: 20px;
}
.community-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.community-feed {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.feed-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--pink);
  margin: 0 0 12px;
}
.feed-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.feed-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s ease;
}
.feed-item:hover {
  border-color: var(--pink);
}
.feed-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.feed-item__author {
  display: flex;
  align-items: center;
  gap: 12px;
}
.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--pink);
  object-fit: cover;
}
.author-avatar-fallback {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--pink);
  color: var(--black);
  display: grid;
  place-items: center;
  font-weight: 800;
}
.author-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--white);
}
.post-date {
  font-size: 0.8rem;
  color: var(--muted);
}
.post-category-tag {
  padding: 4px 10px;
  background: rgba(255, 0, 204, 0.15);
  border: 1px solid var(--pink);
  border-radius: 999px;
  font-size: 0.75rem;
  color: var(--pink-soft);
  text-transform: uppercase;
  font-weight: 700;
}
.post-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--white);
}
.post-content {
  margin: 0;
  color: #ddd;
  line-height: 1.6;
  white-space: pre-line;
}
.post-owner-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.post-delete-btn {
  padding: 4px 12px;
  font-size: 0.8rem;
  min-height: 36px;
}
.status-pill {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}
.status--pending {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.4);
}
.feed-loading, .feed-empty {
  padding: 32px;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  color: var(--muted);
}
.feed-empty-sub {
  color: var(--pink-soft);
  margin-top: 6px;
  font-weight: 600;
}

.feed-enter-active, .feed-leave-active, .fade-enter-active, .fade-leave-active {
  transition: all 0.25s ease;
}
.feed-enter-from, .fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.feed-leave-to, .fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
