import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadBase64ToR2, deleteFromR2 } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, name, price, duration, imageUrl } = body;
    if (!slug || !name || price === undefined || duration === undefined) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    const finalImageUrl = await uploadBase64ToR2(imageUrl, `service_${slug}`);
    const service = await prisma.service.create({
      data: {
        businessId: business.id,
        name,
        price: parseFloat(price),
        duration: parseInt(duration, 10),
        imageUrl: finalImageUrl || null,
      },
    });
    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Error al crear servicio:", error);
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
    const service = await prisma.service.findUnique({ where: { id } });
    if (service?.imageUrl) {
      await deleteFromR2(service.imageUrl);
    }
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
