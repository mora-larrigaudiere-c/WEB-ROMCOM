# FemCine

Catálogo de películas con mirada editorial: cine, cultura pop, personajes femeninos y humor.
Proyecto académico de **Práctica Profesionalizante: Desarrollo Web y Mobile** (Tecnicatura Superior en Diseño Multimedial, ISEC).

## Integrantes

Completar en `src/config/team.js` (lista `TEAM_MEMBERS`) y copiar los nombres acá:

- _Nombre y apellido_
- _Nombre y apellido_

## Tecnologías

Vue 3 (Options API, componentes `.vue`) · Vue CLI (`@vue/cli-service` 5) · Vue Router 4 · LocalStorage · Fetch · CSS propio (sin frameworks).

## Instalación y ejecución

Requiere Node.js 18 o superior.

```bash
npm install
npm run serve     # desarrollo en http://localhost:8080
npm run build     # compilación de producción en /dist
npm test          # pruebas de la lógica (necesita Node 22.7 o superior)
```

### Despliegue en Vercel

`vercel.json` reenvía todas las rutas a `index.html`, así que recargar `/peliculas/:id` funciona.
Framework preset: *Vue CLI* (o "Other") · Build command: `npm run build` · Output directory: `dist`.

## Funcionalidades

- **Rutas (Vue Router):** `/`, `/peliculas`, `/peliculas/:id`, `/peliculas/nueva`, `/peliculas/:id/editar`, `/nosotras` y una página 404.
- **Inicio:** hero, presentación, carrusel "Drama semanal" (alimentado por el catálogo), "Elegí tu veneno" (6 categorías), "Hall de íconos", newsletter.
- **Catálogo:** 16 películas de ejemplo, búsqueda por título (sin distinguir mayúsculas ni tildes), filtro por categoría editorial, orden por título y año, contador de resultados y estado sin coincidencias. Los filtros viven en la URL (`?q=&categoria=&orden=`).
- **Detalle:** póster completo, ficha, volver, editar y eliminar con modal de confirmación accesible. Estado claro si el id no existe.
- **Alta y edición:** un único componente `MovieForm` con validaciones propias y mensajes junto a cada campo. La edición trabaja sobre una copia: cancelar no modifica nada.
- **Persistencia:** el catálogo se guarda en LocalStorage. Las películas de ejemplo se cargan **solo si no existe un catálogo guardado**; un catálogo vacío es válido y no se repone.
- **Más cine para descubrir:** sección externa con Fetch a la Studio Ghibli API (`https://ghibliapi.vercel.app/films`, pública, sin clave), con estados de carga, error y reintento. No mezcla ni reemplaza los registros locales.
- **Newsletter:** valida el correo y lo guarda **solo en este dispositivo** (demostración). No se envía ningún correo.
- **Accesibilidad y responsive:** móvil primero, navegación inferior en móvil, superior desde 768 px, foco visible, enlace "Saltar al contenido", etiquetas de formulario, textos alternativos, modal con foco atrapado y cierre con Escape, respeto de `prefers-reduced-motion`.

## Categorías editoriales vs. género

Las **categorías** (Romcom, Musical, Llanto, Época, Distopía, Terror) son colecciones de FemCine. El **género** (por ejemplo "Comedia romántica") es un dato aparte de cada película.
El repositorio de recursos no incluye pósters para Musical ni Distopía, por eso esas colecciones arrancan vacías y muestran el estado "sin coincidencias". Se pueden poblar agregando películas (con una URL de póster).

## Estructura

```
src/
  main.js, App.vue
  router/index.js            rutas
  store/catalog.js           estado compartido del catálogo (reactive)
  services/                  storageService (LocalStorage), movieRepository, newsletterService, ghibliService (Fetch)
  data/                      assets.js (manifiesto de recursos), categories.js, seedMovies.js, navigation.js
  utils/                     validators.js, catalogQuery.js, movieForm.js, poster.js
  config/team.js             integrantes (configurable)
  components/                17 componentes reutilizables
  views/                     Home, Catalog, MovieDetail, MovieForm, About, NotFound
  assets/img/                recursos gráficos (copias con nombres simples)
  assets/styles/main.css     estilos globales
tests/logic.test.mjs         pruebas de lógica pura
```

## Recursos gráficos

Copias locales de los originales del repositorio `WEB-ROMCOM` (los originales no se modificaron). Todas las rutas están centralizadas en `src/data/assets.js`.

| Archivo local (`src/assets/img/`) | Original (`GRAFICOS/`) |
|---|---|
| `logo.png` | `LOGO.png` |
| `hero-banner.png` | `FONDOS/BANNER PRINCIPAL.png` |
| `bg-negro.png`, `bg-rosa.png`, `bg-foto.png` | `FONDOS/fondo negro.png`, `fondo rosa.png`, `FONDO FOTO.png` |
| `bg-transicion.png` | `FONDOS/fondo transición.png` |
| `newsletter-recorte.png` | `FONDOS/RECORTE ESQUINA NEWSLETTER.png` |
| `categorias/{romcom,musical,llanto,epoca,distopia,terror}.png` | `GÉNEROS/{ROMCOM,MUSICAL,LLANTO,ÉPOCA,DISTOPIA,TERROR}.png` |
| `personajes/elle-woods.png`, `elle-woods-title.png` | `PERSONAJES/Group 32.png`, `ELLE WOODS TITLE.png` |
| `personajes/{cher-horowitz,regina-george,veronica-sawyer}[-title].png` | `PERSONAJES/<NOMBRE>.png` y `<NOMBRE> TITLE.png` |
| `posters/diez-cosas.png` | `PORTADAS PELICULAS/10 COSAS QUE ODIO DE TI-2.png` |
| `posters/diez-things.png` | `10 THINGS I HATE ABOUT YOU.png` (misma película; solo se ofrece como póster alternativo en el formulario) |
| `posters/<slug>.png` | el resto de `PORTADAS PELICULAS/` (p. ej. `ugly-stepsister.png` = `DEN STYGGE STESOSTEREN.png`) |

La carpeta `PERSONALIDADES/` y las composiciones de `DISEÑO/` no se usan en la aplicación.

## Procedencia de datos

- **Catálogo local:** datos de ejemplo escritos para el proyecto en `src/data/seedMovies.js` (sinopsis propias; director, año y duración de referencia, conviene revisarlos).
- **API externa:** [Studio Ghibli API](https://ghibliapi.vercel.app) (`/films`). Se consulta en vivo; no se guarda.

## Capturas de pantalla

_Pendiente: agregar capturas de Inicio, Catálogo, Detalle, Formulario y vista móvil (390 px)._

## Documentación para la entrega

- `docs/GUION-VIDEO.md`: guion del video de demostración (5 a 10 minutos).
- `docs/DEFENSA.md`: explicación sencilla de flujo de datos, componentes, LocalStorage y Fetch.
