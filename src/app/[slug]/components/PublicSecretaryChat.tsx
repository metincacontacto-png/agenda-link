"use client";

import React, { useState, useRef, useEffect } from "react";
import { buildDirectWhatsAppUrl } from "@/lib/whatsapp";
import type { PublicBusinessDTO } from "@/features/booking/public-business-dto";
import styles from "./PublicSecretaryChat.module.css";

type Service = PublicBusinessDTO["services"][number];

interface PublicSecretaryChatProps {
  slug: string;
  business: PublicBusinessDTO;
  isBookingFlow?: boolean;
  onStartBooking: (service?: Service) => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  time: string;
  showBookingAction?: boolean;
}

export default function PublicSecretaryChat({
  slug,
  business,
  isBookingFlow,
  onStartBooking,
}: PublicSecretaryChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: "assistant",
      text: `¡Hola! 👋 Soy Linki, asistente virtual de reservas de ${business.name}. ¿Tienes dudas sobre nuestros servicios, precios o horarios? ¡Pregúntame lo que necesites!`,
      time: "Ahora",
      showBookingAction: true,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // En desktop enfocamos el input
      if (typeof window !== "undefined" && window.innerWidth > 640) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }
  }, [isOpen, messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const timeNow = new Date().toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: "user", text, time: timeNow },
    ];

    setMessages(updatedMessages);
    if (!textToSend) setInputValue("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "public-secretary-chat",
          slug,
          userMessage: text,
          chatHistory: updatedMessages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      const reply =
        data.success && data.reply
          ? data.reply
          : `Disculpa, en este momento no pude consultar la información. Puedes agendar directamente haciendo clic en el botón de agendar.`;

      const shouldShowBooking =
        /agendar|reservar|cita|hora|precio|servicio|costo|valor/i.test(text + " " + reply);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
          time: new Date().toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          showBookingAction: shouldShowBooking,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Tuvimos un problema de conexión momentáneo. Si deseas agendar, puedes hacerlo directamente con el botón de reservas.`,
          time: new Date().toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          showBookingAction: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBookingClick = () => {
    setIsOpen(false);
    onStartBooking();
  };

  const whatsAppUrl = business.landingPhone
    ? buildDirectWhatsAppUrl(
        business.landingPhone,
        `¡Hola ${business.name}! 👋 Tengo una consulta antes de agendar.`
      )
    : "";

  return (
    <>
      {/* =========================================================
          1. BOTÓN FLOTANTE INFERIOR DERECHO
          ========================================================= */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat de atención y reservas"
          className={`${styles.floatingTrigger} ${isBookingFlow ? styles.floatingTriggerBooking : styles.floatingTriggerLanding}`}
        >
          {/* Avatar con pulso verde */}
          <div style={{ position: "relative", width: "34px", height: "34px", flexShrink: 0 }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "13px",
                letterSpacing: "-0.02em",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
              }}
            >
              LS
            </div>
            <span
              style={{
                position: "absolute",
                bottom: "-1px",
                right: "-1px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid #ffffff",
              }}
            />
          </div>

          <div className={styles.triggerText}>
            <div className={styles.triggerTitle}>
              ¿Dudas? Pregúntale a Linki
            </div>
            <div className={styles.triggerSubtitle}>
              Asistente en línea · Responde al instante
            </div>
          </div>
        </button>
      )}

      {/* =========================================================
          2. VENTANA DE CHAT FLOTANTE
          ========================================================= */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat con Linki"
          className={styles.chatWindow}
        >
          {/* Encabezado estilo Apple Blur */}
          <div
            style={{
              padding: "14px 18px",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "13px",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                }}
              >
                LS
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                  Linki · {business.name}
                </div>
                <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                  Asistente oficial · Responde al instante
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                fontSize: "15px",
                fontWeight: 700,
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            >
              ✕
            </button>
          </div>

          {/* Área de mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      background: isUser
                        ? "linear-gradient(135deg, #0071e3 0%, #005bb5 100%)"
                        : "#ffffff",
                      color: isUser ? "#ffffff" : "#0f172a",
                      padding: "11px 15px",
                      borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      fontSize: "13.5px",
                      lineHeight: "1.5",
                      border: isUser ? "none" : "1px solid #e2e8f0",
                      boxShadow: isUser
                        ? "0 4px 12px rgba(0, 113, 227, 0.25)"
                        : "0 2px 6px rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <div>{m.text}</div>

                    {/* Botón de acción para agendar cuando Linki lo sugiere */}
                    {!isUser && m.showBookingAction && (
                      <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                        <button
                          type="button"
                          onClick={handleStartBookingClick}
                          style={{
                            width: "100%",
                            background: "linear-gradient(135deg, #0071e3 0%, #005bb5 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "8px 12px",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            boxShadow: "0 2px 6px rgba(0, 113, 227, 0.25)",
                          }}
                        >
                          <span>⚡ Agendar Cita Online</span>
                          <span>→</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      textAlign: isUser ? "right" : "left",
                      paddingLeft: isUser ? 0 : "6px",
                      paddingRight: isUser ? "6px" : 0,
                    }}
                  >
                    {m.time}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  padding: "10px 14px",
                  borderRadius: "18px 18px 18px 4px",
                  fontSize: "12.5px",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                }}
              >
                <span>Linki está respondiendo...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias Rápidas (Chips) */}
          <div
            style={{
              padding: "8px 14px",
              background: "#ffffff",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              whiteSpace: "nowrap",
              scrollbarWidth: "none",
            }}
          >
            <button
              type="button"
              onClick={() => handleSendMessage("¿Cuáles son los precios y servicios?")}
              disabled={loading}
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #e2e8f0",
                borderRadius: "999px",
                padding: "4px 10px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              🏷️ Ver precios
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("¿Qué horarios de atención tienen?")}
              disabled={loading}
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #e2e8f0",
                borderRadius: "999px",
                padding: "4px 10px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              🕒 Horarios
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("¿Dónde están ubicados?")}
              disabled={loading}
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #e2e8f0",
                borderRadius: "999px",
                padding: "4px 10px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              📍 Ubicación
            </button>
            <button
              type="button"
              onClick={handleStartBookingClick}
              style={{
                fontSize: "11.5px",
                fontWeight: 700,
                background: "rgba(0, 113, 227, 0.1)",
                color: "#0071e3",
                border: "1px solid rgba(0, 113, 227, 0.25)",
                borderRadius: "999px",
                padding: "4px 10px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              ⚡ Agendar Cita
            </button>
          </div>

          {/* Formulario de Entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: "10px 14px",
              background: "#ffffff",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregúntale a Linki sobre precios o citas..."
              disabled={loading}
              maxLength={400}
              style={{
                flex: 1,
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "9px 14px",
                color: "#0f172a",
                fontSize: "13px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              aria-label="Enviar pregunta"
              style={{
                background: "linear-gradient(135deg, #0071e3 0%, #005bb5 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "9px 14px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: loading || !inputValue.trim() ? "not-allowed" : "pointer",
                opacity: loading || !inputValue.trim() ? 0.5 : 1,
                boxShadow: "0 2px 6px rgba(0, 113, 227, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ↑
            </button>
          </form>

          {/* Pie con WhatsApp Directo */}
          {whatsAppUrl && (
            <div
              style={{
                padding: "6px 14px 8px 14px",
                background: "#f8fafc",
                borderTop: "1px solid #f1f5f9",
                textAlign: "center",
              }}
            >
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "11px",
                  color: "#16a34a",
                  textDecoration: "none",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>💬 ¿Prefieres hablar con una persona? Escribir al WhatsApp</span>
                <span>→</span>
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
