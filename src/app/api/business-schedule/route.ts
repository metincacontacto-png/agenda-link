import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessMembership, requireSession } from "@/server/authorize";
import { parseLocalTime } from "@/features/schedule/time";
import { logServerError } from "@/server/observability";

interface DayScheduleInput {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get("slug");
  if (!rawSlug || !rawSlug.trim()) {
    return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
  }
  const slug = rawSlug.trim();

  let businessId: string | undefined;
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
    businessId = business.id;

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    const schedules = await prisma.businessSchedule.findMany({
      where: { businessId: business.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ success: true, schedules });
  } catch (error) {
    logServerError(request, "businessSchedule.list.failed", error, { businessId });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("slug" in body) ||
    typeof (body as Record<string, unknown>).slug !== "string" ||
    !("days" in body) ||
    !Array.isArray((body as Record<string, unknown>).days)
  ) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const { slug, days } = body as {
    slug: string;
    days: Array<DayScheduleInput>;
  };

  const enabledDays: Array<{ dayOfWeek: number; startMinute: number; endMinute: number }> = [];
  const seenIntervals = new Set<string>();

  for (const item of days) {
    if (typeof item !== "object" || item === null) {
      return NextResponse.json({ error: "Elemento de horario inválido" }, { status: 400 });
    }

    const { dayOfWeek, enabled, startTime, endTime } = item;

    if (
      typeof dayOfWeek !== "number" ||
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6
    ) {
      return NextResponse.json({ error: "Día de la semana inválido (debe ser entre 0 y 6)" }, { status: 400 });
    }

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Campo enabled debe ser booleano" }, { status: 400 });
    }

    if (enabled) {
      if (typeof startTime !== "string" || typeof endTime !== "string") {
        return NextResponse.json({ error: "Hora de inicio y fin son requeridas para días activos" }, { status: 400 });
      }

      const startMinute = parseLocalTime(startTime);
      const endMinute = parseLocalTime(endTime);

      if (startMinute === null || endMinute === null || startMinute >= endMinute) {
        return NextResponse.json(
          { error: "Rango de horario inválido (debe tener formato HH:mm y la hora de inicio debe ser anterior a la de fin)" },
          { status: 400 },
        );
      }

      const key = `${dayOfWeek}:${startMinute}:${endMinute}`;
      if (!seenIntervals.has(key)) {
        seenIntervals.add(key);
        enabledDays.push({ dayOfWeek, startMinute, endMinute });
      }
    }
  }

  let businessId: string | undefined;
  try {
    const cleanSlug = slug.trim();
    let business = await prisma.business.findUnique({
      where: { slug: cleanSlug },
      select: { id: true },
    });
    if (!business && cleanSlug.toLowerCase() !== cleanSlug) {
      business = await prisma.business.findUnique({
        where: { slug: cleanSlug.toLowerCase() },
        select: { id: true },
      });
    }
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    businessId = business.id;

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    const professionals = await prisma.professional.findMany({
      where: { businessId: business.id },
      select: { id: true },
    });

    const businessScheduleData = enabledDays.map((d) => ({
      id: crypto.randomUUID(),
      businessId: business.id,
      dayOfWeek: d.dayOfWeek,
      startMinute: d.startMinute,
      endMinute: d.endMinute,
    }));

    const professionalScheduleData = professionals.flatMap((prof) =>
      enabledDays.map((d) => ({
        id: crypto.randomUUID(),
        professionalId: prof.id,
        dayOfWeek: d.dayOfWeek,
        startMinute: d.startMinute,
        endMinute: d.endMinute,
      })),
    );

    // 1. Limpiar horarios de negocio previos
    await prisma.businessSchedule.deleteMany({
      where: { businessId: business.id },
    });

    // 2. Insertar nuevos horarios de negocio
    for (const item of businessScheduleData) {
      await prisma.businessSchedule.create({
        data: item,
      });
    }

    // 3. Sincronizar horarios de los profesionales del negocio
    if (professionals.length > 0) {
      for (const prof of professionals) {
        await prisma.professionalSchedule.deleteMany({
          where: { professionalId: prof.id },
        });
      }

      for (const profItem of professionalScheduleData) {
        await prisma.professionalSchedule.create({
          data: profItem,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError(request, "businessSchedule.update.failed", error, { businessId });
    const msg = error instanceof Error ? error.message : "Error interno al guardar horario";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
