import "./globals.css";
import React from "react";

export const metadata = {
  metadataBase: new URL("https://agendalink.cl"),
  title: "Agenda Link",
  description: "Un link. Todo resuelto.",
  openGraph: {
    title: "Agenda Link",
    description: "Un link. Todo resuelto.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Agenda Link Logo",
      },
    ],
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
