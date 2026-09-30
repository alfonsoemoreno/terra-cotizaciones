# Puesta en producción con cuentas de Terra

Estado: código listo para revisión y pruebas locales completadas. Pendiente aprovisionar cuentas, proyecto y base. No se ha contratado ningún servicio ni publicado la aplicación.

## Información necesaria

- Cuenta u organización GitHub de Terra y repositorio privado.
- Equipo Vercel de Terra con plan apto para uso comercial.
- Organización/proyecto Neon de Terra.
- Dominio para la aplicación si se desea URL propia. Se puede comenzar con una URL de Vercel.

Los accesos se configuran mediante inicio de sesión y variables de entorno; no compartir contraseñas, cadenas de conexión o claves en mensajes ni agregarlas al repositorio.

## Secuencia

1. Crear repositorio privado y subir el proyecto, excluyendo `.env`, `.local-data`, `node_modules`, archivos de pruebas generados y adjuntos privados.
2. Crear Neon PostgreSQL, una rama para pruebas y otra base/rama para producción. Escoger una región disponible cercana al servidor Vercel y coherente con sus opciones de región.
3. Importar el repositorio en Vercel como Next.js. Build: `npm run build`; instalación: `npm ci`; Node.js 24 o versión compatible del proyecto.
4. Usar conexión pooled de Neon para la aplicación; conservar TLS y credenciales del proveedor. Para las migraciones, configurar la cadena de conexión en el entorno del operador autorizado.
5. Preparar el acceso privado de Nelson por contraseña; no se necesita proveedor de correo.
6. Configurar variables separadas para preview/pruebas y producción.
7. Aplicar migraciones a la rama de pruebas con `npm run db:migrate`; no ejecutar el seed de ejemplos contra Neon. Configurar la contraseña de Nelson en cada base con `npm run auth:setup` (ver abajo).
8. Desplegar preview, probar acceso real de Nelson, CRUD, guardado, folios concurrentes y PDF; confirmar que preview no utiliza la base de producción.
9. Aplicar migraciones a producción de forma controlada. Revisar respaldo/recuperación disponible en Neon antes de migrar.
10. Desplegar producción, comprobar acceso privado y una cotización real de principio a fin.

No ejecutar migraciones automáticamente desde cada build de Vercel: un preview nunca debe cambiar el esquema de producción.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL Neon; solo servidor |
| `BETTER_AUTH_URL` | URL exacta del ambiente, con `https://` en producción |
| `BETTER_AUTH_SECRET` | Secreto aleatorio largo para sesiones; independiente por ambiente |
| `OWNER_EMAIL` | `escobar.oceanico@hotmail.com` |
| `LOCAL_DEMO` | `false` en despliegues; el código nunca permite la excepción en producción |

No usar prefijo `NEXT_PUBLIC_` para secretos. Cada ambiente debe tener configuración explícita y una base independiente.

## Configurar o restablecer la contraseña

Con las migraciones aplicadas y `DATABASE_URL` apuntando a la base correcta, ejecutar desde una terminal de un operador autorizado:

```zsh
read -s 'terra_password?Contraseña de Nelson (12 a 128 caracteres): '
echo
TERRA_OWNER_PASSWORD="$terra_password" npm run auth:setup
unset terra_password
```

La entrada queda oculta. No guardar la contraseña en Vercel, `.env`, Git ni el chat. El script guarda un hash y revoca sesiones anteriores. `OWNER_EMAIL` identifica internamente la cuenta; no se utiliza para enviar mensajes. La pantalla de acceso solo solicita la contraseña.

## Comprobación previa al lanzamiento

- Nelson ingresa con contraseña; no hay registro público.
- Solicitudes sin sesión no entregan datos ni PDF.
- Contraseñas incorrectas y orígenes externos se rechazan; la aplicación no envía correos.
- Cotización guardada permanece al recargar.
- Folios únicos con emisiones concurrentes y protección frente a edición desde dos ventanas.
- Catálogo o cliente modificado no cambia PDF de revisiones anteriores.
- Ejemplo de referencia cuadra con $1.218.560 y PDF de varias páginas conserva todos los ítems.
- RUT y dirección pueden completarse en Configuración; no se han inventado esos datos.
- Recuperación de base, registro de errores y control de gasto definidos según los planes contratados.

## Recuperación y mantenimiento

Conservar migraciones y plantilla PDF versión 1. Antes de cambios de esquema, revisar un respaldo o ventana de recuperación de Neon acorde al plan, ensayar en la rama de pruebas y aplicar migraciones compatibles con la versión anterior de la aplicación. Un rollback de Vercel revierte código, no el esquema ni los datos.

Las sesiones se pueden revocar eliminando las filas correspondientes de `session` mediante un operador autorizado. Rotar claves comprometidas desde los paneles del proveedor y redesplegar. Para recuperar acceso, volver a ejecutar `npm run auth:setup` con una nueva contraseña; esto revoca las sesiones anteriores y no envía correo.

## Referencias del proveedor

- Next.js: https://nextjs.org/docs/app/getting-started/installation
- Neon en Vercel: https://vercel.com/marketplace/neon/neon
- Uso comercial de Vercel: https://vercel.com/docs/plans/hobby
- Acceso por contraseña: https://better-auth.com/docs/authentication/email-password
