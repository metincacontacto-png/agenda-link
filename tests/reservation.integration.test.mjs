import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  dateStringAtTimeZone,
  localMinuteToUtc,
  weekdayForDate,
} from "../src/lib/schedule.ts";

const timeZone = "America/Santiago";
const businessA = randomUUID();
const businessB = randomUUID();
const serviceA = randomUUID();
const shortServiceA = randomUUID();
const serviceB = randomUUID();
const professionalA = randomUUID();
const professionalB = randomUUID();
const professionalOtherBusiness = randomUUID();
const testUserId = randomUUID();
const memberUserId = randomUUID();
const existingAppointmentId = randomUUID();
const historicalAppointmentId = randomUUID();
const date = dateStringAtTimeZone(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), timeZone);
const dayOfWeek = weekdayForDate(date);
const port = 32_000 + Math.floor(Math.random() * 10_000);
const baseUrl = `http://localhost:${port}`;
let server;
let testEmail;
let authCookie;
let memberEmail;
let memberCookie;

function runWrangler(args) {
  execFileSync("npx", ["wrangler", ...args], { stdio: "ignore" });
}

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function makePasswordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  ));
  return `pbkdf2-sha256$100000$${encodeBase64Url(salt)}$${encodeBase64Url(bits)}`;
}

async function insertTestData() {
  const bookingTime = localMinuteToUtc(date, 9 * 60 + 30, timeZone).toISOString();
  const blockStart = localMinuteToUtc(date, 14 * 60, timeZone).toISOString();
  const blockEnd = localMinuteToUtc(date, 15 * 60, timeZone).toISOString();
  testEmail = `reservation-test-${testUserId}@example.invalid`;
  memberEmail = `reservation-member-${memberUserId}@example.invalid`;
  const passwordHash = await makePasswordHash("ReservationTestPassword123!");
  const memberPasswordHash = await makePasswordHash("ReservationMemberPassword123!");
  const sql = `
    INSERT INTO Business (id,name,slug,ownerName,email,category,teamSize,country,currency,timezone,createdAt,updatedAt)
    VALUES ('${businessA}','Booking Test A','booking-test-a','Test Owner','owner-a@example.invalid','TEST','1','CL','CLP','${timeZone}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
           ('${businessB}','Booking Test B','booking-test-b','Test Owner','owner-b@example.invalid','TEST','1','CL','CLP','${timeZone}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
    INSERT INTO Service (id,businessId,name,duration,price,createdAt)
    VALUES ('${serviceA}','${businessA}','Long service',60,25000,CURRENT_TIMESTAMP),
           ('${shortServiceA}','${businessA}','Short service',30,12000,CURRENT_TIMESTAMP),
           ('${serviceB}','${businessB}','Foreign service',30,9000,CURRENT_TIMESTAMP);
    INSERT INTO Professional (id,businessId,name,createdAt)
    VALUES ('${professionalA}','${businessA}','Professional A',CURRENT_TIMESTAMP),
           ('${professionalB}','${businessA}','Professional B',CURRENT_TIMESTAMP),
           ('${professionalOtherBusiness}','${businessB}','Foreign professional',CURRENT_TIMESTAMP);
    INSERT INTO BusinessSchedule (id,businessId,dayOfWeek,startMinute,endMinute)
    VALUES ('${randomUUID()}','${businessA}',${dayOfWeek},540,1080),
           ('${randomUUID()}','${businessB}',${dayOfWeek},540,1080);
    INSERT INTO ProfessionalSchedule (id,professionalId,dayOfWeek,startMinute,endMinute)
    VALUES ('${randomUUID()}','${professionalA}',${dayOfWeek},540,1080),
           ('${randomUUID()}','${professionalB}',${dayOfWeek},540,1080),
           ('${randomUUID()}','${professionalOtherBusiness}',${dayOfWeek},540,1080);
    INSERT INTO ProfessionalBreak (id,professionalId,dayOfWeek,startMinute,endMinute,label)
    VALUES ('${randomUUID()}','${professionalA}',${dayOfWeek},720,780,'Lunch');
    INSERT INTO ScheduleBlock (id,businessId,professionalId,startsAt,endsAt,reason)
    VALUES ('${randomUUID()}','${businessA}','${professionalA}','${blockStart}','${blockEnd}','Blocked');
    INSERT INTO Appointment (id,businessId,serviceId,professionalId,clientName,clientWhatsApp,dateTime,status,paymentStatus,createdAt)
    VALUES ('${existingAppointmentId}','${businessA}','${serviceA}','${professionalA}','Existing test appointment','+56000000000','${bookingTime}','CONFIRMED','PENDING',CURRENT_TIMESTAMP),
           ('${historicalAppointmentId}','${businessA}','${serviceA}','${professionalB}','Historical test appointment','+56987654321','${localMinuteToUtc(date, 15 * 60, timeZone).toISOString()}','CANCELLED','PAID',CURRENT_TIMESTAMP);
    INSERT INTO User (id,name,email,passwordHash,globalRole,createdAt,updatedAt)
    VALUES ('${testUserId}','Reservation Test','${testEmail}','${passwordHash}','USER',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
           ('${memberUserId}','Reservation Member','${memberEmail}','${memberPasswordHash}','USER',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
    INSERT INTO BusinessMember (businessId,userId,role)
    VALUES ('${businessA}','${testUserId}','OWNER'),
           ('${businessA}','${memberUserId}','MEMBER');
  `;
  runWrangler(["d1", "execute", "agenda-link-db", "--local", "--command", sql]);
}

async function waitForServer() {
  const url = `${baseUrl}/api/availability?slug=booking-test-a&date=${date}`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.status === 200) return;
    } catch {
      // The development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Next.js development server did not become ready");
}

function bookingPayload(overrides = {}) {
  return {
    slug: "booking-test-a",
    serviceId: serviceA,
    professionalId: professionalA,
    clientName: "Test Client",
    clientWhatsApp: "+56 9 1234 5678",
    date,
    time: "10:30",
    ...overrides,
  };
}

async function postBooking(payload) {
  return fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

before(async () => {
  runWrangler(["d1", "migrations", "apply", "agenda-link-db", "--local"]);
  await insertTestData();
  server = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, SESSION_SIGNING_SECRET: "local-reservation-test-secret-0123456789" },
    detached: true,
    stdio: "inherit",
  });
  await waitForServer();
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: "ReservationTestPassword123!" }),
  });
  assert.equal(login.status, 200);
  authCookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(authCookie);
  const memberLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: memberEmail, password: "ReservationMemberPassword123!" }),
  });
  assert.equal(memberLogin.status, 200);
  memberCookie = memberLogin.headers.get("set-cookie")?.split(";")[0];
  assert.ok(memberCookie);
});

after(() => {
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // The server may already have exited.
    }
  }
  runWrangler([
    "d1", "execute", "agenda-link-db", "--local", "--command",
    `DELETE FROM Business WHERE id IN ('${businessA}','${businessB}'); DELETE FROM User WHERE id = '${testUserId}';`,
  ]);
});

test("availability respects professional schedules, duration, breaks, blocks, and existing bookings", async () => {
  const query = new URLSearchParams({
    slug: "booking-test-a",
    date,
    serviceId: serviceA,
    professionalId: professionalA,
  });
  const response = await fetch(`${baseUrl}/api/availability?${query}`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.availableSlots.includes("09:00"), false, "existing booking overlaps the slot");
  assert.equal(data.availableSlots.includes("11:30"), false, "service would overlap the recurring break");
  assert.equal(data.availableSlots.includes("14:00"), false, "slot is blocked");
  assert.equal(data.availableSlots.includes("17:30"), false, "60-minute service must fit before closing");

  const secondProfessional = new URLSearchParams({
    slug: "booking-test-a",
    date,
    serviceId: shortServiceA,
    professionalId: professionalB,
  });
  const parallelResponse = await fetch(`${baseUrl}/api/availability?${secondProfessional}`);
  const parallelData = await parallelResponse.json();
  assert.equal(parallelData.availableSlots.includes("09:00"), true, "another professional remains available");
  assert.equal(parallelData.availableSlots.includes("17:30"), true, "30-minute service fits before closing");
});

test("administrative appointments paginate and redact client/payment details by role", async () => {
  const ownerResponse = await fetch(`${baseUrl}/api/admin?slug=booking-test-a&limit=1`, {
    headers: { Cookie: authCookie },
  });
  const ownerData = await ownerResponse.json();
  assert.equal(ownerResponse.status, 200);
  assert.equal(ownerData.business.appointments.length, 1);
  assert.equal(ownerData.appointmentsPagination.total, 2);
  assert.equal(ownerData.appointmentsPagination.hasMore, true);
  assert.equal("email" in ownerData.business, false);
  assert.equal(ownerData.appointmentsPagination.piiRedacted, false);

  const nextPageQuery = new URLSearchParams({
    slug: "booking-test-a",
    limit: "1",
    cursor: ownerData.appointmentsPagination.nextCursor,
  });
  const nextPageResponse = await fetch(`${baseUrl}/api/admin?${nextPageQuery}`, {
    headers: { Cookie: authCookie },
  });
  const nextPageData = await nextPageResponse.json();
  assert.equal(nextPageResponse.status, 200);
  assert.equal(nextPageData.business.appointments.length, 1);
  assert.notEqual(nextPageData.business.appointments[0].id, ownerData.business.appointments[0].id);
  assert.equal(nextPageData.appointmentsPagination.hasMore, false);

  const memberResponse = await fetch(`${baseUrl}/api/admin?slug=booking-test-a&limit=10`, {
    headers: { Cookie: memberCookie },
  });
  const memberData = await memberResponse.json();
  assert.equal(memberResponse.status, 200);
  assert.equal(memberData.appointmentsPagination.piiRedacted, true);
  assert.match(memberData.business.appointments[0].clientWhatsApp, /^••••\d{4}$/);
  assert.equal(memberData.business.appointments[0].paymentAmount, null);
  assert.equal(memberData.business.billingBypass, false);

  const crossBusiness = await fetch(`${baseUrl}/api/admin?slug=booking-test-b`, {
    headers: { Cookie: memberCookie },
  });
  assert.equal(crossBusiness.status, 403);
});

test("booking rejects foreign IDs, malformed/past input, and slots outside schedules", async () => {
  const crossBusiness = await postBooking(bookingPayload({
    serviceId: serviceB,
    professionalId: professionalOtherBusiness,
  }));
  assert.equal(crossBusiness.status, 400);

  const malformed = await postBooking(bookingPayload({ date: "2026-02-30" }));
  assert.equal(malformed.status, 400);

  const past = await postBooking(bookingPayload({ date: "2020-01-01" }));
  assert.equal(past.status, 400);

  const outsideHours = await postBooking(bookingPayload({ time: "08:00" }));
  assert.equal(outsideHours.status, 409);
});

test("admin uploads reject image MIME spoofing before writing a service", async () => {
  const response = await fetch(`${baseUrl}/api/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: authCookie },
    body: JSON.stringify({
      slug: "booking-test-a",
      name: "Invalid image service",
      price: 1000,
      duration: 30,
      imageUrl: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/f9sAAAAASUVORK5CYII=",
    }),
  });
  assert.equal(response.status, 400);
});

test("business members can cancel and reprogram future bookings with audit history", async () => {
  const cancelled = await fetch(`${baseUrl}/api/appointments/${existingAppointmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: authCookie },
    body: JSON.stringify({ action: "cancel" }),
  });
  assert.equal(cancelled.status, 200);
  assert.equal((await cancelled.json()).auditRecorded, true);

  const afterCancel = await fetch(`${baseUrl}/api/availability?${new URLSearchParams({
    slug: "booking-test-a",
    date,
    serviceId: serviceA,
    professionalId: professionalA,
  })}`).then((response) => response.json());
  assert.equal(afterCancel.availableSlots.includes("09:00"), true, "cancellation releases its occupied interval");

  const created = await postBooking(bookingPayload({ time: "09:00" }));
  const newAppointment = await created.json();
  assert.equal(created.status, 200);

  const rescheduled = await fetch(`${baseUrl}/api/appointments/${newAppointment.appointment.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: authCookie },
    body: JSON.stringify({ action: "reschedule", date, time: "11:00" }),
  });
  const rescheduledData = await rescheduled.json();
  assert.equal(rescheduled.status, 200);
  assert.equal(new Date(rescheduledData.dateTime).toISOString(), localMinuteToUtc(date, 11 * 60, timeZone).toISOString());
  assert.equal(rescheduledData.auditRecorded, true);
});

test("client payment claims are ignored and concurrent requests cannot double-book a professional", async () => {
  const paidClaim = await postBooking(bookingPayload({
    professionalId: professionalB,
    time: "10:00",
    paymentStatus: "PAID",
    paymentMethod: "Fake",
    paymentAmount: 1,
  }));
  const paidData = await paidClaim.json();
  assert.equal(paidClaim.status, 200);
  assert.equal(paidData.appointment.paymentStatus, "PENDING");
  assert.equal(paidData.appointment.paymentAmount, null);
  assert.equal(paidData.appointment.service.price, 25000);

  const simultaneous = await Promise.all([
    postBooking(bookingPayload({ time: "13:00" })),
    postBooking(bookingPayload({ time: "13:00" })),
  ]);
  assert.deepEqual(simultaneous.map((response) => response.status).sort(), [200, 409]);
});
