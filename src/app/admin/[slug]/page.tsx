import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";
import styles from "./admin.module.css";

async function getAdminData(slug: string) {
  if (!slug) return null;
  return await prisma.business.findUnique({
    where: { slug },
    include: {
      appointments: {
        orderBy: { dateTime: "asc" },
        include: {
          service: true,
          professional: true,
        },
      },
      services: true,
    },
  });
}

export default async function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await getAdminData(slug);

  if (!business) {
    return (
      <main className={styles.container} style={{ textAlign: "center", padding: "40px" }}>
        <h1 className={styles.title}>Negocio no encontrado</h1>
        <p className={styles.subtitle} style={{ marginBottom: "20px" }}>
          No pudimos encontrar el negocio especificado.
        </p>
        <Link href="/" className={styles.pubLinkBtn} style={{ display: "inline-flex" }}>
          Volver al Registro
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{business.name}</h1>
          <p className={styles.subtitle}>
            Panel de Administración · Plan Automático: {business.teamSize}
          </p>
        </div>
        <Link href={`/${business.slug}`} className={styles.pubLinkBtn}>
          Ver link público ↗
        </Link>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Próximas Citas Reservadas</h2>
        
        {business.appointments.length === 0 ? (
          <p className={styles.emptyState}>
            Aún no tienes citas agendadas. ¡Comparte tu link para empezar a recibir reservas!
          </p>
        ) : (
          <div className={styles.appointmentList}>
            {business.appointments.map((app) => {
              const appDate = new Date(app.dateTime).toLocaleDateString("es-ES", {
                day: "numeric", 
                month: "short", 
                hour: "2-digit", 
                minute: "2-digit"
              });

              return (
                <div key={app.id} className={styles.appointmentItem}>
                  <div className={styles.clientInfo}>
                    <h3 className={styles.clientName}>{app.clientName}</h3>
                    <p className={styles.clientWhatsApp}>
                      WhatsApp: {app.clientWhatsApp}
                    </p>
                    <p className={styles.appointmentDetails}>
                      {app.service.name} ({app.service.duration}m) con {app.professional.name}
                    </p>
                  </div>
                  <div className={styles.dateTimeInfo}>
                    <span className={styles.dateText}>{appDate}</span>
                    <span className={styles.statusText}>CONFIRMADA</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
