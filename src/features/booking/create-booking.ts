import { prisma } from "@/lib/db";
import { getAvailableSlotsForProfessional } from "@/features/booking/availability";
import type { CreateBookingInput } from "@/features/booking/validation";
import { localMinuteToUtc, parseLocalTime } from "@/features/schedule/time";

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

function rejected(status: 400 | 404 | 409, error: string): CreateBookingResult {
  return { ok: false, status, error };
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const business = await prisma.business.findUnique({
    where: { slug: input.slug },
    select: { id: true, slug: true, name: true, currency: true, timezone: true },
  });
  if (!business) return rejected(404, "Negocio no encontrado");

  const [service, professional] = await Promise.all([
    prisma.service.findUnique({
      where: { id: input.serviceId },
      select: { id: true, businessId: true, name: true, duration: true, price: true },
    }),
    prisma.professional.findUnique({
      where: { id: input.professionalId },
      select: { id: true, businessId: true, name: true },
    }),
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
  if (dateTime.getTime() <= Date.now()) return rejected(400, "La reserva debe ser futura");

  const availableSlots = await getAvailableSlotsForProfessional({
    businessId: business.id,
    professionalId: professional.id,
    date: input.date,
    timeZone: business.timezone,
    serviceDurationMinutes: service.duration,
  });
  if (!availableSlots.includes(input.time)) {
    return rejected(409, "El horario ya no está disponible");
  }

  const appointmentId = crypto.randomUUID();
  const instant = dateTime.toISOString();
  const inserted = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "Appointment" (
      "id", "businessId", "serviceId", "professionalId", "clientName",
      "clientWhatsApp", "dateTime", "status", "paymentStatus",
      "paymentMethod", "paymentAmount"
    )
    SELECT
      ${appointmentId}, ${business.id}, ${service.id}, ${professional.id},
      ${input.clientName}, ${input.clientWhatsApp}, ${instant},
      'CONFIRMED', 'PENDING', NULL, NULL
    WHERE NOT EXISTS (
      SELECT 1
      FROM "Appointment" AS existing
      INNER JOIN "Service" AS existingService ON existingService."id" = existing."serviceId"
      WHERE existing."businessId" = ${business.id}
        AND existing."professionalId" = ${professional.id}
        AND existing."status" NOT IN ('CANCELLED', 'CANCELED')
        AND julianday(existing."dateTime") < julianday(${instant}) + (${service.duration} / 1440.0)
        AND julianday(existing."dateTime") + (existingService."duration" / 1440.0) > julianday(${instant})
    )
    AND NOT EXISTS (
      SELECT 1
      FROM "ScheduleBlock" AS block
      WHERE block."businessId" = ${business.id}
        AND (block."professionalId" IS NULL OR block."professionalId" = ${professional.id})
        AND julianday(block."startsAt") < julianday(${instant}) + (${service.duration} / 1440.0)
        AND julianday(block."endsAt") > julianday(${instant})
    )
    RETURNING "id"
  `;
  if (inserted.length === 0) {
    return rejected(409, "El horario acaba de dejar de estar disponible");
  }

  return {
    ok: true,
    appointment: {
      id: inserted[0].id,
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
