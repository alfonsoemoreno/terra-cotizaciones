# Revisión del diseño Terra

El prototipo interactivo en la conversación representa el flujo propuesto de la aplicación. Los datos son ejemplos y los cambios se mantienen solo durante la demostración, salvo preferencias de navegación del visor. No hay conexión a servicios externos.

## Recorrido sugerido

1. Abrir la cotización de ejemplo y revisar el documento.
2. Duplicarla para probar cantidades, modalidades y descuentos sin editar el original.
3. Agregar un ítem por recurso y tiempo; activar la duración del proyecto.
4. Revisar la vista previa, emitir en la demostración y registrar aceptación o rechazo.
5. Recorrer Clientes, Servicios y Configuración.

La muestra PDF corresponde al ejemplo original: subtotal $1.280.000, descuento 20%, IVA 19% y total $1.218.560. Usa logo Terra, datos oficiales de Nelson, precio unitario visible, papel carta y espacios para firmas. No incluye imagen de firma.

## Para la implementación

- Sustituir datos en memoria por Neon PostgreSQL y acceso privado de Nelson.
- Calcular importes con decimales en servidor, validar todos los campos y proteger cada operación.
- Guardar copias inmutables por revisión emitida y controlar folios mediante transacciones.
- Generar PDF dinámico desde los datos persistidos, con tablas que soporten varias páginas.
- Completar edición/archivo de clientes y catálogo, categorías/unidades configurables, revisión de documentos emitidos e historial de cambios de estado.
- Añadir expiración calculada, fecha de aceptación/rechazo y notas opcionales.

La maqueta de navegación y los cálculos visibles sirven para evaluar el diseño; no constituyen implementación de estas garantías de producción.
