import React from "react";
import { prisma } from "@/lib/db";
import styles from "./success.module.css";
import Link from "next/link";

async function getAppointment(id: string) {
  if (!id) return null;
  return await prisma.appointment.findUnique({
    where: { id },
    include: {
      service: true,
      professional: true,
      business: true,
    },
  });
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ appId: string }>;
}) {
  const { slug } = await params;
  const { appId } = await searchParams;

  const appointment = await getAppointment(appId);

  if (!appointment) {
    return (
      <main className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title} style={{ color: "var(--danger)" }}>Cita no encontrada</h1>
          <p className={styles.subtitle}>No se pudo cargar la información de tu reserva o el enlace expiró.</p>
          <Link href={`/${slug}`} className={styles.btn}>
            Volver a Intentar
          </Link>
        </div>
      </main>
    );
  }

  const dateFormatted = new Date(appointment.dateTime).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeFormatted = new Date(appointment.dateTime).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formatPrice = (price: number, currency: string) => {
    if (currency === "CLP") {
      return `$${price.toLocaleString("es-CL")}`;
    } else if (currency === "MXN") {
      return `$${price.toLocaleString("es-MX")} MXN`;
    }
    return `$${price.toFixed(2)} USD`;
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.successIcon}>✓</div>
        <h1 className={styles.title}>¡Reserva Confirmada!</h1>
        <p className={styles.subtitle}>
          Recibirás la confirmación por WhatsApp en unos instantes.
        </p>

        <div className={styles.detailsList}>
          <div className={styles.row}>
            <span className={styles.label}>Negocio:</span>
            <span className={styles.value}>{appointment.business.name}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Servicio:</span>
            <span className={styles.value}>{appointment.service.name}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Profesional:</span>
            <span className={styles.value}>{appointment.professional.name}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Fecha:</span>
            <span className={styles.value} style={{ textTransform: "capitalize" }}>{dateFormatted}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Hora:</span>
            <span className={styles.value}>{timeFormatted}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Pago:</span>
            <span className={styles.value} style={{ fontWeight: "700", color: "var(--success)" }}>
              ✓ {formatPrice(appointment.paymentAmount || appointment.service.price, appointment.business.currency)} PAGADO ({appointment.paymentMethod || "Tarjeta"})
            </span>
          </div>
        </div>

        <Link href={`/${slug}`} className={styles.btn}>
          Volver al Inicio
        </Link>
      </div>
    </main>
  );
}
