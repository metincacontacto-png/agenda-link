"use client";

import type { BusinessAppointmentDTO } from "@/features/businesses/contracts";
import styles from "../admin.module.css";

interface SalesTabProps {
  appointments: BusinessAppointmentDTO[];
  timezone: string;
  currency: string;
  piiRedacted: boolean;
  formatPrice: (price: number, currency: string) => string;
}

export default function SalesTab({
  appointments,
  timezone,
  currency,
  piiRedacted,
  formatPrice,
}: SalesTabProps) {
  return (
    <section className={styles.glassCard}>
      <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>
        Estado de pago en reservas
      </h2>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
        Consulta los importes y estados guardados en las citas cargadas. AgendaLink no procesa cobros ni reembolsos.
        {piiRedacted ? " Los datos personales están limitados por tu rol." : ""}
      </p>
      {appointments.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "32px 0" }}>
          No hay reservas cargadas.
        </p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.financialTable}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Servicio</th>
                <th>Monto registrado</th>
                <th>Estado guardado</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td style={{ fontWeight: "700" }}>
                    {piiRedacted ? "Información restringida" : appointment.clientName}
                  </td>
                  <td>
                    {new Date(appointment.dateTime).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: timezone,
                    })}
                  </td>
                  <td>{appointment.service.name}</td>
                  <td style={{ fontWeight: "700" }}>
                    {formatPrice(appointment.paymentAmount ?? appointment.service.price, currency)}
                  </td>
                  <td>
                    {appointment.paymentStatus === "PAID"
                      ? `Marcado como pagado${appointment.paymentMethod ? ` · ${appointment.paymentMethod}` : ""}`
                      : appointment.paymentStatus === "REFUNDED"
                        ? "Marcado como reembolsado"
                        : "Pendiente"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
