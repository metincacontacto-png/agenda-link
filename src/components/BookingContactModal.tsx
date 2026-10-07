"use client";

import { useState, type FormEvent } from "react";
import styles from "./BookingContactModal.module.css";

interface BookingContactModalProps {
  submitting: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => void;
}

export default function BookingContactModal({ submitting, onClose, onSubmit }: BookingContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(name.trim(), phone.trim());
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Confirma tus datos</h2>
        <p className={styles.text}>El negocio usará esta información para gestionar tu reserva.</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="booking-client-name">Nombre Completo</label>
            <input
              id="booking-client-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. María González"
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="booking-client-phone">Número de WhatsApp</label>
            <input
              id="booking-client-phone"
              type="tel"
              required
              maxLength={32}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ej. +56912345678"
              className={styles.input}
            />
          </div>
          <div className={styles.buttonRow}>
            <button type="button" disabled={submitting} onClick={onClose} className={`${styles.btn} ${styles.btnSecondary}`}>
              Volver
            </button>
            <button type="submit" disabled={submitting} className={`${styles.btn} ${styles.btnPrimary}`}>
              {submitting ? "Registrando…" : "Confirmar Reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
