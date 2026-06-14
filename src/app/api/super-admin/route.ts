import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getSuperAdminPassword(): string {
  try {
    const { env } = getCloudflareContext();
    return (env as { SUPER_ADMIN_PASSWORD?: string }).SUPER_ADMIN_PASSWORD || "Giovanni2026";
  } catch {
    return process.env.SUPER_ADMIN_PASSWORD || "Giovanni2026";
  }
}

function checkAuth(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const passwordParam = searchParams.get("password");
  const authHeader = request.headers.get("x-super-admin-password");
  
  const superAdminPassword = getSuperAdminPassword();
  return passwordParam === superAdminPassword || authHeader === superAdminPassword;
}

export async function GET(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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
    console.error("Error en super-admin GET:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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
    console.error("Error en super-admin PUT:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
