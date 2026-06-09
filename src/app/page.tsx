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

  return (
    <div className={styles.landingWrapper}>
      {/* 1. Cabecera */}
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className={styles.logo} style={{ marginBottom: 0 }}>AgendaLink</span>
        </div>
        <nav className={styles.headerNav}>
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
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#7f00ff", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", margin: "0 auto 8px auto" }}>AL</div>
              <div style={{ fontSize: "12px", fontWeight: "800", textAlign: "center" }}>Estudio Demo</div>
              <div style={{ fontSize: "9px", color: "gray", textAlign: "center", marginBottom: "14px" }}>Otros</div>
              
              <div style={{ border: "1px solid #7f00ff", borderRadius: "8px", padding: "8px", background: "rgba(127, 0, 255, 0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", fontWeight: "bold" }}>Corte Caballo</span>
                <span style={{ fontSize: "10px", fontWeight: "bold", color: "#7f00ff" }}>$15.000</span>
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
                <span style={{ color: "#7f00ff", fontWeight: "bold" }}>Giovanni Repetto</span>
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
                  <div style={{ flex: 1, background: "rgba(127, 0, 255, 0.08)", borderLeft: "2px solid #7f00ff", padding: "2px 4px", borderRadius: "3px", fontSize: "8px", textAlign: "left" }}>
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
            <div className={styles.featureIcon}>⚡️</div>
            <h3 className={styles.featureTitle}>Reserva en 4 clics</h3>
            <p className={styles.featureText}>
              Sin contraseñas, sin descargar nada, sin recordar cuentas. Tus clientes entran a tu link, eligen el servicio, pagan y confirman de inmediato.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💬</div>
            <h3 className={styles.featureTitle}>Asistentes Linki IA</h3>
            <p className={styles.featureText}>
              Secretary responde en WhatsApp 24/7 para agendar citas; Marketing reactiva clientes inactivos de forma automática y Business te asesora estratégicamente.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🖨️</div>
            <h3 className={styles.featureTitle}>QR e Imprenta listos</h3>
            <p className={styles.featureText}>
              Te generamos un cartel A4 listo para pegar en tu vitrina y tarjetas de presentación con código QR para que tus clientes agenden al instante.
            </p>
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
