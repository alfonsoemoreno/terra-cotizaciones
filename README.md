# Terra · Cotizaciones

Aplicación privada para Nelson Escobar Belmar. Next.js 16, React, TypeScript, PostgreSQL en Neon, Drizzle, Better Auth y PDF generado en servidor.

La aplicación está implementada y probada localmente. El despliegue en Vercel, la conexión real a Neon requieren las cuentas de Terra; todavía no están aprovisionados.

## Funciones

- Clientes y servicios: crear, editar, archivar y restaurar.
- Categorías y unidades configurables, ítems libres o desde catálogo.
- Cobro por unidad, tiempo, recurso/tiempo y monto global; precios y cantidades decimales.
- Descuento porcentual o monto fijo, IVA del 19% y redondeo al peso por línea.
- Guardar borradores, duplicar, emitir con folio y crear revisiones.
- Registrar enviada, aceptada, rechazada o anulada con fecha y nota.
- PDF completo o resumido, con logo, totales, condiciones y espacios para firmas.
- Datos emitidos preservados por revisión; cambiar catálogo, empresa o cliente no modifica documentos históricos.
- Acceso solo para Nelson con contraseña, sin registro público ni envío de correos.

## Desarrollo local

Requisitos: Node.js 22 o superior y npm. Las versiones instaladas están fijadas en `package-lock.json`.

```sh
npm ci
```

Crear `.env` con `LOCAL_DEMO=true` y sin `DATABASE_URL` para usar PostgreSQL integrado con PGlite. Este modo omite el inicio de sesión únicamente con `NODE_ENV=development` y una base local; nunca se activa en producción.

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Abrir `http://localhost:3000`. La base persiste en `.local-data/postgres`, fuera de Git. El seed solo opera en la base local y carga el ejemplo del PDF adjunto. No usar información sensible mientras el modo local omite el acceso.

Para desarrollar contra una rama de Neon, configurar `DATABASE_URL` y las variables de acceso de `.env.example`. El modo local no permite omitir el acceso cuando `DATABASE_URL` está presente.

## Verificación

```sh
npm run test
npm run typecheck
npm run lint
npm run build
```

Las pruebas cubren cálculos, descuentos, cantidades decimales, redondeo, fechas, folios concurrentes, conflictos de edición, preservación histórica, estados finales, acceso por contraseña, revocación de sesiones y bloqueo de registro público.

Con el servidor local y los ejemplos cargados, ejecutar `npm run test:e2e`. Usa Chrome con un perfil temporal; `PLAYWRIGHT_CHANNEL` permite seleccionar otro navegador instalado. `TEST_URL` cambia la URL, pero usar siempre una base de pruebas porque este recorrido crea cotizaciones, emite y cambia estados.

La base integrada verifica el comportamiento PostgreSQL. Todavía corresponde repetir la prueba de integración contra la rama de pruebas real de Neon y configurar la contraseña de Nelson antes de producción.

## Estructura

- `src/lib/domain.ts`: validación, cálculos, fechas y reglas compartidas.
- `src/lib/repository.ts`: persistencia, transacciones, folios, revisiones y eventos.
- `src/lib/auth.ts`: acceso privado de Nelson por contraseña.
- `src/db/schema.ts` y `drizzle/`: tablas y migraciones versionadas.
- `src/components/terra-app.tsx`: interfaz de gestión.
- `src/components/quote-pdf.tsx`: plantilla PDF versión 1.
- `src/app/api/`: operaciones protegidas y descarga del PDF.

## Operación

Al emitir, la revisión copia datos del prestador, cliente, condiciones, precios, tasa y totales. Una corrección crea otra revisión en borrador. El estado de la revisión actual se mantiene hasta emitir la nueva; entonces vuelve a Emitida. La duplicación genera un documento independiente con otro folio.

La aplicación no envía correos. Nelson registra manualmente envío y aceptación/rechazo. No hay firma electrónica, facturación SII ni seguimiento de pagos.

Las revisiones conservan datos y versión de plantilla; no se archivan los bytes originales de cada PDF. Mantener la plantilla histórica al añadir versiones nuevas. Si se necesita conservar exactamente cada archivo emitido, agregar almacenamiento privado de objetos.

Consultar `docs/DEPLOYMENT.md` para la puesta en producción.
