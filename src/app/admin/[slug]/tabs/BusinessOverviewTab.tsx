"use client";

import type { DashboardMetrics } from "@/features/businesses/dashboard-metrics";
import styles from "../admin.module.css";

export default function BusinessOverviewTab({
  metrics,
  serviceCount,
  professionalCount,
}: {
  metrics: DashboardMetrics;
  serviceCount: number;
  professionalCount: number;
}) {
  return (
    <section className={styles.glassCard}>
      <div className={styles.reportTitle}>Resumen del negocio</div>
      <p className={styles.reportParagraph} style={{ margin: "12px 0 20px" }}>
        Indicadores derivados de las citas y del catálogo cargados; no incluyen ingresos de caja ni campañas.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p className={styles.reportParagraph}><strong>Reservas registradas:</strong> {metrics.totalReservations}.</p>
        <p className={styles.reportParagraph}><strong>Catálogo:</strong> {serviceCount} servicios y {professionalCount} profesionales.</p>
        <p className={styles.reportParagraph}><strong>Mensajería:</strong> no configurada.</p>
      </div>
    </section>
  );
}
