import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, ownerName, category, teamSize, country, serviceName, serviceDuration, servicePrice } = body;

    if (!name || !ownerName || !category || !teamSize || !country || !serviceName || !serviceDuration || !servicePrice) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Generar slug único del negocio
    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Si el slug existe, añadir sufijo aleatorio
    const existing = await prisma.business.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Determinar la moneda por país
    const currency = country === "Chile" ? "CLP" : country === "México" ? "MXN" : "USD";

    // Crear negocio, servicio por defecto y profesional por defecto (el dueño)
    const business = await prisma.business.create({
      data: {
        name,
        slug,
        ownerName,
        category,
        teamSize,
        country,
        currency,
        services: {
          create: {
            name: serviceName,
            duration: parseInt(serviceDuration, 10),
            price: parseFloat(servicePrice),
          },
        },
        professionals: {
          create: {
            name: ownerName,
            avatar: ownerName.substring(0, 2).toUpperCase(),
          },
        },
      },
      include: {
        services: true,
        professionals: true,
      },
    });

    return NextResponse.json({ success: true, slug: business.slug, business });
  } catch (error: any) {
    console.error("Error en onboarding:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
