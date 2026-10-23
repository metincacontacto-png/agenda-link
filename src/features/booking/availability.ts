import { prisma } from "@/lib/db";
import {
  generateAvailableSlots,
  generateSlots,
  localDayUtcRange,
  weekdayForDate,
  type GenerateSlotsResult,
} from "@/features/schedule/time";

export interface ProfessionalSlotsInput {
  businessId: string;
  professionalId: string;
  date: string;
  timeZone: string;
  serviceDurationMinutes: number;
  excludeAppointmentId?: string;
  minDateTime?: Date;
  minNoticeHours?: number;
}

export async function getSlotsForProfessional(
  input: ProfessionalSlotsInput,
): Promise<GenerateSlotsResult> {
  const { businessId, professionalId, date, timeZone, serviceDurationMinutes, excludeAppointmentId } = input;
  const minNoticeHours = input.minNoticeHours ?? 2;
  const minDateTime = input.minDateTime ?? new Date(Date.now() + minNoticeHours * 60 * 60 * 1000);
  const dayOfWeek = weekdayForDate(date);
  const dayRange = localDayUtcRange(date, timeZone);
  if (dayOfWeek === null || !dayRange) return { availableSlots: [], bookedSlots: [] };

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

  return generateSlots({
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
    minDateTime,
  });
}

export async function getAvailableSlotsForProfessional(
  input: ProfessionalSlotsInput,
): Promise<string[]> {
  const result = await getSlotsForProfessional(input);
  return result.availableSlots;
}
