import React, { Suspense } from "react";
import type { Metadata } from "next";
import RegistroForm from "@/components/RegistroForm";

export const metadata: Metadata = {
  title: "Crea tu AgendaLink gratis",
  description: "Configura tu página y empieza a recibir solicitudes de reserva en menos de 10 minutos.",
  alternates: {
    canonical: "/registro",
  },
};

export default function RegistroPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f8fafc" }} />}>
      <RegistroForm />
    </Suspense>
  );
}
