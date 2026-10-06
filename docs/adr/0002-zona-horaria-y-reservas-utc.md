# ADR-0002: Zona horaria de negocio y persistencia de reservas

- Estado: Aceptado
- Fecha: 2026-10-06
- Alcance: disponibilidad y citas de AgendaLink

## Contexto

El flujo actual construye `Date` desde fecha y hora local del navegador. La instancia puede correr en otra zona horaria y los cambios DST vuelven ambiguos o inexistentes algunos horarios. Cada negocio necesita conservar su hora civil independientemente del navegador, región del Worker o zona del propietario.

## Decisiones

### Zona del negocio

- Añadir `Business.timezone` con identificador IANA validado (por ejemplo, `America/Santiago`).
- Para nuevos negocios en Chile, usar `America/Santiago` como valor inicial. La UI de configuración podrá cambiarlo por otra zona IANA.
- Usar la base tzdata/IANA del runtime para resolver offsets; nunca codificar `UTC-3` o `UTC-4` como regla permanente.

### Instantes y formato API

- Persistir `Appointment.dateTime` como un instante UTC (`DateTime`/ISO 8601 con `Z`).
- La API pública recibe fecha civil `YYYY-MM-DD`, hora civil `HH:mm` y resuelve esa hora usando el `timezone` del negocio, nunca la zona del cliente.
- La API devuelve el instante UTC y la zona IANA necesaria para presentar la cita. La UI formatea la hora en esa zona.
- En los límites del sistema se valida estrictamente calendario, reloj y `timezone`; valores imposibles se rechazan con `400`.

### Horario de verano/invierno (DST)

- Hora local inexistente durante el salto de primavera: no generar ese slot; rechazar una creación que intente reservarlo.
- Hora local repetida durante el retroceso de otoño: generar una única opción visible y resolverla al primer instante cronológico de esa hora local (offset anterior al retroceso). No crear dos slots visualmente idénticos.
- Toda resolución de hora ambigua es determinista y queda cubierta con pruebas de transición DST.

### Cambio de zona del negocio

Cambiar `Business.timezone` no reinterpreta ni modifica citas ya guardadas. El instante UTC permanece igual y la pantalla puede mostrar una hora civil diferente en la zona nueva. El cambio debe tener confirmación y registro en operaciones administrativas, pero no recalcula citas pasadas o futuras.

## Alternativas consideradas

- Guardar `date` y `time` como texto local: hace consultas de solapamiento ambiguas y no permite ordenar/comparar instantes globalmente.
- Usar la zona del navegador: produce disponibilidad diferente según quién consulte y depende de la configuración personal.
- Aplicar un offset fijo para Chile: falla en cambios DST y no soporta negocios de otros países.
- Duplicar las dos ocurrencias de una hora repetida: confunde a clientes y profesionales cuando la UI solo puede mostrar `HH:mm`.

## Consecuencias

- La disponibilidad debe calcular límites del día civil en la zona del negocio, convertirlos a UTC y buscar citas dentro de ese intervalo.
- El cálculo de slots debe aplicar duración del servicio y disponibilidad/bloqueos del profesional antes de exponer opciones.
- Los DTOs de reserva deben distinguir hora civil de instante UTC y llevar el identificador IANA.
- Las pruebas deben cubrir conversión UTC/local, un día de 23 horas, uno de 25 horas, horas inexistentes/repetidas y cambio de zona con citas existentes.

## Verificación

El test de aceptación usa `America/Santiago` y fechas de transición DST obtenidas del runtime IANA, no offsets escritos a mano. Debe confirmar que los slots no se desplazan por la zona configurada en el host que ejecuta las pruebas.
