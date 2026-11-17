import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessMembership, requireSession } from "@/server/authorize";
import { getPlanMaxProfessionals, SUBSCRIPTION_PLANS } from "@/features/businesses/subscription-policy";
import { logServerError } from "@/server/observability";

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const slug = typeof (body as { slug?: unknown })?.slug === "string" ? (body as { slug: string }).slug : undefined;
  if (!slug?.trim()) {
    return NextResponse.json({ error: "Falta el slug del negocio" }, { status: 400 });
  }

  const rawName = (body as { name?: unknown }).name;

  if (typeof rawName !== "string" || rawName.trim().length < 1 || rawName.trim().length > 80) {
    return NextResponse.json(
      { error: "El nombre del profesional debe tener entre 1 y 80 caracteres" },
      { status: 400 }
    );
  }

  const name = rawName.trim();
  let businessId: string | undefined;

  try {
    const business = await prisma.business.findUnique({
      where: { slug: slug.trim() },
      select: { id: true, plan: true, subscriptionPlan: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    businessId = business.id;

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    const rawPlan = (business.subscriptionPlan || business.plan || "INDIVIDUAL") as "INDIVIDUAL" | "EQUIPO" | "NEGOCIO";
    const planKey = SUBSCRIPTION_PLANS[rawPlan] ? rawPlan : "INDIVIDUAL";
    const maxAllowed = getPlanMaxProfessionals(planKey);
    const currentCount = await prisma.professional.count({ where: { businessId: business.id } });

    if (currentCount >= maxAllowed) {
      const planName = SUBSCRIPTION_PLANS[planKey]?.name || planKey;
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${maxAllowed} profesional(es) de tu Plan ${planName}. Actualiza tu plan para sumar más profesionales.`,
          maxAllowed,
          currentCount,
          plan: planKey,
        },
        { status: 403 }
      );
    }

    const cleanName = name.trim();
    const avatar = cleanName.substring(0, 2).toUpperCase();

    const professional = await prisma.professional.create({
      data: {
        businessId: business.id,
        name: cleanName,
        avatar,
        schedules: {
          create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
            dayOfWeek,
            startMinute: 540,
            endMinute: 1080,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, professional }, { status: 201 });
  } catch (error) {
    logServerError(request, "professionals.create.failed", error, { businessId });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");
  let slug = searchParams.get("slug");

  if (!id?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "Falta el id del profesional o el slug del negocio" }, { status: 400 });
  }

  id = id.trim();
  slug = slug.trim();
  let businessId: string | undefined;

  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    businessId = business.id;

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    const professional = await prisma.professional.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    });
    if (!professional || professional.businessId !== business.id) {
      return NextResponse.json({ error: "Profesional no encontrado en este negocio" }, { status: 404 });
    }

    const totalProfessionals = await prisma.professional.count({ where: { businessId: business.id } });
    if (totalProfessionals <= 1) {
      return NextResponse.json(
        { error: "No puedes eliminar el único profesional del negocio. Debe existir al menos un profesional para recibir reservas." },
        { status: 400 }
      );
    }

    const appointmentCount = await prisma.appointment.count({
      where: { professionalId: id },
    });
    if (appointmentCount > 0) {
      return NextResponse.json(
        { error: "No es posible eliminar el profesional porque tiene citas asociadas en el sistema. Reasigna o cancela sus citas antes de eliminarlo." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.professionalSchedule.deleteMany({ where: { professionalId: id } }),
      prisma.professionalBreak.deleteMany({ where: { professionalId: id } }),
      prisma.professional.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError(request, "professionals.delete.failed", error, { businessId });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
