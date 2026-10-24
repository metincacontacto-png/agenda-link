import test from "node:test";
import assert from "node:assert/strict";
import {
  generateAvailableSlots,
  generateSlots,
  localDayUtcRange,
  localMinuteToUtc,
  parseLocalTime,
  weekdayForDate,
} from "../src/features/schedule/time.ts";

test("resolves a Chilean local time to the matching UTC instant", () => {
  assert.equal(
    localMinuteToUtc("2026-01-05", 9 * 60, "America/Santiago")?.toISOString(),
    "2026-01-05T12:00:00.000Z",
  );
});

test("rejects a wall-clock time skipped by the spring DST transition", () => {
  assert.equal(localMinuteToUtc("2026-09-06", 30, "America/Santiago"), null);
});

test("chooses the earlier instant for a repeated wall-clock time", () => {
  assert.equal(
    localMinuteToUtc("2026-04-04", 23 * 60 + 30, "America/Santiago")?.toISOString(),
    "2026-04-05T02:30:00.000Z",
  );
});

test("calculates 23-hour and 25-hour civil days across DST", () => {
  const springDay = localDayUtcRange("2026-09-06", "America/Santiago");
  const fallDay = localDayUtcRange("2026-04-04", "America/Santiago");

  assert.ok(springDay);
  assert.ok(fallDay);
  assert.equal(springDay.endsAt.getTime() - springDay.startsAt.getTime(), 23 * 60 * 60 * 1000);
  assert.equal(fallDay.endsAt.getTime() - fallDay.startsAt.getTime(), 25 * 60 * 60 * 1000);
});

test("generates service-duration slots after intersecting schedules and removing breaks, blocks, and appointments", () => {
  const slots = generateAvailableSlots({
    date: "2026-01-05",
    timeZone: "America/Santiago",
    serviceDurationMinutes: 60,
    businessWindows: [{ startMinute: 540, endMinute: 1080 }],
    professionalWindows: [{ startMinute: 540, endMinute: 1080 }],
    breaks: [{ startMinute: 720, endMinute: 780 }],
    blocks: [{
      startsAt: new Date("2026-01-05T17:00:00.000Z"),
      endsAt: new Date("2026-01-05T18:00:00.000Z"),
    }],
    appointments: [{ dateTime: new Date("2026-01-05T12:30:00.000Z"), durationMinutes: 60 }],
  });

  assert.deepEqual(slots, ["10:30", "11:00", "13:00", "15:00", "15:30", "16:00", "16:30", "17:00"]);
});

test("generateSlots returns both availableSlots and bookedSlots for booked appointments", () => {
  const result = generateSlots({
    date: "2026-01-05",
    timeZone: "America/Santiago",
    serviceDurationMinutes: 60,
    businessWindows: [{ startMinute: 540, endMinute: 1080 }],
    professionalWindows: [{ startMinute: 540, endMinute: 1080 }],
    breaks: [],
    blocks: [],
    appointments: [{ dateTime: new Date("2026-01-05T14:30:00.000Z"), durationMinutes: 60 }],
  });

  // 14:30 UTC is 11:30 Santiago time (UTC-3)
  assert.ok(result.bookedSlots.includes("11:30"));
  assert.ok(!result.availableSlots.includes("11:30"));
});

test("generateSlots marks schedule blocks as bookedSlots (red/occupied) rather than omitting them", () => {
  const result = generateSlots({
    date: "2026-01-05",
    timeZone: "America/Santiago",
    serviceDurationMinutes: 60,
    businessWindows: [{ startMinute: 540, endMinute: 1080 }],
    professionalWindows: [{ startMinute: 540, endMinute: 1080 }],
    breaks: [],
    blocks: [{
      startsAt: new Date("2026-01-05T13:00:00.000Z"), // 10:00 Santiago
      endsAt: new Date("2026-01-05T15:00:00.000Z"),   // 12:00 Santiago
    }],
    appointments: [],
  });

  assert.ok(result.bookedSlots.includes("10:00"));
  assert.ok(result.bookedSlots.includes("10:30"));
  assert.ok(!result.availableSlots.includes("10:00"));
  assert.ok(!result.availableSlots.includes("10:30"));
});



test("filters out past slots when minDateTime is provided", () => {
  // 14:00 in Santiago (UTC-3) is 17:00:00.000Z
  const minDateTime = new Date("2026-01-05T17:00:00.000Z");
  const slots = generateAvailableSlots({
    date: "2026-01-05",
    timeZone: "America/Santiago",
    serviceDurationMinutes: 60,
    businessWindows: [{ startMinute: 540, endMinute: 1080 }],
    professionalWindows: [{ startMinute: 540, endMinute: 1080 }],
    breaks: [],
    blocks: [],
    appointments: [],
    minDateTime,
  });

  // All slots 14:00 and earlier are filtered out; only 14:30, 15:00, etc. remain
  assert.ok(!slots.includes("09:00"));
  assert.ok(!slots.includes("10:00"));
  assert.ok(!slots.includes("13:30"));
  assert.ok(!slots.includes("14:00"));
  assert.ok(slots.includes("14:30"));
  assert.ok(slots.includes("15:00"));
});

test("parses strict local dates, times, and weekdays", () => {
  assert.equal(parseLocalTime("09:30"), 570);
  assert.equal(parseLocalTime("24:00"), null);
  assert.equal(weekdayForDate("2026-01-05"), 1);
  assert.equal(weekdayForDate("2026-02-30"), null);
});

test("supports multi-day date range blocking spanning from startRange.startsAt to endRange.endsAt", () => {
  const timeZone = "America/Santiago";
  const startDate = "2026-01-05";
  const endDate = "2026-01-07";

  const startRange = localDayUtcRange(startDate, timeZone);
  const endRange = localDayUtcRange(endDate, timeZone);
  assert.ok(startRange);
  assert.ok(endRange);

  const multiDayBlock = {
    startsAt: startRange.startsAt,
    endsAt: endRange.endsAt,
  };

  // Verify that for all dates in the range (start, middle, end), all slots are marked as booked
  for (const date of ["2026-01-05", "2026-01-06", "2026-01-07"]) {
    const result = generateSlots({
      date,
      timeZone,
      serviceDurationMinutes: 60,
      businessWindows: [{ startMinute: 540, endMinute: 1080 }],
      professionalWindows: [{ startMinute: 540, endMinute: 1080 }],
      breaks: [],
      blocks: [multiDayBlock],
      appointments: [],
    });

    assert.equal(result.availableSlots.length, 0, `Expected no available slots on blocked day ${date}`);
    assert.ok(result.bookedSlots.length > 0, `Expected booked slots on blocked day ${date}`);
    assert.ok(result.bookedSlots.includes("09:00"));
    assert.ok(result.bookedSlots.includes("17:00"));
  }

  // Verify that dates outside the range are NOT blocked by this multi-day block
  const resultAfter = generateSlots({
    date: "2026-01-08",
    timeZone,
    serviceDurationMinutes: 60,
    businessWindows: [{ startMinute: 540, endMinute: 1080 }],
    professionalWindows: [{ startMinute: 540, endMinute: 1080 }],
    breaks: [],
    blocks: [multiDayBlock],
    appointments: [],
  });

  assert.ok(resultAfter.availableSlots.length > 0, "Expected available slots on day after block");
  assert.equal(resultAfter.bookedSlots.length, 0, "Expected no booked slots on day after block");
  assert.ok(resultAfter.availableSlots.includes("09:00"));
});

test("supports specific slot blocking using localMinuteToUtc", () => {
  const timeZone = "America/Santiago";
  const date = "2026-01-05";
  const slotMinute = 14 * 60; // 14:00
  const durationMinutes = 60;

  const slotStart = localMinuteToUtc(date, slotMinute, timeZone);
  const slotEnd = localMinuteToUtc(date, slotMinute + durationMinutes, timeZone);
  assert.ok(slotStart);
  assert.ok(slotEnd);

  const slotBlock = {
    startsAt: slotStart,
    endsAt: slotEnd,
  };

  const result = generateSlots({
    date,
    timeZone,
    serviceDurationMinutes: 60,
    businessWindows: [{ startMinute: 540, endMinute: 1080 }],
    professionalWindows: [{ startMinute: 540, endMinute: 1080 }],
    breaks: [],
    blocks: [slotBlock],
    appointments: [],
  });

  // 14:00 slot is blocked
  assert.ok(result.bookedSlots.includes("14:00"));
  assert.ok(!result.availableSlots.includes("14:00"));
  // 13:30 slot overlaps 14:00-15:00 for a 60-min service, so it is also blocked
  assert.ok(result.bookedSlots.includes("13:30"));
  assert.ok(!result.availableSlots.includes("13:30"));
  // Earlier and later slots remain available
  assert.ok(result.availableSlots.includes("09:00"));
  assert.ok(result.availableSlots.includes("15:00"));
});

