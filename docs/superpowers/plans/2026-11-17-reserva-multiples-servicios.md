# Reserva con Varios Servicios en una Misma Cita Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que los negocios definan cuántos servicios puede elegir un cliente por cita (1 a 5), permitiendo que el cliente seleccione múltiples servicios en la web con suma automática de duración y precio, y bloqueo atómico continuo en el calendario para el tiempo total (ej. 60 min + 120 min = 180 min).

**Architecture:** Se añade `maxServicesPerBooking` en `Business`, y `durationMinutes` y `servicesJson` en `Appointment`. Se actualiza el motor de cálculo de disponibilidad y el candado SQL atómico para considerar `COALESCE(durationMinutes, service.duration)`. Se dota a `ServicesTab.tsx` del selector de límite de servicios, y a `BookingFlow.tsx` de la selección múltiple con resumen interactivo de tiempo y precio acumulados.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma, SQLite / Cloudflare D1, Mercado Pago Checkout, Node.js test runner.

---

### Task 1: Actualización del Esquema Prisma, Migración D1 y Contratos DTO

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261117120000_multi_service_bookings/migration.sql`
- Modify: `src/features/businesses/contracts.ts`
- Modify: `src/features/booking/public-business-dto.ts`
- Modify: `src/app/api/admin/route.ts`

- [x] **Step 1: Update `prisma/schema.prisma`**

In `Business`:
```prisma
maxServicesPerBooking Int @default(1)
```

In `Appointment`:
```prisma
durationMinutes Int?
servicesJson    String?
```

- [x] **Step 2: Create D1 migration file**

Create `prisma/migrations/20261117120000_multi_service_bookings/migration.sql`:
```sql
ALTER TABLE "Business" ADD COLUMN "maxServicesPerBooking" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Appointment" ADD COLUMN "durationMinutes" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "servicesJson" TEXT;
```

- [x] **Step 3: Update local SQLite database schema and generate Prisma client**

Run:
```bash
npx prisma generate
```

- [x] **Step 4: Update Contracts and Admin DTO**

In `src/features/businesses/contracts.ts` and `src/features/booking/public-business-dto.ts`:
- Add `maxServicesPerBooking: number;` to `BusinessAdminDTO` and `PublicBusinessDTO`.
In `src/app/api/admin/route.ts`:
- Include `maxServicesPerBooking` in select and update payloads.

- [x] **Step 5: Verify Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [x] **Step 6: Commit**

Run:
```bash
git add prisma/schema.prisma prisma/migrations/20261117120000_multi_service_bookings/migration.sql src/features/businesses/contracts.ts src/features/booking/public-business-dto.ts src/app/api/admin/route.ts
git commit -m "feat(schema): add maxServicesPerBooking and appointment duration fields"
```

---

### Task 2: Motor de Disponibilidad y Repositorio Atómico con Soporte Multi-Servicio

**Files:**
- Modify: `src/features/booking/availability.ts`
- Modify: `src/lib/prisma-booking-repository.ts`
- Modify: `src/features/booking/ports.ts`
- Modify: `src/features/booking/validation.ts`
- Modify: `src/features/booking/create-booking.ts`
- Create: `tests/multi-service-availability.test.mjs`

- [x] **Step 1: Write test for multi-service slot calculation and total duration blocking**

Create `tests/multi-service-availability.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSlots } from "../src/features/schedule/time.ts";

test("generateSlots with 180 min duration checks consecutive window and omits conflicting slots", () => {
  const result = generateSlots({
    date: "2026-12-01",
    timeZone: "America/Santiago",
    serviceDurationMinutes: 180,
    businessWindows: [{ dayOfWeek: 2, startMinute: 540, endMinute: 1080 }],
    professionalWindows: [{ dayOfWeek: 2, startMinute: 540, endMinute: 1080 }],
    breaks: [],
    blocks: [],
    appointments: [
      // Appointment at 11:00 with duration 60 min
      { dateTime: new Date("2026-12-01T14:00:00Z"), durationMinutes: 60 },
    ],
    minDateTime: new Date("2026-12-01T00:00:00Z"),
  });

  // A 180 min slot starting at 09:00 ends at 12:00, which collides with 11:00-12:00
  assert.equal(result.availableSlots.includes("09:00"), false);
  assert.equal(result.availableSlots.includes("09:30"), false);
  assert.equal(result.availableSlots.includes("10:00"), false);
});

test("appointment with 180 min duration blocks full 3 hours in availability", () => {
  const result = generateSlots({
    date: "2026-12-01",
    timeZone: "America/Santiago",
    serviceDurationMinutes: 30,
    businessWindows: [{ dayOfWeek: 2, startMinute: 540, endMinute: 1080 }],
    professionalWindows: [{ dayOfWeek: 2, startMinute: 540, endMinute: 1080 }],
    breaks: [],
    blocks: [],
    appointments: [
      // Appointment from 10:00 to 13:00 (180 min)
      { dateTime: new Date("2026-12-01T13:00:00Z"), durationMinutes: 180 },
    ],
    minDateTime: new Date("2026-12-01T00:00:00Z"),
  });

  // 10:00, 10:30, 11:00, 11:30, 12:00, 12:30 are all blocked
  assert.equal(result.availableSlots.includes("10:00"), false);
  assert.equal(result.availableSlots.includes("11:00"), false);
  assert.equal(result.availableSlots.includes("12:00"), false);
  assert.equal(result.availableSlots.includes("12:30"), false);
  assert.equal(result.availableSlots.includes("13:00"), true);
});
```

- [x] **Step 2: Run test to verify it passes or fails**

Run: `node --experimental-strip-types --test tests/multi-service-availability.test.mjs`
Expected: PASS (verifies time slot math foundation)

- [x] **Step 3: Update `availability.ts` to read `durationMinutes` from appointments**

In `src/features/booking/availability.ts`:
Select `durationMinutes: true` in appointments query:
```typescript
appointments: appointments.map((appointment) => ({
  dateTime: appointment.dateTime,
  durationMinutes: appointment.durationMinutes ?? appointment.service.duration,
})),
```

- [x] **Step 4: Update `AtomicBookingInput` and `prismaBookingRepository.insertIfAvailable`**

In `src/features/booking/ports.ts`:
Add `servicesJson?: string | null;` and `durationMinutes?: number | null;` to `AtomicBookingInput`.

In `src/lib/prisma-booking-repository.ts`:
Update raw query to store `durationMinutes` and `servicesJson`, and use `COALESCE(existing."durationMinutes", existingService."duration")` in conflict check:
```sql
      INSERT INTO "Appointment" (
        "id", "businessId", "serviceId", "professionalId", "clientName",
        "clientWhatsApp", "dateTime", "status", "paymentStatus",
        "paymentMethod", "paymentAmount", "durationMinutes", "servicesJson"
      )
      SELECT
        ${input.id}, ${input.businessId}, ${input.serviceId}, ${input.professionalId},
        ${input.clientName}, ${input.clientWhatsApp}, ${input.dateTime},
        'CONFIRMED', 'PENDING', NULL, NULL, ${input.serviceDurationMinutes}, ${input.servicesJson ?? null}
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Appointment" AS existing
        INNER JOIN "Service" AS existingService ON existingService."id" = existing."serviceId"
        WHERE existing."businessId" = ${input.businessId}
          AND existing."professionalId" = ${input.professionalId}
          AND existing."status" NOT IN ('CANCELLED', 'CANCELED')
          AND julianday(existing."dateTime") < julianday(${input.dateTime}) + (${input.serviceDurationMinutes} / 1440.0)
          AND julianday(existing."dateTime") + (COALESCE(existing."durationMinutes", existingService."duration") / 1440.0) > julianday(${input.dateTime})
      )
```

- [x] **Step 5: Support multiple `serviceIds` in `parseCreateBookingInput` and `createBooking`**

In `src/features/booking/validation.ts`:
Accept `serviceIds?: string[]` (array of 1 to 5 service IDs) alongside `serviceId`.
In `src/features/booking/create-booking.ts`:
- Fetch all services by their IDs.
- Validate that all belong to the business.
- Calculate `totalDuration = services.reduce((acc, s) => acc + s.duration, 0)`.
- Calculate `totalPrice = services.reduce((acc, s) => acc + s.price, 0)`.
- Pass `serviceDurationMinutes: totalDuration` to `getAvailableSlots` and `insertIfAvailable`.

- [x] **Step 6: Run tests and typecheck**

Run: `node --experimental-strip-types --test tests/multi-service-availability.test.mjs`
Run: `npx tsc --noEmit`
Expected: PASS

- [x] **Step 7: Commit**

Run:
```bash
git add src/features/booking/ tests/multi-service-availability.test.mjs src/lib/prisma-booking-repository.ts
git commit -m "feat(booking): support multi-service duration aggregation and atomic blocking"
```

---

### Task 3: Configuración de Límite de Servicios en Panel de Administración (`ServicesTab.tsx`)

**Files:**
- Modify: `src/app/admin/[slug]/tabs/ServicesTab.tsx`
- Modify: `src/app/admin/[slug]/tabs/SettingsTab.tsx`
- Modify: `src/app/api/admin/route.ts`

- [x] **Step 1: Add `maxServicesPerBooking` control in `ServicesTab.tsx`**

In `src/app/admin/[slug]/tabs/ServicesTab.tsx`:
Add a control block above the service catalog:
- Label: "Límite de servicios por cita"
- Select options: 1 a 5 (default: `business.maxServicesPerBooking || 1`).
- Informative helper: "Define cuántos servicios distintos puede seleccionar un cliente en una misma reserva. El calendario reservará automáticamente la suma del tiempo de todos los servicios elegidos."
- Updates via `POST /api/admin` with `{ slug, maxServicesPerBooking: Number(value) }`.

- [x] **Step 2: Update `POST /api/admin` to handle `maxServicesPerBooking`**

In `src/app/api/admin/route.ts`:
Parse `maxServicesPerBooking`: number between 1 and 5.
Update `prisma.business.update({ where: { slug }, data: { maxServicesPerBooking } })`.

- [x] **Step 3: Run typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/app/admin/[slug]/tabs/ServicesTab.tsx`
Expected: PASS

- [x] **Step 4: Commit**

Run:
```bash
git add src/app/admin/[slug]/tabs/ServicesTab.tsx src/app/admin/[slug]/tabs/SettingsTab.tsx src/app/api/admin/route.ts
git commit -m "feat(admin): add maxServicesPerBooking setting in services management tab"
```

---

### Task 4: Flujo de Reserva Pública con Selección Múltiple y Cobro Consolidado

**Files:**
- Modify: `src/app/[slug]/components/BookingFlow.tsx`
- Modify: `src/app/[slug]/BookingClient.tsx`
- Modify: `src/app/api/availability/route.ts`
- Modify: `src/app/api/appointments/route.ts`
- Modify: `src/app/api/payments/mercadopago/preference/route.ts`
- Modify: `src/lib/whatsapp.ts`

- [x] **Step 1: Update `BookingFlow.tsx` for multi-service selection**

Props:
- `selectedServices: Service[]`
- `onToggleService: (service: Service) => void`
- `maxServicesPerBooking: number`

UI:
- Checkbox / highlight state for each service.
- If `selectedServices.length < maxServicesPerBooking`: user can click to add.
- If clicked and already selected: user can click to remove (minimum 1).
- If trying to exceed limit: shows toast / badge: "Puedes elegir hasta {max} servicios por cita".
- Floating summary bar:
  - "{count} servicios seleccionados · {totalMinutes} min · {formattedTotal}"
  - Button: "Continuar ({totalMinutes} min) →"

- [x] **Step 2: Update `/api/availability` to accept `serviceIds` (comma separated) or `duration`**

In `src/app/api/availability/route.ts`:
Accept `serviceIds` query parameter (e.g. `serviceIds=id1,id2`).
Fetch durations and pass `serviceDurationMinutes: sum(durations)` to `getSlotsForProfessional`.

- [x] **Step 3: Update `preference/route.ts` (Mercado Pago)**

In `src/app/api/payments/mercadopago/preference/route.ts`:
Map each service to `mpPayload.items`:
```typescript
items: selectedServices.map((svc) => ({
  id: svc.id,
  title: `${svc.name} — ${business.name}`,
  quantity: 1,
  currency_id: business.currency || "CLP",
  unit_price: Math.round(svc.price),
}))
```

- [x] **Step 4: Update `buildWhatsAppReminderUrl` in `src/lib/whatsapp.ts`**

Format services list:
```typescript
`✂️ *Servicios:* ${serviceNames.join(" + ")}`,
`⏱️ *Duración total:* ${totalDurationMinutes} min`,
`💰 *Total:* ${formattedPrice}`
```

- [x] **Step 5: Run tests and typecheck**

Run: `node --experimental-strip-types --test tests/multi-service-availability.test.mjs`
Run: `npx tsc --noEmit`
Run: `npm test`
Expected: PASS

- [x] **Step 6: Commit**

Run:
```bash
git add src/app/[slug]/ src/app/api/availability/ src/app/api/payments/mercadopago/preference/ src/lib/whatsapp.ts
git commit -m "feat(booking): enable client multi-service selection, aggregated availability and consolidated payments"
```

---

### Task 5: Migración Remota D1, Verificación Integral y Despliegue a Producción

- [x] **Step 1: Apply D1 migration on remote production**
Run: `npx wrangler d1 migrations apply agenda-link-db --remote`
Expected: Migration applied successfully.

- [x] **Step 2: Run complete test suite**
Run: `npm test`
Expected: PASS

- [x] **Step 3: Run Cloudflare build and deployment**
Run: `npm run deploy`
Expected: Deployed to `agendalink.cl`.

- [x] **Step 4: Push main to origin**
Run: `git push origin main`
Expected: Synchronized with GitHub repository.
