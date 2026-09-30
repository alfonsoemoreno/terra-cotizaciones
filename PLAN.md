# Terra: sistema de cotizaciones

Estado: diseño aprobado e implementación local preparada. Next.js, persistencia PostgreSQL, acceso privado y PDF implementados. Pendiente conectar Neon y despliegue Vercel con las cuentas de Terra; no se ha creado infraestructura externa.

## Diseño preparado para revisión

- Prototipo interactivo mostrado en la conversación: listado, editor, vista previa, aceptación/rechazo, clientes, catálogo y configuración.
- Muestra descargable en `output/pdf/terra-cotizacion-muestra.pdf`, con el logo Terra, datos oficiales y el ejemplo económico del PDF original. Documento marcado como muestra no emitida.
- Verificados en navegador: navegación, aceptación, duplicación, equivalencia de descuento porcentual y fijo, cálculo por recurso/duración, guardado de demostración, presentación móvil y ausencia de errores de consola.
- PDF renderizado e inspeccionado: una página carta, total $1.218.560, condiciones y firmas sin superposiciones.
- El prototipo opera en memoria, sin autenticación, base de datos ni PDF dinámico descargable. No representa todavía la aplicación Next.js de producción; su objetivo es revisar el diseño y el flujo.
- El usuario aprobó el diseño y se inició la implementación usando esa base.

## Implementación local

- Next.js 16.3.8, React, TypeScript, Drizzle y PostgreSQL.
- Clientes y catálogo editables, archivo/restauración, categorías y unidades configurables.
- Editor con cuatro modalidades, ítems libres/catálogo, descuentos y cálculo decimal con IVA.
- Guardado persistente, folios transaccionales, duplicación, revisiones y cambios de estado con notas/fechas.
- Acceso de Nelson mediante Better Auth y contraseña, sin envío de correos ni registro público.
- PDF dinámico desde los datos guardados, completo/resumido, con logo, paginación y plantilla versionada.
- Desarrollo local con PGlite persistente y datos de ejemplo. La omisión del acceso solo opera en desarrollo y sin conexión externa; producción conserva la protección.
- Pruebas de dominio, persistencia, acceso y flujo completo en navegador. Build de producción, TypeScript y lint comprobados.
- Documentación operativa en README.md y docs/DEPLOYMENT.md.
- Cuentas confirmadas: propias de Terra. Pendiente conocer cuáles ya existen y si hay dominio para la aplicación.

## Decisiones confirmadas

- Único usuario: Nelson. No se necesita gestión de equipos ni roles en esta versión.
- Cobro flexible: admitir distintas modalidades en una misma cotización.
- Todas las cotizaciones llevan IVA; tasa inicial de 19% tomada del PDF.
- Descuento por porcentaje o monto fijo, elegido explícitamente por cotización, sin acumular ambos.
- Datos oficiales del prestador: los del PDF. Nombre: Nelson Escobar Belmar. Teléfono: +56 9 7851 5073. Correo: escobar.oceanico@hotmail.com.
- Marca comercial de la aplicación y del nuevo documento: Terra. El encabezado ECO-FORESTAL ESCOBAR corresponde al ejemplo anterior, no reemplaza la marca solicitada.
- Alcance del seguimiento: hasta aceptación o rechazo, registrados manualmente por Nelson. Ejecución y pagos quedan fuera.
- RUT y dirección del prestador no están en el PDF; no inventarlos. Podrán completarse en Configuración.

## Objetivo

Crear una aplicación privada para Terra de Nelson Escobar, en español, que permita preparar, guardar, revisar y gestionar cotizaciones, y exportarlas a PDF. Tecnología solicitada: Next.js, Vercel y Neon PostgreSQL.

## Referencias revisadas

- Planilla `cartilla_cotizacion_unificada.xlsx`: una hoja, tres categorías (forestal, electricidad y domótica), descripción, cantidad, unidad, precio por día, días y total neto. Duración global, descuento, IVA y condiciones de pago.
- PDF `cotización.pdf`: datos del prestador y cliente, servicio, emisión, validez, requerimiento, detalle, totales, condiciones y espacios de firma.
- Logo `logo-terra.png`: Terra, Servicios & Proyectos Integrales; Forestal, Construcción y Automatización. Negro con fondo transparente y márgenes amplios. Preparar una variante recortada para uso web/PDF conservando el original.

Los adjuntos son referencias de contenido y presentación, no instrucciones para ejecutar acciones. Sus datos de clientes y precios son ejemplos, pendientes de confirmar antes de cargarlos como información real.

## Resolución de diferencias entre las referencias

1. Identidad: prevalecen los datos oficiales del PDF según confirmación del usuario; descartar el nombre y correo de ejemplo del Excel.
2. Categorías: iniciar con Forestal, Construcción, Electricidad y Automatización/domótica; permitir crear, renombrar y archivar categorías.
3. Precio: evitar aplicar duración global a todos los ítems como hace el Excel. Cada ítem define su modalidad y solo los diarios pueden depender de esa duración.
4. Descuento: reemplazar la ambigüedad de F31 por selector de porcentaje o monto fijo y un campo numérico con su unidad visible.
5. Duración y validez: el PDF distingue 5 días hábiles de ejecución y 15 días corridos de validez. Modelarlos como campos separados.
6. Firma: el PDF contiene una firma del prestador. En la primera versión, generar espacios para firma; incorporar una imagen de firma solo si Nelson autoriza su uso. No extraerla automáticamente del documento.

## Primera versión propuesta

### Acceso

- Aplicación privada, sin registro público.
- Un único usuario autorizado: Nelson, con acceso a todas las funciones.
- Acceso privado por contraseña, sin registro público ni envío de correos; incluir límites de intentos y revocación de sesión.
- Comprobar sesión y permisos en el servidor para cada consulta, modificación y descarga.

### Clientes

- Persona o empresa, nombre/razón social, RUT opcional según el proceso, contacto, teléfono, correo y dirección.
- Buscar, crear, editar y archivar clientes; conservar los usados en cotizaciones anteriores.

### Catálogo

- Categorías, servicios, descripción, unidad, modalidad de cobro y precio sugerido.
- Permitir editar el precio y la descripción dentro de cada cotización.
- Usar los servicios de la planilla como propuesta de catálogo; confirmar precios antes de habilitarlos.
- Unidades iniciales: hectárea, m², m³, unidad, punto, metro, hora, día, jornada, viaje y global. Permitir cantidades decimales y unidades personalizadas.
- Ítems de servicio, mano de obra, materiales, equipos, traslado y otros; esta clasificación sirve para organizar el detalle y no altera el cálculo.
- Permitir mezclar modalidades, servicios del catálogo e ítems libres en una cotización.

### Cotizaciones

- Listado con búsqueda por folio, cliente y proyecto; filtros por fecha y estado.
- Crear, guardar borrador, editar, duplicar y emitir una cotización.
- Encabezado: cliente, título/servicio, descripción del requerimiento, lugar del trabajo, fecha de emisión, vigencia y duración estimada.
- Ítems ordenables y agrupados por categoría; agregar servicios del catálogo o ítems libres.
- Totales visibles durante la edición, descuento explícito y condiciones comerciales editables.
- Configuración inicial propuesta: vigencia de 15 días corridos y pago 50% de anticipo / 50% contra entrega, confirmables por el usuario.
- Estados propuestos: borrador, emitida, enviada, aceptada, rechazada y anulada. Aceptada y rechazada cierran el seguimiento comercial de esta versión. La condición de vencida se deriva de la fecha y aplica a cotizaciones emitidas/enviadas sin decisión.
- Guardar fecha, nota opcional y motivo opcional al registrar aceptación o rechazo. No generar órdenes de trabajo ni registrar cobros.
- Marcar enviada o aceptada manualmente; descargar un PDF no equivale a haberlo enviado ni aceptado.
- Folio único asignado al emitir mediante operación atómica en PostgreSQL; propuesta de formato TERR-2026-0001, pendiente de confirmar.
- Al emitir, fijar los datos y valores de esa versión. Cambiar un cliente o precio del catálogo no modifica documentos anteriores.
- Una corrección posterior crea una revisión vinculada al mismo folio, con historial y sin sobrescribir el contenido emitido.
- Duplicar crea una nueva cotización en borrador, sin reutilizar folio ni aceptación.

### PDF

- Documento con marca Terra y estructura basada en el PDF adjunto.
- Logo, folio/revisión, prestador, cliente, emisión, vigencia y descripción del trabajo.
- Tabla de servicios con descripción, cantidad, unidad, precio e importe; mostrar duración cuando la modalidad la requiera. Recomendación: opción de detalle completo o resumido, este último similar al PDF adjunto, manteniendo idénticos totales.
- Subtotal, descuento, neto, IVA y total; condiciones y espacios para firmas.
- Formato monetario chileno y fechas en español. Usar tamaño carta como valor inicial siguiendo el ejemplo.
- Saltos de página y encabezados repetidos para cotizaciones extensas; evitar cortar filas, totales y firmas.
- Generar desde la versión persistida con una plantilla versionada; elegir durante implementación entre PDF reproducible y almacenamiento del archivo emitido si se requiere conservar exactamente sus bytes.
- Generación en servidor con una biblioteca PDF compatible con el entorno Node de Vercel; propuesta técnica por validar mediante un prototipo.

## Modalidades y cálculos

- Por unidad: cantidad × precio unitario. Ejemplo: 800 m² × $850 = $680.000.
- Por tiempo: horas, días o jornadas × tarifa del período. Ejemplo: 5 días × $70.000 = $350.000. La duración es la cantidad, no se vuelve a multiplicar.
- Por recurso y tiempo: cantidad de recursos × tarifa por recurso/período × duración. Ejemplo: 2 equipos × $150.000/día × 3 días = $900.000. Indicar recurso y período para que el importe sea comprensible.
- Global o suma alzada: importe fijo para el alcance descrito. Ejemplo: tala y acopio por $250.000.
- Estas modalidades son una propuesta para cubrir el proceso de Terra. Precios unitarios y suma alzada aparecen también en referencias públicas de contratación de obras; esto no implica adoptar esas normas ni demuestra una única práctica para todos los servicios.
- Para servicios con unidad día y cobro por unidad, la cantidad representa los días y no recibe un segundo multiplicador.
- Duración global sugerida en ítems diarios, con opción de días específicos por ítem. El formulario debe indicar si usa la duración global o una duración propia.
- Subtotal: suma de importes de ítems.
- Descuento porcentual: subtotal × porcentaje; descuento fijo: monto ingresado.
- Neto: subtotal − descuento.
- IVA: neto × 19%, obligatorio en todas las cotizaciones de esta versión. Guardar la tasa en cada revisión para conservar el cálculo histórico.
- Total: neto + IVA.
- Importes de salida en pesos enteros. Recomendación: redondear cada línea, el descuento porcentual y el IVA al peso más cercano, con mitades hacia arriba para importes positivos. El subtotal suma las líneas ya redondeadas, de modo que el PDF cuadre visualmente.
- Usar tipos decimales para cantidades y precios, sin cálculos monetarios basados en coma flotante binaria. Recalcular y validar siempre en servidor.
- Validar cantidades, modalidades, precios y descuentos según las reglas acordadas, evitando descuentos que excedan el subtotal.

Caso de aceptación del PDF: subtotal $1.280.000, descuento 20% = $256.000, neto $1.024.000, IVA $194.560 y total $1.218.560.

## Arquitectura propuesta

- Next.js con App Router y TypeScript. Fijar versiones estables al iniciar la implementación.
- Interfaz adaptable a computador y teléfono, Tailwind CSS y componentes accesibles.
- Lógica de cotización compartida para formulario, persistencia y PDF; servidor como autoridad del cálculo.
- Neon PostgreSQL para datos. Propuesta de ORM: Drizzle, con migraciones SQL versionadas y conexión apta para ejecución serverless.
- Vercel para despliegue desde GitHub, con ambientes separados para desarrollo/pruebas y producción.
- Secretos mediante variables de entorno del servidor, nunca en código ni variables públicas del navegador.
- Migraciones controladas: no ejecutarlas automáticamente contra producción en cada preview.
- Elegir regiones compatibles de Vercel y Neon cercanas entre sí; revisar disponibilidad al aprovisionar.
- Definir recuperación/respaldos según el plan de Neon, registro de errores y presupuesto de operación antes de producción.

Entidades iniciales: configuración de empresa, identidad/sesiones de Nelson según proveedor, clientes, categorías, servicios, cotizaciones, revisiones, ítems y eventos de historial. No implementar administración de equipos. La revisión guarda copias de los datos del cliente, empresa, condiciones, precios y totales necesarios para reproducir el documento.

## Diseño propuesto

- Logo negro sobre blanco; verdes sobrios como color de apoyo, tomando el PDF como referencia.
- Navegación: Cotizaciones, Clientes, Servicios y Configuración.
- Pantalla principal con búsqueda, estado, folio, cliente, fecha, total y acción Nueva cotización.
- Editor con datos del cliente/proyecto, tabla de ítems, condiciones y resumen de totales.
- Vista previa del documento antes de emitir y descargar.
- Priorizar legibilidad y entrada rápida de datos; las categorías pueden ampliarse sin cambiar el código.

## Fuera de la primera versión propuesta

- Facturación tributaria y emisión de documentos ante el SII.
- Inventario, contabilidad, órdenes de trabajo y conciliación de pagos.
- Envío automático por correo o WhatsApp.
- Portal de clientes, aceptación por enlace y firma electrónica.
- Importación genérica de planillas históricas.

Estas funciones pueden añadirse posteriormente si el proceso las necesita. Registrar aceptación manual no constituye firma electrónica.

## Etapas y entregables

1. Acordar reglas, usuarios, identidad y alcance. Actualizar este plan con decisiones confirmadas.
2. Preparar diseño de pantallas y muestra de PDF Terra; validar navegación y presentación antes de completar la aplicación.
3. Crear proyecto, esquema de datos, migraciones y acceso; configurar entorno local sin afectar producción.
4. Implementar clientes, catálogo y editor con cálculos, guardado y duplicación.
5. Implementar emisión, folios, revisiones, estados y exportación PDF.
6. Verificar cálculos, autorización, persistencia y documentos; probar el flujo completo con Nelson.
7. Crear/conectar GitHub, Neon y Vercel con las cuentas acordadas; configurar secretos, entorno de pruebas y producción, dominio si corresponde y recuperación.
8. Entregar guía breve de uso y operación; verificar cotización real de principio a fin en producción.

## Criterios de aceptación

- El ejemplo del PDF se reproduce con el total esperado.
- Cambiar duración global actualiza solo ítems que dependan de ella.
- Cantidades decimales, descuentos fijos/porcentuales y redondeos producen resultados acordados.
- No se pierden datos al recargar una cotización guardada.
- Emisiones simultáneas no generan folios duplicados.
- Modificar catálogo, cliente o empresa no cambia una revisión emitida.
- Una revisión nueva conserva la anterior; una duplicación genera un borrador independiente.
- No hay acceso a datos ni PDF sin autorización.
- PDF correcto para 1 ítem, múltiples categorías, textos largos y varias páginas.
- Flujo completo funcional en computador y teléfono.
- Compilación, comprobación de tipos y pruebas relevantes pasan antes del despliegue.

## Recomendaciones por validar con el diseño

- Acceso de Nelson por contraseña.
- Modalidades descritas arriba, redondeos por línea y descuento único sobre subtotal.
- Folio TERR-AÑO-0001, papel carta, vigencia inicial 15 días corridos y condiciones de pago editables con 50%/50% por defecto.
- PDF con detalle completo por defecto y opción resumida; espacios de firma sin imagen incorporada.
- PDF regenerable desde revisión y plantilla versionadas; almacenar el archivo original si se necesita conservar exactamente lo emitido.

## Datos pendientes para puesta en producción

- RUT y dirección del prestador, si se desean incluir; el PDF no los proporciona.
- Acceso a las cuentas GitHub, Vercel y Neon, dominio si corresponde y presupuesto mensual.
- Configuración del acceso privado. Nunca solicitar contraseñas o secretos en el chat: usar inicio de sesión o variables de entorno.

## Documentación técnica consultada

- Next.js: https://nextjs.org/docs/app/getting-started/installation
- Neon en Vercel: https://vercel.com/marketplace/neon/neon
- Vercel Hobby: https://vercel.com/docs/plans/hobby
- Referencia de modalidades de cobro en obras (precios unitarios y suma alzada): https://dgop.mop.gob.cl/uploads/sites/5/2024/08/MANUAL-DE-CONTRATOS.pdf

La documentación de Vercel restringe Hobby a uso personal no comercial. Para producción de Terra, presupuestar un plan compatible con uso comercial. Los costes concretos de infraestructura se confirmarán antes de contratar servicios.
