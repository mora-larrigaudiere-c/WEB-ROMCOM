# Estado de entrega de FemCine

Integrantes: Mora Larrigaudiere Curutchet y Oriana Fuentes Castro. La web acredita a Mora Larrigaudiere Curutchet y Oriana Fuentes como Diseñadoras Multimediales.

## Implementación preparada

Vue 3 con Options API, Vue CLI, Vue Router, componentes reutilizables, props/emits, computed, hooks, formularios con validaciones, LocalStorage, Fetch, transición Vue, transition-group y diseño adaptable. El catálogo inicial contiene 16 películas.

El nuevo alcance incluye catálogo público compartido, perfiles, favoritos y calificaciones privados, reseñas y publicaciones moderadas, edición de aportes y panel de administración. Los scripts SQL y la aplicación requieren configuración y comprobación real en Supabase antes de declarar estas funciones operativas en producción.

## Verificación

Consultar los resultados incluidos en `verification/results.json` y los registros de pruebas del paquete. Las verificaciones independientes incluyen ejecución del SQL en PostgreSQL local mediante PGlite, con un contrato simulado de Supabase Auth, y casos de frontend con respuestas diferidas. No equivalen a iniciar sesión mediante Google ni a probar el proyecto Supabase en vivo.

La compilación de producción comprueba que la aplicación se puede construir. No demuestra que esté desplegada en Vercel. Los guiones de demostración y defensa no sustituyen el video ni la exposición de las integrantes.

## Pendientes externos para cerrar la entrega

1. Completar las variables públicas de la aplicación. El proyecto Supabase `umlryyxwjswdcwykughr` ya fue creado: SQL ejecutado correctamente, 16 películas y seis tablas con RLS activo verificados en el panel.
2. Configurar Google OAuth y probar inicio/cierre de sesión en una pestaña independiente.
3. Asignar los roles administrativos por los UUID reales de ambas creadoras y probar permisos con cuentas distintas.
4. Publicar el código en GitHub y desplegarlo en Vercel. Registrar y probar las URLs finales.
5. Incorporar capturas reales de la versión final al README.
6. Grabar el video de cinco a diez minutos y preparar la defensa oral de ambas integrantes.
7. Reunir los wireframes y la evidencia del trabajo en Stitch que corresponda al proceso real; no se verificó ese material en los archivos suministrados.
8. Entregar el ZIP y los enlaces que solicite el campus, incluidos despliegue y Supabase según las fotos de clase.

No se declara completada toda la consigna mientras estos puntos sigan pendientes.
