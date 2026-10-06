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
  assert.equal("paymentStatus" in result.value, false);
  assert.equal("paymentAmount" in result.value, false);
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
