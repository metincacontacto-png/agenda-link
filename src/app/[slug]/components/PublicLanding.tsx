"use client";

import React from "react";
import type { PublicBusinessDTO } from "@/features/booking/public-business-dto";
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
  const coverUrl = business.landingCoverUrl || business.landingMobileCoverUrl || "";
  const phone = business.landingPhone || "";
  const address = business.landingAddress || "";
  const hours = business.landingHours || "";

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

          {/* CINEMATIC SHOWCASE BANNER (Hardware/Keynote Style) */}
          <div className={styles.appleShowcaseBanner}>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={business.name}
                className={styles.appleShowcaseImg}
                loading="eager"
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0071e3 0%, #1e1e24 100%)" }} />
            )}

            <div className={styles.appleShowcaseOverlay}>
              <div className={styles.appleShowcaseBadge}>
                {address && <span>📍 {address}</span>}
                {address && <span>•</span>}
                <span style={{ color: "#fcd34d", fontWeight: 700 }}>★ 5.0</span>
                <span>Servicio Verificado</span>
              </div>
              <h2 className={styles.appleShowcaseTitle}>{business.name}</h2>
              <p className={styles.appleShowcaseSub}>
                Atención personalizada y exclusiva. Elige tu fecha y hora con disponibilidad en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. FULLSCREEN APPLE SERVICES SECTION (Product Cards Grid)
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
                  <div className={styles.appleServiceCardTop}>
                    <div className={styles.appleServiceCardIcon}>
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className={styles.appleServiceCardImg}
                        />
                      ) : (
                        <span>⚡</span>
                      )}
                    </div>

                    <div className={styles.appleServiceCardDuration}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{service.duration} min</span>
                    </div>

                    <h3 className={styles.appleServiceCardTitle}>{service.name}</h3>
                  </div>

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
          4. MINIMALIST APPLE FOOTER / WHATSAPP SECTION
          ========================================================= */}
      <section className={styles.appleFooterSection}>
        <div className={styles.appleFooterCard}>
          <div style={{ textAlign: "inherit" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#0071e3", letterSpacing: "0.8px", display: "block", marginBottom: "4px" }}>
              Atención Inmediata
            </span>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#1d1d1f", margin: "0 0 4px 0", letterSpacing: "-0.01em" }}>
              ¿Tienes alguna duda o requerimiento especial?
            </h3>
            <p style={{ fontSize: "14px", color: "#86868b", margin: 0 }}>
              Escríbenos directamente a WhatsApp y te atenderemos con gusto.
            </p>
            {(address || hours) && (
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px", fontSize: "12.5px", color: "#86868b" }}>
                {address && <span>📍 {address}</span>}
                {address && hours && <span>•</span>}
                {hours && <span>🕒 {hours}</span>}
              </div>
            )}
          </div>

          {phone && whatsAppInquiryUrl && (
            <a
              href={whatsAppInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.appleWhatsAppBtn}
            >
              <span>💬</span>
              <span>Escribir al WhatsApp</span>
            </a>
          )}
        </div>
      </section>

      {/* Floating CTA for Mobile */}
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
