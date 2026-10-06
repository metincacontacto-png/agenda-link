# ADR-0003: Cancelación y reprogramación de citas

- Estado: Aceptado
- Fecha: 2026-10-06
- Alcance: gestión administrativa de citas en el MVP

## Decisiones

- Solo un miembro autenticado del negocio puede cancelar o reprogramar desde el panel. El autoservicio del cliente queda pendiente hasta que exista identidad/autorización de cliente.
- Solo se modifican citas `CONFIRMED` cuya hora todavía no haya comenzado. El MVP no añade un corte previo de 24 horas; el negocio puede actuar hasta la hora de inicio.
- Reprogramar recibe fecha y hora civil del negocio, comprueba disponibilidad, duración, descansos y bloqueos, y revalida el solapamiento en la escritura atómica.
- Cancelar cambia el estado a `CANCELLED`; esa cita deja de reservar disponibilidad. El estado de pago no se modifica ni se inicia un reembolso automático.
- Un trigger SQLite/D1 registra estado/fecha anterior y nueva, actor y timestamp en `AppointmentAudit` dentro de la misma transacción que el cambio.

## Consecuencias

- La cancelación no borra la cita ni su historial.
- Un conflicto durante la carrera devuelve `409` y conserva la cita original.
- Los reembolsos, notificaciones al cliente y una política configurable de antelación dependen de sus proveedores/decisiones futuras.

## Verificación

Los tests de integración cubren cancelación, liberación del slot, reprogramación, audit trail, horario ocupado y rechazo de citas pasadas/no confirmadas.
