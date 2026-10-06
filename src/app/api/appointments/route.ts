import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAvailableSlotsForProfessional } from "@/features/booking/availability";
import { parseCreateBookingInput } from "@/features/booking/validation";
import { localMinuteToUtc, parseLocalTime } from "@/lib/schedule";

// Public POST is the customer-facing booking flow; administrative appointment
// reads/changes must use authenticated, business-scoped routes.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const parsed = parseCreateBookingInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  try {
    const business = await prisma.business.findUnique({
      where: { slug: input.slug },
      select: { id: true, slug: true, name: true, currency: true, timezone: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

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
      return NextResponse.json({ error: "Servicio o profesional no pertenece a este negocio" }, { status: 400 });
    }

    const minuteOfDay = parseLocalTime(input.time);
    if (minuteOfDay === null) {
      return NextResponse.json({ error: "Fecha u hora inválida" }, { status: 400 });
    }
    const dateTime = localMinuteToUtc(input.date, minuteOfDay, business.timezone);
    if (!dateTime) {
      return NextResponse.json({ error: "La hora elegida no existe en la zona horaria del negocio" }, { status: 400 });
    }
    if (dateTime.getTime() <= Date.now()) {
      return NextResponse.json({ error: "La reserva debe ser futura" }, { status: 400 });
    }

    const availableSlots = await getAvailableSlotsForProfessional({
      businessId: business.id,
      professionalId: professional.id,
      date: input.date,
      timeZone: business.timezone,
      serviceDurationMinutes: service.duration,
    });
    if (!availableSlots.includes(input.time)) {
      return NextResponse.json({ error: "El horario ya no está disponible" }, { status: 409 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        serviceId: service.id,
        professionalId: professional.id,
        clientName: input.clientName,
        clientWhatsApp: input.clientWhatsApp,
        dateTime,
        status: "CONFIRMED",
        // Payment claims from a public client are untrusted. A provider webhook
        // will be the only path that can move paymentStatus to PAID.
        paymentStatus: "PENDING",
        paymentMethod: null,
        paymentAmount: null,
      },
      select: { id: true, dateTime: true, status: true, paymentStatus: true },
    });

    return NextResponse.json({
      success: true,
      appointment: {
        ...appointment,
        service: { name: service.name, duration: service.duration, price: service.price },
        professional: { name: professional.name },
        business,
      },
    });
  } catch (error) {
    console.error("Error al crear cita:", error);
    return NextResponse.json({ error: "Error al registrar la cita" }, { status: 500 });
  }
}
