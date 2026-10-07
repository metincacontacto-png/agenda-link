"use client";

import { useMemo, useState } from "react";
import type { AdminAppointmentsPaginationDTO, BusinessAppointmentDTO } from "@/features/businesses/contracts";
import styles from "../admin.module.css";

interface ClientsTabProps {
  appointments: BusinessAppointmentDTO[];
  pagination: AdminAppointmentsPaginationDTO;
  timezone: string;
  loadingMore: boolean;
  onLoadMore: () => void;
}

interface ClientSummary {
  name: string;
  whatsapp: string;
  appointments: BusinessAppointmentDTO[];
  lastDate: string;
}

export default function ClientsTab({
  appointments,
  pagination,
  timezone,
  loadingMore,
  onLoadMore,
}: ClientsTabProps) {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const clients = useMemo(() => {
    const byPhone = new Map<string, ClientSummary>();
    for (const appointment of appointments) {
      const client = byPhone.get(appointment.clientWhatsApp);
      if (client) {
        client.appointments.push(appointment);
        if (new Date(appointment.dateTime) > new Date(client.lastDate)) client.lastDate = appointment.dateTime;
      } else {
        byPhone.set(appointment.clientWhatsApp, {
          name: appointment.clientName,
          whatsapp: appointment.clientWhatsApp,
          appointments: [appointment],
          lastDate: appointment.dateTime,
        });
      }
    }
    const query = search.trim().toLocaleLowerCase();
    return [...byPhone.values()].filter((client) =>
      client.name.toLocaleLowerCase().includes(query) || client.whatsapp.toLocaleLowerCase().includes(query),
    );
  }, [appointments, search]);

  if (pagination.piiRedacted) {
    return (
      <section className={styles.glassCard}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>Base de clientes</h2>
        <p role="status" style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          Tu rol no tiene permiso para consultar datos personales de clientes.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className={styles.glassCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Clientes con reservas cargadas</h2>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: 4 }}>
              La lista se construye a partir de las citas disponibles; no incluye un CRM independiente.
            </p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nombre o WhatsApp"
            aria-label="Buscar clientes por nombre o WhatsApp"
            className={styles.formInput}
            style={{ maxWidth: 280, minHeight: 36, padding: "8px 12px", fontSize: 13 }}
          />
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.financialTable}>
            <thead>
              <tr><th>Cliente</th><th>WhatsApp</th><th>Reservas cargadas</th><th>Última cita</th><th>Detalle</th></tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--text-secondary)" }}>No hay clientes que coincidan.</td></tr>
              ) : clients.map((client) => (
                <tr key={client.whatsapp}>
                  <td style={{ fontWeight: 700 }}>{client.name}</td>
                  <td>{client.whatsapp}</td>
                  <td>{client.appointments.length}</td>
                  <td>{new Date(client.lastDate).toLocaleDateString("es-ES", { dateStyle: "medium", timeZone: timezone })}</td>
                  <td><button type="button" className={styles.todayDetailsBtn} onClick={() => setSelectedClient(client)}>Ver reservas</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Mostrando {appointments.length} de {pagination.total} reservas cargadas.
          </span>
          {pagination.hasMore && (
            <button type="button" disabled={loadingMore} onClick={onLoadMore} className={styles.todayDetailsBtn}>
              {loadingMore ? "Cargando…" : "Cargar más reservas"}
            </button>
          )}
        </div>
      </section>

      {selectedClient && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setSelectedClient(null)} />
          <aside className={styles.clientDrawer} aria-label={`Reservas de ${selectedClient.name}`} style={{ display: "flex", flexDirection: "column" }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{selectedClient.name}</h3>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selectedClient.whatsapp}</span>
              </div>
              <button type="button" className={styles.modalCloseBtn} aria-label="Cerrar detalle" onClick={() => setSelectedClient(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <h4 style={{ fontSize: 13, fontWeight: 750, marginBottom: 8 }}>Reservas cargadas</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedClient.appointments.map((appointment) => (
                  <div key={appointment.id} style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", padding: 10, borderRadius: 10, fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: "bold" }}>
                      <span>{appointment.service.name}</span>
                      <span>{new Date(appointment.dateTime).toLocaleDateString("es-ES", { dateStyle: "medium", timeZone: timezone })}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                      Profesional: {appointment.professional.name} · Pago: {appointment.paymentStatus === "PAID" ? "marcado pagado" : appointment.paymentStatus === "REFUNDED" ? "marcado reembolsado" : "pendiente"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
