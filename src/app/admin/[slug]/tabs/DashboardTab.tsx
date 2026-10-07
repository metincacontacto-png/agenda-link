"use client";

import type { DashboardMetrics } from "@/features/businesses/dashboard-metrics";
import styles from "../admin.module.css";

interface DashboardTabProps {
  businessCurrency: string;
  businessTimezone: string;
  metrics: DashboardMetrics;
  todayReservationsCollapsed: boolean;
  formatPrice: (price: number, currency: string) => string;
  onToggleTodayReservations: () => void;
  onViewReservations: () => void;
}

export default function DashboardTab({
  businessCurrency,
  businessTimezone,
  metrics,
  todayReservationsCollapsed,
  formatPrice,
  onToggleTodayReservations,
  onViewReservations,
}: DashboardTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
        Resumen calculado a partir de las citas recibidas.
      </p>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCardDark}>
          <span className={styles.kpiLabel}>Total de reservas</span>
          <div className={styles.kpiValue}>{metrics.totalReservations}</div>
          <button onClick={onViewReservations} className={styles.kpiLink}>Ver detalles</button>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Profesionales</span>
          <div className={styles.kpiValue}>{metrics.professionalsCount}</div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Clientes en citas cargadas</span>
          <div className={styles.kpiValue}>{metrics.uniqueClients}</div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Cobros marcados como pagados</span>
          <div className={styles.kpiValue}>{formatPrice(metrics.totalSales, businessCurrency)}</div>
        </div>
      </div>

      <div className={styles.collapsibleWrapper}>
        <button onClick={onToggleTodayReservations} className={styles.collapsibleHeader}>
          <span>Ver detalle de citas cargadas ({metrics.visibleAppointments.length})</span>
          <span className={styles.collapsibleArrow}>{todayReservationsCollapsed ? "▲" : "▼"}</span>
        </button>
        {!todayReservationsCollapsed && (
          <div className={styles.collapsibleContent}>
            {metrics.visibleAppointments.length === 0 ? (
              <p style={{ margin: 0, padding: "16px", color: "var(--text-secondary)", fontSize: "13.5px", textAlign: "center" }}>
                No hay citas en los datos cargados.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px" }}>
                {metrics.visibleAppointments.map((appointment) => (
                  <div key={appointment.id} className={styles.todayAppointmentRow}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span className={styles.todayTimeBadge}>
                        {new Date(appointment.dateTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: businessTimezone })}
                      </span>
                      <div>
                        <strong style={{ fontSize: "14px", color: "var(--foreground)" }}>{appointment.clientName}</strong>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "8px" }}>{appointment.service.name}</span>
                      </div>
                    </div>
                    <button onClick={onViewReservations} className={styles.todayDetailsBtn}>Ver Ficha</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.reportGrid}>
        <div className={styles.reportCard}>
          <div className={styles.reportHeader}>
            <div className={styles.reportIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className={styles.reportCardTitle}>Métodos registrados</h3>
          </div>
            <p className={styles.reportCardDesc}>Distribución de citas guardadas con el estado de pago marcado como pagado.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
            <div className={styles.statProgressBarRow}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: "600", marginBottom: "4px" }}>
                <span>Apple Pay registrado</span>
                <span>{metrics.applePayPercent}% ({formatPrice(metrics.applePaySales, businessCurrency)})</span>
              </div>
              <div className={styles.progressBarBg}><div className={styles.progressBarFill} style={{ width: `${metrics.applePayPercent}%`, background: "var(--foreground)" }} /></div>
            </div>
            <div className={styles.statProgressBarRow}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: "600", marginBottom: "4px" }}>
                <span>Otros métodos registrados</span>
                <span>{metrics.visaPercent}% ({formatPrice(metrics.visaSales, businessCurrency)})</span>
              </div>
              <div className={styles.progressBarBg}><div className={styles.progressBarFill} style={{ width: `${metrics.visaPercent}%`, background: "var(--primary)" }} /></div>
            </div>
          </div>
        </div>

        <div className={styles.reportCard}>
          <div className={styles.reportHeader}>
            <div className={styles.reportIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
            </div>
            <h3 className={styles.reportCardTitle}>Citas esta semana</h3>
          </div>
          <p className={styles.reportCardDesc}>Citas dentro de la semana visible en la agenda.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Reservas:</span>
              <strong style={{ color: "var(--primary)" }}>{metrics.currentWeekAppointments}</strong>
            </div>
          </div>
        </div>

        <div className={styles.reportCard}>
          <div className={styles.reportHeader}>
            <div className={styles.reportIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" />
              </svg>
            </div>
            <h3 className={styles.reportCardTitle}>Origen de reservas</h3>
          </div>
          <p className={styles.reportCardDesc}>El origen de la reserva no se almacena todavía.</p>
        </div>
      </div>

      <div className={styles.reportGrid}>
        <div className={styles.reportCard}>
          <div className={styles.reportHeader}>
            <div className={styles.reportIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <line x1="12" y1="10" x2="12" y2="10" /><line x1="12" y1="14" x2="12" y2="14" />
              </svg>
            </div>
            <h3 className={styles.reportCardTitle}>Ventas Facturadas</h3>
          </div>
          <div style={{ margin: "20px 0 10px 0" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--foreground)" }}>{formatPrice(metrics.totalSales, businessCurrency)}</div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Suma de importes de las citas registradas como pagadas entre las citas cargadas.</p>
          </div>
        </div>
        <div className={styles.reportCard}>
          <div className={styles.reportHeader}>
            <div className={styles.reportIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
          <h3 className={styles.reportCardTitle}>Recordatorios WhatsApp</h3>
          </div>
          <div style={{ margin: "20px 0 10px 0" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-secondary)" }}>Integración no conectada</div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>No se registran envíos de WhatsApp hasta configurar un proveedor.</p>
          </div>
        </div>
        <div className={styles.reportCard}>
          <div className={styles.reportHeader}>
            <div className={styles.reportIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
          <h3 className={styles.reportCardTitle}>Recordatorios Email</h3>
          </div>
          <div style={{ margin: "20px 0 10px 0" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-secondary)" }}>Integración no conectada</div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>No se registran envíos de correo hasta configurar un proveedor.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
