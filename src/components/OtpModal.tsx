"use client";

import React, { useState, useRef } from "react";
import styles from "./OtpModal.module.css";

interface Props {
  onClose: () => void;
  onSuccess: (name: string, whatsapp: string) => void;
}

export default function OtpModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1); // 1: Client Data, 2: OTP Code
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp) return;
    setStep(2);
  };

  const handleOtpChange = (index: number, value: string) => {
    // Solo permitir números
    if (value && !/^[0-9]$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus al siguiente input
    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Volver al input anterior si borra con retroceso
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code === "1234") {
      onSuccess(name, whatsapp);
    } else {
      alert("Código incorrecto. Utiliza '1234' para simular la verificación.");
      setOtp(["", "", "", ""]);
      inputsRef.current[0]?.focus();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <h2 className={styles.title}>Datos de Contacto</h2>
            <p className={styles.text}>Ingresa tu nombre y número de WhatsApp para confirmar tu reserva.</p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. María González"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Número de WhatsApp</label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej. +56912345678"
                className={styles.input}
              />
            </div>

            <div className={styles.buttonRow}>
              <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnSecondary}`}>
                Cancelar
              </button>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                Enviar Código
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <h2 className={styles.title}>Verifica tu WhatsApp</h2>
            <p className={styles.text}>Hemos enviado un código de 4 dígitos a <strong>{whatsapp}</strong>.</p>
            <p style={{ fontSize: "11px", color: "var(--primary)", textAlign: "center", marginTop: "-12px", marginBottom: "12px" }}>
              Código de prueba: <strong>1234</strong>
            </p>

            <div className={styles.otpRow}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={styles.otpInput}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <div className={styles.buttonRow}>
              <button type="button" onClick={() => setStep(1)} className={`${styles.btn} ${styles.btnSecondary}`}>
                Atrás
              </button>
              <button
                type="submit"
                disabled={otp.some((d) => !d)}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Verificar y Agendar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
