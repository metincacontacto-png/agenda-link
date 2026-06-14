import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ error: "Falta el parámetro domain" }, { status: 400 });
    }

    // Buscar el negocio que tiene configurado este customDomain
    const business = await prisma.business.findUnique({
      where: { customDomain: domain },
      select: { slug: true }
    });

    if (!business) {
      return NextResponse.json({ error: "Dominio no asociado a ningún negocio" }, { status: 404 });
    }

    return NextResponse.json({ success: true, slug: business.slug });
  } catch (error) {
    console.error("Error en domain-lookup:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
