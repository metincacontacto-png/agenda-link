import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        appointments: {
          orderBy: { dateTime: "asc" },
          include: {
            service: true,
            professional: true,
            table: true,
          },
        },
        services: true,
        professionals: true,
        tables: true,
        menuItems: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, business });
  } catch (error) {
    console.error("Error al obtener datos de admin:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
