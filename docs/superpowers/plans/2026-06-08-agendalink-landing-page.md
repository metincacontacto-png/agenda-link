# Landing Page de AgendaLink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear una landing page profesional, minimalista y al estilo Apple para AgendaLink, integrando el flujo de onboarding existente en la misma página y mostrando mockups de las interfaces de cliente y administración sin usar imágenes externas pesadas.

**Architecture:** Modificación de `src/app/page.tsx` para incorporar navegación en el header, sección Hero con entrada de slug interactiva, maquetas visuales construidas en CSS, tarjetas de beneficios y planes de suscripción, integrando de forma fluida el onboarding en una sección inferior `#registro` con scroll suave.

**Tech Stack:** Next.js 16 (App Router), Vanilla CSS Modules, qrcode.

---

### Task 1: Estilos de la Landing Page en page.module.css

**Files:**
- Modify: `src/app/page.module.css`

- [ ] **Step 1: Escribir las clases de estilos para la landing page en page.module.css**

Modificar `src/app/page.module.css` para añadir estilos del header, hero, mockups CSS, tarjetas de beneficios, planes de precios y contenedor de registro:

```css
.landingWrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--card-border);
}

.headerNav {
  display: flex;
  gap: 24px;
}

.headerLink {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
  background: none;
  border: none;
}

.headerLink:hover {
  color: var(--foreground);
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.heroSection {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 40px;
  align-items: center;
  padding: 80px 0;
}

@media (max-width: 768px) {
  .heroSection {
    grid-template-columns: 1fr;
    padding: 40px 0;
    text-align: center;
  }
}

.heroContent {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

@media (max-width: 768px) {
  .heroContent {
    align-items: center;
  }
}

.heroTitle {
  font-size: 48px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -1.5px;
  margin-bottom: 20px;
  color: var(--foreground);
}

.heroSubtitle {
  font-size: 18px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 32px;
}

.heroForm {
  display: flex;
  width: 100%;
  max-width: 460px;
  background: var(--card-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-pill);
  padding: 6px;
  box-shadow: var(--shadow-subtle);
  transition: border-color 0.2s;
}

.heroForm:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(127, 0, 255, 0.15);
}

.heroInputWrapper {
  display: flex;
  align-items: center;
  flex: 1;
  padding-left: 16px;
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 600;
}

.heroInput {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  padding: 10px 4px;
  font-size: 15px;
  color: var(--foreground);
  font-weight: 600;
}

.heroBtn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.heroBtn:hover {
  background: var(--primary-hover);
}

/* Mockups CSS Visuales */
.mockupContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  height: 420px;
}

@media (max-width: 768px) {
  .mockupContainer {
    display: none;
  }
}

.phoneMockup {
  width: 200px;
  height: 380px;
  background: white;
  border: 8px solid #1d1d1f;
  border-radius: 36px;
  box-shadow: var(--shadow-active);
  position: absolute;
  left: 10px;
  z-index: 2;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.phoneScreen {
  flex: 1;
  padding: 14px;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.macMockup {
  width: 340px;
  height: 240px;
  background: white;
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  box-shadow: var(--shadow-subtle);
  position: absolute;
  right: 10px;
  bottom: 20px;
  z-index: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.macHeader {
  height: 24px;
  background: #f5f5f7;
  border-bottom: 1px solid #d2d2d7;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 6px;
}

.macDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.macScreen {
  flex: 1;
  background: #ffffff;
  padding: 8px;
}

/* Features Grid */
.featuresSection {
  padding: 80px 0;
  border-top: 1px solid var(--card-border);
}

.sectionHeading {
  text-align: center;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-bottom: 40px;
  color: var(--foreground);
}

.featuresGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 768px) {
  .featuresGrid {
    grid-template-columns: 1fr;
  }
}

.featureCard {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-card);
  padding: 32px;
  text-align: left;
  box-shadow: var(--shadow-subtle);
  transition: transform 0.2s;
}

.featureCard:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-active);
}

.featureIcon {
  font-size: 28px;
  margin-bottom: 16px;
}

.featureTitle {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--foreground);
}

.featureText {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Pricing Section */
.pricingSection {
  padding: 80px 0;
  border-top: 1px solid var(--card-border);
  text-align: center;
}

.pricingGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 40px;
}

@media (max-width: 768px) {
  .pricingGrid {
    grid-template-columns: 1fr;
  }
}

.pricingCard {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-card);
  padding: 32px;
  display: flex;
  flex-direction: column;
  text-align: left;
  position: relative;
  box-shadow: var(--shadow-subtle);
}

.pricingCardPopular {
  border-color: var(--primary);
}

.popularBadge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--brand-gradient);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
}

.planName {
  font-size: 16px;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 8px;
}

.planPrice {
  font-size: 28px;
  font-weight: 800;
  color: var(--foreground);
  margin-bottom: 20px;
}

.planPrice span {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.planFeatures {
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.planFeatureItem {
  font-size: 13.5px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.planBtn {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--input-border);
  background: transparent;
  color: var(--foreground);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.planBtn:hover {
  border-color: var(--foreground);
  background: rgba(0, 0, 0, 0.02);
}

.planBtnPrimary {
  background: var(--primary);
  color: white;
  border: none;
}

.planBtnPrimary:hover {
  background: var(--primary-hover);
}

/* Container de registro */
.registerSection {
  padding: 80px 0;
  border-top: 1px solid var(--card-border);
}
```

- [ ] **Step 2: Verificar sintaxis del CSS de landing**

Run: `git diff src/app/page.module.css` (para confirmar la inserción de las clases sin conflictos).

---

### Task 2: Implementar la Estructura de Landing Page en page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Escribir el código completo de la Landing Page**

Modificar `src/app/page.tsx` para agregar la cabecera, el hero, los mockups CSS, la grilla de beneficios, la tabla de precios y conectar la lógica para transferir datos al formulario de registro en el scroll suave:

```tsx
"use client";

import React, { useState } from "react";
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
  });

  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
          <img src="/logo.png" alt="AgendaLink" style={{ height: "28px" }} />
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
              <form onSubmit={(e) => { e.preventDefault(); if (formData.serviceName && formData.servicePrice && !loading) handleSubmit(); }}>
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
                    disabled={!formData.serviceName || !formData.servicePrice || loading}
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
```

- [ ] **Step 2: Verificar sintaxis de page.tsx**

Run: `git diff src/app/page.tsx` (para verificar que los imports de React y Link son correctos).

---

### Task 3: Verificación y Compilación del Proyecto

**Files:**
- Test: Compilación estática de Next.js y verificación de tipos

- [ ] **Step 1: Ejecutar compilación de producción**

Run: `npm run build`
Expected: Compilación exitosa sin errores en Turbopack o TypeScript.

- [ ] **Step 2: Realizar Commit**

```bash
git add src/app/page.tsx src/app/page.module.css docs/superpowers/specs/2026-06-08-agendalink-landing-page-design.md
git commit -m "feat: implement fully designed clean apple style landing page with integrated onboarding"
```
Expected: Commit exitoso.
