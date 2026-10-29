<template>
  <footer class="site-footer">
    <div class="container site-footer__inner">
      <div>
        <p class="site-footer__brand">FemCine</p>
        <p class="site-footer__muted">Proyecto académico</p>
        <p class="site-footer__muted">{{ info.course }} · {{ info.institution }}</p>
      </div>
      <nav aria-label="Pie de página">
        <p class="site-footer__title">Contenidos</p>
        <ul>
          <li v-for="item in items" :key="item.to">
            <router-link :to="item.to">{{ item.label }}</router-link>
          </li>
          <li><router-link to="/peliculas/nueva">Agregar película</router-link></li>
        </ul>
      </nav>
      <p class="site-footer__note">
        El catálogo y las suscripciones se guardan solo en este dispositivo. Las películas de “Más cine para
        descubrir” provienen de la Studio Ghibli API.
      </p>
    </div>
  </footer>
</template>

<script>
import { NAV_ITEMS } from '@/data/navigation';
import { PROJECT_INFO } from '@/config/team';

export default {
  name: 'SiteFooter',
  data() {
    return { items: NAV_ITEMS, info: PROJECT_INFO };
  }
};
</script>

<style scoped>
.site-footer { background: #000; padding-block: 40px; border-top: 3px solid var(--pink); }
.site-footer__inner { display: grid; gap: 28px; }
.site-footer__brand { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: 2rem; color: var(--pink); text-transform: uppercase; }
.site-footer__muted { margin: 0; color: var(--muted); }
.site-footer__title { margin: 0 0 6px; font-family: var(--font-display); font-weight: 800; text-transform: uppercase; color: var(--pink); }
.site-footer ul { list-style: none; margin: 0; padding: 0; }
.site-footer li a { display: inline-flex; align-items: center; min-height: 44px; }
.site-footer__note { margin: 0; color: var(--muted); font-size: 1rem; max-width: 40ch; }
@media (min-width: 768px) {
  .site-footer__inner { grid-template-columns: 1.4fr 1fr 1.2fr; align-items: start; }
}
</style>
