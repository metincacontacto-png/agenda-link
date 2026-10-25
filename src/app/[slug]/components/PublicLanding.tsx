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
    <div className={styles.landingContainer} style={{ width: "100%", maxWidth: "100%", padding: 0 }}>
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#86868b", fontWeight: 500 }}>
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
              <img
                src={coverUrl}
                alt={business.name}
                className={styles.appleShowcaseImg}
                loading="eager"
              />
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
                    <span style={{ fontSize: "22px" }}>📞</span>
                    <div>
                      <span className={styles.applePillLabel}>WhatsApp / Teléfono</span>
                      <span className={styles.applePillValue}>{phone}</span>
                    </div>
                  </div>
                )}
                {hours && (
                  <div className={styles.appleContactPill}>
                    <span style={{ fontSize: "22px" }}>🕒</span>
                    <div>
                      <span className={styles.applePillLabel}>Horario de Atención</span>
                      <span className={styles.applePillValue}>{hours}</span>
                    </div>
                  </div>
                )}
                {address && (
                  <div className={styles.appleContactPill}>
                    <span style={{ fontSize: "22px" }}>📍</span>
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
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 11 13 15 9" />
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
                  {address && <span>📍 {address}</span>}
                  {address && hours && <span>•</span>}
                  {hours && <span>🕒 {hours}</span>}
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
                  <span>💬</span>
                  <span>Escribir al WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => onStartBooking()}
                className={styles.appleBluePillBtn}
              >
                <span>⚡</span>
                <span>Agendar Cita Online</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating CTA for Mobile Only (hidden on desktop) */}
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
