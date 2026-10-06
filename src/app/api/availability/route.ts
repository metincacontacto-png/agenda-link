import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAvailableSlotsForProfessional } from "@/features/booking/availability";
import type { PublicBusinessDTO } from "@/features/booking/public-business-dto";
import { parseAvailabilityQuery } from "@/features/booking/validation";
import { logServerError } from "@/lib/observability";

export async function GET(request: Request) {
  let businessId: string | undefined;
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseAvailabilityQuery(searchParams);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { slug, date, serviceId, professionalId } = parsed.value;

    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        currency: true,
        timezone: true,
        logoUrl: true,
        landingTitle: true,
        landingSubtitle: true,
        landingAbout: true,
        landingCoverUrl: true,
        landingSecondaryCoverUrl: true,
        landingPhone: true,
        landingAddress: true,
        landingHours: true,
        landingFeaturesJson: true,
        landingTestimonialsJson: true,
        professionals: { select: { id: true, name: true, avatar: true } },
        services: { select: { id: true, name: true, duration: true, price: true, imageUrl: true } },
      },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    businessId = business.id;
    const publicBusiness: PublicBusinessDTO = business;

    let availableSlots: string[] = [];
    if (serviceId && professionalId) {
      const service = publicBusiness.services.find((item) => item.id === serviceId);
      const professional = publicBusiness.professionals.find((item) => item.id === professionalId);
      if (!service || !professional) {
        return NextResponse.json({ error: "Servicio o profesional no encontrado" }, { status: 404 });
      }

      availableSlots = await getAvailableSlotsForProfessional({
        businessId: publicBusiness.id,
        professionalId,
        date,
        timeZone: publicBusiness.timezone,
        serviceDurationMinutes: service.duration,
      });
    }

    return NextResponse.json({
      business,
      availableSlots,
    });
  } catch (error) {
    logServerError(request, "availability.read.failed", error, { businessId });
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
