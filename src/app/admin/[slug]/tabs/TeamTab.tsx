"use client";

import type { ProfessionalDTO } from "@/features/team/contracts";
import styles from "../admin.module.css";

export default function TeamTab({ professionals }: { professionals: ProfessionalDTO[] }) {
  return (
    <section className={styles.glassCard}>
      <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Equipo de profesionales</h2>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
        Profesionales asociados al negocio y disponibles para recibir reservas.
      </p>
      {professionals.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", padding: "28px 0" }}>
          Aún no hay profesionales asociados.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
          {professionals.map((professional) => (
            <div key={professional.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px" }}>
              <div className={styles.profAvatar}>
                {professional.avatar || professional.name.substring(0, 2).toUpperCase()}
              </div>
              <div className={styles.profName}>{professional.name}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
