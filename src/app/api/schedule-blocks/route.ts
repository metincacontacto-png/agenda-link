import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessMembership, requireSession } from "@/server/authorize";
import { localDayUtcRange, localMinuteToUtc, parseLocalTime, isValidDateOnly } from "@/features/schedule/time";
import { logServerError } from "@/server/observability";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get("slug");
  if (!rawSlug || !rawSlug.trim()) {
    return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
  }
  const slug = rawSlug.trim();

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    let business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, timezone: true },
    });
    if (!business && slug.toLowerCase() !== slug) {
      business = await prisma.business.findUnique({
        where: { slug: slug.toLowerCase() },
        select: { id: true, timezone: true },
      });
    }
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    let dateFilter: { startsAt: { lt: Date }; endsAt: { gt: Date } } | null = null;

    if (startDate || endDate) {
      const start = startDate || endDate!;
      const end = endDate || startDate!;
      if (!isValidDateOnly(start) || !isValidDateOnly(end) || start > end) {
        return NextResponse.json({ error: "Rango de fechas inválido (debe ser formato YYYY-MM-DD)" }, { status: 400 });
      }

      const startRange = localDayUtcRange(start, business.timezone);
      const endRange = localDayUtcRange(end, business.timezone);
      if (!startRange || !endRange) {
        return NextResponse.json({ error: "No se pudo calcular el rango de fechas" }, { status: 400 });
      }

      dateFilter = {
        startsAt: { lt: endRange.endsAt },
        endsAt: { gt: startRange.startsAt },
      };
    }

    const blocks = await prisma.scheduleBlock.findMany({
      where: {
        businessId: business.id,
        ...(dateFilter
          ? {
              startsAt: dateFilter.startsAt,
              endsAt: dateFilter.endsAt,
            }
          : {}),
      },
      orderBy: { startsAt: dateFilter ? "asc" : "desc" },
      ...(dateFilter ? {} : { take: 100 }),
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

  const {
    slug,
    mode,
    startDate,
    endDate,
    date,
    slotTime,
    durationMinutes,
    isFullDay,
    startTime,
    endTime,
    reason,
    professionalId,
  } = body as {
    slug: string;
    mode?: string;
    startDate?: string;
    endDate?: string;
    date?: string;
    slotTime?: string;
    durationMinutes?: number;
    isFullDay?: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
    professionalId?: string | null;
  };

  try {
    const cleanSlug = slug.trim();
    let business = await prisma.business.findUnique({
      where: { slug: cleanSlug },
      select: { id: true, timezone: true },
    });
    if (!business && cleanSlug.toLowerCase() !== cleanSlug) {
      business = await prisma.business.findUnique({
        where: { slug: cleanSlug.toLowerCase() },
        select: { id: true, timezone: true },
      });
    }
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    let startsAt: Date | null = null;
    let endsAt: Date | null = null;

    if (mode === "range") {
      if (!startDate || !isValidDateOnly(startDate)) {
        return NextResponse.json({ error: "Fecha de inicio inválida (debe ser formato YYYY-MM-DD)" }, { status: 400 });
      }
      if (!endDate || !isValidDateOnly(endDate)) {
        return NextResponse.json({ error: "Fecha de fin inválida (debe ser formato YYYY-MM-DD)" }, { status: 400 });
      }
      if (startDate > endDate) {
        return NextResponse.json({ error: "La fecha de inicio no puede ser posterior a la fecha de fin" }, { status: 400 });
      }
      const startRange = localDayUtcRange(startDate, business.timezone);
      const endRange = localDayUtcRange(endDate, business.timezone);
      if (!startRange || !endRange) {
        return NextResponse.json({ error: "No se pudo calcular el rango de fechas" }, { status: 400 });
      }
      startsAt = startRange.startsAt;
      endsAt = endRange.endsAt;
    } else if (mode === "slot") {
      if (!date || !isValidDateOnly(date)) {
        return NextResponse.json({ error: "Fecha inválida (debe ser formato YYYY-MM-DD)" }, { status: 400 });
      }
      if (!slotTime || typeof slotTime !== "string") {
        return NextResponse.json({ error: "Debes especificar la hora del horario/slot" }, { status: 400 });
      }
      const startMin = parseLocalTime(slotTime);
      if (startMin === null) {
        return NextResponse.json({ error: "Hora de slot inválida (debe ser formato HH:mm)" }, { status: 400 });
      }
      const duration =
        typeof durationMinutes === "number" && Number.isInteger(durationMinutes) && durationMinutes > 0
          ? durationMinutes
          : 60;
      const endMin = startMin + duration;
      startsAt = localMinuteToUtc(date, startMin, business.timezone);
      endsAt = localMinuteToUtc(date, endMin, business.timezone);
      if (!startsAt || !endsAt || startsAt >= endsAt) {
        return NextResponse.json({ error: "Horarios no válidos en la zona horaria del negocio" }, { status: 400 });
      }
    } else if (mode === "day") {
      if (!date || !isValidDateOnly(date)) {
        return NextResponse.json({ error: "Fecha inválida (debe ser formato YYYY-MM-DD)" }, { status: 400 });
      }
      const dayRange = localDayUtcRange(date, business.timezone);
      if (!dayRange) {
        return NextResponse.json({ error: "No se pudo calcular el rango del día" }, { status: 400 });
      }
      startsAt = dayRange.startsAt;
      endsAt = dayRange.endsAt;
    } else if (mode === "custom_hours") {
      if (!date || !isValidDateOnly(date)) {
        return NextResponse.json({ error: "Fecha inválida (debe ser formato YYYY-MM-DD)" }, { status: 400 });
      }
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
    } else if (!mode) {
      // Backward compatibility for { date, isFullDay, startTime, endTime }
      if (!date || !isValidDateOnly(date)) {
        return NextResponse.json({ error: "Fecha inválida (debe ser formato YYYY-MM-DD)" }, { status: 400 });
      }
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
    } else {
      return NextResponse.json({ error: "Modo de bloqueo no válido" }, { status: 400 });
    }

    if (!startsAt || !endsAt) {
      return NextResponse.json({ error: "No se pudo determinar el horario a bloquear" }, { status: 400 });
    }

    const block = await prisma.scheduleBlock.create({
      data: {
        businessId: business.id,
        professionalId: professionalId ? professionalId : null,
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
  const rawSlug = searchParams.get("slug");

  if (!id || !rawSlug || !rawSlug.trim()) {
    return NextResponse.json({ error: "Faltan parámetros id o slug" }, { status: 400 });
  }
  const slug = rawSlug.trim();

  try {
    let business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!business && slug.toLowerCase() !== slug) {
      business = await prisma.business.findUnique({
        where: { slug: slug.toLowerCase() },
        select: { id: true },
      });
    }
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
