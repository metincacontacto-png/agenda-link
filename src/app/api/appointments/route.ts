import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidDateOnly, localMinuteToUtc, parseLocalTime } from "@/lib/schedule";

// Public POST is the customer-facing booking flow; administrative appointment
// reads/changes must use authenticated, business-scoped routes.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slug,
      serviceId,
      professionalId,
      clientName,
      clientWhatsApp,
      date,
      time,
      paymentStatus,
      paymentMethod,
      paymentAmount,
    } = body;

    if (!slug || !serviceId || !professionalId || !clientName || !clientWhatsApp || !date || !time) {
      return NextResponse.json({ error: "Datos de reserva incompletos" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    if (typeof date !== "string" || typeof time !== "string" || !isValidDateOnly(date)) {
      return NextResponse.json({ error: "Fecha u hora inválida" }, { status: 400 });
    }
    const minuteOfDay = parseLocalTime(time);
    if (minuteOfDay === null) {
      return NextResponse.json({ error: "Fecha u hora inválida" }, { status: 400 });
    }
    const dateTime = localMinuteToUtc(date, minuteOfDay, business.timezone);
    if (!dateTime) {
      return NextResponse.json({ error: "La hora elegida no existe en la zona horaria del negocio" }, { status: 400 });
    }

    // Crear la cita
    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        serviceId,
        professionalId,
        clientName,
        clientWhatsApp,
        dateTime,
        status: "CONFIRMED",
        paymentStatus: paymentStatus || "PENDING",
        paymentMethod: paymentMethod || null,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : null,
      },
      include: {
        service: true,
        professional: true,
        business: true,
      },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("Error al crear cita:", error);
    return NextResponse.json({ error: "Error al registrar la cita" }, { status: 500 });
  }
}
