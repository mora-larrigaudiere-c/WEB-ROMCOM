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
            FemCine es un catálogo de películas para quienes prefieren el drama que sí vale la pena. Combina cine,
            cultura pop, personajes femeninos y humor, con una mirada editorial: en lugar de listas frías, armamos
            colecciones para elegir según el ánimo.
          </p>
          <p>
            Las categorías (Romcom, Musical, Llanto, Época, Distopía y Terror) son colecciones editoriales de FemCine.
            No reemplazan al género de cada película, que se muestra aparte en la ficha.
          </p>
        </div>

        <div class="about__block">
          <DisplayTitle text="Proyecto académico" tone="pink" size="clamp(2rem, 6vw, 3.4rem)" />
          <p>
            FemCine es un trabajo de la materia {{ info.course }} de la {{ info.career }} ({{ info.institution }}). Es una
            aplicación de una sola página hecha con Vue 3, Vue CLI y Vue Router, con un catálogo que se guarda en este
            dispositivo (LocalStorage) y una sección de películas externas que se consulta con Fetch.
          </p>
          <p>No hay cuentas de usuario ni servidor propio: todo lo que agregues vive en tu navegador.</p>
        </div>
      </div>
    </section>

    <section class="about__team section" aria-labelledby="team-title">
      <div class="container">
        <DisplayTitle id="team-title" text="Integrantes" tone="dark" size="clamp(2rem, 6vw, 3.4rem)" />
        <ul v-if="members.length" class="about__members">
          <li v-for="member in members" :key="member.name">
            <strong>{{ member.name }}</strong><span v-if="member.role"> · {{ member.role }}</span>
          </li>
        </ul>
        <p v-else class="about__empty">Equipo de dos integrantes. Los nombres se completarán en la configuración del proyecto.</p>
        <div class="about__links">
          <router-link class="btn btn--black" :to="{ name: 'catalogo' }">Explorar películas</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import DisplayTitle from '@/components/DisplayTitle.vue';
import { TEAM_MEMBERS, PROJECT_INFO } from '@/config/team';

export default {
  name: 'AboutView',
  components: { DisplayTitle },
  data() {
    return { members: TEAM_MEMBERS, info: PROJECT_INFO };
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
.about__block p { margin: 0; max-width: 60ch; }
.about__team { background: var(--pink-strong) var(--img-rosa) center / cover; color: var(--black); }
.about__members { margin: 20px 0; padding-left: 20px; }
.about__empty { margin: 20px 0; font-weight: 600; max-width: 56ch; }
@media (min-width: 900px) { .about__grid { grid-template-columns: 1fr 1fr; gap: 64px; } }
</style>
