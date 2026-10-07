"use client";

import type { BusinessAdminDTO } from "@/features/businesses/contracts";
import ServicesTab from "./ServicesTab";
import styles from "../admin.module.css";

interface SettingsTabProps {
  slug: string;
  business: BusinessAdminDTO;
  subTab: "servicios" | "whatsapp";
  onSubTabChange: (tab: "servicios" | "whatsapp") => void;
  formatPrice: (price: number, currency: string) => string;
  onServicesChanged: () => Promise<void>;
}

export default function SettingsTab({ slug, business, subTab, onSubTabChange, formatPrice, onServicesChanged }: SettingsTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className={styles.segmentedControl}>
        <button className={`${styles.segmentedButton} ${subTab === "servicios" ? styles.segmentedButtonActive : ""}`} onClick={() => onSubTabChange("servicios")}>
          Servicios y Recursos
        </button>
        <button className={`${styles.segmentedButton} ${subTab === "whatsapp" ? styles.segmentedButtonActive : ""}`} onClick={() => onSubTabChange("whatsapp")}>
          Vincular WhatsApp
        </button>
      </div>

      {subTab === "servicios" && (
        <ServicesTab
          slug={slug}
          services={business.services}
          currency={business.currency}
          formatPrice={formatPrice}
          onServicesChanged={onServicesChanged}
        />
      )}

      {subTab === "whatsapp" && (
        <section className={styles.glassCard} style={{ maxWidth: "560px", textAlign: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Vincular WhatsApp de Reservas</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
            La integración de WhatsApp no está configurada para este negocio.
          </p>
          <div style={{ padding: "20px", border: "1px solid var(--card-border)", borderRadius: "12px", color: "var(--text-secondary)" }}>
            No se enviarán mensajes ni se mostrarán estados de conexión hasta integrar y configurar un proveedor.
          </div>
        </section>
      )}
    </div>
  );
}
