"use client";

import type { AdminAppointmentsPaginationDTO, BusinessAppointmentDTO } from "@/features/businesses/contracts";
import type { AppointmentChangeInput } from "@/features/booking/validation";
import { dateStringAtTimeZone } from "@/features/schedule/time";
import styles from "../admin.module.css";

interface ReservationsTabProps {
  appointments: BusinessAppointmentDTO[];
  pagination: AdminAppointmentsPaginationDTO;
  timezone: string;
  currency: string;
  reschedulingId: string | null;
  rescheduleDate: string;
  rescheduleTime: string;
  actionLoadingId: string | null;
  loadingMore: boolean;
  formatPrice: (price: number, currency: string) => string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onStartRescheduling: (appointment: BusinessAppointmentDTO) => void;
  onCancelRescheduling: () => void;
  onChangeAppointment: (id: string, change: AppointmentChangeInput) => void;
  onLoadMore: () => void;
}

export default function ReservationsTab({
  appointments,
  pagination,
  timezone,
  currency,
  reschedulingId,
  rescheduleDate,
  rescheduleTime,
  actionLoadingId,
  loadingMore,
  formatPrice,
  onDateChange,
  onTimeChange,
  onStartRescheduling,
  onCancelRescheduling,
  onChangeAppointment,
  onLoadMore,
}: ReservationsTabProps) {
  return (
    <section className={styles.glassCard}>
      <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Próximas Reservas Recibidas</h2>
      {appointments.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
          Aún no tienes citas agendadas. Comparte tu link para empezar.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {appointments.map((appointment) => (
            <div key={appointment.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "700" }}>{appointment.clientName}</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>WhatsApp: {appointment.clientWhatsApp}</p>
                <p style={{ fontSize: "12px", color: "var(--primary)", marginTop: "4px", fontWeight: "600" }}>
                  {`${appointment.service.name} con ${appointment.professional.name}`}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", display: "block" }}>
                  {new Date(appointment.dateTime).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: timezone })}
                </span>
                <div style={{ marginTop: "4px" }}>
                  {appointment.paymentStatus === "PAID" ? (
                    <span className={styles.badgePaid}>
                      <svg className={styles.badgeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      PAGADO ({formatPrice(appointment.paymentAmount || appointment.service.price || 0, currency)}{appointment.paymentMethod ? ` por ${appointment.paymentMethod}` : " · método no registrado"})
                    </span>
                  ) : (
                    <span className={styles.badgePaid} style={{ background: "rgba(255, 149, 0, 0.12)", color: "#b25900" }}>
                      <svg className={styles.badgeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      PENDIENTE DE PAGO ({formatPrice(appointment.service.price || 0, currency)})
                    </span>
                  )}
                </div>
                {appointment.status === "CONFIRMED" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                    {reschedulingId === appointment.id ? (
                      <>
                        <input
                          aria-label="Nueva fecha de la cita"
                          type="date"
                          min={dateStringAtTimeZone(new Date(), timezone)}
                          value={rescheduleDate}
                          onChange={(event) => onDateChange(event.target.value)}
                        />
                        <input
                          aria-label="Nueva hora de la cita"
                          type="time"
                          value={rescheduleTime}
                          onChange={(event) => onTimeChange(event.target.value)}
                        />
                        <button
                          type="button"
                          disabled={actionLoadingId === appointment.id || !rescheduleDate || !rescheduleTime}
                          onClick={() => onChangeAppointment(appointment.id, {
                            action: "reschedule",
                            date: rescheduleDate,
                            time: rescheduleTime,
                          })}
                          className={styles.saveBtn}
                        >
                          Guardar
                        </button>
                        <button type="button" onClick={onCancelRescheduling} className={styles.cancelBtn}>
                          Cerrar
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => onStartRescheduling(appointment)} className={styles.todayDetailsBtn}>
                          Reprogramar
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === appointment.id}
                          onClick={() => onChangeAppointment(appointment.id, { action: "cancel" })}
                          className={styles.cancelBtn}
                        >
                          Cancelar cita
                        </button>
                      </>
                    )}
                  </div>
                )}
                {appointment.status === "CANCELLED" && (
                  <span style={{ display: "block", marginTop: 8, color: "var(--text-secondary)", fontSize: 12 }}>
                    Cita cancelada
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16 }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Mostrando {appointments.length} de {pagination.total} reservas.
          {pagination.piiRedacted ? " WhatsApp y datos de cobro están limitados por tu rol." : ""}
        </span>
        {pagination.hasMore && (
          <button type="button" disabled={loadingMore} onClick={onLoadMore} className={styles.todayDetailsBtn}>
            {loadingMore ? "Cargando…" : "Cargar más"}
          </button>
        )}
      </div>
    </section>
  );
}
