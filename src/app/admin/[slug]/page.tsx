"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

interface Appointment {
  id: string;
  clientName: string;
  clientWhatsApp: string;
  dateTime: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentAmount: number | null;
  service: { name: string; duration: number; price: number };
  professional: { name: string };
}

interface Business {
  name: string;
  slug: string;
  teamSize: string;
  currency: string;
  category: string;
  appointments: Appointment[];
  services: { name: string }[];
}

export default function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reservas" | "secretary" | "marketing" | "business">("reservas");

  // Chat animado de Linki Secretary
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "bot"; text: string; time: string }[]>([
    { sender: "user", text: "Hola, me gustaría agendar una cita para mañana por la tarde.", time: "14:02" }
  ]);
  const [secretaryTyping, setSecretaryTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const res = await fetch(`/api/admin?slug=${slug}`);
        if (!res.ok) {
          setBusiness(null);
          return;
        }
        const data = await res.json();
        if (data.success) {
          setBusiness(data.business);
        }
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [slug]);

  // Simulación de escritura progresiva de Linki Secretary
  useEffect(() => {
    if (activeTab !== "secretary") return;

    // Reset chat
    setChatMessages([
      { sender: "user", text: "Hola, me gustaría agendar una cita para mañana por la tarde.", time: "14:02" }
    ]);
    setSecretaryTyping(false);
    
    const messagesScript = [
      { sender: "bot", text: "¡Hola! Con gusto. Para mañana tengo horas disponibles a las 15:30 y 16:30. ¿Te sirve alguna?", delay: 2000 },
      { sender: "user", text: "La de las 15:30 me acomoda. ¿Cuál es el valor?", delay: 5500 },
      { sender: "bot", text: "Perfecto. El servicio es 'Corte de Cabello' con Juan Pérez y tiene un valor de $15.000 CLP. Para confirmar la reserva, debes ingresar al siguiente link de pago simulado: agendalink.com/democut/pay. ¿Deseas proceder?", delay: 9000 },
      { sender: "user", text: "Sí, acabo de pagar en el link.", delay: 13500 },
      { sender: "bot", text: "¡Recibido! Tu pago fue aprobado. He agendado tu cita para mañana a las 15:30 hrs. ¡Te esperamos! ⚡️", delay: 17000 }
    ];

    let timeouts: NodeJS.Timeout[] = [];

    messagesScript.forEach((msg, idx) => {
      const t = setTimeout(() => {
        setSecretaryTyping(msg.sender === "bot");
        const typingTimeout = setTimeout(() => {
          setSecretaryTyping(false);
          const timeStr = new Date();
          timeStr.setMinutes(timeStr.getMinutes() + idx * 3);
          const timeFormatted = timeStr.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
          setChatMessages(prev => [...prev, { sender: msg.sender as any, text: msg.text, time: timeFormatted }]);
        }, msg.sender === "bot" ? 1200 : 0);
        timeouts.push(typingTimeout);
      }, msg.delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(t => clearTimeout(t));
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, secretaryTyping]);

  const formatPrice = (price: number, currency: string) => {
    if (currency === "CLP") {
      return `$${price.toLocaleString("es-CL")}`;
    } else if (currency === "MXN") {
      return `$${price.toLocaleString("es-MX")} MXN`;
    }
    return `$${price.toFixed(2)} USD`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "url('/hero-bg.png') center/cover fixed", color: "var(--foreground)" }}>
        <div className={styles.glassCard} style={{ textAlign: "center", padding: "30px" }}>
          <p style={{ fontWeight: 600, fontSize: "16px" }}>Cargando Centro de Control...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "url('/hero-bg.png') center/cover fixed", color: "var(--foreground)", padding: "20px" }}>
        <div className={styles.glassCard} style={{ textAlign: "center", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "12px" }}>Negocio no encontrado</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>El panel administrativo solicitado no existe.</p>
          <Link href="/" style={{ background: "var(--primary)", color: "white", padding: "10px 20px", borderRadius: "9999px", display: "inline-block", fontWeight: 600 }}>Volver a Inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.adminContainer}>
      <div className={styles.sidebar}>
        <div className={styles.brandLogo}>
          <img src="/logo.png" alt="AgendaLink" style={{ height: "24px" }} />
        </div>
        
        <span className={styles.navSectionTitle}>Operación</span>
        <nav className={styles.navList}>
          <button className={`${styles.navItem} ${activeTab === "reservas" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("reservas")}>
            📅 Reservas
          </button>
        </nav>

        <span className={styles.navSectionTitle}>Asistentes Linki IA</span>
        <nav className={styles.navList}>
          <button className={`${styles.navItem} ${activeTab === "secretary" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("secretary")}>
            💬 Linki Secretary
          </button>
          <button className={`${styles.navItem} ${activeTab === "marketing" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("marketing")}>
            📈 Linki Marketing
          </button>
          <button className={`${styles.navItem} ${activeTab === "business" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("business")}>
            🧠 Linki Business
          </button>
        </nav>
      </div>

      <div className={styles.contentArea}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "800" }}>{business.name}</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Panel de Administración · Plan Automático: {business.teamSize}
            </p>
          </div>
          <Link href={`/${business.slug}`} target="_blank" className={styles.navItemActive} style={{ padding: "8px 16px", borderRadius: "9999px", fontSize: "13px", display: "inline-block", fontWeight: 600 }}>
            Ver link público ↗
          </Link>
        </header>

        {activeTab === "reservas" && (
          <section className={styles.glassCard}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Próximas Reservas Recibidas</h2>
            {business.appointments?.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
                Aún no tienes citas agendadas. Comparte tu link para empezar.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {business.appointments?.map((app) => (
                  <div key={app.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", border: "1px solid var(--card-border)", background: "rgba(255,255,255,0.9)", color: "#000" }}>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: "700" }}>{app.clientName}</h3>
                      <p style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>WhatsApp: {app.clientWhatsApp}</p>
                      <p style={{ fontSize: "12px", color: "var(--primary)", marginTop: "4px", fontWeight: "600" }}>
                        {app.service?.name} con {app.professional?.name}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", display: "block" }}>
                        {new Date(app.dateTime).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div style={{ marginTop: "4px" }}>
                        <span className={styles.badgePaid}>
                          ✓ PAGADO ({formatPrice(app.paymentAmount || app.service?.price || 0, business.currency)} por {app.paymentMethod || "Visa Sim"})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "secretary" && (
          <section className={styles.glassCard}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>Linki Secretary · Agendador de WhatsApp 24/7</h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Monitorea en tiempo real cómo tu asistente de inteligencia artificial conversa con tus clientes para reservar cupos.
            </p>
            <div className={styles.chatWindow}>
              <div className={styles.chatHeader}>
                <div className={styles.chatAvatar}>LS</div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>Linki Secretary</div>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>En línea • Respondiendo automáticamente</div>
                </div>
              </div>
              <div className={styles.chatBody}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={msg.sender === "user" ? styles.msgIn : styles.msgOut}>
                    {msg.text}
                    <div style={{ fontSize: "9px", color: "gray", textAlign: "right", marginTop: "4px" }}>{msg.time}</div>
                  </div>
                ))}
                {secretaryTyping && (
                  <div className={styles.msgOut} style={{ fontStyle: "italic", color: "gray" }}>
                    Linki Secretary está escribiendo...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </section>
        )}

        {activeTab === "marketing" && (
          <section className={styles.glassCard}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Linki Marketing · Reactivación de Clientes</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "rgba(255,255,255,0.06)", padding: "16px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: "24px", fontWeight: "800", display: "block" }}>32</span>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>Clientes Inactivos Detectados</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", padding: "16px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: "24px", fontWeight: "800", display: "block" }}>28</span>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>WhatsApp Promocionales Enviados</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", padding: "16px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: "24px", fontWeight: "800", display: "block" }}>14%</span>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>Tasa de Retorno y Agendamiento</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Campaña Activa: Fidelización de 30 Días</h3>
              <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "13px", lineHeight: "1.5", border: "1px solid var(--card-border)" }}>
                <strong>Mensaje automático enviado:</strong><br />
                <p style={{ marginTop: "6px", fontStyle: "italic" }}>
                  "¡Hola [Nombre]! Te extrañamos en {business.name}. Hace un mes que no nos visitas. Agenda tu hora hoy y obtén un 10% de descuento usando tu link de reservas: agendalink.com/{business.slug} ⚡️"
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === "business" && (
          <section className={styles.glassCard}>
            <div className={styles.reportTitle}>
              <span>🧠</span> Linki Business • Reporte Semanal Estratégico
            </div>
            <div style={{ borderLeft: "4px solid var(--primary)", paddingLeft: "16px", margin: "16px 0" }}>
              <p className={styles.reportParagraph} style={{ fontStyle: "italic", fontWeight: "500" }}>
                "Hola. He analizado el rendimiento del negocio durante los últimos 7 días. Aquí tienes mi balance estratégico:"
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p className={styles.reportParagraph}>
                📈 <strong>Rendimiento General:</strong> Las reservas de esta semana aumentaron un <strong>12%</strong> comparado con la semana anterior, registrando una facturación simulada de <strong>{formatPrice(business.appointments?.reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0) || 120000, business.currency)}</strong>.
              </p>
              <p className={styles.reportParagraph}>
                ⭐ <strong>Servicios y Staff Estrella:</strong> Tu servicio más demandado fue {business.services?.[0]?.name || "el servicio estrella"} y tu profesional con más reservas fue {business.appointments?.[0]?.professional?.name || "el profesional estrella"}. Hay alta retención en el bloque de las 15:30 hrs.
              </p>
              <p className={styles.reportParagraph}>
                💡 <strong>Consejo de IA:</strong> He notado que los días martes por la mañana tienen baja ocupación (menos del 20%). Le he sugerido a <strong>Linki Marketing</strong> programar un recordatorio automático con un descuento especial para incentivar reservas los martes temprano.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
