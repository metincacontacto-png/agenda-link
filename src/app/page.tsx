"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import QrDownloader from "@/components/QrDownloader";

export default function LandingAndOnboardingPage() {
  const [heroSlug, setHeroSlug] = useState("");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    category: "Peluquería",
    teamSize: "1 persona",
    country: "Chile",
    serviceName: "",
    serviceDuration: "30",
    servicePrice: "",
    tablesCount: "5",
    tableCapacity: "4",
    menuItemName: "",
    menuItemPrice: "",
    menuItemDescription: "",
    menuItemCategory: "Fondos",
  });

  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [segmentsOpen, setSegmentsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "category") {
      if (value === "Restaurante") {
        setFormData((prev) => ({
          ...prev,
          category: value,
          serviceName: "Reserva de Mesa",
          serviceDuration: "120",
          servicePrice: "0",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          category: value,
          serviceName: prev.serviceName === "Reserva de Mesa" ? "" : prev.serviceName,
          servicePrice: prev.servicePrice === "0" ? "" : prev.servicePrice,
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
    if (categoryVal === "Restaurante") {
      setFormData((prev) => ({
        ...prev,
        category: "Restaurante",
        serviceName: "Reserva de Mesa",
        serviceDuration: "120",
        servicePrice: "0",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        category: categoryVal,
        serviceName: prev.serviceName === "Reserva de Mesa" ? "" : prev.serviceName,
        servicePrice: prev.servicePrice === "0" ? "" : prev.servicePrice,
      }));
    }
    scrollToSection("registro");
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
          <img src="/logo.png" alt="AgendaLink Logo" style={{ height: "30px", width: "auto" }} />
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

                <div className={styles.dropdownColumn}>
                  <div className={styles.columnTitle}>Gastronomía</div>
                  <div className={styles.columnItems}>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Restaurante")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2v20M21 2v4a3 3 0 0 1-3 3M8 2v10M12 2v10M4 2v6a4 4 0 0 0 8 0V2" />
                      </svg>
                      <span>Restaurantes</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Restaurante")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 8h1a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-1M2 6h15v8a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6ZM6 2v4M10 2v4" />
                      </svg>
                      <span>Cafeterías</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Restaurante")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16h16M12 5V2M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3Z" />
                      </svg>
                      <span>Pastelerías</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Restaurante")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 12 2 3h20L12 12Zm0 0v10M8 22h8" />
                      </svg>
                      <span>Bares y Pubs</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className={styles.headerLink} onClick={() => handleSegmentClick("Restaurante")}>Restaurantes</button>
          <button className={styles.headerLink} onClick={() => scrollToSection("features")}>Funcionalidades</button>
          <button className={styles.headerLink} onClick={() => scrollToSection("pricing")}>Precios</button>
        </nav>
        <div className={styles.headerActions}>
          <button className={styles.headerLink} onClick={() => scrollToSection("registro")}>Iniciar Sesión</button>
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
              <span>agendalink.com/</span>
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
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0066ff", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", margin: "0 auto 8px auto" }}>AL</div>
              <div style={{ fontSize: "12px", fontWeight: "800", textAlign: "center" }}>Estudio Demo</div>
              <div style={{ fontSize: "9px", color: "gray", textAlign: "center", marginBottom: "14px" }}>Otros</div>
              
              <div style={{ border: "1px solid #0066ff", borderRadius: "8px", padding: "8px", background: "rgba(0, 102, 255, 0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", fontWeight: "bold" }}>Corte Caballo</span>
                <span style={{ fontSize: "10px", fontWeight: "bold", color: "#0066ff" }}>$15.000</span>
              </div>
              <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "8px", padding: "8px", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.6 }}>
                <span style={{ fontSize: "10px" }}>Perfilado Barba</span>
                <span style={{ fontSize: "10px", fontWeight: "bold" }}>$8.000</span>
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
                <span style={{ color: "#0066ff", fontWeight: "bold" }}>Giovanni Repetto</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <span style={{ fontSize: "8px", width: "22px", color: "gray" }}>09:00</span>
                  <div style={{ flex: 1, background: "rgba(52, 199, 89, 0.08)", borderLeft: "2px solid #34c759", padding: "2px 4px", borderRadius: "3px", fontSize: "8px", textAlign: "left" }}>
                    <strong>Juan Pérez</strong> · Corte Caballo (✓ Pago)
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <span style={{ fontSize: "8px", width: "22px", color: "gray" }}>10:00</span>
                  <div style={{ flex: 1, background: "rgba(0, 102, 255, 0.08)", borderLeft: "2px solid #0066ff", padding: "2px 4px", borderRadius: "3px", fontSize: "8px", textAlign: "left" }}>
                    <strong>María Gómez</strong> · Manicure
                  </div>
                </div>
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
        <div className={styles.pricingGrid}>
          {/* Plan Individual */}
          <div className={styles.pricingCard}>
            <h3 className={styles.planName}>Plan Individual</h3>
            <div className={styles.planPrice}>$0<span> / Gratis siempre</span></div>
            <ul className={styles.planFeatures}>
              <li className={styles.planFeatureItem}>✓ 1 Profesional</li>
              <li className={styles.planFeatureItem}>✓ Link de Reservas público</li>
              <li className={styles.planFeatureItem}>✓ Panel de administración básico</li>
              <li className={styles.planFeatureItem}>✓ QR listo para imprimir</li>
            </ul>
            <button onClick={() => handleSelectPlan("1 persona")} className={styles.planBtn}>
              Comenzar Gratis
            </button>
          </div>

          {/* Plan Equipo */}
          <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
            <div className={styles.popularBadge}>Más Popular</div>
            <h3 className={styles.planName}>Plan Equipo</h3>
            <div className={styles.planPrice}>$19.990<span> / mes</span></div>
            <ul className={styles.planFeatures}>
              <li className={styles.planFeatureItem}>✓ 2 a 5 Profesionales</li>
              <li className={styles.planFeatureItem}>✓ Todos los links individuales</li>
              <li className={styles.planFeatureItem}>✓ Asistente Linki Secretary IA</li>
              <li className={styles.planFeatureItem}>✓ Asistente Linki Marketing IA</li>
            </ul>
            <button onClick={() => handleSelectPlan("2-5 personas")} className={`${styles.planBtn} ${styles.planBtnPrimary}`}>
              Elegir Plan
            </button>
          </div>

          {/* Plan Negocio */}
          <div className={styles.pricingCard}>
            <h3 className={styles.planName}>Plan Negocio</h3>
            <div className={styles.planPrice}>$39.990<span> / mes</span></div>
            <ul className={styles.planFeatures}>
              <li className={styles.planFeatureItem}>✓ 6 o más Profesionales</li>
              <li className={styles.planFeatureItem}>✓ Multi-sucursal avanzada</li>
              <li className={styles.planFeatureItem}>✓ Asistente Linki Business IA</li>
              <li className={styles.planFeatureItem}>✓ Reportes estratégicos premium</li>
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
              <form onSubmit={(e) => { e.preventDefault(); if (formData.name && formData.ownerName) nextStep(); }}>
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
                  <label className={styles.label}>Rubro</label>
                  <select name="category" value={formData.category} onChange={handleChange} className={styles.select}>
                    <option value="Peluquería">Peluquería</option>
                    <option value="Salud">Salud y Bienestar</option>
                    <option value="Fitness">Fitness y Deporte</option>
                    <option value="Restaurante">Restaurante</option>
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
                    disabled={!formData.name || !formData.ownerName}
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
                  if (formData.category === "Restaurante") {
                    if (formData.tablesCount && formData.tableCapacity && formData.menuItemName && formData.menuItemPrice) {
                      handleSubmit();
                    }
                  } else {
                    if (formData.serviceName && formData.servicePrice) {
                      handleSubmit();
                    }
                  }
                }}
              >
                {formData.category === "Restaurante" ? (
                  <>
                    <h2 style={{ fontSize: "15px", marginBottom: "20px", textAlign: "center", fontWeight: "700" }}>Configuración de tu Restaurante</h2>
                    
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                      <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                        <label className={styles.label}>Cantidad de Mesas</label>
                        <input
                          type="number"
                          name="tablesCount"
                          value={formData.tablesCount}
                          onChange={handleChange}
                          placeholder="Ej. 5"
                          className={styles.input}
                          min="1"
                          required
                        />
                      </div>
                      <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                        <label className={styles.label}>Capacidad por Mesa</label>
                        <input
                          type="number"
                          name="tableCapacity"
                          value={formData.tableCapacity}
                          onChange={handleChange}
                          placeholder="Ej. 4"
                          className={styles.input}
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <h2 style={{ fontSize: "14px", margin: "24px 0 16px 0", textAlign: "left", fontWeight: "700", borderTop: "1px solid var(--card-border)", paddingTop: "16px" }}>Agrega tu primer plato o bebida</h2>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nombre del Plato</label>
                      <input
                        type="text"
                        name="menuItemName"
                        value={formData.menuItemName}
                        onChange={handleChange}
                        placeholder="Ej. Fettuccine Alfredo"
                        className={styles.input}
                        required
                      />
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                      <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                        <label className={styles.label}>Precio</label>
                        <input
                          type="number"
                          name="menuItemPrice"
                          value={formData.menuItemPrice}
                          onChange={handleChange}
                          placeholder="Ej. 12000"
                          className={styles.input}
                          required
                        />
                      </div>
                      <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                        <label className={styles.label}>Categoría</label>
                        <select
                          name="menuItemCategory"
                          value={formData.menuItemCategory}
                          onChange={handleChange}
                          className={styles.select}
                        >
                          <option value="Entradas">Entradas</option>
                          <option value="Fondos">Platos de Fondo</option>
                          <option value="Postres">Postres</option>
                          <option value="Bebidas">Bebidas</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Descripción (Opcional)</label>
                      <input
                        type="text"
                        name="menuItemDescription"
                        value={formData.menuItemDescription}
                        onChange={handleChange}
                        placeholder="Ej. Pasta fresca con salsa de crema, mantequilla y queso parmesano"
                        className={styles.input}
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}

                <div className={styles.buttonRow}>
                  <button type="button" onClick={prevStep} className={`${styles.btn} ${styles.btnSecondary}`}>
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      (formData.category === "Restaurante"
                        ? !formData.tablesCount || !formData.tableCapacity || !formData.menuItemName || !formData.menuItemPrice
                        : !formData.serviceName || !formData.servicePrice)
                    }
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
      </footer>
    </div>
  );
}
