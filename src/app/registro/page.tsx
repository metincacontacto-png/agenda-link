import React, { Suspense } from "react";
import OnboardingForm from "@/components/OnboardingForm";

export const metadata = {
  title: "Crea tu AgendaLink | AgendaLink",
  description: "Configura tu página y empieza a recibir solicitudes de reserva en menos de 10 minutos.",
};

export default function RegistroPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0b1220" }} />}>
      <OnboardingForm />
    </Suspense>
  );
}
