"use client";

import React, { useState } from "react";
import styles from "./PaymentModal.module.css";

interface Props {
  amount: number;
  formattedAmount: string;
  onClose: () => void;
  onSuccess: (method: string) => void;
}

export default function PaymentModal({ amount, formattedAmount, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<"card" | "apple">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) return;
    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) return;
    if (val.length > 2) {
      val = val.substring(0, 2) + "/" + val.substring(2);
    }
    setExpiry(val);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length > 3) return;
    setCvv(val);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPaid(true);
      setTimeout(() => {
        onSuccess(method === "apple" ? "Apple Pay" : "Visa Sim");
      }, 1200);
    }, 1800);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>Simulación de Pago</span>
          <span className={styles.amount}>{formattedAmount}</span>
        </div>

        {paid ? (
          <div className={styles.successCheck}>
            <div className={styles.checkmark}>✓</div>
            <p style={{ fontWeight: 600, color: "var(--success)" }}>Pago Aprobado</p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Redirigiendo a verificación...</p>
          </div>
        ) : (
          <form onSubmit={handlePay}>
            <div className={styles.methodSelector}>
              <button
                type="button"
                className={`${styles.methodBtn} ${method === "card" ? styles.methodBtnActive : ""}`}
                onClick={() => setMethod("card")}
              >
                💳 Tarjeta
              </button>
              <button
                type="button"
                className={`${styles.methodBtn} ${method === "apple" ? styles.methodBtnActive : ""}`}
                onClick={() => setMethod("apple")}
              >
                 Pay
              </button>
            </div>

            {method === "card" ? (
              <div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre en la Tarjeta</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    className={styles.input}
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Número de Tarjeta</label>
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    className={styles.input}
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                  />
                </div>
                <div className={styles.row}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Expiración</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/AA"
                      className={styles.input}
                      value={expiry}
                      onChange={handleExpiryChange}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>CVC</label>
                    <input
                      type="password"
                      required
                      placeholder="000"
                      className={styles.input}
                      value={cvv}
                      onChange={handleCvvChange}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0", border: "1px dashed var(--input-border)", borderRadius: "8px", marginBottom: "20px" }}>
                <span style={{ fontSize: "28px", color: "var(--foreground)" }}></span>
                <p style={{ fontWeight: 600, fontSize: "14px", marginTop: "8px", color: "var(--foreground)" }}>Pagar con Apple Pay Simulado</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Se utilizará tu cuenta de prueba de AgendaLink.</p>
              </div>
            )}

            <button type="submit" disabled={loading} className={styles.btnPay}>
              {loading ? "Procesando pago..." : `Pagar ${formattedAmount}`}
            </button>
            <button type="button" disabled={loading} onClick={onClose} className={styles.input} style={{ marginTop: "10px", width: "100%", cursor: "pointer", background: "transparent", border: "none", color: "var(--text-secondary)" }}>
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
