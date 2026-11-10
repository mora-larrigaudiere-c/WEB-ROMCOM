<template>
  <section class="oracle-section section" aria-labelledby="oracle-title">
    <div class="container oracle-section__inner">
      <div class="oracle-section__head">
        <DisplayTitle
          id="oracle-title"
          text="El oráculo del drama"
          tag="h2"
          tone="pink"
          size="clamp(2.4rem, 8vw, 5rem)"
        />
        <p class="oracle-section__subtitle">
          Tu próxima decisión cinematográfica merece un poco de drama y magia.
        </p>
      </div>

      <!-- ESCENARIO MÍSTICO DE LA BOLA DE CRISTAL -->
      <div class="crystal-stage">
        <!-- Control de Sonido Mute/Unmute -->
        <button
          type="button"
          class="sound-toggle-btn"
          :title="isMuted ? 'Activar efectos de sonido del oráculo' : 'Silenciar oráculo'"
          :aria-pressed="!isMuted ? 'true' : 'false'"
          @click="toggleSound"
        >
          <span aria-hidden="true">{{ isMuted ? '🔇 Silenciado' : '🔊 Sonido activo' }}</span>
        </button>

        <!-- Bola de cristal mística con animación y reflejos -->
        <div class="crystal-ball-wrapper" :class="{ 'is-loading': loading, 'has-result': !!result }">
          <div class="crystal-ball" @click="handleCrystalClick">
            <!-- Capa interna de niebla mágica animada -->
            <div class="crystal-mist"></div>

            <!-- Destellos y reflejos de luz especular -->
            <div class="crystal-highlight"></div>
            <div class="crystal-sparkles" aria-hidden="true">✦</div>

            <!-- Centro interactivo -->
            <div class="crystal-center">
              <span v-if="loading" class="crystal-pulsing-rune">🔮</span>
              <span v-else-if="result" class="crystal-result-word">{{ result.answerText }}</span>
              <span v-else class="crystal-resting-eye">👁</span>
            </div>
          </div>
          <!-- Base / pedestal ornamentado de la bola -->
          <div class="crystal-pedestal"></div>
        </div>

        <p class="crystal-hint">
          {{ loading ? 'Sintonizando el destino cinematográfico...' : (result ? 'El cristal ha hablado' : 'Consultá tu duda abajo para revelar el destino') }}
        </p>
      </div>

      <!-- Formulario para realizar la pregunta -->
      <form class="oracle-card" novalidate @submit.prevent="handleSubmit">
        <div class="field">
          <label class="field__label oracle-label" for="oracle-question">
            ¿Qué querés preguntarle al cristal?
          </label>
          <input
            id="oracle-question"
            ref="questionInput"
            v-model="question"
            class="input oracle-input"
            type="text"
            placeholder="¿Reveo mi romcom favorita?"
            autocomplete="off"
            :disabled="loading"
            :aria-invalid="validationError ? 'true' : 'false'"
            :aria-describedby="validationError ? 'oracle-validation-error' : null"
            @input="clearValidationError"
          />
          <p
            v-if="validationError"
            id="oracle-validation-error"
            class="field__error"
            role="alert"
          >
            {{ validationError }}
          </p>
        </div>

        <!-- Sugerencias de preguntas -->
        <div class="oracle-suggestions" aria-label="Sugerencias de preguntas">
          <span class="oracle-suggestions__label">Sugerencias rápidas:</span>
          <div class="oracle-suggestions__list">
            <button
              v-for="sug in suggestions"
              :key="sug"
              type="button"
              class="oracle-chip"
              :disabled="loading"
              @click="applySuggestion(sug)"
            >
              {{ sug }}
            </button>
          </div>
        </div>

        <!-- Botón para consultar -->
        <div class="oracle-actions">
          <button
            type="submit"
            class="btn btn--pink oracle-submit-btn"
            :disabled="loading"
            :aria-busy="loading ? 'true' : 'false'"
          >
            <span v-if="loading">Leyendo el cristal…</span>
            <span v-else>🔮 Invocar al oráculo</span>
          </button>
        </div>
      </form>

      <!-- Mensaje de estado de error accesible -->
      <div
        v-if="errorMessage"
        class="oracle-error-banner"
        role="alert"
        aria-live="assertive"
      >
        <p class="oracle-error-text">{{ errorMessage }}</p>
        <button
          type="button"
          class="btn btn--outline oracle-retry-btn"
          @click="handleSubmit"
        >
          Reintentar consulta
        </button>
      </div>

      <!-- Resultado de la consulta con animación -->
      <transition name="oracle-reveal" mode="out-in">
        <div
          v-if="result && !loading"
          key="oracle-result"
          class="oracle-result-card"
          role="region"
          aria-live="polite"
          aria-labelledby="oracle-answer-heading"
        >
          <div class="oracle-result-badge">
            <span class="oracle-result-star">✦</span>
            <span class="oracle-result-tag">Veredicto del Cristal</span>
            <span class="oracle-result-star">✦</span>
          </div>

          <p class="oracle-asked-question">
            Preguntaste: <em>“{{ lastAskedQuestion }}”</em>
          </p>

          <h3 id="oracle-answer-heading" class="oracle-answer-text">
            {{ result.answerText }}
          </h3>

          <p class="oracle-editorial-phrase">
            {{ result.phrase }}
          </p>

          <div class="oracle-result-actions">
            <button
              type="button"
              class="btn btn--outline oracle-reset-btn"
              @click="resetOracle"
            >
              Hacer otra pregunta
            </button>
          </div>
        </div>
      </transition>
    </div>
  </section>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import { askOracle, OracleApiError } from '@/services/oracleService';
import { isSoundMuted, setSoundMuted, playCrystalGong, playCrystalChime } from '@/services/soundService';

export default {
  name: 'OracleSection',
  components: { DisplayTitle },
  data() {
    return {
      question: '',
      lastAskedQuestion: '',
      loading: false,
      validationError: '',
      errorMessage: '',
      result: null,
      isMuted: isSoundMuted(),
      suggestions: [
        '¿Veo otra romcom?',
        '¿Me animo a una de terror?',
        '¿Reveo mi película favorita?'
      ]
    };
  },
  mounted() {
    this.isMuted = isSoundMuted();
  },
  methods: {
    toggleSound() {
      this.isMuted = !this.isMuted;
      setSoundMuted(this.isMuted);
      if (!this.isMuted) {
        playCrystalChime();
      }
    },
    handleCrystalClick() {
      if (this.question.trim()) {
        this.handleSubmit();
      } else if (this.$refs.questionInput) {
        this.$refs.questionInput.focus();
      }
    },
    applySuggestion(text) {
      this.question = text;
      this.validationError = '';
      if (this.$refs.questionInput) {
        this.$refs.questionInput.focus();
      }
    },
    clearValidationError() {
      if (this.validationError) {
        this.validationError = '';
      }
    },
    async handleSubmit() {
      const trimmed = this.question.trim();
      if (!trimmed) {
        this.validationError = 'Por favor escribí una pregunta antes de consultar.';
        if (this.$refs.questionInput) {
          this.$refs.questionInput.focus();
        }
        return;
      }

      this.validationError = '';
      this.errorMessage = '';
      this.loading = true;

      // Efecto sonoro de inicio de concentración
      playCrystalChime();

      try {
        const response = await askOracle({ timeoutMs: 8000 });
        this.lastAskedQuestion = trimmed;
        this.result = response;

        // Efecto sonoro de veredicto
        playCrystalGong();
      } catch (err) {
        this.result = null;
        if (err instanceof OracleApiError) {
          this.errorMessage = err.message;
        } else {
          this.errorMessage = 'Ocurrió un problema inesperado al consultar el oráculo.';
        }
      } finally {
        this.loading = false;
      }
    },
    resetOracle() {
      this.result = null;
      this.errorMessage = '';
      this.validationError = '';
      this.question = '';
      this.$nextTick(() => {
        if (this.$refs.questionInput) {
          this.$refs.questionInput.focus();
        }
      });
    }
  }
};
</script>

<style scoped>
.oracle-section {
  background: var(--black) var(--img-negro) center / cover;
  border-top: 3px solid var(--pink-strong);
  border-bottom: 3px solid var(--pink-strong);
  position: relative;
  overflow: hidden;
}

.oracle-section__inner {
  max-width: 820px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.oracle-section__head {
  text-align: center;
}

.oracle-section__subtitle {
  margin: 12px auto 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--pink-soft);
  max-width: 48ch;
}

/* ESCENARIO DE LA BOLA DE CRISTAL */
.crystal-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin: 8px 0;
}

.sound-toggle-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 0, 204, 0.4);
  color: var(--white);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sound-toggle-btn:hover {
  background: var(--pink);
  color: var(--black);
}

.crystal-ball-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.crystal-ball {
  width: clamp(160px, 35vw, 210px);
  height: clamp(160px, 35vw, 210px);
  border-radius: 50%;
  position: relative;
  background: radial-gradient(circle at 35% 35%, rgba(255, 100, 230, 0.85) 0%, rgba(130, 0, 110, 0.7) 45%, rgba(15, 0, 25, 0.95) 85%);
  box-shadow:
    0 0 40px rgba(255, 0, 204, 0.5),
    inset 0 0 25px rgba(255, 255, 255, 0.4),
    inset -10px -10px 25px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}

.crystal-ball:hover {
  transform: scale(1.04);
  box-shadow:
    0 0 60px rgba(255, 0, 204, 0.75),
    inset 0 0 35px rgba(255, 255, 255, 0.6);
}

.crystal-ball-wrapper.is-loading .crystal-ball {
  animation: crystal-vibrate 0.6s infinite alternate ease-in-out;
  box-shadow: 0 0 80px rgba(255, 0, 204, 0.9), inset 0 0 40px #fff;
}

@keyframes crystal-vibrate {
  0% { transform: scale(1) translateY(0); filter: hue-rotate(0deg); }
  100% { transform: scale(1.06) translateY(-4px); filter: hue-rotate(45deg); }
}

.crystal-mist {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  animation: mist-spin 8s linear infinite;
  opacity: 0.6;
}

@keyframes mist-spin {
  0% { transform: rotate(0deg) scale(0.9); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(0.9); }
}

.crystal-highlight {
  position: absolute;
  top: 14%;
  left: 20%;
  width: 35%;
  height: 24%;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 75%);
  transform: rotate(-25deg);
  pointer-events: none;
}

.crystal-sparkles {
  position: absolute;
  top: 18px;
  right: 28px;
  color: #fff;
  font-size: 1.2rem;
  animation: sparkle-twinkle 2s infinite ease-in-out;
}

@keyframes sparkle-twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.crystal-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.crystal-resting-eye {
  font-size: 2.2rem;
  opacity: 0.7;
  filter: drop-shadow(0 0 8px #fff);
  transition: opacity 0.3s;
}

.crystal-pulsing-rune {
  font-size: 2.8rem;
  animation: pulse 1s infinite alternate;
}

.crystal-result-word {
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 800;
  color: #fff;
  text-shadow: 0 0 16px rgba(255, 0, 204, 0.9);
  animation: pop-in 0.4s ease-out;
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
}

.crystal-pedestal {
  width: clamp(100px, 24vw, 140px);
  height: 22px;
  background: linear-gradient(to bottom, #444, #1a1a1a 70%, #000);
  border: 2px solid var(--pink);
  border-radius: 0 0 16px 16px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.8);
  margin-top: -6px;
  z-index: 1;
}

.crystal-hint {
  margin: 12px 0 0;
  font-size: 0.95rem;
  color: var(--pink-soft);
  font-weight: 600;
  font-style: italic;
}

/* Card del formulario */
.oracle-card {
  background: rgba(18, 18, 20, 0.85);
  border: 2px solid var(--pink-strong);
  border-radius: var(--radius);
  padding: clamp(20px, 4vw, 32px);
  box-shadow: 0 8px 32px rgba(255, 0, 200, 0.15);
}

.oracle-label {
  font-size: 1.15rem;
  color: var(--white);
  margin-bottom: 8px;
}

.oracle-input {
  font-size: 1.05rem;
  background: #ffffff;
  color: #0a0a0a;
  border: 2px solid #ffffff;
  border-radius: 10px;
}

.oracle-input:focus {
  border-color: var(--pink-strong);
}

.oracle-suggestions {
  margin: 16px 0 24px;
}

.oracle-suggestions__label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin-bottom: 8px;
}

.oracle-suggestions__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.oracle-chip {
  background: rgba(255, 255, 255, 0.08);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 9999px;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  min-height: 40px;
  transition: all 0.15s ease;
}

.oracle-chip:hover:not(:disabled) {
  background: var(--pink-strong);
  color: var(--black);
  border-color: var(--pink-strong);
  transform: translateY(-1px);
}

.oracle-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.oracle-actions {
  display: flex;
  justify-content: flex-start;
}

.oracle-submit-btn {
  width: 100%;
}

@media (min-width: 640px) {
  .oracle-submit-btn {
    width: auto;
  }
}

.oracle-error-banner {
  background: rgba(255, 157, 176, 0.15);
  border: 2px solid var(--danger);
  border-radius: var(--radius);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.oracle-error-text {
  margin: 0;
  color: var(--danger);
  font-weight: 600;
  font-size: 1rem;
}

.oracle-retry-btn {
  border-color: var(--danger);
  color: var(--danger);
}

.oracle-retry-btn:hover {
  background: rgba(255, 157, 176, 0.2);
}

.oracle-result-card {
  background: #0a0a0a;
  border: 3px solid var(--pink-strong);
  border-radius: var(--radius);
  padding: clamp(24px, 5vw, 40px);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 12px 40px rgba(255, 0, 204, 0.3);
}

.oracle-result-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--pink-strong);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.oracle-result-star {
  font-size: 1.1rem;
}

.oracle-asked-question {
  margin: 0;
  color: var(--muted);
  font-size: 1.1rem;
}

.oracle-asked-question em {
  color: var(--white);
  font-style: italic;
}

.oracle-answer-text {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(3rem, 10vw, 5.5rem);
  font-weight: 800;
  color: var(--pink-strong);
  line-height: 1;
  text-shadow: 0 0 20px rgba(255, 0, 204, 0.5);
}

.oracle-editorial-phrase {
  margin: 0;
  font-size: clamp(1.15rem, 3.5vw, 1.45rem);
  font-weight: 700;
  color: var(--white);
  max-width: 44ch;
  line-height: 1.4;
}

.oracle-result-actions {
  margin-top: 12px;
}

.oracle-reset-btn {
  border-color: var(--pink-soft);
  color: var(--pink-soft);
}

.oracle-reset-btn:hover {
  background: var(--pink-strong);
  color: var(--black);
}

.oracle-reveal-enter-active,
.oracle-reveal-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.oracle-reveal-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.oracle-reveal-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .oracle-reveal-enter-active,
  .oracle-reveal-leave-active,
  .crystal-mist,
  .crystal-sparkles {
    transition: opacity 0.01ms !important;
    animation: none !important;
    transform: none !important;
  }
}
</style>
