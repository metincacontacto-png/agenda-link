"use client";

import React, { useState, useEffect, useRef, type FormEvent } from "react";
import styles from "./BookingContactModal.module.css";

interface BookingContactModalProps {
  submitting: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string, email: string) => void;
}

export default function BookingContactModal({ submitting, onClose, onSubmit }: BookingContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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
    onSubmit(name.trim(), phone.trim(), email.trim());
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
              {submitting ? "Enviando…" : "Enviar Solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
