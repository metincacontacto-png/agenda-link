import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/server/authorize";
import { enforceRateLimit } from "@/server/rate-limit";
import { logServerError } from "@/server/observability";

export async function GET(request: Request) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "SUPER_ADMIN_RATE_LIMITER", "super-admin");
    if (rateLimitResponse) return rateLimitResponse;
    const authorization = await requireSuperAdmin(request);
    if (!authorization.ok) return authorization.response;

    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerName: true,
        category: true,
        country: true,
        teamSize: true,
        plan: true,
        billingBypass: true,
        customDomain: true,
        createdAt: true,
      }
    });

    const maintenanceSetting = await prisma.systemSetting.findUnique({
      where: { key: "maintenanceMode" }
    });
    const maintenanceMode = maintenanceSetting ? maintenanceSetting.value === "true" : false;

    return NextResponse.json({ success: true, businesses, maintenanceMode });
  } catch (error) {
    logServerError(request, "super_admin.read.failed", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "SUPER_ADMIN_RATE_LIMITER", "super-admin");
    if (rateLimitResponse) return rateLimitResponse;
    const authorization = await requireSuperAdmin(request);
    if (!authorization.ok) return authorization.response;

    const body = await request.json();
    const { isMaintenanceToggle, maintenanceMode, slug, plan, billingBypass, customDomain } = body;

    // Si es un toggle global de mantenimiento
    if (isMaintenanceToggle !== undefined) {
      const updatedSetting = await prisma.systemSetting.upsert({
        where: { key: "maintenanceMode" },
        update: { value: maintenanceMode ? "true" : "false" },
        create: { key: "maintenanceMode", value: maintenanceMode ? "true" : "false" }
      });
      return NextResponse.json({ success: true, maintenanceMode: updatedSetting.value === "true" });
    }

    if (!slug) {
      return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
    }

    // Validar conflicto de dominio personalizado
    if (customDomain) {
      const cleanDomain = customDomain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
      
      const existing = await prisma.business.findFirst({
        where: {
          customDomain: cleanDomain,
          NOT: { slug }
        }
      });

      if (existing) {
        return NextResponse.json({ error: `El dominio ${cleanDomain} ya está asignado a otro negocio.` }, { status: 400 });
      }
    }

    const updatedBusiness = await prisma.business.update({
      where: { slug },
      data: {
        plan: plan === undefined ? undefined : plan,
        billingBypass: billingBypass === undefined ? undefined : billingBypass,
        customDomain: customDomain === undefined ? undefined : (customDomain ? customDomain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "") : null)
      }
    });

    return NextResponse.json({ success: true, business: updatedBusiness });
  } catch (error) {
    logServerError(request, "super_admin.update.failed", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
