import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const dateTime = new Date(`${date}T${time}:00`);

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
