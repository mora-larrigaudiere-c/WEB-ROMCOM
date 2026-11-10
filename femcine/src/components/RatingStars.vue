<template>
  <div class="rating-stars" :class="{ 'rating-stars--interactive': interactive }" role="group" :aria-label="label">
    <div class="rating-stars__header">
      <span class="rating-stars__label">{{ label }}:</span>
      <span class="rating-stars__value" aria-live="polite">
        {{ ratingText }}
      </span>
    </div>

    <div class="rating-stars__list">
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        class="rating-star-btn"
        :class="{ 'rating-star-btn--active': (hoverRating || modelValue) >= star }"
        :disabled="!interactive"
        :aria-label="`${star} de 5 estrellas`"
        :aria-pressed="modelValue >= star ? 'true' : 'false'"
        @click="onSelect(star)"
        @mouseenter="interactive ? (hoverRating = star) : null"
        @mouseleave="interactive ? (hoverRating = 0) : null"
        @focus="interactive ? (hoverRating = star) : null"
        @blur="interactive ? (hoverRating = 0) : null"
      >
        <span class="star-icon" aria-hidden="true">★</span>
      </button>

      <button
        v-if="interactive && modelValue > 0"
        type="button"
        class="rating-clear-btn"
        title="Quitar calificación"
        aria-label="Quitar calificación"
        @click="onClear"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RatingStars',
  props: {
    modelValue: {
      type: Number,
      default: 0,
      validator: (v) => Number.isInteger(v) && v >= 0 && v <= 5
    },
    interactive: {
      type: Boolean,
      default: true
    },
    label: {
      type: String,
      default: 'Tu calificación'
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      hoverRating: 0
    };
  },
  computed: {
    ratingText() {
      const active = this.hoverRating || this.modelValue;
      if (!active || active === 0) return 'Sin calificar';
      if (active === 1) return '1 estrella';
      return `${active} estrellas`;
    }
  },
  methods: {
    onSelect(star) {
      if (!this.interactive) return;
      // Si toca la misma estrella que ya tenía, se deselecciona (vuelve a 0)
      const next = this.modelValue === star ? 0 : star;
      this.$emit('update:modelValue', next);
    },
    onClear() {
      if (!this.interactive) return;
      this.$emit('update:modelValue', 0);
    }
  }
};
</script>

<style scoped>
.rating-stars {
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
}

.rating-stars__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.rating-stars__label {
  font-weight: 700;
  color: var(--white);
}

.rating-stars__value {
  color: var(--pink-soft);
  font-weight: 600;
}

.rating-stars__list {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-star-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #444448;
  font-size: 1.8rem;
  line-height: 1;
  transition: transform 0.12s ease, color 0.12s ease;
  border-radius: 8px;
}

.rating-star-btn:hover:not(:disabled) {
  transform: scale(1.15);
}

.rating-star-btn--active {
  color: var(--pink-strong);
  text-shadow: 0 0 10px rgba(255, 0, 204, 0.45);
}

.rating-star-btn:disabled {
  cursor: default;
}

.rating-clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
  margin-left: 6px;
  padding: 0;
  background: rgba(255, 255, 255, 0.1);
  color: var(--muted);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.rating-clear-btn:hover {
  background: var(--danger);
  color: var(--black);
  border-color: var(--danger);
}
</style>
