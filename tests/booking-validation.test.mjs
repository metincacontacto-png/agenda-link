import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAvailabilityQuery,
  parseCreateBookingInput,
} from "../src/features/booking/validation.ts";

test("accepts and normalizes valid public booking fields, ignoring client payment claims", () => {
  const result = parseCreateBookingInput({
    slug: "demo-business",
    serviceId: "service-1",
    professionalId: "professional-1",
    clientName: "  Test Client  ",
    clientWhatsApp: "+56 9 1234 5678",
    date: "2026-01-05",
    time: "10:30",
    paymentStatus: "PAID",
    paymentAmount: 0.01,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.clientName, "Test Client");
  assert.equal(result.value.clientWhatsApp, "+56912345678");
  assert.equal("paymentStatus" in result.value, false);
  assert.equal("paymentAmount" in result.value, false);
});

test("accepts and normalizes clientEmail when provided, and rejects invalid email formats", () => {
  const base = {
    slug: "demo-business",
    serviceId: "service-1",
    professionalId: "professional-1",
    clientName: "Test Client",
    clientWhatsApp: "+56 9 1234 5678",
    date: "2026-01-05",
    time: "10:30",
  };

  const valid = parseCreateBookingInput({ ...base, clientEmail: "  Maria.Gonzalez@Ejemplo.com  " });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value.clientEmail, "maria.gonzalez@ejemplo.com");
  }

  const invalidFormat = parseCreateBookingInput({ ...base, clientEmail: "correo-invalido" });
  assert.equal(invalidFormat.ok, false);
  if (!invalidFormat.ok) {
    assert.equal(invalidFormat.error, "Correo electrónico inválido");
  }
});

test("rejects malformed or out-of-range booking data", () => {
  const base = {
    slug: "demo-business",
    serviceId: "service-1",
    professionalId: "professional-1",
    clientName: "Test Client",
    clientWhatsApp: "+56 9 1234 5678",
    date: "2026-01-05",
    time: "10:30",
  };

  assert.equal(parseCreateBookingInput({ ...base, date: "2026-02-30" }).ok, false);
  assert.equal(parseCreateBookingInput({ ...base, time: "24:00" }).ok, false);
  assert.equal(parseCreateBookingInput({ ...base, clientName: "   " }).ok, false);
  assert.equal(parseCreateBookingInput({ ...base, clientWhatsApp: "abc" }).ok, false);
  assert.equal(parseCreateBookingInput({ ...base, slug: "../other" }).ok, false);
});

test("validates and normalizes Chilean phone numbers to +569XXXXXXXX format", () => {
  const base = {
    slug: "demo-business",
    serviceId: "service-1",
    professionalId: "professional-1",
    clientName: "Test Client",
    date: "2026-01-05",
    time: "10:30",
  };

  const local9 = parseCreateBookingInput({ ...base, clientWhatsApp: "912345678" });
  assert.equal(local9.ok, true);
  if (local9.ok) assert.equal(local9.value.clientWhatsApp, "+56912345678");

  const formatted = parseCreateBookingInput({ ...base, clientWhatsApp: "+56 9 8765 4321" });
  assert.equal(formatted.ok, true);
  if (formatted.ok) assert.equal(formatted.value.clientWhatsApp, "+56987654321");

  const short = parseCreateBookingInput({ ...base, clientWhatsApp: "12345678" });
  assert.equal(short.ok, false);
  if (!short.ok) assert.equal(short.error, "Ingresa un celular chileno válido (9 dígitos)");

  const veryShort = parseCreateBookingInput({ ...base, clientWhatsApp: "12345" });
  assert.equal(veryShort.ok, false);
  if (!veryShort.ok) assert.equal(veryShort.error, "Ingresa un celular chileno válido (9 dígitos)");

  const invalidPrefix = parseCreateBookingInput({ ...base, clientWhatsApp: "812345678" });
  assert.equal(invalidPrefix.ok, false);
});

test("validates availability query fields and requires service/professional together", () => {
  const valid = parseAvailabilityQuery(new URLSearchParams({
    slug: "demo-business",
    date: "2026-10-12",
    serviceId: "service-1",
    professionalId: "professional-1",
  }));
  const missingProfessional = parseAvailabilityQuery(new URLSearchParams({
    slug: "demo-business",
    date: "2026-10-12",
    serviceId: "service-1",
  }));

  assert.equal(valid.ok, true);
  assert.equal(missingProfessional.ok, false);
});
