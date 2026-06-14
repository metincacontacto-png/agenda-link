import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const maintenanceSetting = await prisma.systemSetting.findUnique({
      where: { key: "maintenanceMode" }
    });
    const maintenanceMode = maintenanceSetting ? maintenanceSetting.value === "true" : false;
    return NextResponse.json({ maintenanceMode });
  } catch (error) {
    console.error("Error in maintenance-check:", error);
    return NextResponse.json({ maintenanceMode: false });
  }
}
