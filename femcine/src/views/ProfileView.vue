<template>
  <div class="profile-view section">
    <div class="container">
      <div v-if="!authState.user" class="profile-unauth">
        <DisplayTitle text="Mi Perfil" tag="h1" tone="pink" size="clamp(2.4rem, 8vw, 4.8rem)" />
        <p class="profile-intro">Iniciá sesión con Google para ver tus películas favoritas, tus calificaciones y tus aportes a la comunidad.</p>
        <button type="button" class="btn btn--pink" @click="handleLogin">Entrar con Google</button>
      </div>

      <div v-else class="profile-layout">
        <!-- CABECERA DE PERFIL -->
        <header class="profile-card">
          <div class="profile-header-inner">
            <img
              v-if="userAvatar"
              :src="userAvatar"
              :alt="profileForm.displayName"
              class="profile-avatar-large"
              referrerpolicy="no-referrer"
            />
            <div v-else class="profile-avatar-large-fallback">
              {{ (profileForm.displayName || 'C').charAt(0).toUpperCase() }}
            </div>

            <div class="profile-meta">
              <div class="profile-name-row">
                <h1 class="profile-title">{{ profileForm.displayName || 'Cinéfila' }}</h1>
                <span v-if="authState.isAdmin" class="badge-creator">★ Creadora & Moderadora</span>
                <span v-else class="badge-member">Miembro de la Comunidad</span>
              </div>
              <p v-if="profileForm.bio" class="profile-bio">{{ profileForm.bio }}</p>
              <p v-else class="profile-bio-empty">Sin biografía cinematográfica aún.</p>
              <button
                type="button"
                class="btn btn--outline btn--sm edit-profile-btn"
                @click="editingProfile = !editingProfile"
              >
                {{ editingProfile ? 'Cerrar edición' : 'Editar perfil' }}
              </button>
            </div>
          </div>

          <!-- FORMULARIO DE EDICIÓN DE PERFIL CON VALIDACIÓN VISIBLE -->
          <transition name="fade">
            <form v-if="editingProfile" novalidate class="profile-edit-form" @submit.prevent="saveProfile">
              <div class="field">
                <label class="field__label" for="profile-name">Nombre público * (2 a 40 caracteres)</label>
                <input
                  id="profile-name"
                  v-model="profileForm.displayName"
                  type="text"
                  class="input"
                  placeholder="Tu nombre público o apodo"
                  :aria-invalid="profileErrors.displayName ? 'true' : 'false'"
                />
                <p v-if="profileErrors.displayName" class="field__error">{{ profileErrors.displayName }}</p>
              </div>
              <div class="field">
                <label class="field__label" for="profile-bio">Biografía / Tus gustos (máximo 200 caracteres)</label>
                <textarea
                  id="profile-bio"
                  v-model="profileForm.bio"
                  class="textarea"
                  rows="2"
                  placeholder="Contanos tus romcoms favoritas, directores o tropos de cine..."
                  :aria-invalid="profileErrors.bio ? 'true' : 'false'"
                ></textarea>
                <p v-if="profileErrors.bio" class="field__error">{{ profileErrors.bio }}</p>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn--pink btn--sm" :disabled="savingProfile">
                  {{ savingProfile ? 'Guardando...' : 'Guardar perfil' }}
                </button>
              </div>
            </form>
          </transition>
        </header>

        <!-- AVISOS -->
        <StatusMessage v-if="notice" type="success" dismissible @dismiss="notice = ''">
          {{ notice }}
        </StatusMessage>
        <StatusMessage v-if="error" type="error" dismissible @dismiss="error = ''">
          {{ error }}
        </StatusMessage>

        <!-- PESTAÑAS DE ACTIVIDAD -->
        <div class="profile-tabs" role="tablist">
          <button
            type="button"
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'favorites' }"
            role="tab"
            :aria-selected="activeTab === 'favorites' ? 'true' : 'false'"
            @click="activeTab = 'favorites'"
          >
            ♥ Mis Favoritas ({{ favoriteMovies.length }})
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'reviews' }"
            role="tab"
            :aria-selected="activeTab === 'reviews' ? 'true' : 'false'"
            @click="activeTab = 'reviews'"
          >
            Mis Reseñas ({{ myReviews.length }})
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'posts' }"
            role="tab"
            :aria-selected="activeTab === 'posts' ? 'true' : 'false'"
            @click="activeTab = 'posts'"
          >
            Mis Publicaciones ({{ myPosts.length }})
          </button>
        </div>

        <!-- CONTENIDO DE PESTAÑAS -->
        <div class="tab-content">
          <!-- FAVORITAS -->
          <div v-if="activeTab === 'favorites'" class="tab-pane">
            <div v-if="!favoriteMovies.length" class="empty-state">
              <p>Todavía no agregaste películas a tus favoritas.</p>
              <router-link to="/peliculas" class="btn btn--pink btn--sm">Explorar catálogo</router-link>
            </div>
            <ul v-else class="favorites-grid">
              <li v-for="movie in favoriteMovies" :key="movie.id" class="fav-card">
                <router-link :to="{ name: 'detalle', params: { id: movie.id } }">
                  <PosterImage :src="resolvePoster(movie.poster)" :title="movie.title" />
                </router-link>
                <div class="fav-card__info">
                  <h3 class="fav-card__title">
                    <router-link :to="{ name: 'detalle', params: { id: movie.id } }">
                      {{ movie.title }}
                    </router-link>
                  </h3>
                  <span class="fav-card__year">{{ movie.year }} · {{ movie.genre }}</span>
                  <div class="fav-card__rating">
                    ★ {{ movie.userRating ? `${movie.userRating}/5` : 'Sin nota' }}
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- RESEÑAS -->
          <div v-if="activeTab === 'reviews'" class="tab-pane">
            <div v-if="!myReviews.length" class="empty-state">
              <p>No escribiste reseñas todavía.</p>
              <router-link to="/peliculas" class="btn btn--pink btn--sm">Elegí una película para reseñar</router-link>
            </div>
            <ul v-else class="activity-list">
              <li v-for="rev in myReviews" :key="rev.id" class="activity-card">
                <!-- VISTA NORMAL DE RESEÑA -->
                <template v-if="editingReviewId !== rev.id">
                  <div class="activity-card__header">
                    <div>
                      <h3 class="activity-title">
                        Reseña sobre <em>{{ rev.movieTitle }}</em>
                      </h3>
                      <div class="activity-rating">
                        <span v-for="star in 5" :key="star" class="star" :class="{ 'star--filled': star <= rev.rating }">★</span>
                      </div>
                    </div>
                    <span class="status-badge" :class="`status--${rev.status}`">
                      {{ rev.status === 'approved' ? 'Aprobada' : (rev.status === 'rejected' ? 'Rechazada' : 'En revisión') }}
                    </span>
                  </div>
                  <h4 v-if="rev.title" class="activity-sub">{{ rev.title }}</h4>
                  <p class="activity-body">{{ rev.content }}</p>
                  <div class="activity-footer">
                    <span class="activity-date">{{ formatDate(rev.createdAt) }}</span>
                    <div class="activity-actions">
                      <button type="button" class="btn btn--outline btn--sm" @click="startEditReview(rev)">
                        Editar
                      </button>
                      <button type="button" class="btn btn--danger btn--sm" @click="deleteReviewItem(rev.id)">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </template>

                <!-- FORMULARIO DE EDICIÓN DE RESEÑA -->
                <form v-else novalidate class="inline-edit-form" @submit.prevent="saveEditReview(rev.id)">
                  <h4 class="inline-edit-title">Editar reseña de {{ rev.movieTitle }}</h4>
                  <p class="inline-edit-hint">Al editar tu reseña, volverá a quedar en revisión por moderación antes de publicarse.</p>

                  <div class="field">
                    <label class="field__label">Puntaje</label>
                    <RatingStars
                      :model-value="editReviewForm.rating"
                      :interactive="true"
                      label="Puntuación"
                      @update:model-value="editReviewForm.rating = $event"
                    />
                  </div>

                  <div class="field">
                    <label class="field__label">Título breve</label>
                    <input v-model="editReviewForm.title" type="text" class="input" />
                  </div>

                  <div class="field">
                    <label class="field__label">Contenido (mínimo 10 caracteres) *</label>
                    <textarea
                      v-model="editReviewForm.content"
                      class="textarea"
                      rows="3"
                      :aria-invalid="editReviewErrors.content ? 'true' : 'false'"
                    ></textarea>
                    <p v-if="editReviewErrors.content" class="field__error">{{ editReviewErrors.content }}</p>
                  </div>

                  <div class="inline-edit-actions">
                    <button type="submit" class="btn btn--pink btn--sm" :disabled="savingEditReview">
                      {{ savingEditReview ? 'Guardando...' : 'Guardar y enviar a revisión' }}
                    </button>
                    <button type="button" class="btn btn--outline btn--sm" @click="editingReviewId = null">
                      Cancelar
                    </button>
                  </div>
                </form>
              </li>
            </ul>
          </div>

          <!-- PUBLICACIONES COMUNITARIAS -->
          <div v-if="activeTab === 'posts'" class="tab-pane">
            <div v-if="!myPosts.length" class="empty-state">
              <p>No publicaste en la comunidad todavía.</p>
              <router-link to="/comunidad" class="btn btn--pink btn--sm">Ir al Club del Drama</router-link>
            </div>
            <ul v-else class="activity-list">
              <li v-for="post in myPosts" :key="post.id" class="activity-card">
                <!-- VISTA NORMAL DE POST -->
                <template v-if="editingPostId !== post.id">
                  <div class="activity-card__header">
                    <h3 class="activity-title">{{ post.title }}</h3>
                    <span class="status-badge" :class="`status--${post.status}`">
                      {{ post.status === 'approved' ? 'Aprobada' : (post.status === 'rejected' ? 'Rechazada' : 'En revisión') }}
                    </span>
                  </div>
                  <p class="activity-body">{{ post.content }}</p>
                  <div class="activity-footer">
                    <span class="activity-date">{{ formatDate(post.created_at || post.createdAt) }}</span>
                    <div class="activity-actions">
                      <button type="button" class="btn btn--outline btn--sm" @click="startEditPost(post)">
                        Editar
                      </button>
                      <button type="button" class="btn btn--danger btn--sm" @click="deletePostItem(post.id)">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </template>

                <!-- FORMULARIO DE EDICIÓN DE POST -->
                <form v-else novalidate class="inline-edit-form" @submit.prevent="saveEditPost(post.id)">
                  <h4 class="inline-edit-title">Editar publicación comunitaria</h4>
                  <p class="inline-edit-hint">Al editar tu tema, volverá a quedar en revisión por las creadoras.</p>

                  <div class="field">
                    <label class="field__label">Título (mínimo 4 caracteres) *</label>
                    <input
                      v-model="editPostForm.title"
                      type="text"
                      class="input"
                      :aria-invalid="editPostErrors.title ? 'true' : 'false'"
                    />
                    <p v-if="editPostErrors.title" class="field__error">{{ editPostErrors.title }}</p>
                  </div>

                  <div class="field">
                    <label class="field__label">Texto (mínimo 20 caracteres) *</label>
                    <textarea
                      v-model="editPostForm.content"
                      class="textarea"
                      rows="4"
                      :aria-invalid="editPostErrors.content ? 'true' : 'false'"
                    ></textarea>
                    <p v-if="editPostErrors.content" class="field__error">{{ editPostErrors.content }}</p>
                  </div>

                  <div class="inline-edit-actions">
                    <button type="submit" class="btn btn--pink btn--sm" :disabled="savingEditPost">
                      {{ savingEditPost ? 'Guardando...' : 'Guardar y enviar a revisión' }}
                    </button>
                    <button type="button" class="btn btn--outline btn--sm" @click="editingPostId = null">
                      Cancelar
                    </button>
                  </div>
                </form>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import PosterImage from '@/components/PosterImage.vue';
import RatingStars from '@/components/RatingStars.vue';
import { authState, login } from '@/store/auth';
import { state as catalogState } from '@/store/catalog';
import {
  fetchUserReviews,
  fetchUserPosts,
  deleteReview,
  deletePost,
  updateReview,
  updatePost,
  updateProfile
} from '@/services/sharedDataService';
import { resolvePoster } from '@/utils/poster';

export default {
  name: 'ProfileView',
  components: { DisplayTitle, StatusMessage, PosterImage, RatingStars },
  data() {
    return {
      authState,
      catalogState,
      activeTab: 'favorites',
      myReviews: [],
      myPosts: [],
      notice: '',
      error: '',
      epoch: 0,
      editingProfile: false,
      savingProfile: false,
      profileForm: {
        displayName: '',
        bio: ''
      },
      profileErrors: {},
      // Edición de reseñas
      editingReviewId: null,
      savingEditReview: false,
      editReviewForm: { rating: 5, title: '', content: '' },
      editReviewErrors: {},
      // Edición de posts
      editingPostId: null,
      savingEditPost: false,
      editPostForm: { title: '', content: '' },
      editPostErrors: {}
    };
  },
  computed: {
    userAvatar() {
      return (
        this.authState.profile?.avatar_url ||
        this.authState.user?.user_metadata?.avatar_url ||
        this.authState.user?.user_metadata?.picture ||
        ''
      );
    },
    favoriteMovies() {
      return this.catalogState.movies.filter((m) => m.isFavorite === true);
    }
  },
  watch: {
    'authState.user'(newUser) {
      this.epoch++;
      if (newUser) {
        this.initUserData();
      } else {
        // Al cerrar sesión, limpiar inmediatamente datos de la cuenta anterior
        this.myReviews = [];
        this.myPosts = [];
        this.editingReviewId = null;
        this.editingPostId = null;
        this.profileForm = { displayName: '', bio: '' };
      }
    }
  },
  created() {
    if (this.authState.user) {
      this.initUserData();
    }
  },
  methods: {
    resolvePoster(key) {
      return resolvePoster(key);
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
    async initUserData() {
      const u = this.authState.user;
      if (!u) return;

      const currentEpoch = ++this.epoch;
      this.profileForm.displayName =
        this.authState.profile?.display_name ||
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        'Cinéfila';
      this.profileForm.bio = this.authState.profile?.bio || '';

      try {
        const [revs, posts] = await Promise.all([
          fetchUserReviews(u.id),
          fetchUserPosts(u.id)
        ]);
        if (this.epoch === currentEpoch) {
          this.myReviews = revs;
          this.myPosts = posts;
        }
      } catch (err) {
        if (this.epoch === currentEpoch) {
          this.error = 'No se pudo cargar tu actividad completa.';
        }
      }
    },
    async handleLogin() {
      try {
        await login();
      } catch (e) {
        // Handled
      }
    },
    validateProfile() {
      const errs = {};
      const name = this.profileForm.displayName.trim();
      if (!name) errs.displayName = 'Escribí tu nombre público.';
      else if (name.length < 2) errs.displayName = 'Debe tener al menos 2 caracteres.';
      else if (name.length > 40) errs.displayName = 'No puede superar los 40 caracteres.';

      if (this.profileForm.bio && this.profileForm.bio.length > 200) {
        errs.bio = 'La biografía no puede superar los 200 caracteres.';
      }

      this.profileErrors = errs;
      return Object.keys(errs).length === 0;
    },
    async saveProfile() {
      if (!this.validateProfile()) return;
      this.savingProfile = true;
      this.notice = '';
      this.error = '';

      try {
        await updateProfile(this.authState.user.id, {
          displayName: this.profileForm.displayName,
          bio: this.profileForm.bio
        });
        if (this.authState.profile) {
          this.authState.profile.display_name = this.profileForm.displayName;
          this.authState.profile.bio = this.profileForm.bio;
        }
        this.notice = 'Perfil actualizado con éxito.';
        this.editingProfile = false;
      } catch (err) {
        this.error = 'No se pudo actualizar el perfil.';
      } finally {
        this.savingProfile = false;
      }
    },
    // EDICIÓN DE RESEÑAS
    startEditReview(rev) {
      this.editingReviewId = rev.id;
      this.editReviewForm = {
        rating: rev.rating || 5,
        title: rev.title || '',
        content: rev.content || ''
      };
      this.editReviewErrors = {};
    },
    async saveEditReview(reviewId) {
      if (!this.editReviewForm.content || this.editReviewForm.content.trim().length < 10) {
        this.editReviewErrors = { content: 'La reseña debe tener al menos 10 caracteres.' };
        return;
      }

      this.savingEditReview = true;
      this.notice = '';
      this.error = '';

      try {
        await updateReview(reviewId, this.authState.user.id, this.editReviewForm);
        this.notice = 'Reseña editada: ha vuelto a estado "En revisión" hasta su aprobación.';
        this.editingReviewId = null;
        await this.initUserData();
      } catch (err) {
        this.error = 'No se pudo guardar la edición de la reseña.';
      } finally {
        this.savingEditReview = false;
      }
    },
    async deleteReviewItem(id) {
      if (!confirm('¿Segura que querés eliminar esta reseña?')) return;
      try {
        await deleteReview(id, this.authState.user.id, this.authState.isAdmin);
        this.myReviews = this.myReviews.filter((r) => r.id !== id);
        this.notice = 'Reseña eliminada.';
      } catch (e) {
        this.error = 'Error al eliminar la reseña.';
      }
    },
    // EDICIÓN DE PUBLICACIONES
    startEditPost(post) {
      this.editingPostId = post.id;
      this.editPostForm = {
        title: post.title || '',
        content: post.content || ''
      };
      this.editPostErrors = {};
    },
    async saveEditPost(postId) {
      const errs = {};
      if (!this.editPostForm.title || this.editPostForm.title.trim().length < 4) {
        errs.title = 'El título debe tener al menos 4 caracteres.';
      }
      if (!this.editPostForm.content || this.editPostForm.content.trim().length < 20) {
        errs.content = 'La publicación debe tener al menos 20 caracteres.';
      }
      if (Object.keys(errs).length > 0) {
        this.editPostErrors = errs;
        return;
      }

      this.savingEditPost = true;
      this.notice = '';
      this.error = '';

      try {
        await updatePost(postId, this.authState.user.id, this.editPostForm);
        this.notice = 'Publicación editada: ha vuelto a estado "En revisión" hasta su aprobación.';
        this.editingPostId = null;
        await this.initUserData();
      } catch (err) {
        this.error = 'No se pudo guardar la publicación editada.';
      } finally {
        this.savingEditPost = false;
      }
    },
    async deletePostItem(id) {
      if (!confirm('¿Segura que querés eliminar esta publicación?')) return;
      try {
        await deletePost(id, this.authState.user.id, this.authState.isAdmin);
        this.myPosts = this.myPosts.filter((p) => p.id !== id);
        this.notice = 'Publicación eliminada.';
      } catch (e) {
        this.error = 'Error al eliminar la publicación.';
      }
    }
  }
};
</script>

<style scoped>
.profile-card {
  background: rgba(18, 18, 20, 0.85);
  border: 2px solid var(--pink);
  border-radius: var(--radius);
  padding: clamp(24px, 5vw, 40px);
  margin-bottom: 32px;
  box-shadow: 0 8px 30px rgba(255, 0, 204, 0.2);
}
.profile-header-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.profile-avatar-large {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 3px solid var(--pink);
  object-fit: cover;
}
.profile-avatar-large-fallback {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--pink);
  color: var(--black);
  display: grid;
  place-items: center;
  font-size: 2.4rem;
  font-weight: 800;
}
.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.profile-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.profile-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 2.2rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--white);
}
.badge-creator {
  padding: 4px 10px;
  background: var(--pink);
  color: var(--black);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}
.badge-member {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: var(--white);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}
.profile-bio {
  margin: 4px 0 8px;
  color: #ddd;
  max-width: 50ch;
}
.profile-bio-empty {
  margin: 4px 0 8px;
  color: var(--muted);
  font-style: italic;
}
.edit-profile-btn {
  align-self: flex-start;
  margin-top: 4px;
}

.profile-edit-form {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 540px;
}

.profile-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 24px;
  overflow-x: auto;
}
.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 12px 18px;
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.tab-btn:hover {
  color: var(--white);
}
.tab-btn.is-active {
  color: var(--pink);
  border-bottom-color: var(--pink);
}

.favorites-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 14px;
}
@media (min-width: 640px) {
  .favorites-grid { grid-template-columns: repeat(4, 1fr); }
}
.fav-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fav-card__title a {
  color: var(--white);
  text-decoration: none;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
}
.fav-card__year {
  color: var(--muted);
  font-size: 0.85rem;
}
.fav-card__rating {
  color: var(--pink);
  font-weight: 700;
  font-size: 0.9rem;
}

.activity-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.activity-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.activity-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.activity-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--white);
}
.activity-rating {
  margin-top: 4px;
}
.star {
  color: rgba(255, 255, 255, 0.2);
  font-size: 1.1rem;
}
.star--filled {
  color: var(--pink);
}
.status-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}
.status--approved {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.4);
}
.status--pending {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.4);
}
.status--rejected {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.4);
}
.activity-sub {
  margin: 0;
  font-weight: 700;
  color: var(--pink-soft);
}
.activity-body {
  margin: 0;
  color: #ddd;
  line-height: 1.5;
  white-space: pre-line;
}
.activity-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.activity-actions {
  display: flex;
  gap: 8px;
}
.activity-date {
  font-size: 0.8rem;
  color: var(--muted);
}

/* Formulario inline de edición */
.inline-edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
}
.inline-edit-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--pink);
}
.inline-edit-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--pink-soft);
}
.inline-edit-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.empty-state {
  padding: 36px 20px;
  text-align: center;
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: var(--radius);
  color: var(--muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.btn--sm {
  padding: 6px 14px;
  font-size: 0.82rem;
  min-height: 36px;
}
</style>
