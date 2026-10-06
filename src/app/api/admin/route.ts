import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadBase64ToR2, deleteFromR2 } from "@/lib/r2";
import { requireBusinessMembership, requireSession } from "@/lib/authorize";
import { MediaValidationError } from "@/lib/media";
import { logServerError } from "@/lib/observability";

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
      clientWhatsApp: canViewSensitive
        ? appointment.clientWhatsApp
        : `••••${appointment.clientWhatsApp.replace(/\D/g, "").slice(-4)}`,
      paymentMethod: canViewSensitive ? appointment.paymentMethod : null,
      paymentAmount: canViewSensitive ? appointment.paymentAmount : null,
    }));

    return NextResponse.json({
      success: true,
      business: {
        ...business,
        billingBypass: canViewSensitive ? business.billingBypass : false,
        appointments,
      },
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

    const body = await request.json();
    const {
      slug,
      name,
      category,
      teamSize,
      currency,
      logoUrl,
      landingTitle,
      landingSubtitle,
      landingAbout,
      landingCoverUrl,
      landingSecondaryCoverUrl,
      landingPhone,
      landingAddress,
      landingHours,
      landingFeaturesJson,
      landingTestimonialsJson,
      plan,
    } = body;

    if (!slug) {
      return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
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

    // Leer los archivos existentes solo después de comprobar la membresía.
    const existing = await prisma.business.findUnique({
      where: { id: businessRef.id },
      select: { logoUrl: true, landingCoverUrl: true, landingSecondaryCoverUrl: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    let finalLogoUrl = logoUrl;
    let finalCoverUrl = landingCoverUrl;
    let finalSecondaryCoverUrl = landingSecondaryCoverUrl;

    if (logoUrl !== undefined) {
      if (logoUrl !== null && logoUrl !== "") {
        if (typeof logoUrl !== "string") {
          return NextResponse.json({ error: "Imagen de logo inválida" }, { status: 400 });
        }
        finalLogoUrl = await uploadBase64ToR2(logoUrl, `logo_${slug}`);
        if (existing?.logoUrl && existing.logoUrl !== finalLogoUrl) await deleteFromR2(existing.logoUrl);
      } else if ((logoUrl === null || logoUrl === "") && existing?.logoUrl) {
        await deleteFromR2(existing.logoUrl);
        finalLogoUrl = null;
      }
    }

    if (landingCoverUrl !== undefined) {
      if (landingCoverUrl !== null && landingCoverUrl !== "") {
        if (typeof landingCoverUrl !== "string") {
          return NextResponse.json({ error: "Imagen de portada inválida" }, { status: 400 });
        }
        finalCoverUrl = await uploadBase64ToR2(landingCoverUrl, `cover_${slug}`);
        if (existing?.landingCoverUrl && existing.landingCoverUrl !== finalCoverUrl) await deleteFromR2(existing.landingCoverUrl);
      } else if ((landingCoverUrl === null || landingCoverUrl === "") && existing?.landingCoverUrl) {
        await deleteFromR2(existing.landingCoverUrl);
        finalCoverUrl = null;
      }
    }

    if (landingSecondaryCoverUrl !== undefined) {
      if (landingSecondaryCoverUrl !== null && landingSecondaryCoverUrl !== "") {
        if (typeof landingSecondaryCoverUrl !== "string") {
          return NextResponse.json({ error: "Imagen secundaria inválida" }, { status: 400 });
        }
        finalSecondaryCoverUrl = await uploadBase64ToR2(landingSecondaryCoverUrl, `seccover_${slug}`);
        if (existing?.landingSecondaryCoverUrl && existing.landingSecondaryCoverUrl !== finalSecondaryCoverUrl) await deleteFromR2(existing.landingSecondaryCoverUrl);
      } else if ((landingSecondaryCoverUrl === null || landingSecondaryCoverUrl === "") && existing?.landingSecondaryCoverUrl) {
        await deleteFromR2(existing.landingSecondaryCoverUrl);
        finalSecondaryCoverUrl = null;
      }
    }

    const business = await prisma.business.update({
      where: { slug },
      data: {
        name,
        category,
        teamSize,
        currency,
        logoUrl: finalLogoUrl === undefined ? undefined : finalLogoUrl,
        landingTitle: landingTitle === undefined ? undefined : landingTitle,
        landingSubtitle: landingSubtitle === undefined ? undefined : landingSubtitle,
        landingAbout: landingAbout === undefined ? undefined : landingAbout,
        landingCoverUrl: finalCoverUrl === undefined ? undefined : finalCoverUrl,
        landingSecondaryCoverUrl: finalSecondaryCoverUrl === undefined ? undefined : finalSecondaryCoverUrl,
        landingPhone: landingPhone === undefined ? undefined : landingPhone,
        landingAddress: landingAddress === undefined ? undefined : landingAddress,
        landingHours: landingHours === undefined ? undefined : landingHours,
        landingFeaturesJson: landingFeaturesJson === undefined ? undefined : landingFeaturesJson,
        landingTestimonialsJson: landingTestimonialsJson === undefined ? undefined : landingTestimonialsJson,
        plan: plan === undefined ? undefined : plan,
      },
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
      },
    });

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
