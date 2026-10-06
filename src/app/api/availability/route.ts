import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateAvailableSlots,
  isValidDateOnly,
  localDayUtcRange,
  weekdayForDate,
} from "@/lib/schedule";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");
    const professionalId = searchParams.get("professionalId");

    if (!slug || !date) {
      return NextResponse.json({ error: "Faltan parámetros de consulta" }, { status: 400 });
    }
    if (!isValidDateOnly(date)) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }
    if (Boolean(serviceId) !== Boolean(professionalId)) {
      return NextResponse.json({ error: "Selecciona servicio y profesional" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { slug },
      include: { professionals: true, services: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    let availableSlots: string[] = [];
    if (serviceId && professionalId) {
      const service = business.services.find((item) => item.id === serviceId);
      const professional = business.professionals.find((item) => item.id === professionalId);
      if (!service || !professional) {
        return NextResponse.json({ error: "Servicio o profesional no encontrado" }, { status: 404 });
      }

      const dayOfWeek = weekdayForDate(date);
      const dayRange = localDayUtcRange(date, business.timezone);
      if (dayOfWeek === null || !dayRange) {
        return NextResponse.json({ error: "No se pudo resolver la fecha en la zona del negocio" }, { status: 400 });
      }

      const [businessSchedules, professionalSchedules, breaks, blocks, appointments] = await Promise.all([
        prisma.businessSchedule.findMany({ where: { businessId: business.id, dayOfWeek } }),
        prisma.professionalSchedule.findMany({ where: { professionalId, dayOfWeek } }),
        prisma.professionalBreak.findMany({ where: { professionalId, dayOfWeek } }),
        prisma.scheduleBlock.findMany({
          where: {
            businessId: business.id,
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
            businessId: business.id,
            professionalId,
            status: "CONFIRMED",
            dateTime: { gte: dayRange.startsAt, lt: dayRange.endsAt },
          },
          include: { service: { select: { duration: true } } },
        }),
      ]);

      availableSlots = generateAvailableSlots({
        date,
        timeZone: business.timezone,
        serviceDurationMinutes: service.duration,
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

    return NextResponse.json({
      business,
      availableSlots,
      professionals: business.professionals,
    });
  } catch (error) {
    console.error("Error al calcular disponibilidad:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
