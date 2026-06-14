import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const RESERVED_SLUGS = ["admin", "api", "public", "auth", "static", "login", "register", "success"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      ownerName,
      email,
      category,
      teamSize,
      country,
      serviceName,
      serviceDuration,
      servicePrice,
    } = body;
    // Verificar presencia de campos requeridos (permitiendo precios en 0)
    if (
      !name ||
      !ownerName ||
      !email ||
      !category ||
      !teamSize ||
      !country
    ) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Default service values based on category
    let finalServiceName = serviceName || "";
    let finalServiceDuration = serviceDuration ? parseInt(serviceDuration, 10) : 30;
    let finalServicePrice = servicePrice !== undefined && servicePrice !== "" ? parseFloat(servicePrice) : 0;

    if (!finalServiceName) {
      if (category === "Peluquería") {
        finalServiceName = "Corte de Cabello Caballero";
        finalServiceDuration = 30;
        finalServicePrice = 12000;
      } else if (category === "Salud") {
        finalServiceName = "Consulta General";
        finalServiceDuration = 30;
        finalServicePrice = 25000;
      } else if (category === "Fitness") {
        finalServiceName = "Evaluación o Clase Personalizada";
        finalServiceDuration = 60;
        finalServicePrice = 15000;
      } else if (category === "Profesionales") {
        finalServiceName = "Asesoría o Consultoría Inicial";
        finalServiceDuration = 45;
        finalServicePrice = 30000;
      } else {
        finalServiceName = "Servicio General";
        finalServiceDuration = 30;
        finalServicePrice = 15000;
      }
    }

    // Validar precio y duración final
    if (isNaN(finalServicePrice) || finalServicePrice < 0 || isNaN(finalServiceDuration) || finalServiceDuration <= 0) {
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
        email: email.trim().toLowerCase(),
        category,
        teamSize,
        country,
        currency,
        services: {
          create: {
            name: finalServiceName,
            duration: finalServiceDuration,
            price: finalServicePrice,
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
