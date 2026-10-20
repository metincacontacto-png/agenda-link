import "./globals.css";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://agendalink.cl"),
  title: {
    default: "AgendaLink — Un link. Todo resuelto.",
    template: "%s | AgendaLink",
  },
  description:
    "La forma más simple de recibir reservas y organizar tu negocio en Chile. Tu link personalizado listo en 30 segundos.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://agendalink.cl",
    siteName: "AgendaLink",
    title: "AgendaLink — Un link. Todo resuelto.",
    description: "La forma más simple de recibir reservas y organizar tu negocio en Chile.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "AgendaLink",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgendaLink — Un link. Todo resuelto.",
    description: "La forma más simple de recibir reservas y organizar tu negocio en Chile.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
