import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSlotsForProfessional } from "@/features/booking/availability";
import { toPublicBusinessDTO } from "@/features/booking/public-business-dto";
import { parseAvailabilityQuery } from "@/features/booking/validation";
import { logServerError } from "@/server/observability";

export async function GET(request: Request) {
  let businessId: string | undefined;
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseAvailabilityQuery(searchParams);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { slug, date, serviceId, serviceIds, professionalId } = parsed.value;

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
        landingMobileCoverUrl: true,
        landingPhone: true,
        landingAddress: true,
        landingHours: true,
        landingFeaturesJson: true,
        landingTestimonialsJson: true,
        cancellationPolicy: true,
        minNoticeHours: true,
        maxServicesPerBooking: true,
        mercadoPagoAccessToken: true,
        professionals: { select: { id: true, name: true, avatar: true } },
        services: { select: { id: true, name: true, duration: true, price: true, imageUrl: true } },
      },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    businessId = business.id;
    const publicBusiness = toPublicBusinessDTO(business);

    let availableSlots: string[] = [];
    let bookedSlots: string[] = [];
    let nextAvailableDate: string | null = null;
    const requestedServiceIds = serviceIds && serviceIds.length > 0
      ? serviceIds
      : serviceId
        ? [serviceId]
        : [];

    if (requestedServiceIds.length > 0 && professionalId) {
      const professional = publicBusiness.professionals.find((item) => item.id === professionalId);
      if (!professional) {
        return NextResponse.json({ error: "Servicio o profesional no encontrado" }, { status: 404 });
      }

      const services: typeof publicBusiness.services = [];
      for (const id of requestedServiceIds) {
        const found = publicBusiness.services.find((item) => item.id === id);
        if (!found) {
          return NextResponse.json({ error: "Servicio o profesional no encontrado" }, { status: 404 });
        }
        services.push(found);
      }

      const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);

      const slotData = await getSlotsForProfessional({
        businessId: publicBusiness.id,
        professionalId,
        date,
        timeZone: publicBusiness.timezone,
        serviceDurationMinutes: totalDuration,
        minNoticeHours: business.minNoticeHours ?? 2,
      });
      availableSlots = slotData.availableSlots;
      bookedSlots = slotData.bookedSlots;

      if (availableSlots.length === 0) {
        const [year, month, day] = date.split("-").map(Number);
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        // Search at most 2 days ahead to prevent subrequest / CPU exhaustion on Cloudflare Workers
        for (let i = 1; i <= 2; i++) {
          const nextDateObj = new Date(currentDate);
          nextDateObj.setUTCDate(nextDateObj.getUTCDate() + i);
          const nextDateStr = nextDateObj.toISOString().slice(0, 10);
          const checkSlots = await getSlotsForProfessional({
            businessId: publicBusiness.id,
            professionalId,
            date: nextDateStr,
            timeZone: publicBusiness.timezone,
            serviceDurationMinutes: totalDuration,
            minNoticeHours: business.minNoticeHours ?? 2,
          });
          if (checkSlots.availableSlots.length > 0) {
            nextAvailableDate = nextDateStr;
            break;
          }
        }
      }
    }

    return NextResponse.json({
      business: publicBusiness,
      availableSlots,
      bookedSlots,
      nextAvailableDate,
    });
  } catch (error) {
    logServerError(request, "availability.read.failed", error, { businessId });
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
