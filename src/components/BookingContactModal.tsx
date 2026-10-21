"use client";

import React, { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import styles from "./BookingContactModal.module.css";
import { FEATURES } from "@/lib/features";

interface BookingContactModalProps {
  businessName?: string;
  isDemo?: boolean;
  acceptsOnlinePayments?: boolean;
  cancellationPolicy?: string | null;
  errorMessage?: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string, email: string, paymentChoice: "mercadopago" | "local") => void;
}

export default function BookingContactModal({
  businessName,
  isDemo = false,
  acceptsOnlinePayments = false,
  cancellationPolicy,
  errorMessage,
  submitting,
  onClose,
  onSubmit,
}: BookingContactModalProps) {
  const canPayOnline = !isDemo && acceptsOnlinePayments && FEATURES.pagosOnline;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"mercadopago" | "local">("mercadopago");
  const paymentMethod: "mercadopago" | "local" = canPayOnline && selectedPaymentMethod === "mercadopago" ? "mercadopago" : "local";
  const firstInputRef = useRef<HTMLInputElement>(null);

  const cleanPhone = phone.replace(/\D/g, "").replace(/^(56)?/, "");
  const isPhoneValid = /^9\d{8}$/.test(cleanPhone);
  const hasTypedPhone = phone.trim().length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isNameValid = name.trim().length > 0;
  const isFormValid = isNameValid && isPhoneValid && isEmailValid;

  let livePhoneMessage: { text: string; isError: boolean } | null = null;
  if (hasTypedPhone) {
    if (cleanPhone.length > 0 && !cleanPhone.startsWith("9")) {
      livePhoneMessage = {
        text: "El número debe comenzar con 9 (ej: 9 1234 5678)",
        isError: true,
      };
    } else if (cleanPhone.length < 9) {
      livePhoneMessage = {
        text: `Faltan dígitos (${cleanPhone.length} de 9). Debe tener 9 dígitos.`,
        isError: true,
      };
    } else if (cleanPhone.length > 9) {
      livePhoneMessage = {
        text: "Debe tener exactamente 9 dígitos.",
        isError: true,
      };
    } else if (isPhoneValid) {
      livePhoneMessage = {
        text: `✓ Celular chileno válido (+56 9 ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)})`,
        isError: false,
      };
    }
  }

  useEffect(() => {
    firstInputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function normalizeChileanPhone(raw: string): string | null {
    const n = raw.replace(/\D/g, "").replace(/^(56)?/, "");
    if (!/^9\d{8}$/.test(n)) return null;
    return "+56" + n;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhoneError(null);
    const normalizedPhone = normalizeChileanPhone(phone);
    if (!normalizedPhone) {
      setPhoneError("Ingresa un celular chileno válido (9 dígitos, ej: 912345678)");
      return;
    }
    onSubmit(name.trim(), normalizedPhone, email.trim(), paymentMethod);
  }

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-contact-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 id="booking-contact-modal-title" className={styles.title}>
          Confirma tus datos
        </h2>
        <p className={styles.text}>
          El negocio usará esta información para gestionar tu solicitud de reserva y enviarte tu comprobante.
        </p>
        {errorMessage && (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "14px",
              border: "1px solid #fecaca",
            }}
          >
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="booking-client-name">
              Nombre Completo
            </label>
            <input
              ref={firstInputRef}
              id="booking-client-name"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. María González"
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="booking-client-phone">
              Número de WhatsApp
            </label>
            <input
              id="booking-client-phone"
              type="tel"
              autoComplete="tel"
              required
              maxLength={32}
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                if (phoneError) setPhoneError(null);
              }}
              placeholder="Ej. 9 1234 5678"
              className={styles.input}
            />
            <small style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px", display: "block" }}>
              Celular chileno de 9 dígitos para recordatorios por WhatsApp.
            </small>
            {livePhoneMessage && (
              <span
                style={{
                  color: livePhoneMessage.isError ? "#dc2626" : "#16a34a",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                {livePhoneMessage.text}
              </span>
            )}
            {!livePhoneMessage && phoneError && (
              <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: "600", marginTop: "4px", display: "block" }}>
                {phoneError}
              </span>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="booking-client-email">
              Correo Electrónico
            </label>
            <input
              id="booking-client-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Ej. maria@ejemplo.com"
              className={styles.input}
            />
            <small style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px", display: "block" }}>
              Te enviaremos los detalles de tu solicitud de reserva aquí.
            </small>
          </div>
          {isDemo && (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", marginTop: "12px" }}>
              ⚠️ Negocio de demostración: Los pagos online están desactivados y las citas no son reales.
            </div>
          )}

          {FEATURES.pagosOnline && (
            <div className={styles.formGroup} style={{ marginTop: 14 }}>
              <label className={styles.label}>Opciones de Pago</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
                {canPayOnline ? (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: paymentMethod === "mercadopago" ? "2px solid #0066FF" : "1px solid #e2e8f0",
                      background: paymentMethod === "mercadopago" ? "rgba(0,102,255,0.04)" : "#fff",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    <input
                      type="radio"
                      name="bookingPaymentMethod"
                      value="mercadopago"
                      checked={paymentMethod === "mercadopago"}
                      onChange={() => setSelectedPaymentMethod("mercadopago")}
                    />
                    <span>Pagar online con Mercado Pago (Redcompra / Tarjetas)</span>
                  </label>
                ) : isDemo ? (
                  <div style={{ padding: "8px 12px", borderRadius: "8px", background: "#f1f5f9", color: "#64748b", fontSize: "12px" }}>
                    💳 Pagos online con Mercado Pago (desactivado en modo demo)
                  </div>
                ) : (
                  <div style={{ padding: "8px 12px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "12px" }}>
                    💳 Pagos online no activados por el negocio (paga directamente en el local)
                  </div>
                )}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: paymentMethod === "local" ? "2px solid #0066FF" : "1px solid #e2e8f0",
                    background: paymentMethod === "local" ? "rgba(0,102,255,0.04)" : "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <input
                    type="radio"
                    name="bookingPaymentMethod"
                    value="local"
                    checked={paymentMethod === "local"}
                    onChange={() => setSelectedPaymentMethod("local")}
                  />
                  <span>Pagar en el local el día de la atención</span>
                </label>
              </div>
            </div>
          )}

          {/* Política de Cancelación y Devolución */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 14px", marginTop: "14px", marginBottom: "16px", fontSize: "12px", color: "#475569" }}>
            <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📋</span>
              <span>Política de cancelación</span>
            </div>
            <div>{cancellationPolicy || "Cancelaciones con al menos 24 h de anticipación."}</div>
          </div>

          {/* Aviso de Devolución del 100% sobre el botón de pago (cuando paga con Mercado Pago) */}
          {paymentMethod === "mercadopago" && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "600",
                textAlign: "center",
                marginBottom: "14px",
                lineHeight: "1.4",
              }}
            >
              Pago procesado de forma directa al negocio mediante Mercado Pago.
            </div>
          )}

          <div className={styles.buttonRow}>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className={`${styles.btn} ${styles.btnSecondary}`}
              aria-label="Cerrar modal y volver"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {submitting
                ? "Procesando…"
                : isDemo
                ? "Enviar Solicitud (Modo Demo)"
                : paymentMethod === "mercadopago" && FEATURES.pagosOnline
                ? "Pagar con Mercado Pago →"
                : "Enviar Solicitud"}
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", marginTop: "14px", lineHeight: "1.4" }}>
            Tus datos los recibe {businessName || "el negocio"} para gestionar tu reserva.{" "}
            <Link href="/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue, #0066FF)", textDecoration: "underline" }}>
              Ver Política de Privacidad
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
