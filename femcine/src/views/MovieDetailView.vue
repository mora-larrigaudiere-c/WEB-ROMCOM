<template>
  <div class="detail section">
    <div v-if="!deleted" class="container">
      <StatusMessage v-if="!movie" type="error" title="No encontramos esa película">
        No existe ninguna película con el identificador “{{ $route.params.id }}”. Puede que se haya eliminado.
        <template #action>
          <router-link class="btn btn--pink" :to="{ name: 'catalogo' }">Volver al catálogo</router-link>
        </template>
      </StatusMessage>

      <article v-else class="detail__layout">
        <div class="detail__poster">
          <PosterImage :src="posterSrc" :alt="`Póster de ${movie.title}`" :title="movie.title" />
        </div>

        <div class="detail__info">
          <router-link class="link-underline" :to="{ name: 'catalogo' }">← Volver al catálogo</router-link>
          <DisplayTitle :text="movie.title" tag="h1" tone="pink" size="clamp(2.2rem, 7vw, 4.4rem)" />

          <dl class="detail__facts">
            <div><dt>Año</dt><dd>{{ movie.year }}</dd></div>
            <div><dt>Dirección</dt><dd>{{ movie.director }}</dd></div>
            <div><dt>Duración</dt><dd>{{ duration }}</dd></div>
            <div><dt>Género</dt><dd>{{ movie.genre }}</dd></div>
            <div>
              <dt>Categoría editorial</dt>
              <dd>
                <router-link class="link-underline" :to="{ name: 'catalogo', query: { categoria: movie.category } }">{{ categoryName }}</router-link>
              </dd>
            </div>
          </dl>

          <h2 class="detail__syn-title">Sinopsis</h2>
          <p class="detail__synopsis">{{ movie.synopsis }}</p>

          <!-- SECCIÓN PERSONAL DE CALIFICACIÓN Y FAVORITOS -->
          <div class="detail__user-box">
            <RatingStars
              :model-value="movie.userRating || 0"
              :interactive="true"
              label="Tu calificación"
              @update:model-value="onRatingChanged"
            />

            <button
              type="button"
              class="btn detail__fav-btn"
              :class="movie.isFavorite ? 'btn--pink' : 'btn--outline'"
              :aria-pressed="movie.isFavorite ? 'true' : 'false'"
              @click="onToggleFavorite"
            >
              <span aria-hidden="true">{{ movie.isFavorite ? '♥' : '♡' }}</span>
              <span>{{ movie.isFavorite ? 'En tus favoritas' : 'Agregar a favoritas' }}</span>
            </button>
          </div>

          <!-- ACCIONES DE EDICIÓN / ELIMINACIÓN (SOLO ADMINISTRADORAS) -->
          <div v-if="authState.isAdmin" class="detail__actions">
            <router-link class="btn btn--pink" :to="{ name: 'editar', params: { id: movie.id } }">Editar película</router-link>
            <button type="button" class="btn btn--danger" @click="askDelete">Eliminar</button>
          </div>

          <!-- SECCIÓN DE RESEÑAS CINEMATOGRÁFICAS DE LA COMUNIDAD -->
          <section class="detail__reviews-section" aria-labelledby="reviews-heading">
            <div class="reviews-header">
              <h2 id="reviews-heading" class="reviews-title">Reseñas de la Comunidad</h2>
              <button
                type="button"
                class="btn btn--pink btn--sm"
                @click="showReviewForm = !showReviewForm"
              >
                {{ showReviewForm ? 'Cerrar formulario' : '✍ Escribir reseña' }}
              </button>
            </div>

            <!-- AVISO DE ACCIÓN -->
            <StatusMessage v-if="reviewNotice" type="success" dismissible @dismiss="reviewNotice = ''">
              {{ reviewNotice }}
            </StatusMessage>
            <StatusMessage v-if="reviewError" type="error" dismissible @dismiss="reviewError = ''">
              {{ reviewError }}
            </StatusMessage>

            <!-- FORMULARIO DE RESEÑA -->
            <transition name="fade">
              <div v-if="showReviewForm" class="review-form-card">
                <div v-if="!authState.user" class="review-login-prompt">
                  <p>Iniciá sesión con tu cuenta de Google para dejar tu reseña.</p>
                </div>

                <form v-else novalidate class="review-form" @submit.prevent="submitReview">
                  <h3 class="review-form-title">Tu veredicto sobre {{ movie.title }}</h3>
                  <p class="review-form-hint">
                    Las reseñas quedan en revisión previa por moderación para preservar la calidad del espacio.
                  </p>

                  <div class="field">
                    <label class="field__label">Puntaje</label>
                    <RatingStars
                      :model-value="newReview.rating"
                      :interactive="true"
                      label="Puntuación"
                      @update:model-value="newReview.rating = $event"
                    />
                  </div>

                  <div class="field">
                    <label class="field__label" for="review-title">Título breve (opcional)</label>
                    <input
                      id="review-title"
                      v-model="newReview.title"
                      type="text"
                      class="input"
                      placeholder="Ej. Cine romántico en su máxima expresión"
                    />
                  </div>

                  <div class="field">
                    <label class="field__label" for="review-content">Tu reseña (mínimo 10 caracteres) *</label>
                    <textarea
                      id="review-content"
                      v-model="newReview.content"
                      class="textarea"
                      rows="3"
                      placeholder="Contale a la comunidad qué te pareció la dirección, las actuaciones o el desenlace..."
                      :aria-invalid="reviewFormErrors.content ? 'true' : 'false'"
                    ></textarea>
                    <p v-if="reviewFormErrors.content" class="field__error">{{ reviewFormErrors.content }}</p>
                  </div>

                  <div class="review-form-actions">
                    <button type="submit" class="btn btn--pink btn--sm" :disabled="submittingReview">
                      {{ submittingReview ? 'Enviando...' : 'Enviar reseña' }}
                    </button>
                    <button type="button" class="btn btn--outline btn--sm" @click="showReviewForm = false">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </transition>

            <!-- LISTA DE RESEÑAS APROBADAS -->
            <div class="reviews-list-wrapper">
              <div v-if="loadingReviews" class="reviews-loading">
                Cargando reseñas...
              </div>

              <div v-else-if="!reviews.length" class="reviews-empty">
                <p>Todavía no hay reseñas aprobadas sobre esta película.</p>
                <p class="reviews-empty-sub">¡Sé la primera en compartir tu opinión!</p>
              </div>

              <ul v-else class="reviews-list">
                <li v-for="rev in reviews" :key="rev.id" class="review-card">
                  <div class="review-card__header">
                    <div class="review-card__author">
                      <img
                        v-if="rev.authorAvatar"
                        :src="rev.authorAvatar"
                        :alt="rev.authorName"
                        class="review-avatar"
                        referrerpolicy="no-referrer"
                      />
                      <div v-else class="review-avatar-fallback">
                        {{ (rev.authorName || 'C').charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <strong class="review-author-name">{{ rev.authorName }}</strong>
                        <span class="review-date">{{ formatDate(rev.createdAt) }}</span>
                      </div>
                    </div>
                    <div class="review-stars">
                      <span v-for="star in 5" :key="star" class="star" :class="{ 'star--filled': star <= rev.rating }">★</span>
                    </div>
                  </div>

                  <h4 v-if="rev.title" class="review-headline">{{ rev.title }}</h4>
                  <p class="review-text">{{ rev.content }}</p>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </article>
    </div>

    <ConfirmModal
      :open="confirming"
      title="¿Eliminar esta película?"
      :message="`Vas a eliminar “${movie ? movie.title : ''}” del catálogo público compartido. Esta acción no se puede deshacer.`"
      confirm-label="Sí, eliminar"
      cancel-label="Cancelar"
      @confirm="doDelete"
      @cancel="confirming = false"
    />
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import PosterImage from '@/components/PosterImage.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import RatingStars from '@/components/RatingStars.vue';
import { getMovieById, removeMovie, setNotice, state, toggleFavorite, setRating } from '@/store/catalog';
import { authState } from '@/store/auth';
import { categoryLabel } from '@/data/categories';
import { resolvePoster, formatDuration } from '@/utils/poster';
import { fetchMovieReviews, createReview } from '@/services/sharedDataService';

export default {
  name: 'MovieDetailView',
  components: { DisplayTitle, PosterImage, StatusMessage, ConfirmModal, RatingStars },
  data() {
    return {
      confirming: false,
      deleted: false,
      state,
      authState,
      reviews: [],
      loadingReviews: false,
      showReviewForm: false,
      submittingReview: false,
      reviewNotice: '',
      reviewError: '',
      newReview: {
        rating: 5,
        title: '',
        content: ''
      },
      reviewFormErrors: {}
    };
  },
  computed: {
    movie() {
      return getMovieById(this.$route.params.id);
    },
    posterSrc() {
      return this.movie ? resolvePoster(this.movie.poster) : '';
    },
    categoryName() {
      return this.movie ? categoryLabel(this.movie.category) : '';
    },
    duration() {
      return this.movie ? formatDuration(this.movie.duration) : '';
    }
  },
  watch: {
    '$route.params.id'() {
      this.loadReviews();
    }
  },
  created() {
    this.loadReviews();
  },
  methods: {
    formatDate(iso) {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        return '';
      }
    },
    async loadReviews() {
      if (!this.$route.params.id) return;
      this.loadingReviews = true;
      try {
        this.reviews = await fetchMovieReviews(this.$route.params.id);
      } catch (err) {
        console.warn('Error al cargar reseñas:', err);
      } finally {
        this.loadingReviews = false;
      }
    },
    async submitReview() {
      if (!this.newReview.content || this.newReview.content.trim().length < 10) {
        this.reviewFormErrors = { content: 'La reseña debe tener al menos 10 caracteres.' };
        return;
      }
      this.reviewFormErrors = {};
      this.submittingReview = true;
      this.reviewNotice = '';
      this.reviewError = '';

      try {
        await createReview(this.authState.user.id, {
          movieId: this.movie.id,
          rating: this.newReview.rating,
          title: this.newReview.title,
          content: this.newReview.content
        });
        this.reviewNotice = '¡Reseña enviada! Queda en revisión por las creadoras y se mostrará al ser aprobada.';
        this.newReview = { rating: 5, title: '', content: '' };
        this.showReviewForm = false;
        await this.loadReviews();
      } catch (err) {
        this.reviewError = 'No se pudo enviar la reseña.';
      } finally {
        this.submittingReview = false;
      }
    },
    async onRatingChanged(newRating) {
      if (this.movie) {
        await setRating(this.movie.id, newRating);
      }
    },
    async onToggleFavorite() {
      if (this.movie) {
        await toggleFavorite(this.movie.id);
      }
    },
    askDelete() {
      this.confirming = true;
    },
    async doDelete() {
      const title = this.movie ? this.movie.title : 'La película';
      this.confirming = false;
      this.deleted = true;
      try {
        await removeMovie(this.$route.params.id);
        setNotice(`Se eliminó “${title}” del catálogo.`);
        this.$router.push({ name: 'catalogo' });
      } catch (err) {
        this.deleted = false;
        alert('No se pudo eliminar la película. Verificá tus permisos de administración.');
      }
    }
  }
};
</script>

<style scoped>
.detail__layout { display: grid; gap: 28px; }
.detail__poster { width: min(70vw, 320px); }
.detail__info { display: grid; gap: 18px; align-content: start; justify-items: start; }
.detail__facts { margin: 0; display: grid; gap: 10px; width: 100%; }
.detail__facts div { display: grid; grid-template-columns: 11rem 1fr; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.3); }
.detail__facts dt { font-weight: 700; color: var(--pink-soft); }
.detail__facts dd { margin: 0; }
.detail__syn-title { margin: 8px 0 0; font-family: var(--font-display); font-weight: 800; font-size: 1.6rem; text-transform: uppercase; }
.detail__synopsis { margin: 0; max-width: 62ch; line-height: 1.6; }

.detail__user-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 0, 204, 0.4);
  border-radius: var(--radius);
  margin-top: 6px;
}

@media (min-width: 640px) {
  .detail__user-box {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.detail__fav-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.detail__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }

/* SECCIÓN RESEÑAS */
.detail__reviews-section {
  width: 100%;
  margin-top: 36px;
  padding-top: 28px;
  border-top: 2px solid rgba(255, 0, 204, 0.3);
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.reviews-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--pink);
}

.review-form-card {
  background: rgba(18, 18, 20, 0.95);
  border: 2px solid var(--pink);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 24px;
}
.review-form-title {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: #fff;
}
.review-form-hint {
  margin: 0 0 16px;
  font-size: 0.88rem;
  color: var(--pink-soft);
}
.review-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.review-form-actions {
  display: flex;
  gap: 10px;
}

.reviews-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.review-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.review-card__author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.review-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--pink);
  object-fit: cover;
}
.review-avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--pink);
  color: #000;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.85rem;
}
.review-author-name {
  display: block;
  font-size: 0.95rem;
  color: #fff;
}
.review-date {
  font-size: 0.75rem;
  color: var(--muted);
}
.review-stars .star {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.2);
}
.review-stars .star--filled {
  color: var(--pink);
}
.review-headline {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--pink-soft);
}
.review-text {
  margin: 0;
  color: #eee;
  line-height: 1.5;
  white-space: pre-line;
}

.reviews-loading, .reviews-empty {
  padding: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: var(--radius);
  color: var(--muted);
}
.reviews-empty-sub {
  margin-top: 6px;
  color: var(--pink-soft);
}

.btn--sm {
  padding: 6px 14px;
  font-size: 0.85rem;
  min-height: 36px;
}

@media (min-width: 800px) {
  .detail__layout { grid-template-columns: minmax(240px, 360px) 1fr; gap: 56px; align-items: start; }
  .detail__poster { width: 100%; }
}
</style>
