import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, name, category } = body;

    if (!slug) {
      return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
    }

    // Check if business exists
    let business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business) {
      // Auto-create business with default premium features and realistic mock data
      business = await prisma.business.create({
        data: {
          slug,
          name: name || "Me Tinca Estudio Creativo",
          category: category || "Estética/Salón",
          ownerName: "Diego de Oro",
          teamSize: "2-5 personas",
          country: "Chile",
          currency: "CLP",
          landingTitle: name || "Me Tinca Estudio Creativo",
          landingSubtitle: "Agenda tu cita en segundos.",
          landingAbout: "Somos una agencia experta en marcas y marketing.",
          landingPhone: "+56985967325",
          landingAddress: "Diego de oro 382",
          landingHours: "Lun a Sáb 9:00 a 18:00 hrs",
          plan: "NEGOCIO", // Default to premium for demo
          billingBypass: false,
        },
      });

      // Seed 2 default services
      await prisma.service.createMany({
        data: [
          {
            businessId: business.id,
            name: "Consultoría de Marketing",
            duration: 45,
            price: 70000,
          },
          {
            businessId: business.id,
            name: "Consultoría de Sistemas",
            duration: 45,
            price: 70000,
          },
        ],
      });

      // Seed 2 default professionals
      await prisma.professional.createMany({
        data: [
          {
            businessId: business.id,
            name: "Diego de Oro",
          },
          {
            businessId: business.id,
            name: "Pilar Repetto",
          },
        ],
      });
    }

    return NextResponse.json({ success: true, slug: business.slug });
  } catch (error) {
    console.error("Error seeding google account business:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
