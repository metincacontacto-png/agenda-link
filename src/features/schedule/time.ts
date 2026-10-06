export interface MinuteInterval {
  startMinute: number;
  endMinute: number;
}

export interface TimedInterval {
  startsAt: Date;
  endsAt: Date;
}

export interface ExistingAppointment {
  dateTime: Date;
  durationMinutes: number;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();
const offsetCache = new Map<string, number[]>();
const SLOT_STEP_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const values = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

export function dateStringAtTimeZone(instant: Date, timeZone: string): string {
  const parts = zonedParts(instant, timeZone);
  return `${parts.year}-${parts.month.toString().padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

function parseDate(date: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const value = new Date(Date.UTC(year, month - 1, day));
  if (
    value.getUTCFullYear() !== year ||
    value.getUTCMonth() !== month - 1 ||
    value.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function isValidDateOnly(date: string): boolean {
  return parseDate(date) !== null;
}

export function parseLocalTime(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function weekdayForDate(date: string): number | null {
  const parsed = parseDate(date);
  if (!parsed) return null;
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).getUTCDay();
}

function addCalendarDays(date: string, days: number): string {
  const parsed = parseDate(date);
  if (!parsed) throw new RangeError("Invalid calendar date");
  const value = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days));
  return value.toISOString().slice(0, 10);
}

function possibleOffsets(date: string, timeZone: string): number[] {
  const key = `${timeZone}:${date}`;
  const cached = offsetCache.get(key);
  if (cached) return cached;

  const parsed = parseDate(date);
  if (!parsed) return [];
  const localNoonAsUtc = Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12);
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = localNoonAsUtc + hours * 60 * 60 * 1000;
    const local = zonedParts(new Date(sample), timeZone);
    const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
    offsets.add(localAsUtc - sample);
  }
  const result = [...offsets];
  offsetCache.set(key, result);
  if (offsetCache.size > 128) offsetCache.delete(offsetCache.keys().next().value as string);
  return result;
}

function sameLocalMinute(parts: ZonedParts, date: string, minuteOfDay: number): boolean {
  const parsed = parseDate(date);
  if (!parsed) return false;
  return parts.year === parsed.year &&
    parts.month === parsed.month &&
    parts.day === parsed.day &&
    parts.hour * 60 + parts.minute === minuteOfDay;
}

/**
 * Resolve a wall-clock minute into UTC. Gaps return null. During a repeated
 * DST hour, select the earliest instant so each visible HH:mm appears once.
 */
export function localMinuteToUtc(date: string, minuteOfDay: number, timeZone: string): Date | null {
  if (!parseDate(date) || !Number.isInteger(minuteOfDay) || minuteOfDay < 0) return null;
  let targetDate = date;
  let targetMinute = minuteOfDay;
  if (targetMinute >= MINUTES_PER_DAY) {
    const days = Math.floor(targetMinute / MINUTES_PER_DAY);
    targetDate = addCalendarDays(targetDate, days);
    targetMinute %= MINUTES_PER_DAY;
  }
  const parsed = parseDate(targetDate);
  if (!parsed) return null;

  const targetAsUtc = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    Math.floor(targetMinute / 60),
    targetMinute % 60,
  );
  const candidates = possibleOffsets(targetDate, timeZone)
    .map((offset) => new Date(targetAsUtc - offset))
    .filter((candidate) => sameLocalMinute(zonedParts(candidate, timeZone), targetDate, targetMinute))
    .sort((left, right) => left.getTime() - right.getTime());
  return candidates[0] ?? null;
}

function firstInstantOfLocalDate(date: string, timeZone: string): Date | null {
  // Some zones jump over local midnight; find the first real minute of the day.
  for (let minute = 0; minute <= 180; minute += 1) {
    const instant = localMinuteToUtc(date, minute, timeZone);
    if (instant) return instant;
  }
  return null;
}

export function localDayUtcRange(date: string, timeZone: string): TimedInterval | null {
  const startsAt = firstInstantOfLocalDate(date, timeZone);
  const endsAt = firstInstantOfLocalDate(addCalendarDays(date, 1), timeZone);
  if (!startsAt || !endsAt || endsAt <= startsAt) return null;
  return { startsAt, endsAt };
}

function intersectWindows(
  businessWindows: MinuteInterval[],
  professionalWindows: MinuteInterval[],
): MinuteInterval[] {
  const intersections: MinuteInterval[] = [];
  for (const business of businessWindows) {
    for (const professional of professionalWindows) {
      const startMinute = Math.max(business.startMinute, professional.startMinute);
      const endMinute = Math.min(business.endMinute, professional.endMinute);
      if (startMinute < endMinute) intersections.push({ startMinute, endMinute });
    }
  }
  return intersections;
}

function overlaps(leftStart: number, leftEnd: number, rightStart: number, rightEnd: number): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

function formatMinute(minuteOfDay: number): string {
  const hours = Math.floor(minuteOfDay / 60).toString().padStart(2, "0");
  const minutes = (minuteOfDay % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function generateAvailableSlots(input: {
  date: string;
  timeZone: string;
  serviceDurationMinutes: number;
  businessWindows: MinuteInterval[];
  professionalWindows: MinuteInterval[];
  breaks: MinuteInterval[];
  blocks: TimedInterval[];
  appointments: ExistingAppointment[];
}): string[] {
  const {
    date,
    timeZone,
    serviceDurationMinutes,
    businessWindows,
    professionalWindows,
    breaks,
    blocks,
    appointments,
  } = input;
  if (
    !parseDate(date) ||
    !Number.isInteger(serviceDurationMinutes) ||
    serviceDurationMinutes < 1
  ) {
    return [];
  }

  const available = new Set<string>();
  for (const window of intersectWindows(businessWindows, professionalWindows)) {
    const firstStart = Math.ceil(window.startMinute / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
    for (let startMinute = firstStart; startMinute + serviceDurationMinutes <= window.endMinute; startMinute += SLOT_STEP_MINUTES) {
      const endMinute = startMinute + serviceDurationMinutes;
      if (breaks.some((pause) => overlaps(startMinute, endMinute, pause.startMinute, pause.endMinute))) continue;

      const startsAt = localMinuteToUtc(date, startMinute, timeZone);
      const endsAt = localMinuteToUtc(date, endMinute, timeZone);
      if (!startsAt || !endsAt || endsAt <= startsAt) continue;

      const hasScheduleBlock = blocks.some((block) =>
        startsAt < block.endsAt && endsAt > block.startsAt,
      );
      if (hasScheduleBlock) continue;

      const overlapsAppointment = appointments.some((appointment) => {
        const appointmentEnd = new Date(
          appointment.dateTime.getTime() + appointment.durationMinutes * 60_000,
        );
        return startsAt < appointmentEnd && endsAt > appointment.dateTime;
      });
      if (!overlapsAppointment) available.add(formatMinute(startMinute));
    }
  }

  return [...available].sort();
}
