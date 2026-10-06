import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logServerError } from "@/lib/observability";

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
    logServerError(request, "domain_lookup.failed", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
