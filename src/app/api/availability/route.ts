import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAvailableSlotsForProfessional } from "@/features/booking/availability";
import { parseAvailabilityQuery } from "@/features/booking/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseAvailabilityQuery(searchParams);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { slug, date, serviceId, professionalId } = parsed.value;

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

      availableSlots = await getAvailableSlotsForProfessional({
        businessId: business.id,
        professionalId,
        date,
        timeZone: business.timezone,
        serviceDurationMinutes: service.duration,
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
