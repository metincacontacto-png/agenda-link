import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logServerError } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const maintenanceSetting = await prisma.systemSetting.findUnique({
      where: { key: "maintenanceMode" }
    });
    const maintenanceMode = maintenanceSetting ? maintenanceSetting.value === "true" : false;
    return NextResponse.json({ maintenanceMode });
  } catch (error) {
    logServerError(request, "maintenance_check.failed", error);
    return NextResponse.json({ maintenanceMode: false });
  }
}
