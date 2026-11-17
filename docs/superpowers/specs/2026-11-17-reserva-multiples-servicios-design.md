# Especificación de Diseño: Reserva con Varios Servicios en una Misma Cita

- **Fecha:** 2026-11-17
- **Estado:** Aprobado
- **Alcance:** Configuración de límite de servicios en panel de negocio, selección múltiple en flujo de reserva, cálculo de disponibilidad acumulada de calendario y bloqueo atómico en base de datos.

---

## 1. Contexto y Objetivos

Actualmente, el flujo de agendamiento público de AgendaLink (`/[slug]`) restringe al cliente a seleccionar un único servicio por cita. En negocios de belleza, bienestar, estética o consultoría, es habitual que un cliente desee agendar múltiples servicios en una sola visita (por ejemplo: *Corte (60 min)* + *Color completo (120 min)*).

### Criterio de Aceptación:
Reservar 2 servicios de 60 min y 120 min debe dejar un bloque continuo de **180 minutos** en la agenda del profesional. La duración y el precio total deben sumarse automáticamente, y el calendario solo debe ofrecer horarios donde quepa el bloque completo continuo de 180 min.

### Metas:
1. Permitir que el negocio defina en su panel cuántos servicios puede elegir un cliente por cita (entre 1 y 5, por defecto 1).
2. Permitir que el cliente seleccione múltiples servicios en la página de reserva hasta el límite configurado por el negocio.
3. Calcular en tiempo real la duración total (`sum(durations)`) y precio total (`sum(prices)`).
4. El motor de disponibilidad (`/api/availability`) debe buscar bloques disponibles para la duración acumulada completa.
5. El registro de la cita (`Appointment`) debe guardar la duración total (`durationMinutes = 180`) y el detalle JSON de los servicios (`servicesJson`), bloqueando atómicamente la agenda del profesional por el tiempo completo.
6. Si el negocio tiene habilitado Mercado Pago, la preferencia de pago debe cobrar el precio consolidado.
7. Los mensajes de recordatorio por WhatsApp deben listar los servicios contratados con la duración total.

---

## 2. Esquema de Base de Datos y Migración D1

### 2.1 Modelo `Business` (`prisma/schema.prisma`)
Se agrega el campo:
```prisma
maxServicesPerBooking Int @default(1)
```
- Valor permitido: entre 1 y 5.
- Valor predeterminado: 1 (comportamiento clásico de un solo servicio).

### 2.2 Modelo `Appointment` (`prisma/schema.prisma`)
Se agregan los campos:
```prisma
durationMinutes Int?
servicesJson    String?
```
- `serviceId`: Conserva el ID del primer servicio para compatibilidad con interfaces y reportes existentes.
- `durationMinutes`: Almacena la duración total calculada en minutos (ej. `180`).
- `servicesJson`: Almacena la lista serializada de servicios seleccionados:
  `[{"id":"uuid1","name":"Corte","duration":60,"price":18000},{"id":"uuid2","name":"Color","duration":120,"price":45000}]`

### 2.3 Migración SQL canónica para Cloudflare D1
Archivo: `prisma/migrations/20261117120000_multi_service_bookings/migration.sql`
```sql
ALTER TABLE "Business" ADD COLUMN "maxServicesPerBooking" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Appointment" ADD COLUMN "durationMinutes" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "servicesJson" TEXT;
```

---

## 3. Experiencia de Usuario (UI/UX)

### 3.1 Configuración en el Panel (`src/app/admin/[slug]/tabs/ServicesTab.tsx`)
En la parte superior del catálogo de servicios se añade un bloque de configuración de cita:
- Selector: **"Límite de servicios por cita"**:
  - `1 servicio (un solo servicio por cita)`
  - `Hasta 2 servicios por cita`
  - `Hasta 3 servicios por cita`
  - `Hasta 4 servicios por cita`
  - `Hasta 5 servicios por cita`
- Guarda automáticamente o mediante botón a `POST /api/admin` con `{ slug, maxServicesPerBooking }`.

### 3.2 Selección en la Página de Reserva (`src/app/[slug]/components/BookingFlow.tsx`)
- Si `business.maxServicesPerBooking === 1`:
  - Mantiene el comportamiento actual de clic único.
- Si `business.maxServicesPerBooking > 1`:
  - Selección tipo checkbox / multi-select.
  - Al hacer clic en un servicio:
    - Si ya está seleccionado, se deselecciona (siempre que quede al menos uno o permitiendo seleccionar el siguiente).
    - Si no está seleccionado y la cantidad actual es menor a `maxServicesPerBooking`, se agrega a la lista.
    - Si se intenta superar el límite, se muestra una alerta flotante amigable: *"Puedes elegir hasta N servicios por cita"*.
  - **Barra flotante / Resumen en vivo:**
    - Muestra los servicios elegidos, la duración total acumulada (ej. `180 min`) y el valor total (ej. `$63.000`).
    - Botón de continuar: *"Continuar con N servicios (180 min) →"*.

---

## 4. Disponibilidad y Candado Atómico de Base de Datos

### 4.1 Consulta de Disponibilidad (`src/app/api/availability/route.ts` y `availability.ts`)
- La API de disponibilidad recibe `serviceDurationMinutes` como la suma total de las duraciones de los servicios seleccionados (o `serviceId` / `serviceIds` separados por coma).
- `getSlotsForProfessional` busca ranuras de tamaño `serviceDurationMinutes` (180 min).
- Al mapear las citas existentes de ese profesional para calcular los bloques ocupados:
  ```typescript
  appointments: appointments.map((appointment) => ({
    dateTime: appointment.dateTime,
    durationMinutes: appointment.durationMinutes ?? appointment.service.duration,
  }))
  ```
  Esto garantiza que tanto las citas históricas como las nuevas con múltiples servicios sean reconocidas con su duración real de bloqueo.

### 4.2 Inserción Atómica Anti-Colisión (`src/lib/prisma-booking-repository.ts`)
En la consulta raw SQL de `insertIfAvailable`:
```sql
WHERE existing."businessId" = ${input.businessId}
  AND existing."professionalId" = ${input.professionalId}
  AND existing."status" NOT IN ('CANCELLED', 'CANCELED')
  AND julianday(existing."dateTime") < julianday(${input.dateTime}) + (${input.serviceDurationMinutes} / 1440.0)
  AND julianday(existing."dateTime") + (COALESCE(existing."durationMinutes", existingService."duration") / 1440.0) > julianday(${input.dateTime})
```
- Inserta la nueva cita con `"durationMinutes" = ${input.serviceDurationMinutes}` y `"servicesJson" = ${input.servicesJson}`.
- El uso de `COALESCE(existing."durationMinutes", existingService."duration")` protege toda la ventana de tiempo contra reservas concurrentes en D1/SQLite.

---

## 5. Pagos en Mercado Pago y Notificaciones

1. **Preferencia de Mercado Pago (`/api/payments/mercadopago/preference`):**
   - Se crea la preferencia desglosando los servicios seleccionados en `items`:
     ```typescript
     items: selectedServices.map((svc) => ({
       id: svc.id,
       title: `${svc.name} — ${business.name}`,
       quantity: 1,
       currency_id: business.currency || "CLP",
       unit_price: Math.round(svc.price),
     }))
     ```
   - Mercado Pago suma automáticamente el total acumulado ($63.000).

2. **WhatsApp (`buildWhatsAppReminderUrl`):**
   - Detalla la lista de servicios:
     `✂️ Servicios: Corte + Brushing (60 min) · Color completo (120 min)`
     `⏱️ Duración: 180 min`
     `💰 Total: $63.000`

---

## 6. Plan de Pruebas y Validación

1. **Pruebas Unitarias de Disponibilidad (`tests/multi-service-availability.test.mjs`):**
   - Verificar que al solicitar disponibilidad para 180 min, un slot a las 10:00 se rechace si hay otra cita a las 11:30.
   - Verificar que una cita con `durationMinutes: 180` bloquee los slots posteriores dentro de su rango.
2. **Pruebas de Validación y Contratos:**
   - Validar que no se puedan enviar más servicios que el `maxServicesPerBooking` permitido.
   - Validar cálculo correcto de precio total y duración total.
3. **Verificación de Compilación y Despliegue:**
   - `npm test`
   - `npm run build`
   - `npm run build:cloudflare`
   - `npm run deploy`
