<template>
  <section class="hall" aria-labelledby="hall-title">
    <div class="container hall__inner">
      <div class="hall__copy">
        <DisplayTitle id="hall-title" text="Hall de íconos" tone="pink" size="clamp(2.6rem, 8vw, 5.2rem)" />
        <h3 class="hall__lead">Ellas no pidieron ser icónicas</h3>
        <p>
          Simplemente lo fueron. Y lo siguen siendo cada vez que alguien cita una de sus frases, copia un look o finge
          que no le importa mientras le importa todo. En FemCine las amamos no porque sean perfectas, sino porque son
          caóticas, mandonas, intensas, frágiles, brillantes o simplemente inolvidables.
        </p>
      </div>

      <div class="hall__stage">
        <button type="button" class="hall__arrow" aria-label="Personaje anterior" @click="prev">
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>

        <div class="hall__card" aria-live="polite">
          <transition name="fade" mode="out-in">
            <figure :key="current.id" class="hall__figure">
              <img class="hall__portrait" :src="current.portrait" :alt="current.portraitAlt" loading="lazy" decoding="async" />
              <figcaption class="hall__caption">
                <img class="hall__name" :src="current.title" :alt="current.name" loading="lazy" decoding="async" />
                <span class="hall__film">{{ current.film }}</span>
                <span class="sr-only">Personaje {{ position }} de {{ characters.length }}</span>
              </figcaption>
            </figure>
          </transition>
        </div>

        <button type="button" class="hall__arrow" aria-label="Personaje siguiente" @click="next">
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="m9 4 8 8-8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
      </div>
    </div>
  </section>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import { ASSETS } from '@/data/assets';

export default {
  name: 'IconHall',
  components: { DisplayTitle },
  data() {
    return { characters: ASSETS.characters, index: 0 };
  },
  computed: {
    current() {
      return this.characters[this.index];
    },
    position() {
      return this.index + 1;
    }
  },
  methods: {
    next() {
      this.index = (this.index + 1) % this.characters.length;
    },
    prev() {
      this.index = (this.index - 1 + this.characters.length) % this.characters.length;
    }
  }
};
</script>

<style scoped>
.hall { background: #0a0a0a var(--img-negro) center / cover; padding-block: clamp(40px, 7vw, 96px); overflow: hidden; }
.hall__inner { display: grid; gap: 32px; align-items: center; }
.hall__lead { margin: 20px 0 10px; font-weight: 400; font-size: clamp(1.4rem, 4vw, 2rem); text-transform: uppercase; color: var(--pink-soft); letter-spacing: 0.02em; }
.hall__copy p { max-width: 56ch; margin: 0; }
.hall__stage { display: grid; grid-template-columns: 48px 1fr 48px; align-items: center; gap: 8px; }
.hall__arrow {
  width: 48px; height: 48px; display: grid; place-items: center; cursor: pointer;
  background: transparent; color: var(--white); border: 2px solid var(--white); border-radius: 12px;
}
.hall__arrow:hover { border-color: var(--pink); color: var(--pink); }
.hall__figure { margin: 0; display: grid; justify-items: center; gap: 8px; }
.hall__portrait { width: min(100%, 340px); height: auto; }
.hall__caption { display: grid; justify-items: center; gap: 4px; }
.hall__name { width: min(100%, 300px); height: auto; }
.hall__film { color: var(--muted); font-weight: 600; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.22s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@media (min-width: 900px) {
  .hall__inner { grid-template-columns: 1fr 1fr; gap: 56px; }
}
</style>
