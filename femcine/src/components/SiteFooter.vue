<template>
  <footer class="site-footer">
    <div class="container site-footer__inner">
      <div>
        <p class="site-footer__brand">FemCine</p>
        <p class="site-footer__tagline">Catálogo curado & Club del Drama</p>
        <p class="site-footer__creators">
          Creado por <strong>Mora Larrigaudiere Curutchet</strong> y <strong>Oriana Fuentes</strong>
          <br />
          <span class="site-footer__sub">Diseñadoras Multimediales</span>
        </p>
      </div>

      <nav aria-label="Pie de página">
        <p class="site-footer__title">Explorar</p>
        <ul>
          <li v-for="item in items" :key="item.to">
            <router-link :to="item.to">{{ item.label }}</router-link>
          </li>
          <li><router-link to="/perfil">Mi Perfil</router-link></li>
        </ul>
      </nav>

      <div class="site-footer__info-col">
        <p class="site-footer__title">El Oráculo</p>
        <p class="site-footer__note">
          Consultas en vivo conectadas a la bola de cristal de YesNoOracle. Respuestas aleatorias pensadas para el entretenimiento cinéfilo.
        </p>
      </div>
    </div>
  </footer>
</template>

<script>
import { NAV_ITEMS } from '@/data/navigation';

export default {
  name: 'SiteFooter',
  data() {
    return {
      items: NAV_ITEMS
    };
  }
};
</script>

<style scoped>
.site-footer { background: #000; padding-block: 40px; border-top: 3px solid var(--pink); }
.site-footer__inner { display: grid; gap: 28px; }
.site-footer__brand { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: 2rem; color: var(--pink); text-transform: uppercase; }
.site-footer__tagline { margin: 4px 0 10px; color: var(--pink-soft); font-weight: 600; font-size: 0.95rem; }
.site-footer__creators { margin: 0; color: #ccc; font-size: 0.95rem; line-height: 1.4; }
.site-footer__sub { color: var(--muted); font-size: 0.85rem; }
.site-footer__title { margin: 0 0 8px; font-family: var(--font-display); font-weight: 800; text-transform: uppercase; color: var(--pink); }
.site-footer ul { list-style: none; margin: 0; padding: 0; }
.site-footer li a { display: inline-flex; align-items: center; min-height: 40px; color: #eee; text-decoration: none; }
.site-footer li a:hover { color: var(--pink); }
.site-footer__note { margin: 0; color: var(--muted); font-size: 0.92rem; max-width: 40ch; line-height: 1.5; }
@media (min-width: 768px) {
  .site-footer__inner { grid-template-columns: 1.4fr 1fr 1.2fr; align-items: start; }
}
</style>
