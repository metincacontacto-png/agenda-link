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
    email: "",
    password: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  return (
    <div className={styles.landingWrapper}>
      {/* Background Glowing Orbs */}
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />
      <div className={styles.glowOrb3} />

      {/* 1. Cabecera */}
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/logo.png" alt="AgendaLink Logo" style={{ height: "32px", width: "auto" }} />
          <span style={{ fontWeight: "800", fontSize: "22px", color: "#000000", fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", letterSpacing: "-0.04em" }}>agenda link</span>
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
                  <div className={styles.columnTitle}>Servicios Profesionales</div>
                  <div className={styles.columnItems}>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Profesionales")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>Consultores y Asesores</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Profesionales")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                      <span>Abogados y Legal</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Profesionales")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5h20c0-2.31-1-4.24-2.5-5.5" />
                        <path d="M12 2a5 5 0 0 0-5 5c0 4 5 9 5 9s5-5 5-5a5 5 0 0 0-5-5z" />
                      </svg>
                      <span>Psicólogos y Terapeutas</span>
                    </div>
                    <div className={styles.columnItem} onClick={() => handleSegmentClick("Profesionales")}>
                      <svg className={styles.columnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      <span>Clases y Tutorías</span>
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
          <Link href="/login" className={styles.headerLink}>Iniciar Sesión</Link>
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
              Tu negocio, más fácil de agendar.
            </span>
          </h1>
          <p className={styles.heroSubtitle}>
            Comparte un link para que tus clientes consulten servicios, revisen horarios y soliciten una reserva. Los pagos y mensajes automatizados aún no están habilitados.
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

        <div className={styles.heroVisual}>
        {/* Representación visual ilustrativa; no muestra datos reales. */}
        <div className={styles.mockupContainer}>
          {/* Teléfono */}
          <div className={styles.phoneMockup}>
            <div className={styles.phoneScreen}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0066ff", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", margin: "0 auto 8px auto" }}>AL</div>
              <div style={{ fontSize: "12px", fontWeight: "800", textAlign: "center" }}>Página del negocio</div>
              <div style={{ fontSize: "9px", color: "gray", textAlign: "center", marginBottom: "14px" }}>Servicios y disponibilidad</div>
              
              <div style={{ border: "1px solid #0066ff", borderRadius: "8px", padding: "8px", background: "rgba(0, 102, 255, 0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", fontWeight: "bold" }}>Servicio disponible</span>
                <span style={{ fontSize: "10px", fontWeight: "bold", color: "#0066ff" }}>Consultar</span>
              </div>
              <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "8px", padding: "8px", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", opacity: 0.8 }}>
                <span style={{ fontSize: "10px" }}>Otro servicio</span>
                <span style={{ fontSize: "10px", fontWeight: "bold" }}>Consultar</span>
              </div>
              <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "8px", padding: "8px", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.6 }}>
                <span style={{ fontSize: "10px" }}>Horario disponible</span>
                <span style={{ fontSize: "10px", fontWeight: "bold" }}>Consultar</span>
              </div>

              <div style={{ marginTop: "auto", background: "#0066ff", color: "white", padding: "10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", textAlign: "center" }}>
                Solicitar reserva
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
                    <strong>Reserva</strong> · Pendiente
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <span style={{ fontSize: "8px", width: "22px", color: "gray" }}>10:00</span>
                  <div style={{ flex: 1, background: "rgba(0, 102, 255, 0.08)", borderLeft: "2px solid #0066ff", padding: "2px 4px", borderRadius: "3px", fontSize: "8px", textAlign: "left" }}>
                    <strong>Reserva</strong> · Pendiente
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className={styles.mockupCaption}>Representación ilustrativa; no es una captura del sistema.</p>
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
                Comparte una página donde tus clientes pueden revisar servicios y horarios disponibles y enviar una solicitud de reserva.
              </p>
              <div className={styles.diffLabel}>agendalink.cl/tu-marca ➔</div>
            </div>
            <div className={styles.diffVisualLink} style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", width: "100%" }}>
              <div className={styles.visualLinkCard}>
                <span className={styles.visualLinkIcon}>🔗</span>
                <span className={styles.visualLinkLabel}>Tu página y link propios</span>
              </div>
              <p className={styles.featureText}>Al crear tu cuenta puedes descargar un QR vinculado a tu página.</p>
            </div>
          </div>

          {/* Grid de 2 columnas para Rapidez y Facilidad */}
          <div className={styles.diffSubGrid}>
            {/* Banner 2: Rapidez */}
            <div className={`${styles.diffCard} ${styles.diffCardSpeed}`} style={{ justifyContent: "flex-start", gap: "24px" }}>
              <div>
                <span className={styles.diffCardBadge}>⚡️ ULTRA RÁPIDO</span>
                <h3 className={styles.diffCardTitle}>Solicitud de reserva en pocos pasos</h3>
                <p className={styles.diffCardText} style={{ marginBottom: "24px" }}>
                  Tus clientes pueden consultar servicios y horarios desde el link del negocio y enviar sus datos para solicitar una reserva. No necesitan crear una cuenta ni descargar una app.
                </p>
              </div>
            </div>

            {/* Banner 3: Facilidad */}
            <div className={`${styles.diffCard} ${styles.diffCardEasy}`} style={{ justifyContent: "flex-start", gap: "24px" }}>
              <div>
                <span className={styles.diffCardBadge}>✨ GESTIÓN CENTRALIZADA</span>
                <h3 className={styles.diffCardTitle}>Gestiona tus solicitudes desde un panel</h3>
                <p className={styles.diffCardText} style={{ marginBottom: "24px" }}>
                  Consulta y actualiza reservas, servicios, horarios y datos públicos del negocio. Los pagos y los ingresos no se procesan desde la plataforma.
                </p>
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
            <h3 className={styles.featureTitle}>Solicitudes de reserva</h3>
            <p className={styles.featureText}>
              Tus clientes revisan servicios y horarios disponibles y envían sus datos para solicitar una reserva. La plataforma no procesa pagos.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <svg className={styles.flatBlueIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Mensajería automática</h3>
            <p className={styles.featureText}>
              Los recordatorios y campañas no están habilitados hasta conectar un proveedor de mensajería.
            </p>
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
            <h3 className={styles.featureTitle}>Código QR para tu página</h3>
            <p className={styles.featureText}>
              Descarga un código QR que dirige a la página pública de tu negocio. Impresión de carteles y tarjetas no está incluida.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Planes de Precios */}
      <section id="pricing" className={styles.pricingSection}>
        <h2 className={styles.sectionHeading}>Planes adaptados a tu etapa de crecimiento</h2>
        <p style={{ maxWidth: 680, margin: "-16px auto 24px", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
          Precios mensuales referenciales. El plan inicial depende del tamaño del equipo; el registro no realiza cargos y la facturación recurrente aún no está habilitada.
        </p>

        <div className={styles.pricingGrid}>
          {/* Plan Individual */}
          <div className={styles.pricingCard}>
            <h3 className={styles.planName}>Plan Individual</h3>
            <div className={styles.planPrice}>$9.900<span> / mes</span></div>
            <ul className={styles.planFeatures}>
              <li className={styles.planFeatureItem}>✓ Registro de un profesional</li>
              <li className={styles.planFeatureItem}>✓ Link público para consultar y solicitar reservas</li>
              <li className={styles.planFeatureItem}>✓ Catálogo de servicios y disponibilidad</li>
              <li className={styles.planFeatureItem}>✓ Panel para consultar y gestionar citas</li>
              <li className={styles.planFeatureItem}>✓ Código QR descargable</li>
            </ul>
            <button onClick={() => handleSelectPlan("1 persona")} className={styles.planBtn}>
              Elegir Plan
            </button>
          </div>

          {/* Plan Equipo */}
          <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
            <div className={styles.popularBadge}>Más Popular</div>
            <h3 className={styles.planName}>Plan Equipo</h3>
            <div className={styles.planPrice}>$19.990<span> / mes</span></div>
            <ul className={styles.planFeatures}>
              <li className={styles.planFeatureItem}>✓ Tamaño de equipo configurable en el registro</li>
              <li className={styles.planFeatureItem}>✓ Link público y catálogo de servicios</li>
              <li className={styles.planFeatureItem}>✓ Panel de citas y clientes</li>
              <li className={styles.planFeatureItem}>— Pagos, membresías y mensajería: no habilitados</li>
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
              <li className={styles.planFeatureItem}>✓ Tamaño de equipo configurable en el registro</li>
              <li className={styles.planFeatureItem}>✓ Link público y catálogo de servicios</li>
              <li className={styles.planFeatureItem}>✓ Panel de citas y clientes</li>
              <li className={styles.planFeatureItem}>— Pagos, dominios personalizados y automatización: no habilitados</li>
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

            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); if (!loading && formData.name && formData.ownerName && formData.email && formData.password) handleSubmit(); }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre de tu Negocio</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={
                      formData.category === "Profesionales"
                        ? "Ej. Consultoría Inmobiliaria o Estudio Jurídico"
                        : formData.category === "Salud"
                        ? "Ej. Centro Médico Alameda"
                        : formData.category === "Fitness"
                        ? "Ej. Gimnasio UpFit"
                        : "Ej. Peluquería Bella Vista"
                    }
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
                  <label className={styles.label}>Contraseña para tu cuenta</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Al menos 12 caracteres"
                    className={styles.input}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Rubro</label>
                  <select name="category" value={formData.category} onChange={handleChange} className={styles.select}>
                    <option value="Peluquería">Peluquería</option>
                    <option value="Salud">Salud y Bienestar</option>
                    <option value="Fitness">Fitness y Deporte</option>
                    <option value="Profesionales">Servicios Profesionales</option>
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
                    disabled={loading || !formData.name || !formData.ownerName || !formData.email || formData.password.length < 12}
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
                  Ya puedes compartir este link para que tus clientes consulten servicios y soliciten reservas. Los pagos en línea aún no están habilitados.
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

    </div>
  );
}
