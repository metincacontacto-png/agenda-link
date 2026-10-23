import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessMembership, requireSession } from "@/server/authorize";
import { localDayUtcRange, localMinuteToUtc, parseLocalTime, isValidDateOnly } from "@/features/schedule/time";
import { logServerError } from "@/server/observability";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
  }

  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, timezone: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    const blocks = await prisma.scheduleBlock.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: { startsAt: "desc" },
      take: 50,
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        reason: true,
        professionalId: true,
      },
    });

    return NextResponse.json({ success: true, blocks, timezone: business.timezone });
  } catch (error) {
    logServerError(request, "scheduleBlocks.list.failed", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("slug" in body) || typeof body.slug !== "string") {
    return NextResponse.json({ error: "Falta el slug del negocio" }, { status: 400 });
  }

  const { slug, date, isFullDay, startTime, endTime, reason } = body as {
    slug: string;
    date: string;
    isFullDay?: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  };

  if (!date || !isValidDateOnly(date)) {
    return NextResponse.json({ error: "Fecha inválida (debe ser formato YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, timezone: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    let startsAt: Date | null = null;
    let endsAt: Date | null = null;

    if (isFullDay) {
      const dayRange = localDayUtcRange(date, business.timezone);
      if (!dayRange) {
        return NextResponse.json({ error: "No se pudo calcular el rango del día" }, { status: 400 });
      }
      startsAt = dayRange.startsAt;
      endsAt = dayRange.endsAt;
    } else {
      if (!startTime || !endTime) {
        return NextResponse.json({ error: "Debes especificar hora de inicio y fin" }, { status: 400 });
      }
      const startMin = parseLocalTime(startTime);
      const endMin = parseLocalTime(endTime);
      if (startMin === null || endMin === null || startMin >= endMin) {
        return NextResponse.json({ error: "Rango de horas inválido" }, { status: 400 });
      }
      startsAt = localMinuteToUtc(date, startMin, business.timezone);
      endsAt = localMinuteToUtc(date, endMin, business.timezone);
      if (!startsAt || !endsAt || startsAt >= endsAt) {
        return NextResponse.json({ error: "Horarios no válidos en la zona horaria del negocio" }, { status: 400 });
      }
    }

    const block = await prisma.scheduleBlock.create({
      data: {
        businessId: business.id,
        startsAt,
        endsAt,
        reason: reason?.trim() || "Día/Horario no disponible",
      },
    });

    return NextResponse.json({ success: true, block });
  } catch (error) {
    logServerError(request, "scheduleBlocks.create.failed", error);
    return NextResponse.json({ error: "Error al crear bloqueo de horario" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");

  if (!id || !slug) {
    return NextResponse.json({ error: "Faltan parámetros id o slug" }, { status: 400 });
  }

  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    const block = await prisma.scheduleBlock.findUnique({
      where: { id },
      select: { businessId: true },
    });
    if (!block || block.businessId !== business.id) {
      return NextResponse.json({ error: "Bloqueo no encontrado" }, { status: 404 });
    }

    await prisma.scheduleBlock.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError(request, "scheduleBlocks.delete.failed", error);
    return NextResponse.json({ error: "Error al eliminar bloqueo" }, { status: 500 });
  }
}
