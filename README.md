# FemCine

FemCine es nuestro proyecto para el parcial de **Práctica Profesionalizante Desarrollo Web y Mobile**. Elegimos hacer un catálogo de películas con una comunidad para compartir reseñas y recomendaciones.

La idea es que se pueda buscar una película según la categoría, guardar favoritas y conversar sobre cine. Para el diseño usamos una estética en negro y fucsia, con referencias a las romcoms y a la cultura pop.

## Integrantes

- **Mora Larrigaudiere Curutchet**
- **Oriana Fuentes Castro**

**Carrera:** Tecnicatura Superior en Diseño Multimedial — ISEC.  
**Docente:** Facundo Romero.

Las dos participamos en la selección de películas, el diseño visual, la experiencia de usuario y el desarrollo de la página.

## Enlaces

- [Página publicada en Vercel](https://femcine.vercel.app/)
- [Repositorio de GitHub](https://github.com/mora-larrigaudiere-c/WEB-ROMCOM)
- [Carpeta con el código de FemCine](femcine/)
- **Project URL de Supabase:** https://umlryyxwjswdcwykughr.supabase.co

La URL de Supabase se usa para conectar la base de datos. Para ver y usar la página hay que entrar al enlace de Vercel.

## ¿Qué se puede hacer?

- Ver un catálogo de **16 películas** y entrar a la ficha de cada una.
- Buscar por título, filtrar por categoría y ordenar por título o año.
- Iniciar sesión con Google, editar el perfil, guardar favoritas y calificar películas.
- Escribir reseñas y hacer publicaciones en el **Club del Drama**.
- Consultar el oráculo, que muestra una respuesta en español con una bola animada y sonido.
- Usar la página desde un celular, una tablet o una computadora.

También tenemos un **panel de creadoras**. Desde ahí podemos agregar, editar y eliminar películas, y aprobar o rechazar reseñas y publicaciones. Las dos integrantes tenemos los mismos permisos. Las usuarias que no son administradoras pueden enviar sus aportes, pero estos quedan en revisión antes de mostrarse en la comunidad.

El formulario de novedades es una simulación: valida el correo y lo guarda en LocalStorage, pero no envía emails.

## Tecnologías que usamos

- **Vue 3 con Vue CLI** para armar la aplicación.
- **Vue Router** para navegar entre las pantallas sin recargar toda la página.
- **JavaScript y CSS** para las funciones y el diseño.
- **LocalStorage** para guardar datos en el dispositivo.
- **Supabase** para la base de datos y el inicio de sesión con Google.
- **Fetch y la API de YesNoOracle** para obtener las respuestas del oráculo.
- **Web Audio API** para el sonido del oráculo.

Para seguir la consigna usamos componentes reutilizables, `props` y `emits`, propiedades `computed`, los hooks `created()` y `mounted()`, formularios con `v-model`, una transición Vue y un `transition-group`.

## Cómo ejecutar el proyecto

Se necesita **Node.js 22 o superior**, npm y Git.

```sh
git clone https://github.com/mora-larrigaudiere-c/WEB-ROMCOM.git
cd WEB-ROMCOM/femcine
npm ci
npm run dev
```

Después, abrir **http://localhost:3000/** en el navegador.

Para usar Google y Supabase en una copia local, hay que crear un archivo `.env.local` dentro de la carpeta `femcine` con estos datos:

```dotenv
VUE_APP_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VUE_APP_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICABLE
```

Sin esas variables, la aplicación permite explorar el modo local. En la página publicada, Google y la base de datos ya están conectados. El ID y el secret de Google se configuran en Supabase; el secret no va dentro del código.

También se pueden ejecutar estos comandos desde la carpeta `femcine`:

```sh
npm test        # Ejecuta las pruebas del proyecto
npm run build  # Genera la versión de producción en dist/
```

## Cómo organizamos los archivos

- `src/components`: partes que se reutilizan, como el navbar, las tarjetas, los formularios y el footer.
- `src/views`: las pantallas de inicio, catálogo, detalle, alta/edición, comunidad, perfil, nosotras y administración.
- `src/router`: las rutas de la página.
- `src/services` y `src/store`: las funciones para trabajar con los datos y compartirlos entre las pantallas.
- `src/assets`: imágenes y estilos.
- `supabase`: el [SQL de las tablas y las películas iniciales](femcine/supabase/schema.sql).

## Capturas de pantalla

Estas capturas son de la página publicada, tomadas el **11 de noviembre de 2026**. En algunas se ve una cuenta de creadora, por eso aparecen las opciones de administración.

### Inicio

![Inicio de FemCine en computadora](femcine/docs/capturas/inicio-escritorio.png)

### Catálogo de películas

![Catálogo de FemCine con sus filtros y películas](femcine/docs/capturas/catalogo-escritorio.png)

### Club del Drama

![Publicación aprobada en la comunidad de FemCine](femcine/docs/capturas/comunidad-escritorio.png)

### Versión para celular

<img src="femcine/docs/capturas/inicio-movil.png" alt="Inicio de FemCine con la navegación para celular" width="320">

## Pruebas que hicimos

Probamos agregar una película, editar sus datos y eliminarla. También revisamos los mensajes que aparecen al dejar campos vacíos o escribir datos incorrectos. La película de prueba se eliminó y el catálogo quedó con las 16 películas originales.

Comprobamos que los favoritos y las calificaciones se mantengan al recargar y al cerrar y volver a abrir una pestaña. Además, ingresamos con una cuenta sin permisos de administración, escribimos una reseña y una publicación, y verificamos que se vieran después de aprobarlas.

Por último, revisamos la página en tamaños de celular, tablet y escritorio.
