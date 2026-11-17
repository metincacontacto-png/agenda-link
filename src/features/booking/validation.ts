import { isValidDateOnly, parseLocalTime } from "../schedule/time.ts";

export interface CreateBookingInput {
  slug: string;
  serviceId: string;
  serviceIds?: string[];
  professionalId: string;
  clientName: string;
  clientWhatsApp: string;
  clientEmail?: string;
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
  serviceIds: string[] | null;
  professionalId: string | null;
}

export type AppointmentChangeInput =
  | { action: "cancel" }
  | { action: "reschedule"; date: string; time: string };

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
  const professionalId = boundedString(record.professionalId, 1, 100);
  const clientName = boundedString(record.clientName, 1, 100);
  const clientWhatsApp = boundedString(record.clientWhatsApp, 1, 32);
  const rawEmail = boundedString(record.clientEmail, 3, 254);
  const date = boundedString(record.date, 10, 10);
  const time = boundedString(record.time, 5, 5);

  let rawServiceIds: unknown[] = [];
  if (Array.isArray(record.serviceIds)) {
    rawServiceIds = [...record.serviceIds];
  } else if (record.serviceIds !== undefined && record.serviceIds !== null) {
    return { ok: false, error: "Selecciona un servicio y un profesional" };
  }

  const singleServiceId = boundedString(record.serviceId, 1, 100);
  if (singleServiceId && !rawServiceIds.includes(singleServiceId)) {
    rawServiceIds = [singleServiceId, ...rawServiceIds];
  }

  const serviceIds: string[] = [];
  for (const item of rawServiceIds) {
    const s = boundedString(item, 1, 100);
    if (!s) {
      return { ok: false, error: "Selecciona un servicio y un profesional" };
    }
    serviceIds.push(s);
  }

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: "Slug de negocio inválido" };
  }
  if (serviceIds.length === 0 || !professionalId) {
    return { ok: false, error: "Selecciona un servicio y un profesional" };
  }
  if (new Set(serviceIds).size !== serviceIds.length) {
    return { ok: false, error: "No se permiten servicios duplicados en una misma cita" };
  }
  if (serviceIds.length > 5) {
    return { ok: false, error: "Selecciona como máximo 5 servicios" };
  }
  if (!clientName || /[\u0000-\u001f\u007f]/.test(clientName)) {
    return { ok: false, error: "Nombre de cliente inválido" };
  }
  if (!clientWhatsApp) {
    return { ok: false, error: "Ingresa un celular chileno válido (9 dígitos)" };
  }
  const cleanPhone = clientWhatsApp.replace(/\D/g, "").replace(/^(56)?/, "");
  if (!/^9\d{8}$/.test(cleanPhone)) {
    return { ok: false, error: "Ingresa un celular chileno válido (9 dígitos)" };
  }
  const normalizedWhatsApp = "+56" + cleanPhone;
  let clientEmail: string | undefined;
  if (rawEmail) {
    const normalized = rawEmail.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { ok: false, error: "Correo electrónico inválido" };
    }
    clientEmail = normalized;
  }
  if (!date || !isValidDateOnly(date) || !time || parseLocalTime(time) === null) {
    return { ok: false, error: "Fecha u hora inválida" };
  }

  return {
    ok: true,
    value: {
      slug,
      serviceId: serviceIds[0],
      serviceIds,
      professionalId,
      clientName,
      clientWhatsApp: normalizedWhatsApp,
      ...(clientEmail ? { clientEmail } : {}),
      date,
      time,
    },
  };
}

export function parseAvailabilityQuery(params: URLSearchParams): AvailabilityQueryResult {
  const slug = boundedString(params.get("slug"), 1, 100);
  const date = boundedString(params.get("date"), 10, 10);
  const professionalId = boundedString(params.get("professionalId"), 1, 100);

  const rawServiceIdsList = params.getAll("serviceIds").slice(0, 5);
  const rawServiceIdParam = params.get("serviceId");

  const parsedServiceIds: string[] = [];
  for (const item of rawServiceIdsList) {
    const split = item.split(",").map((s) => s.trim()).filter(Boolean);
    for (const s of split) {
      if (!parsedServiceIds.includes(s)) {
        parsedServiceIds.push(s);
      }
    }
  }
  if (rawServiceIdParam) {
    const single = rawServiceIdParam.trim();
    if (single && !parsedServiceIds.includes(single)) {
      parsedServiceIds.push(single);
    }
  }

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: "Slug de negocio inválido" };
  }
  if (!date || !isValidDateOnly(date)) {
    return { ok: false, error: "Fecha inválida" };
  }

  const hasServicesParam = rawServiceIdsList.length > 0 || rawServiceIdParam !== null;
  const hasProfessionalParam = params.get("professionalId") !== null;

  if (hasServicesParam !== hasProfessionalParam) {
    return { ok: false, error: "Selecciona un servicio y profesional válidos" };
  }

  if (hasServicesParam && hasProfessionalParam) {
    if (!professionalId || parsedServiceIds.length === 0) {
      return { ok: false, error: "Selecciona un servicio y profesional válidos" };
    }
    for (const id of parsedServiceIds) {
      if (!boundedString(id, 1, 100)) {
        return { ok: false, error: "Selecciona un servicio y profesional válidos" };
      }
    }
    const cappedServiceIds = parsedServiceIds.slice(0, 5);
    return {
      ok: true,
      value: {
        slug,
        date,
        serviceId: cappedServiceIds[0],
        serviceIds: cappedServiceIds,
        professionalId,
      },
    };
  }

  return {
    ok: true,
    value: {
      slug,
      date,
      serviceId: null,
      serviceIds: null,
      professionalId: null,
    },
  };
}

export function parseAppointmentChangeInput(input: unknown):
  | { ok: true; value: AppointmentChangeInput }
  | { ok: false; error: string } {
  if (typeof input !== "object" || input === null || !("action" in input)) {
    return { ok: false, error: "Solicitud de cambio inválida" };
  }
  const record = input as Record<string, unknown>;
  if (record.action === "cancel") return { ok: true, value: { action: "cancel" } };
  if (record.action !== "reschedule") {
    return { ok: false, error: "Acción de cita no válida" };
  }

  const date = boundedString(record.date, 10, 10);
  const time = boundedString(record.time, 5, 5);
  if (!date || !isValidDateOnly(date) || !time || parseLocalTime(time) === null) {
    return { ok: false, error: "Nueva fecha u hora inválida" };
  }
  return { ok: true, value: { action: "reschedule", date, time } };
}
