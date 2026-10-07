import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessMembership, requireSession } from "@/server/authorize";
import { MediaValidationError } from "@/features/media/validation";
import { parseBusinessProfileInput } from "@/features/branding/validation";
import { updateBusinessProfile } from "@/features/branding/update-business-profile";
import type { BusinessAdminDTO } from "@/features/businesses/contracts";
import { logServerError } from "@/server/observability";

export async function GET(request: Request) {
  let businessId: string | undefined;
  try {
    const session = await requireSession(request);
    if (!session.ok) return session.response;

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const cursor = searchParams.get("cursor");
    const requestedLimit = searchParams.get("limit");
    const limit = requestedLimit === null ? 50 : Number(requestedLimit);

    if (!slug) {
      return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || (cursor !== null && cursor.length > 100)) {
      return NextResponse.json({ error: "Parámetros de paginación inválidos" }, { status: 400 });
    }

    const businessRef = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
    if (!businessRef) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    businessId = businessRef.id;
    const authorization = await requireBusinessMembership(session.user, businessRef.id);
    if (!authorization.ok) return authorization.response;
    const membership = session.user.globalRole === "SUPER_ADMIN"
      ? null
      : await prisma.businessMember.findUnique({
          where: { businessId_userId: { businessId: businessRef.id, userId: session.user.id } },
          select: { role: true },
        });
    const canViewSensitive = session.user.globalRole === "SUPER_ADMIN" ||
      membership?.role === "OWNER" || membership?.role === "ADMIN";

    const [business, totalAppointments, appointmentRows] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessRef.id },
        select: {
          id: true,
          name: true,
          slug: true,
          ownerName: true,
          category: true,
          country: true,
          teamSize: true,
          currency: true,
          timezone: true,
          plan: true,
          billingBypass: true,
          customDomain: true,
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
          services: {
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, duration: true, price: true, imageUrl: true },
          },
          professionals: {
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      prisma.appointment.count({ where: { businessId: businessRef.id } }),
      prisma.appointment.findMany({
        where: { businessId: businessRef.id },
        orderBy: [{ dateTime: "asc" }, { id: "asc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          clientName: true,
          clientWhatsApp: true,
          dateTime: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          paymentAmount: true,
          service: { select: { name: true, duration: true, price: true } },
          professional: { select: { name: true } },
        },
      }),
    ]);

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    const hasMore = appointmentRows.length > limit;
    const rows = appointmentRows.slice(0, limit);
    const appointments = rows.map((appointment) => ({
      ...appointment,
      dateTime: appointment.dateTime.toISOString(),
      clientWhatsApp: canViewSensitive
        ? appointment.clientWhatsApp
        : `••••${appointment.clientWhatsApp.replace(/\D/g, "").slice(-4)}`,
      paymentMethod: canViewSensitive ? appointment.paymentMethod : null,
      paymentAmount: canViewSensitive ? appointment.paymentAmount : null,
    }));
    const businessDTO = {
      ...business,
      billingBypass: canViewSensitive ? business.billingBypass : false,
      appointments,
    } satisfies BusinessAdminDTO;

    return NextResponse.json({
      success: true,
      business: businessDTO,
      appointmentsPagination: {
        total: totalAppointments,
        limit,
        hasMore,
        nextCursor: hasMore ? rows[rows.length - 1]?.id ?? null : null,
        piiRedacted: !canViewSensitive,
      },
    });
  } catch (error) {
    logServerError(request, "admin.read.failed", error, { businessId });
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let businessId: string | undefined;
  try {
    const session = await requireSession(request);
    if (!session.ok) return session.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }
    if (typeof body !== "object" || body === null || !("slug" in body) || typeof body.slug !== "string") {
      return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
    }
    const slug = body.slug.trim();
    const parsed = parseBusinessProfileInput(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const businessRef = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
    if (!businessRef) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    businessId = businessRef.id;
    const authorization = await requireBusinessMembership(session.user, businessRef.id);
    if (!authorization.ok) return authorization.response;
    const membership = session.user.globalRole === "SUPER_ADMIN"
      ? null
      : await prisma.businessMember.findUnique({
          where: { businessId_userId: { businessId: businessRef.id, userId: session.user.id } },
          select: { role: true },
        });
    const canViewSensitive = session.user.globalRole === "SUPER_ADMIN" ||
      membership?.role === "OWNER" || membership?.role === "ADMIN";
    if (parsed.value.plan !== undefined && !canViewSensitive) {
      return NextResponse.json({ error: "Tu rol no puede cambiar el plan del negocio" }, { status: 403 });
    }
    const business = await updateBusinessProfile(businessRef.id, slug, parsed.value);
    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    return NextResponse.json({
      success: true,
      business: { ...business, billingBypass: canViewSensitive ? business.billingBypass : false },
    });
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logServerError(request, "admin.update.failed", error, { businessId });
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
