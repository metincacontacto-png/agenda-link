import { prisma } from "@/lib/db";
import {
  generateAvailableSlots,
  localDayUtcRange,
  weekdayForDate,
} from "@/features/schedule/time";

export async function getAvailableSlotsForProfessional(input: {
  businessId: string;
  professionalId: string;
  date: string;
  timeZone: string;
  serviceDurationMinutes: number;
  excludeAppointmentId?: string;
}): Promise<string[]> {
  const { businessId, professionalId, date, timeZone, serviceDurationMinutes, excludeAppointmentId } = input;
  const dayOfWeek = weekdayForDate(date);
  const dayRange = localDayUtcRange(date, timeZone);
  if (dayOfWeek === null || !dayRange) return [];

  const [businessSchedules, professionalSchedules, breaks, blocks, appointments] = await Promise.all([
    prisma.businessSchedule.findMany({ where: { businessId, dayOfWeek } }),
    prisma.professionalSchedule.findMany({ where: { professionalId, dayOfWeek } }),
    prisma.professionalBreak.findMany({ where: { professionalId, dayOfWeek } }),
    prisma.scheduleBlock.findMany({
      where: {
        businessId,
        AND: [
          { startsAt: { lt: dayRange.endsAt } },
          { endsAt: { gt: dayRange.startsAt } },
        ],
        OR: [{ professionalId: null }, { professionalId }],
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.appointment.findMany({
      where: {
        businessId,
        professionalId,
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        status: "CONFIRMED",
        dateTime: { gte: dayRange.startsAt, lt: dayRange.endsAt },
      },
      include: { service: { select: { duration: true } } },
    }),
  ]);

  return generateAvailableSlots({
    date,
    timeZone,
    serviceDurationMinutes,
    businessWindows: businessSchedules,
    professionalWindows: professionalSchedules,
    breaks,
    blocks,
    appointments: appointments.map((appointment) => ({
      dateTime: appointment.dateTime,
      durationMinutes: appointment.service.duration,
    })),
  });
}
