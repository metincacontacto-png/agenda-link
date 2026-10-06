import { isValidDateOnly, parseLocalTime } from "../../lib/schedule.ts";

export interface CreateBookingInput {
  slug: string;
  serviceId: string;
  professionalId: string;
  clientName: string;
  clientWhatsApp: string;
  date: string;
  time: string;
}

export type BookingInputResult =
  | { ok: true; value: CreateBookingInput }
  | { ok: false; error: string };

export interface AvailabilityQuery {
  slug: string;
  date: string;
  serviceId: string | null;
  professionalId: string | null;
}

export type AvailabilityQueryResult =
  | { ok: true; value: AvailabilityQuery }
  | { ok: false; error: string };

function boundedString(value: unknown, min: number, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length >= min && normalized.length <= max ? normalized : null;
}

export function parseCreateBookingInput(input: unknown): BookingInputResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Datos de reserva inválidos" };
  }
  const record = input as Record<string, unknown>;
  const slug = boundedString(record.slug, 1, 100);
  const serviceId = boundedString(record.serviceId, 1, 100);
  const professionalId = boundedString(record.professionalId, 1, 100);
  const clientName = boundedString(record.clientName, 1, 100);
  const clientWhatsApp = boundedString(record.clientWhatsApp, 7, 32);
  const date = boundedString(record.date, 10, 10);
  const time = boundedString(record.time, 5, 5);

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: "Slug de negocio inválido" };
  }
  if (!serviceId || !professionalId) {
    return { ok: false, error: "Selecciona un servicio y un profesional" };
  }
  if (!clientName || /[\u0000-\u001f\u007f]/.test(clientName)) {
    return { ok: false, error: "Nombre de cliente inválido" };
  }
  if (!clientWhatsApp || !/^\+?[0-9\s().-]{7,32}$/.test(clientWhatsApp)) {
    return { ok: false, error: "WhatsApp o teléfono inválido" };
  }
  if (!date || !isValidDateOnly(date) || !time || parseLocalTime(time) === null) {
    return { ok: false, error: "Fecha u hora inválida" };
  }

  return {
    ok: true,
    value: { slug, serviceId, professionalId, clientName, clientWhatsApp, date, time },
  };
}

export function parseAvailabilityQuery(params: URLSearchParams): AvailabilityQueryResult {
  const slug = boundedString(params.get("slug"), 1, 100);
  const date = boundedString(params.get("date"), 10, 10);
  const serviceId = params.get("serviceId");
  const professionalId = params.get("professionalId");

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: "Slug de negocio inválido" };
  }
  if (!date || !isValidDateOnly(date)) {
    return { ok: false, error: "Fecha inválida" };
  }
  if (
    (serviceId !== null && (!serviceId || serviceId.length > 100)) ||
    (professionalId !== null && (!professionalId || professionalId.length > 100)) ||
    Boolean(serviceId) !== Boolean(professionalId)
  ) {
    return { ok: false, error: "Selecciona un servicio y profesional válidos" };
  }

  return { ok: true, value: { slug, date, serviceId, professionalId } };
}
