<template>
  <div class="about">
    <section class="about__hero" aria-labelledby="about-title">
      <div class="container about__hero-inner">
        <p class="about__kicker">Nosotras</p>
        <h1 id="about-title" class="about__title">Bienvenida al <span>Club del Drama</span></h1>
      </div>
    </section>

    <section class="section">
      <div class="container about__grid">
        <div class="about__block">
          <DisplayTitle text="Qué es FemCine" tone="pink" size="clamp(2rem, 6vw, 3.4rem)" />
          <p>
            FemCine es un catálogo y espacio de encuentro cinematográfico para quienes prefieren el drama que sí vale la pena.
            Combina cine, cultura pop, personajes femeninos icónicos y humor, con una mirada editorial distintiva: en lugar de listas frías, armamos colecciones vivas para elegir según el ánimo.
          </p>
          <p>
            Nuestras categorías (Romcom, Musical, Llanto, Época, Distopía y Terror) son colecciones editoriales curadas con devoción por los detalles y la estética cinematográfica.
          </p>
        </div>

        <div class="about__block">
          <DisplayTitle text="Nuestra Visión" tone="pink" size="clamp(2rem, 6vw, 3.4rem)" />
          <p>
            Creamos FemCine como un refugio donde ser fanática no es un delito. La plataforma ofrece un catálogo público compartido donde descubrir títulos, compartir reseñas cinéfilas, guardar tus películas favoritas y debatir en el Club del Drama.
          </p>
          <p>
            Además, incorporamos <em>“El oráculo del drama”</em>: una bola de cristal interactiva que consulta en vivo para ayudarte a tomar tus decisiones cinéfilas más difíciles.
          </p>
        </div>
      </div>
    </section>

    <section class="about__team section" aria-labelledby="team-title">
      <div class="container">
        <DisplayTitle id="team-title" text="Creadoras" tone="dark" size="clamp(2rem, 6vw, 3.4rem)" />
        <ul class="about__members">
          <li v-for="creator in creators" :key="creator.name" class="creator-item">
            <strong class="creator-name">{{ creator.name }}</strong>
            <span class="creator-role"> · {{ creator.role }}</span>
            <p v-if="creator.bio" class="creator-bio">{{ creator.bio }}</p>
          </li>
        </ul>
        <div class="about__links">
          <router-link class="btn btn--black" :to="{ name: 'catalogo' }">Explorar películas</router-link>
          <router-link class="btn btn--outline-dark" :to="{ name: 'comunidad' }">Entrar a la comunidad</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import { CREATORS } from '@/config/team';

export default {
  name: 'AboutView',
  components: { DisplayTitle },
  data() {
    return {
      creators: CREATORS,
      members: CREATORS // Retrocompatibilidad
    };
  }
};
</script>

<style scoped>
.about__hero {
  position: relative; display: grid; align-items: center; min-height: clamp(280px, 48vw, 520px);
  background: #111 var(--img-foto) center / cover; text-align: center;
}
.about__hero::before { content: ''; position: absolute; inset: 0; background: rgba(0, 0, 0, 0.45); }
.about__hero-inner { position: relative; display: grid; gap: 8px; justify-items: center; padding-block: 40px; }
.about__kicker { margin: 0; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
.about__title { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: clamp(2.2rem, 8vw, 5rem); line-height: 1; text-transform: uppercase; text-shadow: 0 2px 18px rgba(0, 0, 0, 0.7); }
.about__title span { display: block; font-family: var(--font-script); font-weight: 400; text-transform: none; font-size: 1.35em; color: var(--pink); line-height: 1; }
.about__grid { display: grid; gap: 40px; }
.about__block { display: grid; gap: 16px; align-content: start; }
.about__block p { margin: 0; max-width: 60ch; line-height: 1.6; }
.about__team { background: var(--pink-strong) var(--img-rosa) center / cover; color: var(--black); }
.about__members { margin: 24px 0; padding: 0; list-style: none; display: grid; gap: 20px; }
.creator-item {
  background: rgba(255, 255, 255, 0.2);
  padding: 16px 20px;
  border-radius: var(--radius);
  border: 1px solid rgba(0, 0, 0, 0.15);
}
.creator-name { font-size: 1.25rem; font-family: var(--font-display); font-weight: 800; }
.creator-role { font-weight: 700; color: #111; }
.creator-bio { margin: 6px 0 0; font-size: 0.95rem; }
.about__links { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 16px; }
.btn--outline-dark {
  border: 2px solid var(--black);
  color: var(--black);
  background: transparent;
}
.btn--outline-dark:hover {
  background: var(--black);
  color: var(--white);
}
@media (min-width: 900px) { .about__grid { grid-template-columns: 1fr 1fr; gap: 64px; } }
</style>
