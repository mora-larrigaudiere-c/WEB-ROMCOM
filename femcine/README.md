# FemCine

Catálogo de películas y comunidad de cine con colecciones editoriales, reseñas, publicaciones y un oráculo interactivo en español.

## Integrantes

- Mora Larrigaudiere Curutchet.
- Oriana Fuentes Castro. En la web figura como Oriana Fuentes.

Ambas son Diseñadoras Multimediales. La documentación académica pertenece a Práctica Profesionalizante Desarrollo Web y Mobile, Tecnicatura Superior en Diseño Multimedial, ISEC. Esos datos no se muestran en la interfaz pública.

## Tecnologías y ejecución

Vue 3 con Options API, Vue CLI 5, Vue Router 4, CSS propio, LocalStorage, Fetch, Supabase y Web Audio API. Requiere Node.js 22 o superior.

```sh
npm ci
npm run serve
npm test
npm run build
```

La salida de producción es `dist/`. `npm run dev` inicia el servidor en el puerto 3000. No se necesita Vite ni React para ejecutar el proyecto.

## Funciones

- Catálogo compartido con 16 películas iniciales, búsqueda por texto, categorías y orden por título o año.
- Detalle de película y reseñas de la comunidad.
- Favoritos y calificaciones personales, separados por cuenta.
- Comunidad con publicaciones propias. Las reseñas y publicaciones nuevas o editadas vuelven a revisión.
- Perfil con edición de nombre y biografía, actividad propia y edición de aportes.
- Panel de creadoras para administrar el catálogo y moderar contenido.
- Oráculo en español: bola de cristal animada y efectos de sonido propios, con respuestas reales mediante Fetch a YesNoOracle.
- Diseño adaptable, navegación móvil, transiciones Vue y `transition-group`.
- Registro local de interés por novedades; no existe un servicio de envío de correos conectado.

## Modelo de acceso

| Información | Lectura | Escritura |
|---|---|---|
| Películas | Pública | Administradoras |
| Nombre público, avatar y biografía | Pública | Su titular |
| Correos | No disponibles mediante la API pública de perfiles | Supabase Auth y proceso de perfil |
| Favoritos y calificaciones personales | Su titular | Su titular |
| Reseñas y publicaciones aprobadas | Pública | Autor con nueva revisión; moderación por administradoras |
| Aportes pendientes o rechazados | Autor y administradoras | Autor y administradoras, según las políticas |
| Roles administrativos | Cuenta propia y administradoras | Asignación manual desde el servidor |

Las políticas RLS de PostgreSQL controlan los permisos incluso si alguien llama directamente a la API. Ocultar un botón no sustituye esas políticas. El rol no se obtiene modificando el perfil ni los metadatos de Google.

## Configuración de Supabase

1. Crear un proyecto Supabase. Para esta configuración se preparó el plan gratuito, Data API habilitada, exposición automática de tablas deshabilitada y RLS automático habilitado. No es necesario compartir la contraseña de la base con la aplicación.
2. Revisar y ejecutar `supabase/schema.sql` en el SQL Editor. Crea `profiles`, `admin_roles`, `movies`, `movie_preferences`, `reviews` y `posts`, las concesiones de acceso, las políticas y las 16 películas. El seed usa `ON CONFLICT DO NOTHING`, por lo que repetirlo conserva los cambios editoriales existentes.
3. Crear `.env.local` a partir de `.env.example` y completar:

```dotenv
VUE_APP_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VUE_APP_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

Usar la clave pública/anon del proyecto. Nunca colocar `service_role`, la contraseña de PostgreSQL ni secretos de OAuth en variables `VUE_APP_*`: esas variables se incluyen en el navegador.

4. Reiniciar el servidor o volver a compilar después de modificar variables.
5. En Google Cloud, configurar un cliente OAuth web. Su URI de retorno es el callback de Supabase: `https://TU_PROYECTO.supabase.co/auth/v1/callback`. Guardar el Client ID y el Client Secret en el proveedor Google de Supabase, no en el código.
6. En Supabase Authentication, configurar el Site URL de producción y las Redirect URLs exactas de desarrollo y producción. Por ejemplo, `http://localhost:3000/` para `npm run dev`. El inicio de sesión debe probarse en una pestaña independiente, además de la vista previa integrada.
7. Cada creadora inicia sesión con Google. Identificar su UUID en Authentication > Users y usar `supabase/bootstrap_admin.sql` para asignar el rol a la cuenta correcta. No asignar roles por un nombre escrito en un formulario.

Referencias: [Google OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls) y [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Modo local y caché

Sin variables de Supabase, la aplicación permite explorar una versión local. LocalStorage conserva datos del dispositivo y apoya la persistencia pedida por la consigna. Los datos públicos y las preferencias de cada cuenta deben permanecer separados; el modo local no otorga permisos administrativos en el servidor.

Las tablas y servicios antiguos `user_movies` y `movie_requests`, si aparecen en una versión previa, no describen el modelo actual. No ejecutar instrucciones antiguas de importación de catálogos personales para configurar esta versión.

## GitHub y Vercel

Publicar el código fuente sin `node_modules`, `dist`, contraseñas ni `.env.local`. En Vercel usar Vue CLI u Other, comando de build `npm run build` y carpeta de salida `dist`. Agregar las dos variables públicas de Supabase al entorno y desplegar de nuevo.

`vercel.json` reescribe las rutas hacia `index.html`. Verificar una recarga directa de `/peliculas/x`, `/comunidad` y `/perfil` en la URL final. Después, actualizar las URLs autorizadas de Supabase y probar Google, CRUD y moderación desde producción.

La existencia de la configuración no demuestra que el repositorio o el despliegue estén publicados. Sus URLs y la conexión real se registran solo después de verificarlos.

## Entrega

- `docs/ENTREGA.md`: comprobaciones y pendientes.
- `docs/DEFENSA.md`: explicación de arquitectura y flujo de datos.
- `docs/GUION-VIDEO.md`: demostración de aproximadamente ocho minutos.
- `verification/`: pruebas independientes, cuando se incluyan en el paquete.

Las capturas para el README y el video final deben mostrar esta versión real. No se incluyen imágenes simuladas ni se declara grabado un video que todavía no existe.
