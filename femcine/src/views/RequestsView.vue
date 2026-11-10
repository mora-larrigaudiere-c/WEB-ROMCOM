<template>
  <div class="requests-view section">
    <div class="container">
      <div class="requests-view__header">
        <DisplayTitle text="Solicitudes" tag="h1" tone="pink" size="clamp(2.5rem, 9vw, 5rem)" />
        <p class="requests-view__intro">
          Proponé películas para sumar a las colecciones de FemCine. Cada sugerencia es evaluada por su aporte
          a la mirada editorial, personajes y momentos inolvidables.
        </p>

        <!-- Estado de sincronización -->
        <div class="requests-view__status-chip">
          <span v-if="authState.user" class="chip-cloud">
            ☁ Conectada como <strong>{{ userDisplayName }}</strong> · Sincronizado en la nube
          </span>
          <span v-else class="chip-local">
            💾 Modo local · Las solicitudes se guardan en este dispositivo
          </span>
        </div>
      </div>

      <!-- Alertas -->
      <StatusMessage v-if="successNotice" type="success" dismissible class="requests-view__alert" @dismiss="successNotice = ''">
        {{ successNotice }}
      </StatusMessage>
      <StatusMessage v-if="requestsState.error" type="error" dismissible class="requests-view__alert" @dismiss="requestsState.error = null">
        {{ requestsState.error }}
      </StatusMessage>

      <div class="requests-view__layout">
        <!-- FORMULARIO DE SOLICITUD -->
        <section class="requests-view__form-card" aria-labelledby="form-title">
          <h2 id="form-title" class="requests-card-title">Nueva solicitud</h2>
          <p class="requests-card-subtitle">Completá la ficha con los detalles de la película sugerida.</p>

          <form novalidate class="requests-form" @submit.prevent="onSubmit">
            <FormField id="req-title" label="Título de la película" :error="errors.title" required>
              <input
                id="req-title"
                ref="firstInput"
                v-model="form.title"
                type="text"
                class="input"
                placeholder="Ej. Legally Blonde 2"
                autocomplete="off"
                :aria-invalid="errors.title ? 'true' : 'false'"
                @blur="validateField('title')"
              />
            </FormField>

            <div class="requests-form__row">
              <FormField id="req-category" label="Categoría editorial sugerida" :error="errors.category" required>
                <select
                  id="req-category"
                  v-model="form.category"
                  class="select"
                  :aria-invalid="errors.category ? 'true' : 'false'"
                  @change="validateField('category')"
                >
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.label }}
                  </option>
                </select>
              </FormField>

              <FormField id="req-year" label="Año (opcional)" hint="Ej. 2003" :error="errors.year">
                <input
                  id="req-year"
                  v-model="form.year"
                  type="text"
                  inputmode="numeric"
                  class="input"
                  placeholder="2003"
                  :aria-invalid="errors.year ? 'true' : 'false'"
                  @blur="validateField('year')"
                />
              </FormField>
            </div>

            <FormField
              id="req-reason"
              label="¿Por qué debería estar en FemCine?"
              hint="Contanos qué personaje, escena o drama la hace imperdible (mínimo 10 caracteres)."
              :error="errors.reason"
              required
            >
              <textarea
                id="req-reason"
                v-model="form.reason"
                class="textarea"
                rows="4"
                placeholder="Ej. Elle Woods vestida de rosa en Washington defendiendo los derechos de los animales es cine puro..."
                :aria-invalid="errors.reason ? 'true' : 'false'"
                @blur="validateField('reason')"
              ></textarea>
            </FormField>

            <FormField
              id="req-url"
              label="Enlace de referencia (opcional)"
              hint="Link de IMDb, Letterboxd, JustWatch o trailer en YouTube."
              :error="errors.referenceUrl"
            >
              <input
                id="req-url"
                v-model="form.referenceUrl"
                type="url"
                class="input"
                placeholder="https://..."
                :aria-invalid="errors.referenceUrl ? 'true' : 'false'"
                @blur="validateField('referenceUrl')"
              />
            </FormField>

            <div class="requests-form__actions">
              <button type="submit" class="btn btn--pink" :disabled="submitting">
                {{ submitting ? 'Enviando...' : 'Enviar solicitud' }}
              </button>
              <button type="button" class="btn btn--outline" @click="resetForm">
                Limpiar campos
              </button>
            </div>
          </form>
        </section>

        <!-- LISTADO PRIVADO DE SOLICITUDES -->
        <section class="requests-view__list-section" aria-labelledby="list-title">
          <div class="requests-view__list-header">
            <h2 id="list-title" class="requests-card-title">
              Tus solicitudes
              <span class="requests-badge">{{ requestsState.items.length }}</span>
            </h2>
            <span class="requests-card-subtitle">Listado privado y persistente de tus pedidos.</span>
          </div>

          <div v-if="requestsState.loading" class="requests-loading">
            Cargando solicitudes...
          </div>

          <transition-group
            v-else-if="requestsState.items.length"
            name="request-item"
            tag="ul"
            class="requests-list"
          >
            <li v-for="req in requestsState.items" :key="req.id" class="request-card">
              <div class="request-card__header">
                <div>
                  <h3 class="request-card__title">{{ req.title }}</h3>
                  <span class="request-card__meta">
                    {{ req.year ? `${req.year} · ` : '' }}{{ getCategoryLabel(req.category) }}
                  </span>
                </div>
                <span class="request-card__status" :class="`status--${req.status.toLowerCase()}`">
                  {{ req.status }}
                </span>
              </div>

              <p class="request-card__reason">“{{ req.reason }}”</p>

              <div class="request-card__footer">
                <a
                  v-if="req.referenceUrl"
                  :href="req.referenceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="request-card__link link-underline"
                >
                  Ver referencia ↗
                </a>
                <span v-else class="request-card__date">
                  Registrada el {{ formatDate(req.createdAt) }}
                </span>

                <button
                  type="button"
                  class="btn btn--danger request-card__del-btn"
                  title="Eliminar esta solicitud"
                  aria-label="Eliminar solicitud"
                  @click="onDelete(req.id)"
                >
                  Eliminar
                </button>
              </div>
            </li>
          </transition-group>

          <div v-else class="requests-empty">
            <p>Todavía no enviaste ninguna sugerencia de película.</p>
            <p class="requests-empty__sub">¡Completá el formulario de la izquierda para sugerir la primera!</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import FormField from '@/components/FormField.vue';
import StatusMessage from '@/components/StatusMessage.vue';
import { CATEGORIES, categoryLabel } from '@/data/categories';
import { isValidUrl } from '@/utils/validators';
import { requestsState, addRequest, deleteRequest, initRequests } from '@/store/requests';
import { authState } from '@/store/auth';

export default {
  name: 'RequestsView',
  components: { DisplayTitle, FormField, StatusMessage },
  data() {
    return {
      form: {
        title: '',
        category: 'romcom',
        year: '',
        reason: '',
        referenceUrl: ''
      },
      errors: {},
      categories: CATEGORIES,
      submitting: false,
      successNotice: '',
      requestsState,
      authState
    };
  },
  computed: {
    userDisplayName() {
      const u = this.authState.user;
      if (!u) return '';
      return u.user_metadata?.full_name || u.user_metadata?.name || u.email || 'Usuaria';
    }
  },
  created() {
    initRequests(this.authState.user ? this.authState.user.id : null);
  },
  mounted() {
    // Si la pantalla abre sin datos, no mostramos errores
    this.errors = {};
  },
  methods: {
    getCategoryLabel(id) {
      return categoryLabel(id);
    },
    formatDate(isoString) {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        return '';
      }
    },
    validateField(field) {
      const e = { ...this.errors };

      if (field === 'title') {
        const t = this.form.title.trim();
        if (!t) e.title = 'El título de la película es obligatorio.';
        else if (t.length < 2) e.title = 'Escribí al menos 2 caracteres.';
        else delete e.title;
      }

      if (field === 'category') {
        if (!this.form.category) e.category = 'Elegí una categoría editorial.';
        else delete e.category;
      }

      if (field === 'year') {
        const y = this.form.year.trim();
        if (y) {
          const num = Number(y);
          if (!/^\d{4}$/.test(y) || num < 1888 || num > 2100) {
            e.year = 'El año debe ser un número de 4 cifras (entre 1888 y 2100).';
          } else {
            delete e.year;
          }
        } else {
          delete e.year;
        }
      }

      if (field === 'reason') {
        const r = this.form.reason.trim();
        if (!r) e.reason = 'Contanos por qué debería sumarse al catálogo.';
        else if (r.length < 10) e.reason = 'Escribí una justificación de al menos 10 caracteres.';
        else delete e.reason;
      }

      if (field === 'referenceUrl') {
        const url = this.form.referenceUrl.trim();
        if (url && !isValidUrl(url)) {
          e.referenceUrl = 'Ingresá una dirección web válida con http:// o https://';
        } else {
          delete e.referenceUrl;
        }
      }

      this.errors = e;
      return Object.keys(e).length === 0;
    },
    runAllValidation() {
      ['title', 'category', 'year', 'reason', 'referenceUrl'].forEach((f) => this.validateField(f));
      return Object.keys(this.errors).length === 0;
    },
    async onSubmit() {
      if (!this.runAllValidation()) {
        this.$nextTick(() => {
          const firstInvalid = this.$el.querySelector('[aria-invalid="true"]');
          if (firstInvalid) firstInvalid.focus();
        });
        return;
      }

      this.submitting = true;
      this.successNotice = '';

      try {
        const payload = {
          title: this.form.title.trim(),
          category: this.form.category,
          year: this.form.year.trim() ? Number(this.form.year.trim()) : null,
          reason: this.form.reason.trim(),
          referenceUrl: this.form.referenceUrl.trim(),
          status: 'Pendiente'
        };

        await addRequest(payload);
        this.successNotice = `¡Solicitud enviada! Registramos tu pedido de “${payload.title}”.`;
        this.resetForm();
      } catch (err) {
        console.error('Error al guardar solicitud:', err);
      } finally {
        this.submitting = false;
      }
    },
    async onDelete(id) {
      if (!confirm('¿Segura que querés eliminar esta solicitud?')) return;
      try {
        await deleteRequest(id);
        this.successNotice = 'Solicitud eliminada correctamente.';
      } catch (err) {
        console.error('Error al eliminar solicitud:', err);
      }
    },
    resetForm() {
      this.form = {
        title: '',
        category: 'romcom',
        year: '',
        reason: '',
        referenceUrl: ''
      };
      this.errors = {};
      if (this.$refs.firstInput) {
        this.$refs.firstInput.focus();
      }
    }
  }
};
</script>

<style scoped>
.requests-view__header {
  margin-bottom: 28px;
}

.requests-view__intro {
  max-width: 65ch;
  margin: 12px 0 16px;
  font-size: 1.1rem;
}

.requests-view__status-chip {
  display: inline-block;
  margin-bottom: 8px;
}

.chip-cloud {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 0, 204, 0.15);
  border: 1px solid var(--pink);
  border-radius: 999px;
  font-size: 0.85rem;
  color: var(--pink-soft);
}

.chip-local {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  font-size: 0.85rem;
  color: var(--muted);
}

.requests-view__alert {
  margin-bottom: 24px;
}

.requests-view__layout {
  display: grid;
  gap: 32px;
}

.requests-view__form-card {
  background: rgba(18, 18, 20, 0.8);
  border: 2px solid var(--pink);
  border-radius: var(--radius);
  padding: clamp(20px, 4vw, 32px);
  box-shadow: 0 8px 30px rgba(255, 0, 204, 0.15);
}

.requests-card-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--white);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.requests-badge {
  font-family: var(--font-body);
  font-size: 0.9rem;
  padding: 2px 10px;
  background: var(--pink);
  color: var(--black);
  border-radius: 999px;
}

.requests-card-subtitle {
  color: var(--pink-soft);
  font-size: 0.95rem;
  margin-bottom: 20px;
  display: block;
}

.requests-form__row {
  display: grid;
  gap: 0 16px;
}

.requests-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

/* LISTADO */
.requests-view__list-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.requests-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.request-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.request-card:hover {
  border-color: var(--pink);
}

.request-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.request-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--white);
}

.request-card__meta {
  color: var(--pink-soft);
  font-size: 0.88rem;
  font-weight: 600;
}

.request-card__status {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
}

.request-card__status.status--pendiente {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.4);
}

.request-card__reason {
  margin: 0;
  color: var(--muted);
  font-style: italic;
  font-size: 0.95rem;
  line-height: 1.5;
}

.request-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.request-card__link {
  font-size: 0.9rem;
  color: var(--pink-soft);
}

.request-card__date {
  font-size: 0.82rem;
  color: var(--muted);
}

.request-card__del-btn {
  padding: 4px 12px;
  min-height: 36px;
  min-width: 36px;
  font-size: 0.8rem;
}

.requests-empty {
  padding: 40px 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  color: var(--muted);
}

.requests-empty__sub {
  margin-top: 8px;
  color: var(--pink-soft);
  font-weight: 600;
}

.requests-loading {
  padding: 24px;
  text-align: center;
  color: var(--muted);
}

/* Transición para la lista de solicitudes */
.request-item-enter-active,
.request-item-leave-active {
  transition: all 0.25s ease;
}

.request-item-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.request-item-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@media (min-width: 640px) {
  .requests-form__row {
    grid-template-columns: 1fr 140px;
  }
}

@media (min-width: 900px) {
  .requests-view__layout {
    grid-template-columns: 1.1fr 1fr;
    align-items: start;
    gap: 40px;
  }
}
</style>
