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
      peopleCount,
    } = body;

    if (!slug || !serviceId || !professionalId || !clientName || !clientWhatsApp || !date || !time) {
      return NextResponse.json({ error: "Datos de reserva incompletos" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const dateTime = new Date(`${date}T${time}:00`);

    let assignedTableId: string | null = null;
    let parsedPeopleCount: number | null = null;

    if (business.category === "Restaurante") {
      parsedPeopleCount = peopleCount ? parseInt(peopleCount, 10) : 2;
      
      // Cargar todas las mesas
      const tables = await prisma.table.findMany({
        where: { businessId: business.id },
      });

      // Filtrar mesas con capacidad adecuada
      const suitableTables = tables.filter((t) => t.capacity >= (parsedPeopleCount || 2));
      if (suitableTables.length === 0) {
        return NextResponse.json({ error: "No hay mesas disponibles con esa capacidad en este restaurante" }, { status: 400 });
      }

      // Cargar citas de hoy para verificar colisiones
      const todayStart = new Date(`${date}T00:00:00`);
      const todayEnd = new Date(`${date}T23:59:59`);
      const appointments = await prisma.appointment.findMany({
        where: {
          businessId: business.id,
          status: "CONFIRMED",
          dateTime: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      const slotTime = dateTime.getTime();
      let selectedTable = null;

      // Buscar una mesa libre
      for (const table of suitableTables) {
        let isBusy = false;
        for (const app of appointments) {
          if (app.tableId !== table.id) continue;
          
          const appTime = new Date(app.dateTime).getTime();
          const twoHoursInMs = 2 * 60 * 60 * 1000;
          
          // Si colisionan los rangos de 2 horas
          if (slotTime >= appTime && slotTime < appTime + twoHoursInMs) {
            isBusy = true;
            break;
          }
        }
        if (!isBusy) {
          selectedTable = table;
          break;
        }
      }

      if (!selectedTable) {
        return NextResponse.json({ error: "No quedan mesas libres disponibles para este horario. Intenta elegir otra hora." }, { status: 400 });
      }

      assignedTableId = selectedTable.id;
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
        peopleCount: parsedPeopleCount,
        tableId: assignedTableId,
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
