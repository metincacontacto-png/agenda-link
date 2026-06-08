import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!slug || !dateStr) {
      return NextResponse.json({ error: "Faltan parámetros de consulta" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        professionals: true,
        services: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Definición de slots estándar de 09:00 a 18:00 (último slot empieza a las 17:30)
    const slots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
      "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];

    // Obtener citas ya agendadas para esa fecha
    const startDate = new Date(`${dateStr}T00:00:00`);
    const endDate = new Date(`${dateStr}T23:59:59`);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        status: "CONFIRMED",
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const bookedTimes = appointments.map((app) => {
      const hours = app.dateTime.getHours().toString().padStart(2, "0");
      const minutes = app.dateTime.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    });

    // Filtrar slots disponibles
    const availableSlots = slots.filter((slot) => !bookedTimes.includes(slot));

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
