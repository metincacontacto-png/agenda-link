import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessMembership, requireSession } from "@/lib/authorize";
import { getAvailableSlotsForProfessional } from "@/features/booking/availability";
import { parseAppointmentChangeInput } from "@/features/booking/validation";
import { localMinuteToUtc, parseLocalTime } from "@/lib/schedule";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const parsed = parseAppointmentChangeInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const appointmentRef = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    });
    if (!appointmentRef) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }
    const authorization = await requireBusinessMembership(session.user, appointmentRef.businessId);
    if (!authorization.ok) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, name: true, duration: true, price: true } },
        professional: { select: { id: true, name: true } },
        business: { select: { id: true, name: true, slug: true, currency: true, timezone: true } },
      },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }
    if (appointment.status !== "CONFIRMED" || appointment.dateTime.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Solo se pueden modificar citas futuras confirmadas" }, { status: 409 });
    }

    if (parsed.value.action === "cancel") {
      const cancelled = await prisma.$queryRaw<Array<{ id: string }>>`
        UPDATE "Appointment"
        SET "status" = 'CANCELLED',
            "updatedAt" = CURRENT_TIMESTAMP,
            "lastModifiedBy" = ${session.user.id}
        WHERE "id" = ${appointment.id}
          AND "businessId" = ${appointment.businessId}
          AND "status" = 'CONFIRMED'
          AND julianday("dateTime") > julianday('now')
        RETURNING "id"
      `;
      if (cancelled.length === 0) {
        return NextResponse.json({ error: "La cita cambió y ya no se puede cancelar" }, { status: 409 });
      }
      const auditEvent = await prisma.appointmentAudit.findFirst({
        where: { appointmentId: appointment.id, actorUserId: session.user.id, eventType: "CANCELLED" },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (!auditEvent) throw new Error("Appointment cancellation audit event was not written");
      return NextResponse.json({ success: true, appointmentId: appointment.id, status: "CANCELLED", auditRecorded: true });
    }

    const minuteOfDay = parseLocalTime(parsed.value.time);
    if (minuteOfDay === null) {
      return NextResponse.json({ error: "Nueva fecha u hora inválida" }, { status: 400 });
    }
    const newDateTime = localMinuteToUtc(
      parsed.value.date,
      minuteOfDay,
      appointment.business.timezone,
    );
    if (!newDateTime || newDateTime.getTime() <= Date.now()) {
      return NextResponse.json({ error: "La nueva fecha y hora deben ser futuras y válidas" }, { status: 400 });
    }
    if (newDateTime.getTime() === appointment.dateTime.getTime()) {
      return NextResponse.json({ error: "La cita ya está en ese horario" }, { status: 400 });
    }

    const availableSlots = await getAvailableSlotsForProfessional({
      businessId: appointment.businessId,
      professionalId: appointment.professionalId,
      date: parsed.value.date,
      timeZone: appointment.business.timezone,
      serviceDurationMinutes: appointment.service.duration,
      excludeAppointmentId: appointment.id,
    });
    if (!availableSlots.includes(parsed.value.time)) {
      return NextResponse.json({ error: "El nuevo horario no está disponible" }, { status: 409 });
    }

    const instant = newDateTime.toISOString();
    const updated = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "Appointment"
      SET "dateTime" = ${instant},
          "updatedAt" = CURRENT_TIMESTAMP,
          "lastModifiedBy" = ${session.user.id}
      WHERE "id" = ${appointment.id}
        AND "businessId" = ${appointment.businessId}
        AND "status" = 'CONFIRMED'
        AND julianday("dateTime") > julianday('now')
        AND NOT EXISTS (
          SELECT 1
          FROM "Appointment" AS existing
          INNER JOIN "Service" AS existingService ON existingService."id" = existing."serviceId"
          WHERE existing."id" <> ${appointment.id}
            AND existing."businessId" = ${appointment.businessId}
            AND existing."professionalId" = ${appointment.professionalId}
            AND existing."status" NOT IN ('CANCELLED', 'CANCELED')
            AND julianday(existing."dateTime") < julianday(${instant}) + (${appointment.service.duration} / 1440.0)
            AND julianday(existing."dateTime") + (existingService."duration" / 1440.0) > julianday(${instant})
        )
        AND NOT EXISTS (
          SELECT 1
          FROM "ScheduleBlock" AS block
          WHERE block."businessId" = ${appointment.businessId}
            AND (block."professionalId" IS NULL OR block."professionalId" = ${appointment.professionalId})
            AND julianday(block."startsAt") < julianday(${instant}) + (${appointment.service.duration} / 1440.0)
            AND julianday(block."endsAt") > julianday(${instant})
        )
      RETURNING "id"
    `;
    if (updated.length === 0) {
      return NextResponse.json({ error: "El nuevo horario acaba de dejar de estar disponible" }, { status: 409 });
    }

    const auditEvent = await prisma.appointmentAudit.findFirst({
      where: { appointmentId: appointment.id, actorUserId: session.user.id, eventType: "RESCHEDULED" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!auditEvent) throw new Error("Appointment reschedule audit event was not written");

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      status: "CONFIRMED",
      dateTime: newDateTime,
      auditRecorded: true,
    });
  } catch (error) {
    console.error("Error al actualizar la cita:", error);
    return NextResponse.json({ error: "No se pudo actualizar la cita" }, { status: 500 });
  }
}
