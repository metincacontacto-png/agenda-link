import test from "node:test";
import assert from "node:assert/strict";
import { createBooking } from "../src/features/booking/create-booking.ts";
import { localMinuteToUtc } from "../src/features/schedule/time.ts";

const business = {
  id: "business-a",
  slug: "booking-test",
  name: "Booking Test",
  currency: "CLP",
  timezone: "America/Santiago",
};
const service = {
  id: "service-a",
  businessId: business.id,
  name: "Consulta",
  duration: 30,
  price: 15000,
};
const professional = { id: "professional-a", businessId: business.id, name: "Profesional" };
const bookingInput = {
  slug: business.slug,
  serviceId: service.id,
  professionalId: professional.id,
  clientName: "Cliente de prueba",
  clientWhatsApp: "+56912345678",
  date: "2030-01-10",
  time: "09:30",
};

function makeRepository(overrides = {}) {
  const calls = { slots: 0, inserts: [] };
  const repository = {
    findBusinessBySlug: async () => business,
    findServiceById: async () => service,
    findProfessionalById: async () => professional,
    getAvailableSlots: async () => {
      calls.slots += 1;
      return [bookingInput.time];
    },
    insertIfAvailable: async (input) => {
      calls.inserts.push(input);
      return true;
    },
    ...overrides,
  };
  return { repository, calls };
}

const fixedClock = { now: () => new Date("2029-01-01T00:00:00.000Z") };

test("creates a booking through injected repository, ID generator, and clock", async () => {
  const { repository, calls } = makeRepository();
  const result = await createBooking(bookingInput, {
    repository,
    clock: fixedClock,
    createId: () => "appointment-fixed-id",
  });

  assert.equal(result.ok, true);
  assert.equal(result.appointment.id, "appointment-fixed-id");
  assert.equal(result.appointment.paymentStatus, "PENDING");
  assert.equal(result.appointment.paymentAmount, null);
  assert.equal(
    result.appointment.dateTime.toISOString(),
    localMinuteToUtc(bookingInput.date, 9 * 60 + 30, business.timezone).toISOString(),
  );
  assert.equal(calls.inserts.length, 1);
  assert.equal(calls.inserts[0].businessId, business.id);
  assert.equal(calls.inserts[0].serviceId, service.id);
  assert.equal(calls.inserts[0].professionalId, professional.id);
  assert.equal(calls.inserts[0].clientName, bookingInput.clientName);
  assert.equal(calls.inserts[0].serviceDurationMinutes, service.duration);
});

test("rejects a booking that is not in the repository's available slots", async () => {
  const { repository, calls } = makeRepository({ getAvailableSlots: async () => [] });
  const result = await createBooking(bookingInput, { repository, clock: fixedClock });

  assert.deepEqual(result, { ok: false, status: 409, error: "El horario ya no está disponible" });
  assert.equal(calls.inserts.length, 0);
});

test("keeps the database conflict check as the final authority", async () => {
  const { repository } = makeRepository({ insertIfAvailable: async () => false });
  const result = await createBooking(bookingInput, { repository, clock: fixedClock });

  assert.deepEqual(result, { ok: false, status: 409, error: "El horario acaba de dejar de estar disponible" });
});

test("rejects past appointments using the injected clock without database writes", async () => {
  const { repository, calls } = makeRepository();
  const result = await createBooking({ ...bookingInput, date: "2028-01-10" }, {
    repository,
    clock: fixedClock,
  });

  assert.deepEqual(result, { ok: false, status: 400, error: "La reserva debe ser futura" });
  assert.equal(calls.slots, 0);
  assert.equal(calls.inserts.length, 0);
});

test("rejects foreign service and professional records before checking availability", async () => {
  const { repository, calls } = makeRepository({
    findProfessionalById: async () => ({ ...professional, businessId: "business-b" }),
  });
  const result = await createBooking(bookingInput, { repository, clock: fixedClock });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    error: "Servicio o profesional no pertenece a este negocio",
  });
  assert.equal(calls.slots, 0);
  assert.equal(calls.inserts.length, 0);
});
