import test from "node:test";
import assert from "node:assert/strict";
import { generateSlots } from "../src/features/schedule/time.ts";
import { parseCreateBookingInput, parseAvailabilityQuery } from "../src/features/booking/validation.ts";
import { createBooking } from "../src/features/booking/create-booking.ts";
import { buildWhatsAppReminderUrl } from "../src/lib/whatsapp.ts";

test("generateSlots with 180 min duration checks consecutive window and omits conflicting slots", () => {
  const result = generateSlots({
    date: "2026-12-01",
    timeZone: "America/Santiago",
    serviceDurationMinutes: 180,
    businessWindows: [{ startMinute: 540, endMinute: 1080 }],
    professionalWindows: [{ startMinute: 540, endMinute: 1080 }],
    breaks: [],
    blocks: [],
    appointments: [
      // Appointment at 11:00 with duration 60 min (11:00 local is 14:00 UTC)
      { dateTime: new Date("2026-12-01T14:00:00Z"), durationMinutes: 60 },
    ],
    minDateTime: new Date("2026-12-01T00:00:00Z"),
  });

  // A 180 min slot starting at 09:00 ends at 12:00, which collides with 11:00-12:00
  assert.equal(result.availableSlots.includes("09:00"), false);
  assert.equal(result.availableSlots.includes("09:30"), false);
  assert.equal(result.availableSlots.includes("10:00"), false);
  assert.equal(result.availableSlots.includes("10:30"), false);
  assert.equal(result.availableSlots.includes("12:00"), true);
});

test("appointment with 180 min duration blocks full 3 hours in availability", () => {
  const result = generateSlots({
    date: "2026-12-01",
    timeZone: "America/Santiago",
    serviceDurationMinutes: 30,
    businessWindows: [{ startMinute: 540, endMinute: 1080 }],
    professionalWindows: [{ startMinute: 540, endMinute: 1080 }],
    breaks: [],
    blocks: [],
    appointments: [
      // Appointment from 10:00 to 13:00 (180 min, in Santiago UTC-3 is 13:00 UTC)
      { dateTime: new Date("2026-12-01T13:00:00Z"), durationMinutes: 180 },
    ],
    minDateTime: new Date("2026-12-01T00:00:00Z"),
  });

  // 10:00, 10:30, 11:00, 11:30, 12:00, 12:30 are all blocked
  assert.equal(result.availableSlots.includes("09:30"), true);
  assert.equal(result.availableSlots.includes("10:00"), false);
  assert.equal(result.availableSlots.includes("10:30"), false);
  assert.equal(result.availableSlots.includes("11:00"), false);
  assert.equal(result.availableSlots.includes("11:30"), false);
  assert.equal(result.availableSlots.includes("12:00"), false);
  assert.equal(result.availableSlots.includes("12:30"), false);
  assert.equal(result.availableSlots.includes("13:00"), true);
});

test("parseCreateBookingInput accepts and normalizes serviceIds and serviceId", () => {
  const base = {
    slug: "demo-business",
    professionalId: "professional-1",
    clientName: "Cliente Prueba",
    clientWhatsApp: "+56912345678",
    date: "2026-05-10",
    time: "10:00",
  };

  // Multiple serviceIds
  const multi = parseCreateBookingInput({
    ...base,
    serviceIds: ["svc-1", "svc-2"],
  });
  assert.equal(multi.ok, true);
  if (multi.ok) {
    assert.deepEqual(multi.value.serviceIds, ["svc-1", "svc-2"]);
    assert.equal(multi.value.serviceId, "svc-1");
  }

  // Backwards compatibility with single serviceId
  const single = parseCreateBookingInput({
    ...base,
    serviceId: "svc-legacy",
  });
  assert.equal(single.ok, true);
  if (single.ok) {
    assert.deepEqual(single.value.serviceIds, ["svc-legacy"]);
    assert.equal(single.value.serviceId, "svc-legacy");
  }

  // Both serviceId and serviceIds provided
  const both = parseCreateBookingInput({
    ...base,
    serviceId: "svc-1",
    serviceIds: ["svc-1", "svc-2"],
  });
  assert.equal(both.ok, true);
  if (both.ok) {
    assert.deepEqual(both.value.serviceIds, ["svc-1", "svc-2"]);
    assert.equal(both.value.serviceId, "svc-1");
  }

  // Both provided where serviceId was not in serviceIds (normalizes to include both)
  const bothMerged = parseCreateBookingInput({
    ...base,
    serviceId: "svc-1",
    serviceIds: ["svc-2"],
  });
  assert.equal(bothMerged.ok, true);
  if (bothMerged.ok) {
    assert.deepEqual(bothMerged.value.serviceIds, ["svc-1", "svc-2"]);
  }

  // Rejects empty serviceIds without serviceId
  const empty = parseCreateBookingInput({
    ...base,
    serviceIds: [],
  });
  assert.equal(empty.ok, false);

  // Rejects > 5 services
  const tooMany = parseCreateBookingInput({
    ...base,
    serviceIds: ["s1", "s2", "s3", "s4", "s5", "s6"],
  });
  assert.equal(tooMany.ok, false);

  // Rejects invalid string items in serviceIds
  const invalidItem = parseCreateBookingInput({
    ...base,
    serviceIds: ["s1", ""],
  });
  assert.equal(invalidItem.ok, false);

  // Rejects duplicate serviceIds
  const duplicates = parseCreateBookingInput({
    ...base,
    serviceIds: ["svc-1", "svc-1"],
  });
  assert.equal(duplicates.ok, false);
  if (!duplicates.ok) {
    assert.equal(duplicates.error, "No se permiten servicios duplicados en una misma cita");
  }
});

test("createBooking aggregates multi-service duration and price and enforces maxServicesPerBooking", async () => {
  const business = {
    id: "biz-1",
    slug: "salon-demo",
    name: "Salon Demo",
    currency: "CLP",
    timezone: "America/Santiago",
    maxServicesPerBooking: 3,
  };
  const service1 = {
    id: "svc-1",
    businessId: business.id,
    name: "Corte",
    duration: 45,
    price: 15000,
  };
  const service2 = {
    id: "svc-2",
    businessId: business.id,
    name: "Barba",
    duration: 30,
    price: 10000,
  };
  const professional = {
    id: "pro-1",
    businessId: business.id,
    name: "Barbero Juan",
  };

  const fixedClock = { now: () => new Date("2026-05-01T00:00:00.000Z") };
  const calls = { slotsQueries: [], inserts: [] };
  const repository = {
    findBusinessBySlug: async () => business,
    findServiceById: async (id) => {
      if (id === service1.id) return service1;
      if (id === service2.id) return service2;
      return null;
    },
    findProfessionalById: async () => professional,
    getAvailableSlots: async (q) => {
      calls.slotsQueries.push(q);
      return ["11:00"];
    },
    insertIfAvailable: async (input) => {
      calls.inserts.push(input);
      return true;
    },
  };

  // 1. Success case with 2 services
  const result = await createBooking(
    {
      slug: business.slug,
      serviceId: service1.id,
      serviceIds: [service1.id, service2.id],
      professionalId: professional.id,
      clientName: "Carlos Cliente",
      clientWhatsApp: "+56912345678",
      date: "2026-05-10",
      time: "11:00",
    },
    { repository, clock: fixedClock, createId: () => "appt-multi-1" },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.appointment.id, "appt-multi-1");
  assert.equal(result.appointment.service.duration, 75); // 45 + 30
  assert.equal(result.appointment.service.price, 25000); // 15000 + 10000
  assert.equal(result.appointment.service.name, "Corte + Barba");
  assert.equal(result.appointment.services.length, 2);

  // Verifies availability query used totalDuration (75 min)
  assert.equal(calls.slotsQueries.length, 1);
  assert.equal(calls.slotsQueries[0].serviceDurationMinutes, 75);

  // Verifies atomic insert stored durationMinutes and servicesJson
  assert.equal(calls.inserts.length, 1);
  assert.equal(calls.inserts[0].serviceId, service1.id);
  assert.equal(calls.inserts[0].serviceDurationMinutes, 75);
  assert.equal(calls.inserts[0].durationMinutes, 75);
  const parsedJson = JSON.parse(calls.inserts[0].servicesJson);
  assert.equal(parsedJson.length, 2);
  assert.equal(parsedJson[0].id, "svc-1");
  assert.equal(parsedJson[1].id, "svc-2");

  // 2. Enforces maxServicesPerBooking limit
  const businessLimit1 = { ...business, maxServicesPerBooking: 1 };
  const repoLimit = { ...repository, findBusinessBySlug: async () => businessLimit1 };
  const overLimitResult = await createBooking(
    {
      slug: business.slug,
      serviceId: service1.id,
      serviceIds: [service1.id, service2.id],
      professionalId: professional.id,
      clientName: "Carlos Cliente",
      clientWhatsApp: "+56912345678",
      date: "2026-05-10",
      time: "11:00",
    },
    { repository: repoLimit, clock: fixedClock },
  );

  assert.equal(overLimitResult.ok, false);
  if (!overLimitResult.ok) {
    assert.equal(overLimitResult.status, 400);
    assert.match(overLimitResult.error, /El negocio solo permite hasta 1 servicio/);
  }
});

test("parseAvailabilityQuery accepts serviceIds and serviceId and returns normalized serviceIds array", () => {
  // Comma-separated serviceIds
  const multiRes = parseAvailabilityQuery(new URLSearchParams({
    slug: "demo-biz",
    date: "2026-05-10",
    serviceIds: "svc-1,svc-2",
    professionalId: "pro-1",
  }));
  assert.equal(multiRes.ok, true);
  if (multiRes.ok) {
    assert.deepEqual(multiRes.value.serviceIds, ["svc-1", "svc-2"]);
    assert.equal(multiRes.value.serviceId, "svc-1");
    assert.equal(multiRes.value.professionalId, "pro-1");
  }

  // Backwards compatibility with single serviceId
  const singleRes = parseAvailabilityQuery(new URLSearchParams({
    slug: "demo-biz",
    date: "2026-05-10",
    serviceId: "svc-only",
    professionalId: "pro-1",
  }));
  assert.equal(singleRes.ok, true);
  if (singleRes.ok) {
    assert.deepEqual(singleRes.value.serviceIds, ["svc-only"]);
    assert.equal(singleRes.value.serviceId, "svc-only");
  }

  // Both serviceIds and serviceId
  const bothRes = parseAvailabilityQuery(new URLSearchParams({
    slug: "demo-biz",
    date: "2026-05-10",
    serviceIds: "svc-1,svc-2",
    serviceId: "svc-1",
    professionalId: "pro-1",
  }));
  assert.equal(bothRes.ok, true);
  if (bothRes.ok) {
    assert.deepEqual(bothRes.value.serviceIds, ["svc-1", "svc-2"]);
    assert.equal(bothRes.value.serviceId, "svc-1");
  }

  // Limits serviceIds to at most 5 items
  const manyParams = new URLSearchParams();
  manyParams.set("slug", "demo-biz");
  manyParams.set("date", "2026-05-10");
  manyParams.set("professionalId", "pro-1");
  for (let i = 1; i <= 8; i++) {
    manyParams.append("serviceIds", `svc-${i}`);
  }
  const limitedRes = parseAvailabilityQuery(manyParams);
  assert.equal(limitedRes.ok, true);
  if (limitedRes.ok) {
    assert.equal(limitedRes.value.serviceIds.length, 5);
    assert.deepEqual(limitedRes.value.serviceIds, ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"]);
  }

  // Query with no services and no professional (valid for business info fetching)
  const noProRes = parseAvailabilityQuery(new URLSearchParams({
    slug: "demo-biz",
    date: "2026-05-10",
  }));
  assert.equal(noProRes.ok, true);
  if (noProRes.ok) {
    assert.equal(noProRes.value.serviceIds, null);
    assert.equal(noProRes.value.serviceId, null);
    assert.equal(noProRes.value.professionalId, null);
  }

  // Reject when serviceIds provided without professionalId
  const missingPro = parseAvailabilityQuery(new URLSearchParams({
    slug: "demo-biz",
    date: "2026-05-10",
    serviceIds: "svc-1,svc-2",
  }));
  assert.equal(missingPro.ok, false);

  // Reject when professionalId provided without service
  const missingSvc = parseAvailabilityQuery(new URLSearchParams({
    slug: "demo-biz",
    date: "2026-05-10",
    professionalId: "pro-1",
  }));
  assert.equal(missingSvc.ok, false);
});

test("buildWhatsAppReminderUrl formats multiple services and total duration", () => {
  const multiUrl = buildWhatsAppReminderUrl({
    clientName: "Valentina Cliente",
    clientWhatsApp: "+56987654321",
    serviceName: "Corte",
    serviceNames: ["Corte", "Barba", "Perfilado"],
    durationMinutes: 90,
    professionalName: "Rodrigo Barbero",
    dateTime: "2026-05-10T14:00:00.000Z",
    businessName: "Barbería Central",
    price: 35000,
    currency: "CLP",
  });

  const decodedMulti = decodeURIComponent(multiUrl);
  assert.match(decodedMulti, /✂️ \*Servicios:\* Corte \+ Barba \+ Perfilado/);
  assert.match(decodedMulti, /⏱️ \*Duración total:\* 90 min/);
  assert.match(decodedMulti, /💰 \*Total:\* \$35\.000/);
  assert.match(decodedMulti, /wa\.me\/56987654321/);

  // Single service fallback
  const singleUrl = buildWhatsAppReminderUrl({
    clientName: "Juan Perez",
    clientWhatsApp: "912345678",
    serviceName: "Corte Clásico",
    professionalName: "Ana Peluquera",
    dateTime: "2026-05-10T15:00:00.000Z",
  });

  const decodedSingle = decodeURIComponent(singleUrl);
  assert.match(decodedSingle, /✂️ \*Servicio:\* Corte Clásico/);
  assert.doesNotMatch(decodedSingle, /Duración total/);
});
