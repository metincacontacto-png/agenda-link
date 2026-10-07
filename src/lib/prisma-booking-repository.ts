import { getAvailableSlotsForProfessional } from "@/features/booking/availability";
import type { AtomicBookingInput, BookingRepository } from "@/features/booking/ports";
import { prisma } from "@/lib/db";

export const prismaBookingRepository: BookingRepository = {
  findBusinessBySlug(slug) {
    return prisma.business.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, currency: true, timezone: true },
    });
  },

  findServiceById(serviceId) {
    return prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, businessId: true, name: true, duration: true, price: true },
    });
  },

  findProfessionalById(professionalId) {
    return prisma.professional.findUnique({
      where: { id: professionalId },
      select: { id: true, businessId: true, name: true },
    });
  },

  getAvailableSlots: getAvailableSlotsForProfessional,

  async insertIfAvailable(input: AtomicBookingInput) {
    const inserted = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "Appointment" (
        "id", "businessId", "serviceId", "professionalId", "clientName",
        "clientWhatsApp", "dateTime", "status", "paymentStatus",
        "paymentMethod", "paymentAmount"
      )
      SELECT
        ${input.id}, ${input.businessId}, ${input.serviceId}, ${input.professionalId},
        ${input.clientName}, ${input.clientWhatsApp}, ${input.dateTime},
        'CONFIRMED', 'PENDING', NULL, NULL
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Appointment" AS existing
        INNER JOIN "Service" AS existingService ON existingService."id" = existing."serviceId"
        WHERE existing."businessId" = ${input.businessId}
          AND existing."professionalId" = ${input.professionalId}
          AND existing."status" NOT IN ('CANCELLED', 'CANCELED')
          AND julianday(existing."dateTime") < julianday(${input.dateTime}) + (${input.serviceDurationMinutes} / 1440.0)
          AND julianday(existing."dateTime") + (existingService."duration" / 1440.0) > julianday(${input.dateTime})
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "ScheduleBlock" AS block
        WHERE block."businessId" = ${input.businessId}
          AND (block."professionalId" IS NULL OR block."professionalId" = ${input.professionalId})
          AND julianday(block."startsAt") < julianday(${input.dateTime}) + (${input.serviceDurationMinutes} / 1440.0)
          AND julianday(block."endsAt") > julianday(${input.dateTime})
      )
      RETURNING "id"
    `;
    return inserted.length > 0;
  },
};
