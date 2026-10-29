# Guía para la defensa oral

## Flujo de datos (en una frase)
`LocalStorage → movieRepository → store/catalog (reactive) → vistas → componentes (props abajo, eventos arriba) → store → repository → LocalStorage`.

1. `App.vue` ejecuta `initCatalog()` en `created()`: el repositorio lee LocalStorage (o siembra los ejemplos si no hay nada guardado) y deja las películas en `state.movies`.
2. Las vistas leen `state.movies` con propiedades computadas (`filteredMovies`, `dramaMovies`, `categoryCards`).
3. Los componentes hijos reciben datos por **props** y avisan con **eventos** (`$emit`): por ejemplo `MovieForm` emite `submit` con los datos y la vista decide si hace `addMovie` o `updateMovie`.
4. Cada función del store (`addMovie`, `updateMovie`, `removeMovie`) cambia `state.movies` y llama a `persist()`, que guarda en LocalStorage. Si falla, `state.error` muestra un aviso en `App.vue`.

## Componentes (17) y por qué son reutilizables
- Estructura: `AppHeader`, `BottomNav`, `SiteFooter`, `SearchBar`.
- Catálogo: `MovieCard`, `CatalogToolbar`, `PosterImage`, `CategoryCard`.
- Formularios: `MovieForm` (alta **y** edición), `FormField`, `NewsletterForm`.
- Retroalimentación: `ConfirmModal`, `StatusMessage`.
- Home: `DramaCarousel`, `IconHall`, `DisplayTitle`.
- Externo: `DiscoverSection`, `ExternalFilmCard`.

## Vue Router
Seis rutas más la 404. `/peliculas/nueva` se declara antes que `/peliculas/:id`. Los filtros del catálogo van en la query (`?q=&categoria=&orden=`). `vercel.json` y `historyApiFallback` permiten recargar rutas.

## Formularios y validaciones
`v-model` en cada campo. `utils/validators.js` es una función pura que devuelve `{ campo: mensaje }`: obligatorios, longitudes mínimas, año entero en rango, duración positiva, categoría admitida y URL válida. Se valida al salir de cada campo (`blur`) y al enviar; el primer campo con error recibe el foco.

## LocalStorage
Solo `storageService.js` toca `localStorage`. `movieRepository.js` decide qué guardar. Clave: `femcine:movies:v1`. Los ejemplos se cargan únicamente si la clave **no existe**; un `[]` guardado es un catálogo vacío válido. Errores de lectura/escritura devuelven mensajes para el usuario.

## Fetch
`ghibliService.fetchGhibliFilms` usa `fetch` con timeout y `AbortController`, valida `response.ok` y que el JSON sea un arreglo, y lanza `ApiError` con mensajes comprensibles. `DiscoverSection` lo llama en `mounted()`, muestra carga/éxito/error, ofrece **Reintentar** y cancela la petición en `beforeUnmount()`. Nunca se mezcla con los datos locales.

## Hooks, computed y animaciones
- `created()`: `App` inicializa el catálogo; `AppHeader` toma `?q=` de la URL; `CatalogView` normaliza filtros inválidos.
- `mounted()`: `DiscoverSection` dispara el Fetch.
- Computed: `filteredMovies`, `resultsText`, `dramaMovies`, `categoryCards`, `previewSrc`, `errorCount`.
- `<transition>`: cambio de página (`App.vue`), diapositivas del carrusel, modal. `<transition-group>`: grilla del catálogo, con `:key="movie.id"`.

## Preguntas probables
- *¿Por qué no Vuex/Pinia?* Un único estado pequeño; un `reactive` compartido alcanza y es más simple de explicar.
- *¿Por qué categoría ≠ género?* La categoría es una colección editorial del sitio; el género es un dato cinematográfico de cada película.
- *¿Qué pasa si LocalStorage está bloqueado?* La app sigue funcionando en memoria y avisa que los cambios no se guardarán.
