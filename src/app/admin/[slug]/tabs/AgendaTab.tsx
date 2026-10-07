"use client";

import type { BusinessAppointmentDTO } from "@/features/businesses/contracts";
import styles from "../admin.module.css";

interface AgendaTabProps {
  businessCurrency: string;
  weekDates: Date[];
  hourSlots: string[];
  weekRangeLabel: string;
  getAppointmentsForSlot: (date: Date, hour: string) => BusinessAppointmentDTO[];
  formatPrice: (price: number, currency: string) => string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export default function AgendaTab({
  businessCurrency,
  weekDates,
  hourSlots,
  weekRangeLabel,
  getAppointmentsForSlot,
  formatPrice,
  onPreviousWeek,
  onNextWeek,
}: AgendaTabProps) {
  return (
    <section className={styles.glassCard} style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Agenda de Turnos</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={onPreviousWeek} className={styles.navItemActive} style={{ width: "32px", height: "32px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
            &lt;
          </button>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)", minWidth: "150px", textAlign: "center" }}>
            {weekRangeLabel}
          </span>
          <button onClick={onNextWeek} className={styles.navItemActive} style={{ width: "32px", height: "32px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
            &gt;
          </button>
        </div>
      </div>

      <div className={styles.calendarWrapper}>
        <table className={styles.calendarTable}>
          <thead>
            <tr>
              <th className={styles.calendarTimeHeaderCell}>Hora</th>
              {weekDates.map((date, index) => {
                const dayName = date.toLocaleDateString("es-ES", { weekday: "short" });
                const dayNumber = date.getDate();
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <th key={index} className={styles.calendarHeaderCell} style={isToday ? { color: "var(--primary)", borderBottomColor: "var(--primary)" } : {}}>
                    <span style={{ display: "block", textTransform: "capitalize", fontSize: "10px", color: "var(--text-secondary)" }}>{dayName}</span>
                    <span style={{ fontSize: "16px", fontWeight: "800" }}>{dayNumber}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hourSlots.map((hour, rowIndex) => (
              <tr key={rowIndex} className={styles.calendarRow}>
                <td className={styles.calendarTimeCell}>{hour}</td>
                {weekDates.map((date, columnIndex) => {
                  const appointments = getAppointmentsForSlot(date, hour);
                  return (
                    <td key={columnIndex} className={styles.calendarCell}>
                      {appointments.map((appointment) => {
                        const isPaid = appointment.paymentStatus === "PAID";
                        return (
                          <div key={appointment.id} className={`${styles.appointmentBlock} ${isPaid ? styles.appointmentBlockPaid : ""}`}>
                            <div className={styles.appointmentClientName}>{appointment.clientName}</div>
                            <div className={styles.appointmentServiceName}>{appointment.service?.name}</div>
                            <div className={`${styles.appointmentPriceBadge} ${isPaid ? styles.appointmentPriceBadgePaid : ""}`} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                              {isPaid && (
                                <svg className={styles.badgeIcon} style={{ width: "10px", height: "10px", marginRight: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              {formatPrice(appointment.paymentAmount || appointment.service?.price || 0, businessCurrency)}
                            </div>
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
