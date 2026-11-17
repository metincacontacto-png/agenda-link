import type { Clock } from "../schedule/clock.ts";
import { systemClock } from "../schedule/clock.ts";
import { localMinuteToUtc, parseLocalTime } from "../schedule/time.ts";
import type { BookingBusiness, BookingRepository, BookingService } from "./ports.ts";
import type { CreateBookingInput } from "./validation.ts";

export interface BookingReceipt {
  id: string;
  dateTime: Date;
  status: "CONFIRMED";
  paymentStatus: "PENDING";
  paymentAmount: null;
  paymentMethod: null;
  service: { name: string; duration: number; price: number };
  services?: Array<{ id: string; name: string; duration: number; price: number }>;
  professional: { name: string };
  business: BookingBusiness;
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

  const serviceIds =
    input.serviceIds && input.serviceIds.length > 0
      ? input.serviceIds
      : input.serviceId
        ? [input.serviceId]
        : [];

  const maxServices = business.maxServicesPerBooking ?? 1;
  if (serviceIds.length === 0) {
    return rejected(400, "Selecciona un servicio y un profesional");
  }
  if (serviceIds.length > maxServices) {
    return rejected(
      400,
      `El negocio solo permite hasta ${maxServices} servicio${maxServices === 1 ? "" : "s"} por reserva`,
    );
  }

  const [professional, rawServices] = await Promise.all([
    repository.findProfessionalById(input.professionalId),
    repository.findServicesByIds
      ? repository.findServicesByIds(serviceIds)
      : Promise.all(serviceIds.map((id) => repository.findServiceById(id))),
  ]);

  if (!professional || professional.businessId !== business.id) {
    return rejected(400, "Servicio o profesional no pertenece a este negocio");
  }

  const serviceMap = new Map(
    (rawServices.filter(Boolean) as BookingService[]).map((s) => [s.id, s]),
  );
  const services: BookingService[] = [];
  for (const id of serviceIds) {
    const s = serviceMap.get(id);
    if (s && s.businessId === business.id) {
      services.push(s);
    }
  }

  if (services.length !== serviceIds.length) {
    return rejected(400, "Servicio o profesional no pertenece a este negocio");
  }

  const minuteOfDay = parseLocalTime(input.time);
  if (minuteOfDay === null) return rejected(400, "Fecha u hora inválida");
  const dateTime = localMinuteToUtc(input.date, minuteOfDay, business.timezone);
  if (!dateTime) return rejected(400, "La hora elegida no existe en la zona horaria del negocio");
  if (dateTime.getTime() <= clock.now().getTime()) return rejected(400, "La reserva debe ser futura");
  const minNoticeHours = business.minNoticeHours ?? 2;
  const minRequiredTime = clock.now().getTime() + minNoticeHours * 60 * 60 * 1000;
  if (dateTime.getTime() < minRequiredTime) {
    return rejected(400, `Las reservas requieren al menos ${minNoticeHours} hora${minNoticeHours === 1 ? "" : "s"} de anticipación`);
  }

  const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);
  const totalPrice = services.reduce((acc, s) => acc + s.price, 0);
  const servicesJson = JSON.stringify(
    services.map((s) => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      price: s.price,
    })),
  );
  const primaryService = services[0];

  const availableSlots = await repository.getAvailableSlots({
    businessId: business.id,
    professionalId: professional.id,
    date: input.date,
    timeZone: business.timezone,
    serviceDurationMinutes: totalDuration,
    minDateTime: new Date(minRequiredTime),
    minNoticeHours,
  });
  if (!availableSlots.includes(input.time)) {
    return rejected(409, "El horario ya no está disponible");
  }

  const appointmentId = createId();
  const dateTimeIso = dateTime.toISOString();
  const inserted = await repository.insertIfAvailable({
    id: appointmentId,
    businessId: business.id,
    serviceId: primaryService.id,
    professionalId: professional.id,
    clientName: input.clientName,
    clientWhatsApp: input.clientWhatsApp,
    dateTime: dateTimeIso,
    serviceDurationMinutes: totalDuration,
    durationMinutes: totalDuration,
    servicesJson,
  });
  if (!inserted) return rejected(409, "El horario acaba de dejar de estar disponible");

  const combinedName =
    services.length > 1
      ? services.map((s) => s.name).join(" + ")
      : primaryService.name;

  return {
    ok: true,
    appointment: {
      id: appointmentId,
      dateTime,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      paymentAmount: null,
      paymentMethod: null,
      service: {
        name: combinedName,
        duration: totalDuration,
        price: totalPrice,
      },
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        duration: s.duration,
        price: s.price,
      })),
      professional: { name: professional.name },
      business,
    },
  };
}
