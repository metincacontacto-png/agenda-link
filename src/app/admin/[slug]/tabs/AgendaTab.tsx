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
  onOpenScheduleBlocks?: () => void;
  scheduleBlocks: Array<{ id: string; startsAt: string; endsAt: string; reason: string | null }>;
  onBlockSlot: (date: Date, hour: string) => Promise<void> | void;
  onUnblockSlot: (blockId: string) => Promise<void> | void;
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
  onOpenScheduleBlocks,
  scheduleBlocks = [],
  onBlockSlot,
  onUnblockSlot,
}: AgendaTabProps) {
  const getBlockForSlot = (date: Date, hour: string) => {
    const [slotHour, slotMinute = 0] = hour.split(":").map((val) => Number.parseInt(val, 10));
    const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), slotHour, slotMinute, 0, 0).getTime();
    const slotEnd = slotStart + 60 * 60 * 1000;

    return scheduleBlocks.find((block) => {
      const blockStart = new Date(block.startsAt).getTime();
      const blockEnd = new Date(block.endsAt).getTime();
      if (Number.isNaN(blockStart) || Number.isNaN(blockEnd)) return false;
      return slotStart < blockEnd && slotEnd > blockStart;
    });
  };
  return (
    <section className={styles.glassCard} style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Agenda de Turnos</h2>
          {onOpenScheduleBlocks && (
            <button
              type="button"
              onClick={onOpenScheduleBlocks}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#0f172a",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <span>⛔</span> Bloquear Día u Horario
            </button>
          )}
        </div>
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
                  const block = getBlockForSlot(date, hour);

                  return (
                    <td key={columnIndex} className={styles.calendarCell}>
                      {appointments.length > 0 ? (
                        appointments.map((appointment) => {
                          const isPaid = appointment.paymentStatus === "PAID";
                          const appDate = new Date(appointment.dateTime);
                          const timeStr = appDate.toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          });
                          return (
                            <div key={appointment.id} className={`${styles.appointmentBlock} ${isPaid ? styles.appointmentBlockPaid : ""}`}>
                              <div className={styles.appointmentTimeBadge}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {timeStr} hrs
                              </div>
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
                        })
                      ) : block ? (
                        <div className={styles.calendarBlockCard}>
                          <div>
                            <div className={styles.calendarBlockTitle}>
                              <span>🔴</span>
                              <span>Ocupado (Bloqueado)</span>
                            </div>
                            {block.reason && (
                              <div className={styles.calendarBlockReason} title={block.reason}>
                                {block.reason}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className={styles.calendarUnblockBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              void onUnblockSlot(block.id);
                            }}
                          >
                            🔓 Desbloquear
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.calendarAddBlockBtn}
                          onClick={() => void onBlockSlot(date, hour)}
                        >
                          + Bloquear
                        </button>
                      )}
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
