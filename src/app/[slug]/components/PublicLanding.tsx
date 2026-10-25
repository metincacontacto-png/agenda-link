"use client";

import React from "react";
import type { PublicBusinessDTO } from "@/features/booking/public-business-dto";
import { parseLandingFeatures, parseLandingTestimonials } from "@/features/branding/content";
import { buildDirectWhatsAppUrl } from "@/lib/whatsapp";
import styles from "../page.module.css";

interface PublicLandingProps {
  business: PublicBusinessDTO;
  formatPrice: (price: number, currency: string) => string;
  onStartBooking: (service?: PublicBusinessDTO["services"][number]) => void;
}

export default function PublicLanding({ business, formatPrice, onStartBooking }: PublicLandingProps) {
  const heroTitle = business.landingTitle || `Reserva tu cita en segundos con ${business.name}`;
  const heroSubtitle =
    business.landingSubtitle ||
    "Selecciona tu servicio y profesional favorito para agendar de forma inmediata y sin esperas.";
  const aboutText = business.landingAbout || "";
  const coverUrl = business.landingCoverUrl || "";
  const mobileCoverUrl = business.landingMobileCoverUrl || "";
  const effectiveCover = coverUrl || mobileCoverUrl;
  const phone = business.landingPhone || "";
  const address = business.landingAddress || "";
  const hours = business.landingHours || "";
  const features = parseLandingFeatures(business.landingFeaturesJson);
  const rawTestimonials = parseLandingTestimonials(business.landingTestimonialsJson);
  const testimonials = rawTestimonials.filter(
    (t) => t.text.trim().length > 0 && t.author.trim().length > 0
  );

  const whatsAppInquiryUrl = phone
    ? buildDirectWhatsAppUrl(
        phone,
        `¡Hola ${business.name}! 👋 Tengo una consulta sobre los servicios y disponibilidad de horas.`
      )
    : "";

  return (
    <div className={styles.landingContainer}>
      {/* =========================================================
          00. TOP NAVIGATION BAR (Clean Floating Island)
          ========================================================= */}
      <header className={styles.bentoNav}>
        <div className={styles.bentoNavBrand}>
          {business.logoUrl ? (
            <img src={business.logoUrl} alt={business.name} className={styles.bentoNavLogo} />
          ) : (
            <div className={styles.bentoNavLogoFallback}>
              {business.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.2 }}>
            <span className={styles.bentoNavName}>{business.name}</span>
            {business.category && (
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                {business.category}
              </span>
            )}
          </div>
        </div>

        <nav className={styles.bentoNavLinks} aria-label="Navegación principal">
          <a href="#servicios" className={styles.bentoNavLink}>
            Servicios
          </a>
          <a href="#como-funciona" className={styles.bentoNavLink}>
            Cómo Funciona
          </a>
          {(aboutText || phone || address) && (
            <a href="#contacto" className={styles.bentoNavLink}>
              Contacto
            </a>
          )}
        </nav>

        <button
          type="button"
          className={styles.bentoNavBtn}
          onClick={() => onStartBooking()}
        >
          <span>⚡</span>
          <span>Agendar Cita</span>
        </button>
      </header>

      {/* =========================================================
          01. BENTO HERO SECTION (Results-first Bento Hero)
          ========================================================= */}
      <section className={styles.bentoHeroSection}>
        {/* Top Tag Badge */}
        <div className={styles.bentoTagBadge}>
          <span className={styles.pulseDot} style={{ background: "#22c55e" }}></span>
          <span>Disponible para Reservar Hoy</span>
        </div>

        {/* High-Impact Headline & Subtitle */}
        <h1 className={styles.bentoHeroTitle}>{heroTitle}</h1>
        <p className={styles.bentoHeroSubtitle}>{heroSubtitle}</p>

        {/* Primary CTA Buttons */}
        <div className={styles.bentoHeroCtaWrapper}>
          <button
            type="button"
            className={styles.bentoPrimaryCta}
            onClick={() => onStartBooking()}
          >
            <span>⚡ Agendar Cita Online</span>
            <span style={{ fontSize: "18px" }}>→</span>
          </button>
          <a href="#servicios" className={styles.bentoSecondaryCta}>
            <span>Explorar Servicios</span>
            <span>↓</span>
          </a>
        </div>

        {/* Asymmetric Bento Cards Grid (4 Cards) */}
        <div className={styles.bentoHeroGrid}>
          {/* Bento Card 1: Disponibilidad y Sincronización (Span 4) */}
          <div className={`${styles.bentoCard} ${styles.bentoCardCol4} ${styles.bentoCardPrimary}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "#0066FF",
                  letterSpacing: "0.5px",
                }}
              >
                EN VIVO
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>
                <span className={styles.pulseDot} style={{ background: "#16a34a" }}></span>
                Abierto
              </span>
            </div>

            <div style={{ margin: "20px 0 16px 0" }}>
              <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Disponibilidad Inmediata</div>
              <div style={{ fontSize: "22px", fontWeight: 850, color: "#0f172a", marginTop: "4px" }}>
                Horas Libres Esta Semana
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "auto" }}>
              <span style={{ background: "white", border: "1px solid rgba(0,102,255,0.12)", padding: "5px 10px", borderRadius: "8px", fontSize: "11.5px", fontWeight: 700, color: "#0f172a" }}>
                📲 WhatsApp
              </span>
              <span style={{ background: "white", border: "1px solid rgba(0,102,255,0.12)", padding: "5px 10px", borderRadius: "8px", fontSize: "11.5px", fontWeight: 700, color: "#0f172a" }}>
                📅 Google Calendar
              </span>
              <span style={{ background: "white", border: "1px solid rgba(0,102,255,0.12)", padding: "5px 10px", borderRadius: "8px", fontSize: "11.5px", fontWeight: 700, color: "#0f172a" }}>
                ⏰ Recordatorios
              </span>
            </div>
          </div>

          {/* Bento Card 2: Cover Visual Showcase or Dark Executive Card (Span 8) */}
          {effectiveCover ? (
            <div
              className={`${styles.bentoCoverCard} ${styles.bentoCardCol8}`}
              style={{ backgroundImage: `url(${effectiveCover})` }}
            >
              <div className={styles.bentoCoverOverlay}></div>
              <div className={styles.bentoCoverContent}>
                <div className={styles.bentoCoverTag}>
                  <span>★ 5.0</span>
                  <span>Servicio Profesional Verificado</span>
                </div>
                <h3 className={styles.bentoCoverTitle}>{business.name}</h3>
                <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.9)", margin: 0, maxWidth: "480px" }}>
                  Atención exclusiva y personalizada. Reserva tu cita online en cualquier momento.
                </p>
              </div>
            </div>
          ) : (
            <div className={`${styles.bentoCard} ${styles.bentoCardCol8} ${styles.bentoCardDark}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#38bdf8", letterSpacing: "0.5px" }}>
                  TECNOLOGÍA AGENDA LINK
                </span>
                <span style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                  0 min de Espera
                </span>
              </div>

              <div style={{ margin: "24px 0 16px 0" }}>
                <h3 style={{ fontSize: "24px", fontWeight: 850, color: "white", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
                  Agendamiento inteligente, simple y sin fricción
                </h3>
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                  Olvídate de coordinar por mensajes eternos. Selecciona el servicio, elige la hora y asegura tu atención en menos de 1 minuto.
                </p>
              </div>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "12.5px", color: "#cbd5e1", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Reserva 100% online 24/7
                </span>
                <span style={{ fontSize: "12.5px", color: "#cbd5e1", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Confirmación inmediata
                </span>
                <span style={{ fontSize: "12.5px", color: "#cbd5e1", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Aviso a WhatsApp
                </span>
              </div>
            </div>
          )}

          {/* Bento Card 3: 99% Speed & Instant Confirmation (Span 8) */}
          <div className={`${styles.bentoCard} ${styles.bentoCardCol8} ${styles.bentoCardAccentGreen}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#16a34a", letterSpacing: "0.5px" }}>
                AUTOMATIZACIÓN DIRECTA
              </span>
              <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                ⚡ Sin intermediarios
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", margin: "16px 0 8px 0" }}>
              <span style={{ fontSize: "clamp(36px, 5vw, 48px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1 }}>
                99%
              </span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#15803d" }}>
                de citas confirmadas en segundos
              </span>
            </div>

            <p style={{ fontSize: "13.5px", color: "#475569", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Tu hora queda bloqueada automáticamente en la agenda del negocio. Sin llamadas de espera ni confirmaciones manuales.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "auto" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#0066FF", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, border: "2px solid white" }}>✓</span>
                <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#22c55e", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, border: "2px solid white", marginLeft: "-8px" }}>💬</span>
                <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#0f172a", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, border: "2px solid white", marginLeft: "-8px" }}>📅</span>
              </div>
              <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 600 }}>
                Confirmación enviada directo a tu teléfono
              </span>
            </div>
          </div>

          {/* Bento Card 4: Social Proof & Trust Card (Span 4) */}
          <div className={`${styles.bentoCard} ${styles.bentoCardCol4}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                CONFIANZA TOTAL
              </span>
              <span style={{ color: "#eab308", fontSize: "14px", fontWeight: 800 }}>
                ★★★★★
              </span>
            </div>

            <div style={{ margin: "20px 0 12px 0" }}>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1 }}>
                +300
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginTop: "6px" }}>
                Citas gestionadas con éxito
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>
              &quot;Agendar en 1 minuto y tener el comprobante en WhatsApp me ahorra un montón de tiempo.&quot;
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          02. STATS & FEATURES BAR + FEATURED SERVICES
          ========================================================= */}
      <section className={styles.bentoStatsSection} id="servicios">
        {/* Big Number Proof Bar */}
        <div className={styles.bentoBigStatsBar}>
          <div className={styles.bentoStatItem}>
            <span className={styles.bentoStatNumber}>+300</span>
            <span className={styles.bentoStatLabel}>Citas Gestionadas</span>
          </div>
          <div className={styles.bentoStatItem}>
            <span className={styles.bentoStatNumber} style={{ color: "#0066FF" }}>100%</span>
            <span className={styles.bentoStatLabel}>Reserva Garantizada</span>
          </div>
          <div className={styles.bentoStatItem}>
            <span className={styles.bentoStatNumber} style={{ color: "#16a34a" }}>5.0 ★</span>
            <span className={styles.bentoStatLabel}>Satisfacción de Clientes</span>
          </div>
          <div className={styles.bentoStatItem}>
            <span className={styles.bentoStatNumber}>24/7</span>
            <span className={styles.bentoStatLabel}>Disponibilidad Online</span>
          </div>
        </div>

        {/* Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div className={styles.bentoSectionHeader} style={{ marginBottom: 0 }}>
            <span className={styles.bentoSectionTag}>SERVICIOS Y TARIFAS</span>
            <h2 className={styles.bentoSectionHeading}>Catálogo de Servicios</h2>
            <p className={styles.bentoSectionSubheading}>
              Tarifas claras, duración exacta y disponibilidad en vivo sin llamadas previas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onStartBooking()}
            className={styles.bentoPrimaryCta}
            style={{ padding: "10px 22px", fontSize: "13.5px" }}
          >
            ⚡ Agendar Cita
          </button>
        </div>

        {/* Modular Grid of Services */}
        <div className={styles.servicesGridModular}>
          {business.services && business.services.length > 0 ? (
            business.services.map((service) => (
              <div
                key={service.id}
                className={styles.landingServiceCardGlass}
                onClick={() => onStartBooking(service)}
                style={{ cursor: "pointer" }}
              >
                <div style={{ display: "flex", gap: "16px", alignItems: "center", minWidth: 0, flex: 1 }}>
                  {service.imageUrl ? (
                    <img src={service.imageUrl} alt={service.name} className={styles.serviceCardImg} />
                  ) : (
                    <div className={styles.serviceCardIconFallback}>⚡</div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start", textAlign: "left", minWidth: 0 }}>
                    <span className={styles.serviceCardTitle}>{service.name}</span>
                    <span className={styles.serviceCardDuration}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {service.duration} min
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0, marginLeft: "12px" }}>
                  <span className={styles.serviceCardPrice}>
                    {formatPrice(service.price, business.currency)}
                  </span>
                  <span className={styles.reservePillBtn}>
                    Reservar →
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "16px 0" }}>
              No hay servicios configurados actualmente.
            </p>
          )}
        </div>
      </section>

      {/* =========================================================
          03. GET STARTED IN 3 SIMPLE STEPS
          ========================================================= */}
      <section className={styles.bentoStepsSection} id="como-funciona">
        <div className={styles.bentoSectionHeader} style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 36px auto" }}>
          <span className={styles.bentoSectionTag}>EXPERIENCIA SIMPLE</span>
          <h2 className={styles.bentoSectionHeading}>Agenda tu atención en 3 simples pasos</h2>
          <p className={styles.bentoSectionSubheading}>
            Diseñado para que reserves en segundos desde cualquier dispositivo, sin esperas ni llamadas telefónicas.
          </p>
        </div>

        <div className={styles.bentoStepsGrid}>
          {/* Step 1 */}
          <div className={styles.bentoStepCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className={styles.bentoStepBadge}>01</span>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Paso 1</span>
            </div>

            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                Elige tu Servicio
              </h3>
              <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Explora el catálogo con precios transparentes y la duración estimada de cada atención.
              </p>
            </div>

            <div className={styles.bentoStepMockup}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>✂️ Atención Profesional</span>
                <span style={{ color: "#16a34a", fontWeight: 800 }}>✓ Seleccionado</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className={styles.bentoStepCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className={styles.bentoStepBadge} style={{ background: "#0066FF" }}>02</span>
              <span style={{ fontSize: "12px", color: "#0066FF", fontWeight: 700 }}>Paso 2</span>
            </div>

            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                Selecciona Fecha y Hora
              </h3>
              <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Elige a tu profesional favorito y visualiza los cupos disponibles en vivo en el calendario.
              </p>
            </div>

            <div className={styles.bentoStepMockup}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ background: "#0066FF", color: "white", padding: "5px 10px", borderRadius: "6px", fontWeight: 700, fontSize: "11px" }}>
                  10:30 hrs
                </span>
                <span style={{ background: "white", border: "1px solid #cbd5e1", color: "#334155", padding: "5px 10px", borderRadius: "6px", fontWeight: 600, fontSize: "11px" }}>
                  11:45 hrs
                </span>
                <span style={{ background: "white", border: "1px solid #cbd5e1", color: "#334155", padding: "5px 10px", borderRadius: "6px", fontWeight: 600, fontSize: "11px" }}>
                  16:00 hrs
                </span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className={styles.bentoStepCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className={styles.bentoStepBadge} style={{ background: "#16a34a" }}>03</span>
              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>Paso 3</span>
            </div>

            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                Confirmación en WhatsApp
              </h3>
              <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                ¡Listo! Tu hora queda agendada y recibes un comprobante con recordatorio directo a tu WhatsApp.
              </p>
            </div>

            <div className={styles.bentoStepMockup}>
              <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 12px", borderRadius: "8px", fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>💬</span>
                <span>¡Cita confirmada exitosamente!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          04. ABOUT, TESTIMONIALS & DARK EXECUTIVE BOTTOM BANNER
          ========================================================= */}
      {/* Testimonials (if present) */}
      {testimonials.length > 0 && (
        <section className={styles.landingSectionGlass} style={{ marginBottom: "32px" }}>
          <div className={styles.bentoSectionHeader} style={{ marginBottom: "16px" }}>
            <span className={styles.bentoSectionTag}>OPINIONES</span>
            <h2 className={styles.bentoSectionHeading}>Lo que dicen nuestros clientes</h2>
          </div>
          <div className={styles.testimonialsGridModular}>
            {testimonials.map((test, index) => (
              <div key={index} className={styles.testimonialCardGlass}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 750, fontSize: "14px", color: "#0f172a" }}>{test.author}</span>
                  <span style={{ color: "#eab308", fontSize: "13px" }}>{"★".repeat(test.rating || 5)}</span>
                </div>
                <p className={styles.testimonialText}>&quot;{test.text}&quot;</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About & Location (if present) */}
      {aboutText && (
        <section className={styles.landingSectionGlass} style={{ marginBottom: "32px" }} id="contacto">
          <div className={styles.bentoSectionHeader} style={{ marginBottom: "12px" }}>
            <span className={styles.bentoSectionTag}>CONÓCENOS</span>
            <h2 className={styles.bentoSectionHeading}>Sobre {business.name}</h2>
          </div>
          <p className={styles.aboutText}>{aboutText}</p>

          <div className={styles.quickContactGridModular}>
            {phone && (
              <div className={styles.contactPillGlass}>
                <span className={styles.contactIcon}>📞</span>
                <div className={styles.contactText}>
                  <span className={styles.contactLabel}>WhatsApp / Teléfono</span>
                  <span className={styles.contactValue}>{phone}</span>
                </div>
              </div>
            )}
            {hours && (
              <div className={styles.contactPillGlass}>
                <span className={styles.contactIcon}>🕒</span>
                <div className={styles.contactText}>
                  <span className={styles.contactLabel}>Horario de Atención</span>
                  <span className={styles.contactValue}>{hours}</span>
                </div>
              </div>
            )}
            {address && (
              <div className={styles.contactPillGlass}>
                <span className={styles.contactIcon}>📍</span>
                <div className={styles.contactText}>
                  <span className={styles.contactLabel}>Dirección</span>
                  <span className={styles.contactValue}>{address}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Checklist (if present) */}
      {features && features.length > 0 && (
        <section className={styles.landingSectionGlass} style={{ marginBottom: "32px" }}>
          <div className={styles.bentoSectionHeader} style={{ marginBottom: "16px" }}>
            <span className={styles.bentoSectionTag}>GARANTÍA Y COMPROMISO</span>
            <h2 className={styles.bentoSectionHeading}>¿Por qué elegirnos?</h2>
          </div>
          <div className={styles.featuresGridModular}>
            {features.map((feat, index) => (
              <div key={index} className={styles.featureCardModular}>
                <div className={styles.featureIconWrapper}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 11 13 15 9" />
                  </svg>
                </div>
                <div>
                  <h4 className={styles.featureTitle}>{feat.title}</h4>
                  <p className={styles.featureDesc}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dark Executive Bottom Banner (Inspired by the Reference Image) */}
      <div className={styles.bentoDarkBanner}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "560px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#38bdf8", letterSpacing: "0.8px" }}>
            ATENCIÓN PERSONALIZADA
          </span>
          <h3 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 850, margin: 0, color: "white", letterSpacing: "-0.02em" }}>
            ¿Tienes alguna duda antes de agendar?
          </h3>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            Estamos aquí para orientarte sobre servicios, presupuestos o requerimientos especiales.
          </p>
          {(address || hours) && (
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "6px", fontSize: "12.5px", color: "#cbd5e1" }}>
              {address && <span>📍 {address}</span>}
              {hours && <span>🕒 {hours}</span>}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {phone && whatsAppInquiryUrl && (
            <a
              href={whatsAppInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bentoDarkBannerBtn}
            >
              <span>💬</span>
              <span>Escribir al WhatsApp</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => onStartBooking()}
            style={{
              background: "#0066FF",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(0, 102, 255, 0.4)",
              transition: "all 0.2s ease",
            }}
          >
            <span>⚡</span>
            <span>Agendar Cita Online</span>
          </button>
        </div>
      </div>

      {/* Floating Call to Action for Mobile */}
      <div className={styles.floatingCTA}>
        <button
          type="button"
          className={styles.ctaBtn}
          onClick={() => onStartBooking()}
        >
          ⚡ Agenda tu Cita Online
        </button>
      </div>
    </div>
  );
}
