import test from "node:test";
import assert from "node:assert/strict";
import {
  generateAvailableSlots,
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

test("parses strict local dates, times, and weekdays", () => {
  assert.equal(parseLocalTime("09:30"), 570);
  assert.equal(parseLocalTime("24:00"), null);
  assert.equal(weekdayForDate("2026-01-05"), 1);
  assert.equal(weekdayForDate("2026-02-30"), null);
});
