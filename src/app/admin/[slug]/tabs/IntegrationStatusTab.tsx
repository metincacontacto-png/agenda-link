"use client";

import styles from "../admin.module.css";

export default function IntegrationStatusTab({ title, description }: { title: string; description: string }) {
  return (
    <section className={styles.glassCard}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>{description}</p>
      <div role="status" style={{ padding: 16, border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--text-secondary)" }}>
        Integración no configurada; esta función no ejecuta acciones.
      </div>
    </section>
  );
}
