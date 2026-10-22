"use client";

import React, { useState } from "react";
import type { BusinessAdminDTO } from "@/features/businesses/contracts";
import { SUBSCRIPTION_PLANS, getTrialDaysRemaining } from "@/features/businesses/subscription-policy";
import styles from "../admin.module.css";

interface BillingModalProps {
  business: BusinessAdminDTO;
  isOpen: boolean;
  onClose: () => void;
  isEnforcedPaywall?: boolean;
}

export default function BillingModal({
  business,
  isOpen,
  onClose,
  isEnforcedPaywall = false,
}: BillingModalProps) {
  const currentPlanKey = (
    business.subscriptionPlan ||
    business.plan ||
    "EQUIPO"
  ) as "INDIVIDUAL" | "EQUIPO" | "NEGOCIO";

  const [selectedPlan, setSelectedPlan] = useState<"INDIVIDUAL" | "EQUIPO" | "NEGOCIO">(
    SUBSCRIPTION_PLANS[currentPlanKey] ? currentPlanKey : "EQUIPO"
  );
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const daysRemaining = getTrialDaysRemaining(business.trialEndsAt);
  const isTrialActive = business.subscriptionStatus === "TRIALING" && daysRemaining > 0;
  const isSubscriptionActive = business.subscriptionStatus === "ACTIVE";

  const handleSubscribe = async () => {
    try {
      setLoadingCheckout(true);
      setErrorMessage(null);

      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: business.slug,
          plan: selectedPlan,
        }),
      });

      const data = (await res.json()) as { success?: boolean; initPoint?: string; error?: string };

      if (!res.ok || !data.initPoint) {
        setErrorMessage(data.error || "No se pudo conectar con Mercado Pago. Intenta nuevamente.");
        setLoadingCheckout(false);
        return;
      }

      // Redirigir al checkout oficial de Mercado Pago
      window.location.href = data.initPoint;
    } catch (err) {
      setErrorMessage("Ocurrió un error de conexión. Por favor verifica tu internet.");
      setLoadingCheckout(false);
    }
  };

  return (
    <div className={styles.modalOverlay} style={{ zIndex: 9999 }}>
      <div className={styles.modalContent} style={{ maxWidth: 780, maxHeight: "90vh" }}>
        <div className={styles.modalHeader}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Planes y Facturación</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
              Suscripción mensual automática protegida por Mercado Pago
            </p>
          </div>
          {!isEnforcedPaywall && (
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.modalBody}>
          {/* Status Banner */}
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 14,
              marginBottom: 20,
              background: business.billingBypass
                ? "rgba(14, 165, 233, 0.1)"
                : isSubscriptionActive
                ? "rgba(16, 185, 129, 0.1)"
                : isTrialActive
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${
                business.billingBypass
                  ? "rgba(14, 165, 233, 0.3)"
                  : isSubscriptionActive
                  ? "rgba(16, 185, 129, 0.3)"
                  : isTrialActive
                  ? "rgba(59, 130, 246, 0.3)"
                  : "rgba(239, 68, 68, 0.3)"
              }`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                {business.billingBypass && "✨ Acceso Especial Activo (Bypass)"}
                {!business.billingBypass && isSubscriptionActive && "🟢 Suscripción Activa"}
                {!business.billingBypass && !isSubscriptionActive && isTrialActive && (
                  `⏳ Período de Prueba Gratis (${daysRemaining} ${daysRemaining === 1 ? "día restante" : "días restantes"})`
                )}
                {!business.billingBypass && !isSubscriptionActive && !isTrialActive && (
                  "⚠️ Tu período de prueba de 14 días ha finalizado"
                )}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                {business.billingBypass && "Este negocio cuenta con membresía administrativa sin cobros automáticos."}
                {!business.billingBypass && isSubscriptionActive && (
                  `Plan actual: ${SUBSCRIPTION_PLANS[currentPlanKey]?.name || currentPlanKey}. Tu servicio está 100% activo.`
                )}
                {!business.billingBypass && !isSubscriptionActive && isTrialActive && (
                  "Disfruta de todas las funciones sin restricciones. Puedes suscribirte ahora para garantizar continuidad."
                )}
                {!business.billingBypass && !isSubscriptionActive && !isTrialActive && (
                  "Selecciona uno de los siguientes planes para reactivar tu panel y tus reservas públicas inmediatamente."
                )}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(239, 68, 68, 0.12)",
                color: "#b91c1c",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Cards de Planes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Plan Individual */}
            <div
              onClick={() => setSelectedPlan("INDIVIDUAL")}
              style={{
                border: selectedPlan === "INDIVIDUAL" ? "2px solid var(--primary)" : "1px solid rgba(0,0,0,0.1)",
                background: selectedPlan === "INDIVIDUAL" ? "rgba(59, 130, 246, 0.04)" : "#fff",
                borderRadius: 16,
                padding: "18px 16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Individual
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, margin: "6px 0 4px" }}>
                  $9.990 <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>/mes</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
                  Para 1 profesional independiente
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--foreground)", lineHeight: 1.6 }}>
                  <li>1 profesional</li>
                  <li>Agenda pública online 24/7</li>
                  <li>WhatsApp en 1 clic</li>
                  <li>Recordatorios desde panel</li>
                  <li>Mercado Pago integrado</li>
                </ul>
              </div>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: selectedPlan === "INDIVIDUAL" ? "var(--primary)" : "rgba(0,0,0,0.06)",
                    color: selectedPlan === "INDIVIDUAL" ? "#fff" : "var(--foreground)",
                  }}
                >
                  {selectedPlan === "INDIVIDUAL" ? "Seleccionado" : "Elegir"}
                </span>
              </div>
            </div>

            {/* Plan Básico (Equipo) - RECOMENDADO */}
            <div
              onClick={() => setSelectedPlan("EQUIPO")}
              style={{
                border: selectedPlan === "EQUIPO" ? "2px solid var(--primary)" : "2px solid rgba(59, 130, 246, 0.3)",
                background: selectedPlan === "EQUIPO" ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.02)",
                borderRadius: 16,
                padding: "18px 16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 6px 20px rgba(59, 130, 246, 0.12)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  right: 14,
                  background: "var(--primary)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 999,
                  letterSpacing: "0.5px",
                }}
              >
                RECOMENDADO
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
                  Básico
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, margin: "6px 0 4px" }}>
                  $28.990 <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>/mes</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
                  Para equipos de 2 a 5 profesionales
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--foreground)", lineHeight: 1.6 }}>
                  <li><strong>Hasta 5 profesionales</strong></li>
                  <li>Calendario por profesional</li>
                  <li>Control de caja y ventas</li>
                  <li>Base de clientes y fichas</li>
                  <li>Todo lo de Individual</li>
                </ul>
              </div>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: selectedPlan === "EQUIPO" ? "var(--primary)" : "rgba(0,0,0,0.06)",
                    color: selectedPlan === "EQUIPO" ? "#fff" : "var(--foreground)",
                  }}
                >
                  {selectedPlan === "EQUIPO" ? "Seleccionado" : "Elegir"}
                </span>
              </div>
            </div>

            {/* Plan Premium (Negocio) */}
            <div
              onClick={() => setSelectedPlan("NEGOCIO")}
              style={{
                border: selectedPlan === "NEGOCIO" ? "2px solid var(--primary)" : "1px solid rgba(0,0,0,0.1)",
                background: selectedPlan === "NEGOCIO" ? "rgba(59, 130, 246, 0.04)" : "#fff",
                borderRadius: 16,
                padding: "18px 16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Premium
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, margin: "6px 0 4px" }}>
                  $48.990 <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>/mes</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
                  Para negocios de más de 5 personas
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--foreground)", lineHeight: 1.6 }}>
                  <li><strong>Profesionales ilimitados</strong></li>
                  <li>Soporte preferencial prioritario</li>
                  <li>Configuración multi-servicio</li>
                  <li>Reportes avanzados</li>
                  <li>Todo lo de Básico</li>
                </ul>
              </div>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: selectedPlan === "NEGOCIO" ? "var(--primary)" : "rgba(0,0,0,0.06)",
                    color: selectedPlan === "NEGOCIO" ? "#fff" : "var(--foreground)",
                  }}
                >
                  {selectedPlan === "NEGOCIO" ? "Seleccionado" : "Elegir"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loadingCheckout}
              className={styles.submitButton}
              style={{
                width: "100%",
                maxWidth: 420,
                padding: "14px 24px",
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 12,
                cursor: loadingCheckout ? "not-allowed" : "pointer",
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                boxShadow: "0 4px 14px rgba(0, 118, 255, 0.3)",
              }}
            >
              {loadingCheckout
                ? "Conectando con Mercado Pago..."
                : `Suscribirme al Plan ${SUBSCRIPTION_PLANS[selectedPlan]?.name} (${SUBSCRIPTION_PLANS[selectedPlan]?.priceFormatted})`}
            </button>
            <div
              style={{
                marginTop: 12,
                fontSize: 11.5,
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>🔒 Pago 100% seguro con Mercado Pago</span>
              <span>·</span>
              <span>Cancela cuando quieras desde tu cuenta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
