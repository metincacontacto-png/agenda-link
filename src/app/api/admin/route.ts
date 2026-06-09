import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadBase64ToR2, deleteFromR2 } from "@/lib/r2";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slug,
      name,
      category,
      teamSize,
      currency,
      logoUrl,
      landingTitle,
      landingSubtitle,
      landingAbout,
      landingCoverUrl,
      landingSecondaryCoverUrl,
      landingPhone,
      landingAddress,
      landingHours,
      landingFeaturesJson,
      landingTestimonialsJson,
    } = body;

    if (!slug) {
      return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
    }

    // Obtener valores actuales en la base de datos para controlar la sobreescritura de archivos
    const existing = await prisma.business.findUnique({
      where: { slug },
      select: { logoUrl: true, landingCoverUrl: true, landingSecondaryCoverUrl: true }
    });

    let finalLogoUrl = logoUrl;
    let finalCoverUrl = landingCoverUrl;
    let finalSecondaryCoverUrl = landingSecondaryCoverUrl;

    if (logoUrl !== undefined) {
      if (logoUrl && logoUrl.startsWith("data:image/")) {
        if (existing?.logoUrl) await deleteFromR2(existing.logoUrl);
        finalLogoUrl = await uploadBase64ToR2(logoUrl, `logo_${slug}`);
      } else if ((logoUrl === null || logoUrl === "") && existing?.logoUrl) {
        await deleteFromR2(existing.logoUrl);
      }
    }

    if (landingCoverUrl !== undefined) {
      if (landingCoverUrl && landingCoverUrl.startsWith("data:image/")) {
        if (existing?.landingCoverUrl) await deleteFromR2(existing.landingCoverUrl);
        finalCoverUrl = await uploadBase64ToR2(landingCoverUrl, `cover_${slug}`);
      } else if ((landingCoverUrl === null || landingCoverUrl === "") && existing?.landingCoverUrl) {
        await deleteFromR2(existing.landingCoverUrl);
      }
    }

    if (landingSecondaryCoverUrl !== undefined) {
      if (landingSecondaryCoverUrl && landingSecondaryCoverUrl.startsWith("data:image/")) {
        if (existing?.landingSecondaryCoverUrl) await deleteFromR2(existing.landingSecondaryCoverUrl);
        finalSecondaryCoverUrl = await uploadBase64ToR2(landingSecondaryCoverUrl, `seccover_${slug}`);
      } else if ((landingSecondaryCoverUrl === null || landingSecondaryCoverUrl === "") && existing?.landingSecondaryCoverUrl) {
        await deleteFromR2(existing.landingSecondaryCoverUrl);
      }
    }

    const business = await prisma.business.update({
      where: { slug },
      data: {
        name,
        category,
        teamSize,
        currency,
        logoUrl: finalLogoUrl === undefined ? undefined : finalLogoUrl,
        landingTitle: landingTitle === undefined ? undefined : landingTitle,
        landingSubtitle: landingSubtitle === undefined ? undefined : landingSubtitle,
        landingAbout: landingAbout === undefined ? undefined : landingAbout,
        landingCoverUrl: finalCoverUrl === undefined ? undefined : finalCoverUrl,
        landingSecondaryCoverUrl: finalSecondaryCoverUrl === undefined ? undefined : finalSecondaryCoverUrl,
        landingPhone: landingPhone === undefined ? undefined : landingPhone,
        landingAddress: landingAddress === undefined ? undefined : landingAddress,
        landingHours: landingHours === undefined ? undefined : landingHours,
        landingFeaturesJson: landingFeaturesJson === undefined ? undefined : landingFeaturesJson,
        landingTestimonialsJson: landingTestimonialsJson === undefined ? undefined : landingTestimonialsJson,
      },
    });

    return NextResponse.json({ success: true, business });
  } catch (error) {
    console.error("Error al actualizar datos de admin:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

