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
      include: { menuItems: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, menuItems: business.menuItems });
  } catch (error) {
    console.error("Error al obtener platos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, name, price, description, category } = body;
    if (!slug || !name || price === undefined || !category) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    const menuItem = await prisma.menuItem.create({
      data: {
        businessId: business.id,
        name,
        price: parseFloat(price),
        description: description || null,
        category,
      },
    });
    return NextResponse.json({ success: true, menuItem });
  } catch (error) {
    console.error("Error al crear plato:", error);
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
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar plato:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
