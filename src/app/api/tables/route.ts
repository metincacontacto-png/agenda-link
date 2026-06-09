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
      include: { tables: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, tables: business.tables });
  } catch (error) {
    console.error("Error al obtener mesas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, number, capacity } = body;
    if (!slug || number === undefined || capacity === undefined) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    const table = await prisma.table.create({
      data: {
        businessId: business.id,
        number: parseInt(number, 10),
        capacity: parseInt(capacity, 10),
      },
    });
    return NextResponse.json({ success: true, table });
  } catch (error) {
    console.error("Error al crear mesa:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Falta el parámetro id" }, { status: 400 });
    }
    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar mesa:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
