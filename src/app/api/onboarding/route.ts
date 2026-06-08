import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const RESERVED_SLUGS = ["admin", "api", "public", "auth", "static", "login", "register", "success"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, ownerName, category, teamSize, country, serviceName, serviceDuration, servicePrice } = body;

    // Verificar presencia de campos requeridos (permitiendo precios en 0)
    if (
      !name ||
      !ownerName ||
      !category ||
      !teamSize ||
      !country ||
      !serviceName ||
      serviceDuration === undefined ||
      servicePrice === undefined ||
      servicePrice === ""
    ) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Validar precio y duración
    const parsedPrice = parseFloat(servicePrice);
    const parsedDuration = parseInt(serviceDuration, 10);
    if (isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedDuration) || parsedDuration <= 0) {
      return NextResponse.json({ error: "Precio o duración inválidos" }, { status: 400 });
    }

    // Generar slug único del negocio (removiendo acentos en español)
    let slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remueve tildes de forma segura
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remueve caracteres especiales
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Evitar slug vacío
    if (!slug) {
      slug = "negocio";
    }

    // Evitar slugs reservados
    if (RESERVED_SLUGS.includes(slug)) {
      slug = `${slug}-negocio`;
    }

    // Loop de unicidad para evitar colisiones
    let finalSlug = slug;
    let collision = true;
    let attempts = 0;
    while (collision && attempts < 100) {
      const existing = await prisma.business.findUnique({ where: { slug: finalSlug } });
      if (existing) {
        finalSlug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
        attempts++;
      } else {
        collision = false;
      }
    }

    // Determinar la moneda por país
    const currency = country === "Chile" ? "CLP" : country === "México" ? "MXN" : "USD";

    // Crear negocio, servicio por defecto y profesional por defecto (el dueño)
    const business = await prisma.business.create({
      data: {
        name,
        slug: finalSlug,
        ownerName,
        category,
        teamSize,
        country,
        currency,
        services: {
          create: {
            name: serviceName,
            duration: parsedDuration,
            price: parsedPrice,
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
  } catch (error) {
    console.error("Error en onboarding:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
