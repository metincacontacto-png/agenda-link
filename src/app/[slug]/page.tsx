import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isValidSlug } from "@/lib/reserved-slugs";
import { prisma } from "@/lib/db";
import { isSubscriptionActive } from "@/features/businesses/subscription-policy";
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
    alternates: {
      canonical: `https://agendalink.cl/${slug}`,
    },
    ...(slug === "valentina" ? { robots: { index: false, follow: false } } : {}),
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
    select: {
      id: true,
      name: true,
      billingBypass: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  });

  if (!business) {
    notFound();
  }

  if (!isSubscriptionActive(business)) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          background: "#f8fafc",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 460,
            width: "100%",
            background: "#fff",
            borderRadius: 20,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🗓️</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "#0f172a" }}>{business.name}</h1>
          <div
            style={{
              display: "inline-block",
              background: "rgba(245, 158, 11, 0.12)",
              color: "#b45309",
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Reservas pausadas temporalmente
          </div>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
            Este negocio no tiene disponible la agenda en línea en este momento. Si necesitas agendar, por favor comunícate directamente con el establecimiento.
          </p>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
            <Link
              href={`/login?next=${encodeURIComponent(`/admin/${slug}`)}`}
              style={{ fontSize: 12.5, color: "#0070f3", textDecoration: "none", fontWeight: 600 }}
            >
              ¿Eres el dueño de este negocio? Iniciar sesión →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <BookingClient slug={slug} initialBusinessName={business.name} />;
}
