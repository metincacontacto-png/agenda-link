"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import QrDownloader from "@/components/QrDownloader";

export default function LandingAndOnboardingPage() {
  const [heroSlug, setHeroSlug] = useState("");
  const [step, setStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    email: "",
    category: "Peluquería",
    teamSize: "1 persona",
    country: "Chile",
    serviceName: "",
    serviceDuration: "30",
    servicePrice: "",
  });

  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [segmentsOpen, setSegmentsOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginSlug, setLoginSlug] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [googleMode, setGoogleMode] = useState<"none" | "chooser">("none");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSlug(data.slug);
        setStep(3);
      } else {
        alert(data.error || "Algo salió mal");
      }
    } catch (err) {
      console.error(err);
      alert("Error al enviar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert("No se pudo copiar automáticamente. Por favor, selecciona y copia el link manualmente.");
      }
    } catch (err) {
      console.error("Fallback de copia falló:", err);
      alert("No se pudo copiar automáticamente. Por favor, selecciona y copia el link manualmente.");
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/${slug}`;
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Error al copiar usando navigator.clipboard:", err);
          fallbackCopyText(url);
        });
    } else {
      fallbackCopyText(url);
    }
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroSlug) return;
    setFormData((prev) => ({ ...prev, name: heroSlug }));
    document.getElementById("registro")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectPlan = (teamSize: string) => {
    setFormData((prev) => ({ ...prev, teamSize }));
    document.getElementById("registro")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSegmentClick = (categoryVal: string) => {
    setSegmentsOpen(false);
    setFormData((prev) => ({
      ...prev,
      category: categoryVal,
    }));
    scrollToSection("registro");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginSlug) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`/api/admin?slug=${loginSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          window.location.href = `/admin/${loginSlug}`;
        } else {
          setLoginError("No se pudo iniciar sesión. Verifica el link.");
        }
      } else {
        setLoginError("El negocio no existe. Asegúrate de que el link sea correcto.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleAccountSelect = async (accountEmail: string, accountName: string, accountSlug: string) => {
    setGoogleLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/google-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: accountSlug,
          name: accountSlug === "me-tinca" ? "Me Tinca Estudio Creativo" : "Invitado Demo",
          category: accountSlug === "me-tinca" ? "Estética/Salón" : "Otros",
        }),
      });
      const data = await res.json();
      if (data.success && data.slug) {
        window.location.href = `/admin/${data.slug}`;
      } else {
        setLoginError(data.error || "Error al conectar con la cuenta de Google.");
        setGoogleLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoginError("Error de conexión al iniciar con Google.");
      setGoogleLoading(false);
    }
  };


  return (
    <div className={styles.landingWrapper}>
      {/* Background Glowing Orbs */}
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />
      <div className={styles.glowOrb3} />

      {/* 1. Cabecera */}
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/logo.png" alt="AgendaLink Logo" style={{ height: "36px", width: "auto" }} />
        </div>
        <nav className={styles.headerNav}>
          <div
            className={styles.dropdownContainer}
            onMouseEnter={() => setSegmentsOpen(true)}
            onMouseLeave={() => setSegmentsOpen(false)}
          >
            <button className={`${styles.headerLink} ${segmentsOpen ? styles.headerLinkActive : ""}`}>
              Negocios <span className={styles.caret}>{segmentsOpen ? "▲" : "▼"}</span>
            </button>
            
            {segmentsOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownColumn}>
                  <div className={styles.columnTitle}>Estética y Belleza</div>
                  <div className={styles.columnItems}>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Peluquería")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <line x1="9.8" y1="8.2" x2="21" y2="19.4" />
                        <line x1="9.8" y1="15.8" x2="21" y2="4.6" />
                      </svg>
                      <span>Salones de belleza</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Peluquería")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-4 5-4c2 0 3 2 5 4 2-2 3-4 5-4 2 0 5 4 5 4-2 4-5 4-7 2-2 2-4 2-6 0-2 2-5 2-7-2Z" />
                      </svg>
                      <span>Barberías</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Peluquería")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3c-1.2 3.4-3 6-6 8.5 3 2.5 4.8 5.1 6 8.5 1.2-3.4 3-6 6-8.5-3-2.5-4.8-5.1-6-8.5Z" />
                      </svg>
                      <span>Spas y Estética</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Peluquería")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a4 4 0 0 0-4 4v12a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Zm0 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
                      </svg>
                      <span>Manicure y Pedicure</span>
                    </div>
                  </div>
                </div>

                <div className={styles.dropdownColumn}>
                  <div className={styles.columnTitle}>Salud y Bienestar</div>
                  <div className={styles.columnItems}>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Salud")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 10h-5V5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5h5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1Z" />
                      </svg>
                      <span>Centros médicos</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Salud")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                      <span>Kinesiología</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Fitness")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6.5 6.5h11M6.5 17.5h11M18 5v14M6 5v14M3 8v8M21 8v8" />
                      </svg>
                      <span>Centros deportivos</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Salud")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"/><path d="M12 2v4M12 2c0 2-2 3-4 3" />
                      </svg>
                      <span>Nutricionistas</span>
                    </div>
                  </div>
                </div>


              </div>
            )}
          </div>

          <button className={styles.headerLink} onClick={() => scrollToSection("features")}>Funcionalidades</button>
          <button className={styles.headerLink} onClick={() => scrollToSection("pricing")}>Precios</button>
        </nav>
        <div className={styles.headerActions}>
          <button className={styles.headerLink} onClick={() => setLoginModalOpen(true)}>Iniciar Sesión</button>
          <button className={styles.heroBtn} style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => scrollToSection("registro")}>Registrar negocio</button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.techBadge}>
            <span>⚡️</span> AgendaLink 2.0 • Plataforma Inteligente
          </div>
          <h1 className={styles.heroTitle}>
            Un solo link.<br />
            <span style={{ background: "var(--brand-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Todo tu negocio resuelto.
            </span>
          </h1>
          <p className={styles.heroSubtitle}>
            Dale un link a tus clientes para ver tus servicios, agendar, pagar con tarjeta o Apple Pay y recibir recordatorios en WhatsApp. Configuración en menos de 10 minutos.
          </p>
          <form onSubmit={handleHeroSubmit} className={styles.heroForm}>
            <div className={styles.heroInputWrapper}>
              <span>agendalink.cl/</span>
              <input
                type="text"
                placeholder="tu-negocio"
                className={styles.heroInput}
                value={heroSlug}
                onChange={(e) => setHeroSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
            </div>
            <button type="submit" className={styles.heroBtn}>
              Crear mi link
            </button>
          </form>
        </div>

        {/* Mockups CSS Visuales */}
        <div className={styles.mockupContainer}>
          {/* Teléfono */}
          <div className={styles.phoneMockup}>
            <div className={styles.phoneScreen}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0066ff", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", margin: "0 auto 8px auto" }}>KL</div>
              <div style={{ fontSize: "12px", fontWeight: "800", textAlign: "center" }}>KineActive</div>
              <div style={{ fontSize: "9px", color: "gray", textAlign: "center", marginBottom: "14px" }}>Kinesiología y Rehabilitación</div>
              
              <div style={{ border: "1px solid #0066ff", borderRadius: "8px", padding: "8px", background: "rgba(0, 102, 255, 0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", fontWeight: "bold" }}>Sesión Kinesiológica</span>
                <span style={{ fontSize: "10px", fontWeight: "bold", color: "#0066ff" }}>$25.000</span>
              </div>
              <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "8px", padding: "8px", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", opacity: 0.8 }}>
                <span style={{ fontSize: "10px" }}>Evaluación Inicial</span>
                <span style={{ fontSize: "10px", fontWeight: "bold" }}>$30.000</span>
              </div>
              <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "8px", padding: "8px", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.6 }}>
                <span style={{ fontSize: "10px" }}>Terapia Manual</span>
                <span style={{ fontSize: "10px", fontWeight: "bold" }}>$20.000</span>
              </div>

              <div style={{ marginTop: "auto", background: "black", color: "white", padding: "10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", textAlign: "center", cursor: "pointer" }}>
                 Pay
              </div>
            </div>
          </div>

          {/* Mac */}
          <div className={styles.macMockup}>
            <div className={styles.macHeader}>
              <div className={styles.macDot} style={{ background: "#ff5f56" }} />
              <div className={styles.macDot} style={{ background: "#ffbd2e" }} />
              <div className={styles.macDot} style={{ background: "#27c93f" }} />
            </div>
            <div className={styles.macScreen}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", borderBottom: "1px solid #eee", paddingBottom: "4px", marginBottom: "4px" }}>
                <span style={{ fontWeight: "bold" }}>Agenda Semanal</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <span style={{ fontSize: "8px", width: "22px", color: "gray" }}>09:00</span>
                  <div style={{ flex: 1, background: "rgba(52, 199, 89, 0.08)", borderLeft: "2px solid #34c759", padding: "2px 4px", borderRadius: "3px", fontSize: "8px", textAlign: "left" }}>
                    <strong>Juan Pérez</strong> · Evaluación (✓ Pago)
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <span style={{ fontSize: "8px", width: "22px", color: "gray" }}>10:00</span>
                  <div style={{ flex: 1, background: "rgba(0, 102, 255, 0.08)", borderLeft: "2px solid #0066ff", padding: "2px 4px", borderRadius: "3px", fontSize: "8px", textAlign: "left" }}>
                    <strong>María Gómez</strong> · Sesión Kine
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seccion Diferenciadores Comerciales */}
      <section className={styles.differentiatorsSection}>
        <div className={styles.differentiatorBannerGrid}>
          {/* Banner 1: Un solo link */}
          <div className={`${styles.diffBanner} ${styles.diffBannerLink}`}>
            <div className={styles.diffBannerContent}>
              <span className={styles.diffBadge}>🔗 ATRIBUTO CLAVE</span>
              <h3 className={styles.diffTitle}>Tu negocio completo en un solo link.</h3>
              <p className={styles.diffText}>
                Olvídate de coordinar horas por chats interminables. Un único link para que tus clientes vean tus servicios o carta, elijan profesional, revisen turnos libres y confirmen de inmediato.
              </p>
              <div className={styles.diffLabel}>agendalink.cl/tu-marca ➔</div>
            </div>
            <div className={styles.diffVisualLink} style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", width: "100%" }}>
              <div style={{ width: "100%", aspectRatio: "1.1 / 1", borderRadius: "18px", overflow: "hidden", border: "1px solid rgba(0, 102, 255, 0.12)", boxShadow: "var(--shadow-subtle)" }}>
                <img src="/qr_mockup.png" alt="Código QR para reservas" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div className={styles.visualLinkCard}>
                <span className={styles.visualLinkIcon}>🔗</span>
                <span className={styles.visualLinkLabel}>agendalink.cl/tu-negocio</span>
              </div>
            </div>
          </div>

          {/* Grid de 2 columnas para Rapidez y Facilidad */}
          <div className={styles.diffSubGrid}>
            {/* Banner 2: Rapidez */}
            <div className={`${styles.diffCard} ${styles.diffCardSpeed}`} style={{ justifyContent: "space-between", minHeight: "440px" }}>
              <div>
                <span className={styles.diffCardBadge}>⚡️ ULTRA RÁPIDO</span>
                <h3 className={styles.diffCardTitle}>Reserva en menos de 20 segundos</h3>
                <p className={styles.diffCardText} style={{ marginBottom: "24px" }}>
                  Removimos toda la fricción. Tus clientes no necesitan crear contraseñas ni descargar apps. Entran a tu link, seleccionan en 4 clics, pagan y listo.
                </p>
              </div>
              <div style={{ width: "100%", aspectRatio: "1.2 / 1", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(0, 102, 255, 0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <img src="/easy_booking.png" alt="Reserva rápida en smartphone" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>

            {/* Banner 3: Facilidad */}
            <div className={`${styles.diffCard} ${styles.diffCardEasy}`} style={{ justifyContent: "space-between", minHeight: "440px" }}>
              <div>
                <span className={styles.diffCardBadge}>✨ 100% INTUITIVO</span>
                <h3 className={styles.diffCardTitle}>Tan simple que se explica solo</h3>
                <p className={styles.diffCardText} style={{ marginBottom: "24px" }}>
                  Creado pensando en la comodidad móvil. Administra tus turnos, actualiza servicios y ve tus ingresos diarios desde una interfaz limpia y libre de complicaciones.
                </p>
              </div>
              <div style={{ width: "100%", aspectRatio: "1.2 / 1", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(0, 102, 255, 0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <img src="/admin_dashboard.png" alt="Panel de control intuitivo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Características Grid */}
      <section id="features" className={styles.featuresSection}>
        <h2 className={styles.sectionHeading}>La plataforma más rápida y simple para agendar</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <svg className={styles.flatBlueIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Reserva en 4 clics</h3>
            <p className={styles.featureText}>
              Sin contraseñas, sin descargar nada, sin recordar cuentas. Tus clientes entran a tu link, eligen el servicio, pagan y confirman de inmediato.
            </p>
            <div className={styles.featureImageContainer}>
              <img src="/booking_mockup.png" alt="Reserva en 4 clics" className={styles.featureImage} />
            </div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <svg className={styles.flatBlueIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Asistentes Linki IA</h3>
            <p className={styles.featureText}>
              Secretary responde en WhatsApp 24/7 para agendar citas; Marketing reactiva clientes inactivos de forma automática y Business te asesora estratégicamente.
            </p>
            <div className={styles.featureImageContainer}>
              <img src="/whatsapp_mockup.png" alt="Asistentes Linki IA" className={styles.featureImage} />
            </div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <svg className={styles.flatBlueIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>QR e Imprenta listos</h3>
            <p className={styles.featureText}>
              Te generamos un cartel A4 listo para pegar en tu vitrina y tarjetas de presentación con código QR para que tus clientes agenden al instante.
            </p>
            <div className={styles.featureImageContainer}>
              <img src="/qr_mockup.png" alt="QR e Imprenta listos" className={styles.featureImage} />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Planes de Precios */}
      <section id="pricing" className={styles.pricingSection}>
        <h2 className={styles.sectionHeading}>Planes adaptados a tu etapa de crecimiento</h2>
        
        {/* Toggle Facturación */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <span style={{ fontSize: "14px", fontWeight: billingCycle === "monthly" ? "700" : "500", color: billingCycle === "monthly" ? "var(--foreground)" : "var(--text-secondary)" }}>
            Mensual
          </span>
          <button 
            type="button"
            onClick={() => setBillingCycle(prev => prev === "monthly" ? "yearly" : "monthly")}
            style={{
              width: "50px",
              height: "26px",
              borderRadius: "13px",
              background: "var(--primary)",
              border: "none",
              cursor: "pointer",
              position: "relative",
              padding: "3px",
              transition: "background 0.3s"
            }}
          >
            <div 
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "white",
                transition: "transform 0.3s",
                transform: billingCycle === "yearly" ? "translateX(24px)" : "translateX(0px)"
              }}
            />
          </button>
          <span style={{ fontSize: "14px", fontWeight: billingCycle === "yearly" ? "700" : "500", color: billingCycle === "yearly" ? "var(--foreground)" : "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
            Anual <span style={{ background: "rgba(52, 199, 89, 0.15)", color: "#34c759", fontSize: "11px", fontWeight: "700", padding: "2px 6px", borderRadius: "20px" }}>Ahorra 20%</span>
          </span>
        </div>

        <div className={styles.pricingGrid}>
          {/* Plan Individual */}
          <div className={styles.pricingCard}>
            <h3 className={styles.planName}>Plan Individual</h3>
            <div className={styles.planPrice}>
              {billingCycle === "monthly" ? (
                <>$9.900<span> / mes</span></>
              ) : (
                <>
                  $7.900<span> / mes</span>
                  <span style={{ display: "block", fontSize: "11px", color: "var(--success)", fontWeight: "600", marginTop: "4px" }}>
                    Facturado anual ($94.800/año)
                  </span>
                </>
              )}
            </div>
            <ul className={styles.planFeatures}>
              <li className={styles.planFeatureItem}>✓ 1 Profesional / Sucursal</li>
              <li className={styles.planFeatureItem}>✓ Link de Reservas público personalizado</li>
              <li className={styles.planFeatureItem}>✓ Panel de administración básico</li>
              <li className={styles.planFeatureItem}>✓ Carta digital básica (Hasta 10 platos)</li>
              <li className={styles.planFeatureItem}>✓ Generación de código QR descargable</li>
              <li className={styles.planFeatureItem}>✓ Soporte estándar</li>
            </ul>
            <button onClick={() => handleSelectPlan("1 persona")} className={styles.planBtn}>
              Elegir Plan
            </button>
          </div>

          {/* Plan Equipo */}
          <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
            <div className={styles.popularBadge}>Más Popular</div>
            <h3 className={styles.planName}>Plan Equipo</h3>
            <div className={styles.planPrice}>
              {billingCycle === "monthly" ? (
                <>$19.990<span> / mes</span></>
              ) : (
                <>
                  $15.990<span> / mes</span>
                  <span style={{ display: "block", fontSize: "11px", color: "var(--success)", fontWeight: "600", marginTop: "4px" }}>
                    Facturado anual ($191.880/año)
                  </span>
                </>
              )}
            </div>
            <ul className={styles.planFeatures}>
              <li className={styles.planFeatureItem}>✓ 2 a 5 Profesionales / Sucursales</li>
              <li className={styles.planFeatureItem}>✓ Landing page para cada profesional</li>
              <li className={styles.planFeatureItem}>✓ Panel completo (Turnos, Reservas, Clientes)</li>
              <li className={styles.planFeatureItem}>✓ Caja diaria, control de arqueo y propinas</li>
              <li className={styles.planFeatureItem}>✓ Emisión de Gift Cards y Membresías</li>
              <li className={styles.planFeatureItem}>✓ Recordatorios de WhatsApp (Confirmación e inmediata)</li>
              <li className={styles.planFeatureItem}>✓ Linki Secretary IA (Hasta 100 chats/mes)</li>
            </ul>
            <button onClick={() => handleSelectPlan("2-5 personas")} className={`${styles.planBtn} ${styles.planBtnPrimary}`}>
              Elegir Plan
            </button>
          </div>

          {/* Plan Negocio */}
          <div className={styles.pricingCard}>
            <h3 className={styles.planName}>Plan Negocio</h3>
            <div className={styles.planPrice}>
              {billingCycle === "monthly" ? (
                <>$39.990<span> / mes</span></>
              ) : (
                <>
                  $31.990<span> / mes</span>
                  <span style={{ display: "block", fontSize: "11px", color: "var(--success)", fontWeight: "600", marginTop: "4px" }}>
                    Facturado anual ($383.880/año)
                  </span>
                </>
              )}
            </div>
            <ul className={styles.planFeatures}>
              <li className={styles.planFeatureItem}>✓ 6 o más Profesionales / Multi-sucursal</li>
              <li className={styles.planFeatureItem}>✓ Landing page para cada profesional</li>
              <li className={styles.planFeatureItem}>✓ Mapa interactivo visual de Mesas</li>
              <li className={styles.planFeatureItem}>✓ Linki Secretary IA (WhatsApp ilimitado)</li>
              <li className={styles.planFeatureItem}>✓ Linki Marketing IA (Reactivación de clientes)</li>
              <li className={styles.planFeatureItem}>✓ Linki Business IA (Consultoría estratégica)</li>
              <li className={styles.planFeatureItem}>✓ Programa de Puntos IA y Retención avanzada</li>
              <li className={styles.planFeatureItem}>✓ Soporte prioritario 24/7</li>
            </ul>
            <button onClick={() => handleSelectPlan("6+ personas")} className={styles.planBtn}>
              Elegir Plan
            </button>
          </div>
        </div>
      </section>

      {/* 5. Onboarding / Registro integrado */}
      <section id="registro" className={styles.registerSection}>
        <div className={styles.container} style={{ margin: "0 auto", padding: 0 }}>
          <div className={styles.card}>
            <div className={styles.header} style={{ display: "block", textAlign: "center", border: "none", padding: "0 0 20px 0" }}>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--foreground)" }}>Configura tu AgendaLink</h2>
              <p className={styles.subtitle} style={{ marginTop: "4px" }}>Toma menos de 10 minutos empezar.</p>
            </div>

            {step < 3 && (
              <div className={styles.stepIndicator}>
                <div className={`${styles.dot} ${step === 1 ? styles.dotActive : ""}`} />
                <div className={`${styles.dot} ${step === 2 ? styles.dotActive : ""}`} />
              </div>
            )}

            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); if (formData.name && formData.ownerName && formData.email) nextStep(); }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre de tu Negocio</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej. Peluquería Bella Vista"
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tu Nombre</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Ej. Juan Pérez"
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Ej. juan.perez@correo.com"
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Rubro</label>
                  <select name="category" value={formData.category} onChange={handleChange} className={styles.select}>
                    <option value="Peluquería">Peluquería</option>
                    <option value="Salud">Salud y Bienestar</option>
                    <option value="Fitness">Fitness y Deporte</option>
                    <option value="Otros">Otros servicios</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>¿Cuántas personas trabajan en tu negocio?</label>
                  <select name="teamSize" value={formData.teamSize} onChange={handleChange} className={styles.select}>
                    <option value="1 persona">Solo yo (Plan Link Individual)</option>
                    <option value="2-5 personas">2 a 5 personas (Plan Link Equipo)</option>
                    <option value="6+ personas">6 o más personas (Plan Link Negocio)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>País</label>
                  <select name="country" value={formData.country} onChange={handleChange} className={styles.select}>
                    <option value="Chile">Chile</option>
                    <option value="México">México</option>
                  </select>
                </div>
                <div className={styles.buttonRow}>
                  <button
                    type="submit"
                    disabled={!formData.name || !formData.ownerName || !formData.email}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                  >
                    Siguiente
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (loading) return;
                  if (formData.serviceName && formData.servicePrice) {
                    handleSubmit();
                  }
                }}
              >
                <h2 style={{ fontSize: "15px", marginBottom: "20px", textAlign: "center", fontWeight: "700" }}>Agrega tu primer servicio</h2>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre del Servicio</label>
                  <input
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleChange}
                    placeholder="Ej. Corte de Cabello Caballero"
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Duración (minutos)</label>
                  <select name="serviceDuration" value={formData.serviceDuration} onChange={handleChange} className={styles.select}>
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1 hora y media</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Precio</label>
                  <input
                    type="number"
                    name="servicePrice"
                    value={formData.servicePrice}
                    onChange={handleChange}
                    placeholder="Ej. 15000"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.buttonRow}>
                  <button type="button" onClick={prevStep} className={`${styles.btn} ${styles.btnSecondary}`}>
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.serviceName || !formData.servicePrice}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                  >
                    {loading ? "Creando..." : "Crear mi link"}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>🎉</div>
                <h2 className={styles.successTitle}>¡Tu AgendaLink está lista!</h2>
                <p className={styles.successText}>
                  Ya puedes compartir este link con tus clientes para agendar y recibir pagos.
                </p>

                <div className={styles.linkBox}>
                  <span className={styles.linkText}>
                    {window.location.origin}/{slug}
                  </span>
                  <button onClick={copyLink} className={styles.copyBtn}>
                    {copied ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>

                <div className={styles.qrContainer}>
                  <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Tu código QR de reservas</p>
                  <QrDownloader slug={slug} businessName={formData.name} />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                  <Link href={`/${slug}`} className={`${styles.btn} ${styles.btnSecondary}`} style={{ textDecoration: "none" }}>
                    Ver link público
                  </Link>
                  <Link href={`/admin/${slug}`} className={`${styles.btn} ${styles.btnPrimary}`} style={{ textDecoration: "none" }}>
                    Panel de Control
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* 6. Pie de Página */}
      <footer style={{ padding: "40px 0", borderTop: "1px solid var(--card-border)", textAlign: "center", fontSize: "12px", color: "var(--text-secondary)" }}>
        <p>© 2026 AgendaLink. Todos los derechos reservados.</p>
        <p style={{ marginTop: "8px", opacity: 0.7, letterSpacing: "0.05em" }}>AgendaLink es una plataforma de <a href="https://ganimides.cl" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", fontWeight: "bold" }}>GANIMIDES.CL</a></p>
      </footer>

      {/* Modal de Inicio de Sesión */}
      {loginModalOpen && (
        <div className={styles.modalOverlay} onClick={() => { setLoginModalOpen(false); setGoogleMode("none"); setGoogleLoading(false); }}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => { setLoginModalOpen(false); setGoogleMode("none"); setGoogleLoading(false); }}>×</button>
            
            {googleMode === "none" ? (
              <>
                <h3 className={styles.modalTitle}>Iniciar Sesión</h3>
                <p className={styles.modalSubtitle}>Ingresa el link de tu negocio para acceder al Panel de Control</p>
                
                {loginError && <div className={styles.modalError}>{loginError}</div>}
                
                <form onSubmit={handleLoginSubmit}>
                  <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
                    <label className={styles.label}>Link de tu negocio</label>
                    <div className={styles.heroInputWrapper} style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: "var(--radius-input)", padding: "4px 8px 4px 12px", height: "48px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-secondary)" }}>agendalink.cl/</span>
                      <input
                        type="text"
                        placeholder="tu-negocio"
                        className={styles.heroInput}
                        style={{ fontSize: "13.5px", padding: "6px 4px" }}
                        value={loginSlug}
                        onChange={(e) => setLoginSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        required
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className={`${styles.btn} ${styles.btnPrimary}`} 
                    style={{ width: "100%", padding: "12px", height: "46px" }}
                    disabled={loginLoading || !loginSlug}
                  >
                    {loginLoading ? "Verificando..." : "Ingresar"}
                  </button>
                </form>

                <div className={styles.divider}>o ingresar con</div>

                <button 
                  type="button" 
                  className={styles.googleBtn}
                  onClick={() => setGoogleMode("chooser")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.08h3.97c2.33-2.15 3.66-5.32 3.66-8.7z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.97-3.08c-1.12.75-2.54 1.19-3.99 1.19-3.07 0-5.67-2.08-6.6-4.88H1.31v3.18A12 12 0 0 0 12 24z"/>
                    <path fill="#FBBC05" d="M5.4 14.32a7.16 7.16 0 0 1 0-4.64V6.5H1.31a12 12 0 0 0 0 11L5.4 14.32z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.93 11.93 0 0 0 12 0 12 12 0 0 0 1.31 6.5l4.09 3.18c.93-2.8 3.53-4.93 6.6-4.93z"/>
                  </svg>
                  Continuar con Google
                </button>
              </>
            ) : (
              <div className={styles.googleChooser}>
                <div className={styles.googleLogoWrapper}>
                  <svg width="32" height="32" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.08h3.97c2.33-2.15 3.66-5.32 3.66-8.7z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.97-3.08c-1.12.75-2.54 1.19-3.99 1.19-3.07 0-5.67-2.08-6.6-4.88H1.31v3.18A12 12 0 0 0 12 24z"/>
                    <path fill="#FBBC05" d="M5.4 14.32a7.16 7.16 0 0 1 0-4.64V6.5H1.31a12 12 0 0 0 0 11L5.4 14.32z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.93 11.93 0 0 0 12 0 12 12 0 0 0 1.31 6.5l4.09 3.18c.93-2.8 3.53-4.93 6.6-4.93z"/>
                  </svg>
                </div>
                
                <h3 className={styles.modalTitle} style={{ fontSize: "18px", fontWeight: "750", marginBottom: "4px" }}>Elige una cuenta</h3>
                <p className={styles.modalSubtitle} style={{ fontSize: "13px" }}>para continuar en AgendaLink</p>
                
                {loginError && <div className={styles.modalError} style={{ marginTop: "12px", width: "100%" }}>{loginError}</div>}

                {googleLoading ? (
                  <div style={{ padding: "40px 0", color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "24px", height: "24px", border: "2.5px solid var(--primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "badgePulse 1s infinite linear" }} />
                    Iniciando espacio de trabajo...
                  </div>
                ) : (
                  <>
                    <div className={styles.googleAccountList}>
                      <button 
                        type="button" 
                        className={styles.googleAccountItem}
                        onClick={() => handleGoogleAccountSelect("contacto@metinca.cl", "Metinca Contacto", "me-tinca")}
                      >
                        <div className={styles.googleAvatar} style={{ background: "#4285F4" }}>M</div>
                        <div className={styles.googleAccountInfo}>
                          <span className={styles.googleAccountName}>Metinca Contacto</span>
                          <span className={styles.googleAccountEmail}>contacto@metinca.cl</span>
                        </div>
                      </button>
                      <button 
                        type="button" 
                        className={styles.googleAccountItem}
                        onClick={() => handleGoogleAccountSelect("demo@agendalink.cl", "Invitado Demo", "invitado-demo")}
                      >
                        <div className={styles.googleAvatar} style={{ background: "#34A853" }}>D</div>
                        <div className={styles.googleAccountInfo}>
                          <span className={styles.googleAccountName}>Invitado Demo</span>
                          <span className={styles.googleAccountEmail}>demo@agendalink.cl</span>
                        </div>
                      </button>
                    </div>

                    <button 
                      type="button" 
                      className={styles.googleBackBtn}
                      onClick={() => setGoogleMode("none")}
                    >
                      Usar otro link de negocio
                    </button>
                  </>
                )}
                
                <p className={styles.googleFooter}>
                  Para continuar, Google compartirá tu nombre, correo y foto de perfil con AgendaLink. Consulta la <a href="#">Política de Privacidad</a> y los <a href="#">Términos del Servicio</a>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
