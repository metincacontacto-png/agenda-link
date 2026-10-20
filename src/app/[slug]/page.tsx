import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidSlug } from "@/lib/reserved-slugs";
import { prisma } from "@/lib/db";
import BookingClient from "./BookingClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return {
      title: "Página no encontrada (Error 404)",
      robots: { index: false, follow: false },
    };
  }

  const business = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, landingSubtitle: true },
  });

  if (!business) {
    return {
      title: "Página no encontrada (Error 404)",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${business.name} | Agendar Cita`,
    description:
      business.landingSubtitle ||
      `Reserva tu hora de atención online en ${business.name} a través de AgendaLink.`,
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isValidSlug(slug)) {
    notFound();
  }

  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!business) {
    notFound();
  }

  return <BookingClient slug={slug} initialBusinessName={business.name} />;
}
