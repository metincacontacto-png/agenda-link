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
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
        <div>
          <span style={{ fontSize: "12.5px", fontWeight: "750", color: "#0f172a" }}>
            📚 Base de conocimientos sincronizada
          </span>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "3px" }}>
            {serviceCount} servicios cargados con precios reales · Horarios del negocio · Enlace oficial: agendalink.cl/{slug}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {services.slice(0, 3).map((s) => (
            <span key={s.name} style={{ fontSize: "11.5px", background: "#f8fafc", color: "#334155", fontWeight: "600", padding: "4px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              {s.name} (${s.price.toLocaleString("es-CL")})
            </span>
          ))}
          {services.length > 3 && (
            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", padding: "4px 6px" }}>
              +{services.length - 3} más
            </span>
          )}
        </div>
      </div>

      {/* Ventana de Chat Interactiva */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          overflow: "hidden",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "460px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        {/* Barra superior de la ventana de chat */}
        <div
          style={{
            padding: "14px 20px",
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "13px",
              color: "#fff",
              boxShadow: "0 2px 6px rgba(37, 211, 102, 0.25)",
            }}
          >
            LS
          </div>
          <div>
            <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f172a" }}>Linki Secretary · {businessName}</div>
            <div style={{ fontSize: "11.5px", color: "#16a34a", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              En línea • Respondiendo en tiempo real
            </div>
          </div>
        </div>

        {/* Cuerpo de mensajes */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
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
                  background: isUser ? "linear-gradient(135deg, #0066FF 0%, #0052CC 100%)" : "#ffffff",
                  color: isUser ? "#ffffff" : "#0f172a",
                  padding: "12px 16px",
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  fontSize: "13.5px",
                  lineHeight: "1.55",
                  border: isUser ? "none" : "1px solid #e2e8f0",
                  boxShadow: isUser ? "0 4px 12px rgba(0, 102, 255, 0.25)" : "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                <div>{m.text}</div>
                <div style={{ fontSize: "10.5px", opacity: isUser ? 0.8 : 0.55, textAlign: "right", marginTop: "5px" }}>
                  {m.time}
                </div>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                padding: "10px 16px",
                borderRadius: "16px 16px 16px 4px",
                fontSize: "12.5px",
                color: "#64748b",
                fontStyle: "italic",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
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
            padding: "14px 18px",
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: "10px",
            alignItems: "center",
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
              background: "#f8fafc",
              border: "1.5px solid #cbd5e1",
              borderRadius: "10px",
              padding: "11px 16px",
              color: "#0f172a",
              fontSize: "13.5px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            style={{
              background: "linear-gradient(135deg, #0066FF 0%, #0052CC 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "11px 22px",
              fontSize: "13.5px",
              fontWeight: "750",
              cursor: loading || !inputValue.trim() ? "not-allowed" : "pointer",
              opacity: loading || !inputValue.trim() ? 0.6 : 1,
              boxShadow: "0 3px 10px rgba(0, 102, 255, 0.3)",
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </section>
  );
}
