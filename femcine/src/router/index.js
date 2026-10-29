import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

const routes = [
  { path: '/', name: 'inicio', component: HomeView, meta: { title: 'Inicio' } },
  {
    path: '/peliculas',
    name: 'catalogo',
    component: () => import(/* webpackChunkName: "catalogo" */ '@/views/CatalogView.vue'),
    meta: { title: 'Películas' }
  },
  // "nueva" debe declararse antes que ":id" para no confundirse con un identificador.
  {
    path: '/peliculas/nueva',
    name: 'pelicula-nueva',
    component: () => import(/* webpackChunkName: "formulario" */ '@/views/MovieFormView.vue'),
    meta: { title: 'Agregar película' }
  },
  {
    path: '/peliculas/:id',
    name: 'detalle',
    component: () => import(/* webpackChunkName: "detalle" */ '@/views/MovieDetailView.vue'),
    meta: { title: 'Detalle' }
  },
  {
    path: '/peliculas/:id/editar',
    name: 'editar',
    component: () => import(/* webpackChunkName: "formulario" */ '@/views/MovieFormView.vue'),
    meta: { title: 'Editar película' }
  },
  {
    path: '/nosotras',
    name: 'nosotras',
    component: () => import(/* webpackChunkName: "nosotras" */ '@/views/AboutView.vue'),
    meta: { title: 'Nosotras' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'no-encontrada',
    component: () => import(/* webpackChunkName: "404" */ '@/views/NotFoundView.vue'),
    meta: { title: 'Página no encontrada' }
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from) {
    // Cambiar filtros (misma ruta) no debe devolver la página arriba.
    if (to.path === from.path) return false;
    return { top: 0 };
  }
});

router.afterEach((to) => {
  const title = to.meta && to.meta.title ? `${to.meta.title} · FemCine` : 'FemCine';
  document.title = title;
});

export default router;
