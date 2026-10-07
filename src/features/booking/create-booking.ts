import type { Clock } from "../schedule/clock.ts";
import { systemClock } from "../schedule/clock.ts";
import { localMinuteToUtc, parseLocalTime } from "../schedule/time.ts";
import type { BookingRepository } from "./ports.ts";
import type { CreateBookingInput } from "./validation.ts";

export interface BookingReceipt {
  id: string;
  dateTime: Date;
  status: "CONFIRMED";
  paymentStatus: "PENDING";
  paymentAmount: null;
  paymentMethod: null;
  service: { name: string; duration: number; price: number };
  professional: { name: string };
  business: { id: string; slug: string; name: string; currency: string; timezone: string };
}

export type CreateBookingResult =
  | { ok: true; appointment: BookingReceipt }
  | { ok: false; status: 400 | 404 | 409; error: string };

export interface CreateBookingDependencies {
  repository: BookingRepository;
  clock?: Clock;
  createId?: () => string;
}

function rejected(status: 400 | 404 | 409, error: string): CreateBookingResult {
  return { ok: false, status, error };
}

export async function createBooking(
  input: CreateBookingInput,
  dependencies: CreateBookingDependencies,
): Promise<CreateBookingResult> {
  const { repository } = dependencies;
  const clock = dependencies.clock ?? systemClock;
  const createId = dependencies.createId ?? (() => crypto.randomUUID());

  const business = await repository.findBusinessBySlug(input.slug);
  if (!business) return rejected(404, "Negocio no encontrado");

  const [service, professional] = await Promise.all([
    repository.findServiceById(input.serviceId),
    repository.findProfessionalById(input.professionalId),
  ]);
  if (
    !service ||
    !professional ||
    service.businessId !== business.id ||
    professional.businessId !== business.id
  ) {
    return rejected(400, "Servicio o profesional no pertenece a este negocio");
  }

  const minuteOfDay = parseLocalTime(input.time);
  if (minuteOfDay === null) return rejected(400, "Fecha u hora inválida");
  const dateTime = localMinuteToUtc(input.date, minuteOfDay, business.timezone);
  if (!dateTime) return rejected(400, "La hora elegida no existe en la zona horaria del negocio");
  if (dateTime.getTime() <= clock.now().getTime()) return rejected(400, "La reserva debe ser futura");

  const availableSlots = await repository.getAvailableSlots({
    businessId: business.id,
    professionalId: professional.id,
    date: input.date,
    timeZone: business.timezone,
    serviceDurationMinutes: service.duration,
  });
  if (!availableSlots.includes(input.time)) {
    return rejected(409, "El horario ya no está disponible");
  }

  const appointmentId = createId();
  const dateTimeIso = dateTime.toISOString();
  const inserted = await repository.insertIfAvailable({
    id: appointmentId,
    businessId: business.id,
    serviceId: service.id,
    professionalId: professional.id,
    clientName: input.clientName,
    clientWhatsApp: input.clientWhatsApp,
    dateTime: dateTimeIso,
    serviceDurationMinutes: service.duration,
  });
  if (!inserted) return rejected(409, "El horario acaba de dejar de estar disponible");

  return {
    ok: true,
    appointment: {
      id: appointmentId,
      dateTime,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      paymentAmount: null,
      paymentMethod: null,
      service: { name: service.name, duration: service.duration, price: service.price },
      professional: { name: professional.name },
      business,
    },
  };
}
