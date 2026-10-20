"use client";

import React, { useState } from "react";
import type { BusinessAdminDTO } from "@/features/businesses/contracts";
import type { AdminSettingsSubTab } from "./types";
import ServicesTab from "./ServicesTab";
import styles from "../admin.module.css";

interface SettingsTabProps {
  slug: string;
  business: BusinessAdminDTO;
  subTab: AdminSettingsSubTab;
  onSubTabChange: (tab: AdminSettingsSubTab) => void;
  formatPrice: (price: number, currency: string) => string;
  onServicesChanged: () => Promise<void>;
}

export default function SettingsTab({
  slug,
  business,
  subTab,
  onSubTabChange,
  formatPrice,
  onServicesChanged,
}: SettingsTabProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [publicKeyInput, setPublicKeyInput] = useState(business.mercadoPagoPublicKey || "");
  const [showToken, setShowToken] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(null);

    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setPaymentError("Por favor ingresa tu Access Token de Mercado Pago (empieza con APP_USR- o TEST-)");
      return;
    }

    setSavingPayment(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          mercadoPagoAccessToken: cleanToken,
          mercadoPagoPublicKey: publicKeyInput.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPaymentError(data.error || "Error al guardar las credenciales.");
      } else {
        setPaymentSuccess("¡Credenciales vinculadas exitosamente! Tus clientes ya pueden pagar online con Mercado Pago.");
        setTokenInput("");
        await onServicesChanged();
      }
    } catch {
      setPaymentError("Error de conexión al guardar credenciales.");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("¿Seguro que deseas desconectar Mercado Pago? Tus clientes solo podrán elegir pagar en el local.")) {
      return;
    }

    setPaymentError(null);
    setPaymentSuccess(null);
    setSavingPayment(true);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          mercadoPagoAccessToken: "",
          mercadoPagoPublicKey: "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPaymentError(data.error || "Error al desconectar Mercado Pago.");
      } else {
        setPaymentSuccess("Mercado Pago ha sido desconectado. Tus reservas vuelven a modo 'Pagar en el local'.");
        setTokenInput("");
        setPublicKeyInput("");
        await onServicesChanged();
      }
    } catch {
      setPaymentError("Error de conexión al desconectar Mercado Pago.");
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className={styles.segmentedControl}>
        <button
          className={`${styles.segmentedButton} ${subTab === "servicios" ? styles.segmentedButtonActive : ""}`}
          onClick={() => onSubTabChange("servicios")}
        >
          Servicios y Recursos
        </button>
        <button
          className={`${styles.segmentedButton} ${subTab === "pagos" ? styles.segmentedButtonActive : ""}`}
          onClick={() => onSubTabChange("pagos")}
        >
          💳 Cobros Online (Mercado Pago)
        </button>
        <button
          className={`${styles.segmentedButton} ${subTab === "whatsapp" ? styles.segmentedButtonActive : ""}`}
          onClick={() => onSubTabChange("whatsapp")}
        >
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

      {subTab === "pagos" && (
        <section className={styles.glassCard} style={{ maxWidth: "700px", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0" }}>
                Cobros Online con Mercado Pago Chile
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                Recibe pagos directos con Redcompra, tarjetas de débito y crédito al agendar.
              </p>
            </div>
            {business.mercadoPagoConnected ? (
              <span
                style={{
                  background: "rgba(34, 197, 94, 0.12)",
                  color: "#16a34a",
                  padding: "6px 12px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>●</span> Cobros directos activos
              </span>
            ) : (
              <span
                style={{
                  background: "rgba(245, 158, 11, 0.12)",
                  color: "#b45309",
                  padding: "6px 12px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                ⚠️ Desactivado (Solo pago en el local)
              </span>
            )}
          </div>

          {/* Garantía de No Intermediación */}
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "12px",
              padding: "14px 16px",
              fontSize: "13px",
              color: "#1e3a8a",
              marginBottom: "20px",
              lineHeight: "1.5",
            }}
          >
            <strong>🔒 Cobro 100% directo a tu cuenta bancaria:</strong> AgendaLink no retiene tu dinero ni cobra comisiones por transacción. El total de cada reserva pagada se abona directamente en tu cuenta de Mercado Pago Chile.
          </div>

          {/* Estado de Conexión Existente */}
          {business.mercadoPagoConnected && (
            <div
              style={{
                background: "rgba(0, 0, 0, 0.02)",
                border: "1px solid var(--card-border)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                  Cuenta Vinculada
                </span>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={savingPayment}
                  style={{
                    background: "transparent",
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {savingPayment ? "Procesando…" : "Desconectar Mercado Pago"}
                </button>
              </div>

              <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                <strong>Access Token actual:</strong>{" "}
                <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace" }}>
                  {business.mercadoPagoTokenMasked || "APP_USR-••••••••"}
                </code>
              </div>

              {business.mercadoPagoPublicKey && (
                <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                  <strong>Public Key:</strong>{" "}
                  <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace" }}>
                    {business.mercadoPagoPublicKey}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Formulario de Configuración / Actualización */}
          <form onSubmit={handleSaveCredentials} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", margin: "0 0 4px 0", color: "#0f172a" }}>
              {business.mercadoPagoConnected ? "Actualizar credenciales de Mercado Pago" : "Conectar tu cuenta de Mercado Pago"}
            </h3>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                Production Access Token <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showToken ? "text" : "password"}
                  className={styles.formInput}
                  style={{ width: "100%", paddingRight: "70px" }}
                  placeholder="APP_USR-1234567890123456-..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  {showToken ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <small style={{ color: "var(--text-secondary)", fontSize: "11.5px", marginTop: "4px", display: "block" }}>
                Tu token privado que permite crear los checkouts de tus clientes en tu cuenta de Mercado Pago.
              </small>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                Public Key (opcional)
              </label>
              <input
                type="text"
                className={styles.formInput}
                style={{ width: "100%" }}
                placeholder="APP_USR-abcdef... (opcional)"
                value={publicKeyInput}
                onChange={(e) => setPublicKeyInput(e.target.value)}
                autoComplete="off"
              />
            </div>

            {paymentError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                ⚠️ {paymentError}
              </div>
            )}

            {paymentSuccess && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                ✓ {paymentSuccess}
              </div>
            )}

            <div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={savingPayment}
                style={{ minWidth: "220px" }}
              >
                {savingPayment
                  ? "Guardando…"
                  : business.mercadoPagoConnected
                  ? "Actualizar Credenciales"
                  : "Guardar y Activar Cobros"}
              </button>
            </div>
          </form>

          {/* Guía Paso a Paso */}
          <div
            style={{
              marginTop: "28px",
              borderTop: "1px solid var(--card-border)",
              paddingTop: "20px",
            }}
          >
            <h4 style={{ fontSize: "13.5px", fontWeight: "700", marginBottom: "10px", color: "#0f172a" }}>
              ¿Cómo obtener tus credenciales de Mercado Pago Chile?
            </h4>
            <ol style={{ fontSize: "13px", color: "var(--text-secondary)", paddingLeft: "18px", margin: 0, lineHeight: "1.7" }}>
              <li>
                Inicia sesión en{" "}
                <a
                  href="https://www.mercadopago.cl/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--blue, #0066FF)", fontWeight: "600" }}
                >
                  mercadopago.cl/developers ↗
                </a>{" "}
                con tu cuenta de Mercado Pago.
              </li>
              <li>Ve a <strong>Tus integraciones</strong> y haz clic en <strong>Crear aplicación</strong> (o selecciona una existente).</li>
              <li>Selecciona la opción de <strong>Checkout Pro</strong> o pagos online.</li>
              <li>En el menú de la izquierda, entra a <strong>Credenciales de producción</strong>.</li>
              <li>Copia tu <strong>Access Token</strong> (comienza con <code style={{ fontFamily: "monospace" }}>APP_USR-</code>) y pégalo en el campo superior.</li>
              <li>Haz clic en <strong>Guardar y Activar Cobros</strong>. ¡Listo! Tus clientes verán de inmediato la opción de pago online al agendar.</li>
            </ol>
          </div>
        </section>
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
