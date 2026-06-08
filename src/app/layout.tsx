import "./globals.css";
import React from "react";

export const metadata = {
  title: "Agenda Link",
  description: "Un link. Todo resuelto.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
