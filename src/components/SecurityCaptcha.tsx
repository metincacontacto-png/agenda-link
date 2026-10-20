"use client";

import React, { useState, useEffect } from "react";

interface SecurityCaptchaProps {
  onVerify: (verified: boolean) => void;
}

export default function SecurityCaptcha({ onVerify }: SecurityCaptchaProps) {
  const [numA, setNumA] = useState(3);
  const [numB, setNumB] = useState(4);
  const [answer, setAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  const generateChallenge = () => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 1;
    setNumA(a);
    setNumB(b);
    setAnswer("");
    setIsCorrect(false);
    onVerify(false);
  };

  useEffect(() => {
    generateChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setAnswer(val);
    const parsed = parseInt(val, 10);
    const correct = parsed === numA + numB;
    setIsCorrect(correct);
    onVerify(correct);
  };

  return (
    <div
      style={{
        background: isCorrect ? "rgba(22, 163, 74, 0.04)" : "#f8fafc",
        border: isCorrect ? "1px solid #86efac" : "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "12px 14px",
        marginTop: "12px",
        marginBottom: "14px",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <label
          htmlFor="security-captcha-input"
          style={{
            fontSize: "12.5px",
            fontWeight: "700",
            color: "#334155",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🛡️</span>
          <span>Control de seguridad humano</span>
        </label>
        <button
          type="button"
          onClick={generateChallenge}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "11px",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          title="Cambiar pregunta"
        >
          Cambiar
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "8px 14px",
            fontWeight: "800",
            fontSize: "14px",
            color: "#0f172a",
            letterSpacing: "0.05em",
            userSelect: "none",
          }}
        >
          {numA} + {numB} =
        </div>
        <input
          id="security-captcha-input"
          type="number"
          value={answer}
          onChange={handleChange}
          placeholder="¿Resultado?"
          style={{
            width: "110px",
            padding: "8px 12px",
            border: isCorrect ? "2px solid #16a34a" : "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "700",
            outline: "none",
            background: "#ffffff",
          }}
          required
        />
        {isCorrect ? (
          <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>✓</span>
            <span>Verificado</span>
          </span>
        ) : answer.length > 0 ? (
          <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: "600" }}>
            Intenta otra vez
          </span>
        ) : null}
      </div>
    </div>
  );
}
