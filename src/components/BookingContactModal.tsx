"use client";

import React, { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import styles from "./BookingContactModal.module.css";
import { FEATURES } from "@/lib/features";

interface BookingContactModalProps {
  businessName?: string;
  errorMessage?: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string, email: string, paymentChoice: "mercadopago" | "local") => void;
}

export default function BookingContactModal({ businessName, errorMessage, submitting, onClose, onSubmit }: BookingContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mercadopago" | "local">("mercadopago");
  const firstInputRef = useRef<HTMLInputElement>(null);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(name.trim(), phone.trim(), email.trim(), paymentMethod);
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
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ej. +56912345678"
              className={styles.input}
            />
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
          {FEATURES.pagosOnline && (
            <div className={styles.formGroup} style={{ marginTop: 14 }}>
              <label className={styles.label}>Opciones de Pago</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
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
                    onChange={() => setPaymentMethod("mercadopago")}
                  />
                  <span>Pagar online con Mercado Pago (Redcompra / Tarjetas)</span>
                </label>
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
                    onChange={() => setPaymentMethod("local")}
                  />
                  <span>Pagar en el local el día de la atención</span>
                </label>
              </div>
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
            <button type="submit" disabled={submitting} className={`${styles.btn} ${styles.btnPrimary}`}>
              {submitting
                ? "Procesando…"
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
