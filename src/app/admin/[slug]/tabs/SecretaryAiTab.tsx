"use client";

import { useState, useRef, useEffect } from "react";
import styles from "../admin.module.css";

interface SecretaryAiTabProps {
  slug: string;
  businessName: string;
  serviceCount: number;
  services: Array<{ name: string; price: number; duration: number }>;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  time: string;
}

export default function SecretaryAiTab({
  slug,
  businessName,
  serviceCount,
  services,
}: SecretaryAiTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: `¡Hola! Soy Linki Secretary, tu asistente de atención y reservas para ${businessName} 👋. Pregúntame sobre tus precios, servicios u horarios como si fueras un cliente para ver cómo respondo.`,
      time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue.trim();
    const timeNow = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", text: userText, time: timeNow },
    ];

    setMessages(updatedMessages);
    setInputValue("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "secretary-chat",
          slug,
          userMessage: userText,
          chatHistory: updatedMessages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await res.json();
      const replyText = data.success && data.reply ? data.reply : "Disculpa, tuve un problema procesando tu consulta.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: replyText,
          time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Hubo un error de conexión con Linki Secretary. Por favor intenta de nuevo.",
          time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.glassCard} style={{ padding: "28px" }}>
      {/* Cabecera */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "28px" }}>💬</span>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--foreground)" }}>
            Linki Secretary · Asistente de Atención y Reservas
          </h2>
          <span style={{ fontSize: "11px", fontWeight: "700", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", padding: "3px 8px", borderRadius: "9999px", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
            Operativo · Gemini 2.5 Flash
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px", maxWidth: "600px", lineHeight: "1.5" }}>
          Atiende a tus clientes respondiendo preguntas sobre tus servicios, precios reales y disponibilidad, guiándolos directamente a tu enlace de reservas.
        </p>
      </div>

      {/* Tarjeta de Conocimiento Cargado */}
      <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--card-border)", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--foreground)" }}>
            📚 Base de conocimientos sincronizada
          </span>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            {serviceCount} servicios cargados con precios reales · Horarios del negocio · Enlace oficial: agendalink.cl/{slug}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {services.slice(0, 3).map((s) => (
            <span key={s.name} style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.06)", padding: "3px 8px", borderRadius: "6px", border: "1px solid var(--card-border)" }}>
              {s.name} (${s.price.toLocaleString("es-CL")})
            </span>
          ))}
          {services.length > 3 && (
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", padding: "3px 4px" }}>
              +{services.length - 3} más
            </span>
          )}
        </div>
      </div>

      {/* Ventana de Chat Interactiva */}
      <div
        style={{
          border: "1px solid var(--card-border)",
          borderRadius: "14px",
          overflow: "hidden",
          background: "rgba(10, 15, 29, 0.7)",
          display: "flex",
          flexDirection: "column",
          height: "440px",
        }}
      >
        {/* Barra superior de la ventana de chat */}
        <div
          style={{
            padding: "12px 18px",
            background: "rgba(255, 255, 255, 0.05)",
            borderBottom: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "13px",
              color: "#fff",
            }}
          >
            LS
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700" }}>Linki Secretary · {businessName}</div>
            <div style={{ fontSize: "11px", color: "#4ade80", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              En línea • Respondiendo en tiempo real
            </div>
          </div>
        </div>

        {/* Cuerpo de mensajes */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
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
                  maxWidth: "80%",
                  background: isUser ? "var(--primary)" : "rgba(255, 255, 255, 0.08)",
                  color: isUser ? "#fff" : "var(--foreground)",
                  padding: "10px 14px",
                  borderRadius: isUser ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                <div>{m.text}</div>
                <div style={{ fontSize: "10px", opacity: 0.7, textAlign: "right", marginTop: "4px" }}>
                  {m.time}
                </div>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "rgba(255, 255, 255, 0.08)",
                padding: "8px 14px",
                borderRadius: "14px 14px 14px 2px",
                fontSize: "12px",
                color: "var(--text-secondary)",
                fontStyle: "italic",
              }}
            >
              Linki Secretary está escribiendo...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Barra de entrada de texto */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: "12px 16px",
            background: "rgba(0, 0, 0, 0.3)",
            borderTop: "1px solid var(--card-border)",
            display: "flex",
            gap: "10px",
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe como cliente (ej: ¿Cuánto cuesta cortarse el pelo?)..."
            disabled={loading}
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--card-border)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "var(--foreground)",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            style={{
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0 18px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: loading || !inputValue.trim() ? "not-allowed" : "pointer",
              opacity: loading || !inputValue.trim() ? 0.6 : 1,
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </section>
  );
}
