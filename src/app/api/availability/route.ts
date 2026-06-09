import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const peopleParam = searchParams.get("people");

    if (!slug || !dateStr) {
      return NextResponse.json({ error: "Faltan parámetros de consulta" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        professionals: true,
        services: true,
        tables: true,
        menuItems: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Definición de slots según categoría
    const slots = business.category === "Restaurante"
      ? [
          "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00",
          "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
        ]
      : [
          "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
          "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
          "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
        ];

    let availableSlots = slots;

    if (business.category === "Restaurante") {
      const peopleCount = peopleParam ? parseInt(peopleParam, 10) : 2;
      const tables = business.tables || [];
      const suitableTables = tables.filter((t) => t.capacity >= peopleCount);

      if (suitableTables.length === 0) {
        // No hay mesas con esa capacidad
        availableSlots = [];
      } else {
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

        // Para cada slot, verificar si queda al menos una mesa adecuada libre
        availableSlots = slots.filter((slot) => {
          // Convertir slot a timestamp local para comparar
          const slotTime = new Date(`${dateStr}T${slot}:00`).getTime();
          const busyTableIds = new Set<string>();

          for (const app of appointments) {
            if (!app.tableId) continue;
            const appTime = new Date(app.dateTime).getTime();
            const twoHoursInMs = 2 * 60 * 60 * 1000;

            // Si el slot cae dentro de la ventana de reserva de la mesa [appTime, appTime + 2h)
            if (slotTime >= appTime && slotTime < appTime + twoHoursInMs) {
              busyTableIds.add(app.tableId);
            }
          }

          // ¿Quedan mesas adecuadas libres?
          const freeTablesCount = suitableTables.filter((t) => !busyTableIds.has(t.id)).length;
          return freeTablesCount > 0;
        });
      }
    } else {
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

      availableSlots = slots.filter((slot) => !bookedTimes.includes(slot));
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
