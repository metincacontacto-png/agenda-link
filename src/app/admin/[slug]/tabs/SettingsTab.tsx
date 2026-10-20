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
        <section className={styles.glassCard} style={{ maxWidth: "600px", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Recordatorios por WhatsApp</h2>
            <span style={{ background: "rgba(37, 211, 102, 0.12)", color: "#16a34a", padding: "4px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: "700" }}>
              ✓ 1 Clic Activo (Gratis)
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.5" }}>
            Los recordatorios por WhatsApp están habilitados sin costo adicional. Desde la pestaña <strong>Reservas</strong>, presiona el botón verde <strong>Recordar</strong> junto a cualquier cita para abrir WhatsApp con los datos del cliente y el mensaje ya redactado.
          </p>

          <div style={{ background: "rgba(0, 0, 0, 0.02)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <h4 style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Vista previa del mensaje enviado
            </h4>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#1e293b", whiteSpace: "pre-line", fontFamily: "inherit", lineHeight: "1.5" }}>
              {`¡Hola Francisca! 👋

Te escribimos de *${business.name}* para recordarte tu próxima cita:

📅 *Fecha:* martes 21 de octubre
⏰ *Hora:* 15:30 hrs
✂️ *Servicio:* Corte y Peinado
👤 *Profesional:* Valentina Morales
💰 *Total:* $15.000

Por favor confírmanos si podrás asistir respondiendo a este mensaje. ¡Te esperamos! ✨`}
            </div>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            💡 <em>Usa tu propio WhatsApp desde tu teléfono o computador. Sin costos de Meta ni riesgo de bloqueo de línea.</em>
          </div>
        </section>
      )}
    </div>
  );
}
