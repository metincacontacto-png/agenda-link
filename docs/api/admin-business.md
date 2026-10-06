# Contratos administrativos de negocio

Las rutas administrativas requieren una cookie de sesión válida y membresía en el negocio solicitado. Un usuario `SUPER_ADMIN` global puede acceder a cualquier negocio. El `businessId` autorizado se resuelve en servidor a partir del `slug`; no se acepta como autoridad un identificador enviado por el cliente.

## GET `/api/admin`

Parámetros:

- `slug` (obligatorio): slug del negocio.
- `limit` (opcional): 1–100; predeterminado 50.
- `cursor` (opcional): id de la última cita de la página anterior.

Devuelve la información necesaria para el panel y una página ordenada de citas. `appointmentsPagination` incluye `total`, `limit`, `hasMore`, `nextCursor` y `piiRedacted`. El cliente debe usar `nextCursor` para pedir más registros; no se cargan todas las citas en una sola respuesta.

## Visibilidad por rol

- `OWNER`, `ADMIN` y `SUPER_ADMIN`: pueden ver WhatsApp completo y datos de cobro de las citas de su alcance.
- Otros miembros del negocio: reciben WhatsApp enmascarado (solo últimos 4 dígitos), `paymentAmount`/`paymentMethod` nulos y `billingBypass` desactivado en el DTO.
- Email del negocio, password hashes, tokens y grafos completos de Prisma no forman parte del contrato.

## Mutaciones y servicios

`POST /api/admin` y `POST`/`DELETE /api/services` requieren sesión y membresía del negocio antes de tocar D1 o R2. `POST /api/appointments` se mantiene pública porque es la reserva de clientes; valida IDs/horario en servidor y no acepta el precio ni estado de pago del cliente.

## Errores

- `401`: falta sesión válida.
- `403`: cuenta autenticada sin membresía para el negocio.
- `404`: negocio/servicio/cita no encontrado dentro del alcance permitido.
- `400`: parámetros o contenido inválidos.
