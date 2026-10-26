"use client";

import React from "react";
import type { PublicBusinessDTO } from "@/features/booking/public-business-dto";
import { parseLandingFeatures } from "@/features/branding/content";
import { buildDirectWhatsAppUrl } from "@/lib/whatsapp";
import styles from "../page.module.css";

interface PublicLandingProps {
  business: PublicBusinessDTO;
  formatPrice: (price: number, currency: string) => string;
  onStartBooking: (service?: PublicBusinessDTO["services"][number]) => void;
}

export default function PublicLanding({ business, formatPrice, onStartBooking }: PublicLandingProps) {
  const heroTitle = business.landingTitle || business.name;
  const heroSubtitle =
    business.landingSubtitle ||
    "Reserva tu hora en segundos, sin llamadas ni fricción. Elige tu servicio y asegura tu atención de inmediato.";
  const aboutText = business.landingAbout || "";
  const coverUrl = business.landingCoverUrl || business.landingMobileCoverUrl || "";
  const phone = business.landingPhone || "";
  const address = business.landingAddress || "";
  const hours = business.landingHours || "";
  const features = parseLandingFeatures(business.landingFeaturesJson);

  const whatsAppInquiryUrl = phone
    ? buildDirectWhatsAppUrl(
        phone,
        `¡Hola ${business.name}! 👋 Tengo una consulta sobre sus servicios y disponibilidad de horas.`
      )
    : "";

  return (
    <div className={styles.appleLandingWrapper}>
      {/* =========================================================
          1. APPLE BLUR FLOATING NAVIGATION BAR
          ========================================================= */}
      <header className={styles.appleNav}>
        <div className={styles.appleNavInner}>
          <div className={styles.appleNavBrand}>
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className={styles.appleNavLogo}
              />
            ) : (
              <div className={styles.appleNavLogoFallback}>
                {business.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <span className={styles.appleNavTitle}>{business.name}</span>
              {business.category && (
                <span className={styles.appleNavCategory}>{business.category}</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span className={styles.appleNavStatus} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#86868b", fontWeight: 500 }}>
              <span className={styles.pulseDot} style={{ background: "#34c759" }}></span>
              <span>Disponible hoy</span>
            </span>
            <button
              type="button"
              className={styles.appleNavBtn}
              onClick={() => onStartBooking()}
            >
              Agendar Cita
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          2. FULLSCREEN APPLE HERO SECTION
          ========================================================= */}
      <section className={styles.appleHeroSection}>
        <div className={styles.appleHeroContainer}>
          {/* Pill Badge */}
          <div className={styles.appleHeroBadge}>
            <span>✨</span>
            <span>Agendamiento Online 24/7</span>
          </div>

          {/* Big Confident Headline */}
          <h1 className={styles.appleHeroTitle}>{heroTitle}</h1>

          {/* Subtitle */}
          <p className={styles.appleHeroSubtitle}>{heroSubtitle}</p>

          {/* Location & Rating Meta Row */}
          {(address || business.category) && (
            <div className={styles.appleHeroMetaRow}>
              {address && <span>📍 {address}</span>}
              {address && <span>•</span>}
              <span style={{ color: "#eab308", fontWeight: 700 }}>★ 5.0</span>
              <span style={{ color: "#86868b" }}>Servicio Verificado</span>
            </div>
          )}

          {/* Apple Action CTAs */}
          <div className={styles.appleHeroCtas}>
            <button
              type="button"
              className={styles.applePrimaryBtn}
              onClick={() => onStartBooking()}
            >
              <span>⚡ Agendar Cita Online</span>
              <span style={{ fontSize: "18px" }}>→</span>
            </button>
            <a href="#servicios" className={styles.appleSecondaryBtn}>
              <span>Ver Servicios</span>
              <span style={{ fontSize: "14px" }}>↓</span>
            </a>
          </div>

          {/* Micro Trust Row */}
          <div className={styles.appleMicroTrust}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#16a34a", fontWeight: 600 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Confirmación Inmediata
            </span>
            <span>•</span>
            <span>Sin esperas ni llamadas</span>
            <span>•</span>
            <span>Aviso a WhatsApp</span>
          </div>

          {/* CLEAN SHOWCASE BANNER (100% limpio, sin gradientes negras ni letras encima) */}
          {coverUrl && (
            <div className={styles.appleShowcaseBanner}>
              {business.landingMobileCoverUrl && business.landingCoverUrl ? (
                <picture>
                  <source media="(max-width: 640px)" srcSet={business.landingMobileCoverUrl} />
                  <img
                    src={business.landingCoverUrl}
                    alt={business.name}
                    className={styles.appleShowcaseImg}
                    loading="eager"
                  />
                </picture>
              ) : (
                <img
                  src={coverUrl}
                  alt={business.name}
                  className={styles.appleShowcaseImg}
                  loading="eager"
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          3. FULLSCREEN APPLE SERVICES SECTION (Product Cards Grid con Fotos en Grande)
          ========================================================= */}
      <section id="servicios" className={styles.appleServicesSection}>
        <div className={styles.appleServicesContainer}>
          <div className={styles.appleSectionHeader}>
            <div>
              <span className={styles.appleSectionTag}>Catálogo Oficial</span>
              <h2 className={styles.appleSectionTitle}>Servicios Disponibles</h2>
              <p className={styles.appleSectionSubtitle}>
                Precios transparentes y duración exacta. Selecciona tu servicio para reservar:
              </p>
            </div>

            <button
              type="button"
              onClick={() => onStartBooking()}
              className={styles.applePrimaryBtn}
              style={{ padding: "10px 24px", fontSize: "14px" }}
            >
              ⚡ Agendar Ahora
            </button>
          </div>

          {/* Responsive Grid of Apple Cards */}
          <div className={styles.appleServicesGrid}>
            {business.services && business.services.length > 0 ? (
              business.services.map((service) => (
                <div
                  key={service.id}
                  className={styles.appleServiceCard}
                  onClick={() => onStartBooking(service)}
                >
                  {/* Large Photo on Top */}
                  <div className={styles.appleServiceImageWrapper}>
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className={styles.appleServiceLargeImg}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.appleServiceFallbackBanner}>
                        <span style={{ fontSize: "36px" }}>⚡</span>
                      </div>
                    )}

                    <div className={styles.appleServiceDurationBadge}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{service.duration} min</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className={styles.appleServiceBody}>
                    <h3 className={styles.appleServiceCardTitle}>{service.name}</h3>

                    <div className={styles.appleServiceCardBottom}>
                      <div>
                        <span style={{ fontSize: "11px", color: "#86868b", fontWeight: 600, display: "block" }}>
                          Inversión
                        </span>
                        <span className={styles.appleServiceCardPrice}>
                          {formatPrice(service.price, business.currency)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={styles.appleServiceCardBtn}
                      >
                        <span>Reservar</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: "14px", color: "#86868b", margin: "24px 0" }}>
                No hay servicios configurados actualmente.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          4. CONÓCENOS (Sobre el negocio)
          ========================================================= */}
      {aboutText && (
        <section className={styles.appleInfoSection}>
          <div className={styles.appleInfoContainer}>
            <div className={styles.appleCardWhite}>
              <span className={styles.appleSectionTag} style={{ color: "#0071e3" }}>CONÓCENOS</span>
              <h2 className={styles.appleSectionTitle} style={{ fontSize: "28px", marginBottom: "16px" }}>
                Sobre {business.name}
              </h2>
              <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.7", margin: "0 0 24px 0" }}>
                {aboutText}
              </p>

              <div className={styles.appleContactPillsGrid}>
                {phone && (
                  <div className={styles.appleContactPill}>
                    <div className={styles.applePillIconWrapper}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </div>
                    <div>
                      <span className={styles.applePillLabel}>WhatsApp / Teléfono</span>
                      <span className={styles.applePillValue}>{phone}</span>
                    </div>
                  </div>
                )}
                {hours && (
                  <div className={styles.appleContactPill}>
                    <div className={styles.applePillIconWrapper}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <span className={styles.applePillLabel}>Horario de Atención</span>
                      <span className={styles.applePillValue}>{hours}</span>
                    </div>
                  </div>
                )}
                {address && (
                  <div className={styles.appleContactPill}>
                    <div className={styles.applePillIconWrapper}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <span className={styles.applePillLabel}>Dirección</span>
                      <span className={styles.applePillValue}>{address}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          5. GARANTÍA Y COMPROMISO (¿Por qué elegirnos?)
          ========================================================= */}
      {features && features.length > 0 && (
        <section className={styles.appleInfoSection}>
          <div className={styles.appleInfoContainer}>
            <div className={styles.appleCardWhite}>
              <span className={styles.appleSectionTag} style={{ color: "#0071e3" }}>GARANTÍA Y COMPROMISO</span>
              <h2 className={styles.appleSectionTitle} style={{ fontSize: "28px", marginBottom: "20px" }}>
                ¿Por qué elegirnos?
              </h2>

              <div className={styles.appleFeaturesGrid}>
                {features.map((feat, index) => (
                  <div key={index} className={styles.appleFeatureCard}>
                    <div className={styles.appleFeatureIcon}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                    </div>
                    <h3 className={styles.appleFeatureTitle}>{feat.title}</h3>
                    <p className={styles.appleFeatureDesc}>{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          6. BANNER EJECUTIVO INFERIOR (ATENCIÓN PERSONALIZADA)
          ========================================================= */}
      <section className={styles.appleInfoSection} style={{ paddingBottom: "60px" }}>
        <div className={styles.appleInfoContainer}>
          <div className={styles.appleDarkBanner}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "580px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#38bdf8", letterSpacing: "0.8px" }}>
                ATENCIÓN PERSONALIZADA
              </span>
              <h3 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 850, margin: 0, color: "white", letterSpacing: "-0.02em" }}>
                ¿Tienes alguna duda antes de agendar?
              </h3>
              <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Estamos aquí para orientarte sobre servicios, presupuestos o requerimientos especiales.
              </p>
              {(address || hours) && (
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px", fontSize: "12.5px", color: "#cbd5e1" }}>
                  {address && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {address}
                    </span>
                  )}
                  {address && hours && <span>•</span>}
                  {hours && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {hours}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.appleDarkBannerBtns}>
              {phone && whatsAppInquiryUrl && (
                <a
                  href={whatsAppInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.appleGreenBtn}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  <span>Escribir al WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => onStartBooking()}
                className={styles.appleBluePillBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span>Agendar Cita Online</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
