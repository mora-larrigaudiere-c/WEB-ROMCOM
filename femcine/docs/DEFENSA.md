# Guía de defensa de FemCine

Integrantes: Mora Larrigaudiere Curutchet y Oriana Fuentes Castro. Práctica Profesionalizante Desarrollo Web y Mobile, ISEC.

## Arquitectura

La aplicación usa Vue 3 con Options API y Vue CLI. `main.js` crea la aplicación, `App.vue` compone la estructura y Vue Router elige la vista. Las pantallas principales son Inicio, Catálogo, Detalle, Alta/Edición, Nosotras, Comunidad, Perfil y Administración. HTML5 History necesita la reescritura de Vercel para que una recarga de una ruta interna no produzca un error 404.

Las vistas coordinan acciones y los componentes presentan partes reutilizables: cabecera, navegación inferior, tarjeta de película, formulario, estrellas, mensajes y modal. Las props transportan datos del padre al hijo; los emits notifican acciones al padre. Los valores computed calculan resultados derivados, como filtros, contadores o permisos visibles, sin mantener copias innecesarias.

`created()` inicializa datos y suscripciones. `mounted()` permite operar sobre elementos ya montados. Las transiciones de pantalla usan `transition`; la grilla reactiva del catálogo usa `transition-group` con claves estables.

## Datos y permisos

`movies` es el catálogo público compartido. `movie_preferences` guarda favoritos y notas de cada cuenta. `reviews` contiene opiniones sobre películas y `posts` publicaciones generales. Ambos tipos de aportes pasan a revisión al crearse o editarse. `profiles` guarda los datos públicos del perfil y `admin_roles` permite verificar a las administradoras.

El flujo de una acción es: formulario o botón → método de la vista → store o servicio → Supabase/LocalStorage → actualización reactiva de la interfaz. En un guardado remoto la navegación debe esperar a la respuesta; si falla, se conserva el formulario y se informa el error.

Los permisos se verifican en PostgreSQL mediante RLS y concesiones de columnas. Un visitante puede leer películas y aportes aprobados. Una persona autenticada administra sus preferencias y sus aportes. Las creadoras administran películas y moderan contenido. El código del navegador nunca contiene la clave de servicio ni decide por sí solo que una cuenta es administradora.

El correo de Google no forma parte de las columnas legibles del perfil público. La identidad que usa `auth.uid()` deriva de la sesión validada, no de un ID que el visitante escriba libremente.

## Persistencia y concurrencia

LocalStorage conserva información entre recargas y cierres normales del navegador. Es almacenamiento del dispositivo, no una base compartida. Supabase agrega persistencia entre dispositivos y separación de cuentas. La caché pública debe excluir preferencias y borradores privados.

Al salir o cambiar de cuenta se limpian los datos privados en memoria. Los contadores de generación permiten descartar respuestas de red que pertenecen a una sesión anterior. Las operaciones de preferencias se serializan por película y deben conservar la identidad de la cuenta que inició cada acción.

## Formularios y API

`v-model` vincula los campos con su estado. Las validaciones comprueban obligatorios, longitudes y formatos; los mensajes aparecen junto al campo. El formulario de películas sirve para alta y edición. Una edición debe partir de una copia, de modo que cancelar no modifique el registro.

El oráculo usa Fetch a `https://yesnooracle.app/api/oracle?tool=crystal-ball`, comprueba el estado HTTP y el formato de respuesta y maneja errores y timeout. La bola, los textos en español y los sonidos son una adaptación de FemCine; la API aporta el veredicto. No se debe mostrar una respuesta inventada como si fuera una consulta exitosa.

## Qué demostrar

Explicar una prop, un emit y dos computed concretos del código. Recorrer un alta válida y una inválida, editar y cancelar, mostrar la persistencia, consultar el oráculo y comparar móvil/escritorio. Con Supabase configurado, demostrar una cuenta normal, una administradora y un aporte pendiente antes y después de su aprobación.

Las pruebas locales con servicios simulados no sustituyen probar Google OAuth y las políticas en el proyecto de producción. Cada integrante debe poder explicar el flujo completo y las partes del código que presente.
