# Guion del video de demostración (5 a 10 minutos)

Grabá en el navegador con la consola cerrada. Mostrá primero escritorio y después la vista móvil (herramientas de desarrollo, 390 px).

| Min | Qué mostrar | Qué decir |
|---|---|---|
| 0:00 | Inicio completo, scroll de arriba a abajo | Qué es FemCine y qué secciones tiene |
| 0:45 | Carrusel "Drama semanal" y Hall de íconos | Que el carrusel sale del catálogo guardado |
| 1:15 | Categorías → clic en una | Que el filtro viaja en la URL |
| 1:45 | Catálogo: buscar, filtrar, ordenar, combinar; búsqueda sin resultados | Contador y estado sin coincidencias |
| 3:00 | Detalle de una película; recargar la página (F5) | Que la ruta funciona al recargar |
| 3:30 | **Alta**: enviar vacío (errores), completar mal (año, duración, URL), completar bien | Validaciones propias y mensajes junto al campo |
| 5:00 | **Edición** y **cancelación** (no cambia el registro) | Formulario reutilizado, trabaja sobre una copia |
| 5:45 | **Eliminar** con modal (Escape, Tab, confirmar) | Foco atrapado y devuelto |
| 6:30 | **Persistencia**: recargar y cerrar/abrir el navegador | LocalStorage; catálogo vacío no se repone |
| 7:15 | "Más cine para descubrir": carga, resultados; simular error (desconectar red) y **Reintentar** | Fetch real, estados de carga/error |
| 8:15 | Newsletter con correo inválido y válido | El mensaje aclara que se guarda solo en el dispositivo |
| 8:45 | Responsive: 390 px (barra inferior), tablet, escritorio; Nosotras y 404 | Diseño móvil primero |
| 9:30 | Cierre | Tecnologías: Vue 3, Vue CLI, Vue Router |

Para restablecer el catálogo de ejemplo antes de grabar: DevTools → Application → Local Storage → borrar `femcine:movies:v1` y recargar.
