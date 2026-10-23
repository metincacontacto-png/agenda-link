"use client";

import React from "react";
import type { PublicBusinessDTO } from "@/features/booking/public-business-dto";
import { parseLandingFeatures, parseLandingTestimonials } from "@/features/branding/content";
import styles from "../page.module.css";

interface PublicLandingProps {
  business: PublicBusinessDTO;
  formatPrice: (price: number, currency: string) => string;
  onStartBooking: (service?: PublicBusinessDTO["services"][number]) => void;
}

export default function PublicLanding({ business, formatPrice, onStartBooking }: PublicLandingProps) {
  const heroTitle = business.landingTitle || `Reserva tu cita en segundos con ${business.name}`;
  const heroSubtitle = business.landingSubtitle || "Selecciona tu servicio y profesional favorito para agendar de forma inmediata.";
  const aboutText = business.landingAbout || "";
  const coverUrl = business.landingCoverUrl || "";
  const phone = business.landingPhone || "";
  const address = business.landingAddress || "";
  const hours = business.landingHours || "";
  const features = parseLandingFeatures(business.landingFeaturesJson);
  const rawTestimonials = parseLandingTestimonials(business.landingTestimonialsJson);
  const testimonials = rawTestimonials.filter(
    (t) => t.text.trim().length > 0 && t.author.trim().length > 0
  );

  return (
    <div className={styles.landingContainer}>
      {/* Módulo 1: HERO HEADER (Banner + Info Card debajo) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Banner Image Box */}
        <div 
          className={styles.landingHero} 
          style={coverUrl ? { 
            backgroundImage: `url(${coverUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "240px"
          } : {
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0284c7 100%)",
            height: "180px"
          }}
        />

        {/* Header Info Card below the banner */}
        <div className={styles.landingSectionGlass} style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            {/* Left Side: Titles, Badge & Primary CTA Button */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "850", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                  {heroTitle}
                </h1>
                <span className={styles.landingActiveBadge}>
                  <span className={styles.pulseDot}></span> Disponible para Reservar
                </span>
              </div>
              
              <p style={{ fontSize: "14px", color: "#475569", margin: 0, lineHeight: "1.5" }}>
                {heroSubtitle}
              </p>

              <div style={{ marginTop: "6px" }}>
                <button 
                  type="button" 
                  className={styles.heroPrimaryBtn} 
                  onClick={() => onStartBooking()}
                  style={{ padding: "14px 28px", fontSize: "15.5px" }}
                >
                  ⚡ Reservar Cita Online
                </button>
              </div>
            </div>

            {/* Right Side: Profile / Logo Photo */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: "96px", height: "96px", borderRadius: "50%", padding: "4px", background: "white", boxShadow: "0 8px 24px rgba(0, 102, 255, 0.12)", border: "1px solid rgba(0, 102, 255, 0.1)" }}>
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "28px" }}>
                    {business.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Módulo 2: SERVICIOS DESTACADOS */}
      <section className={styles.landingSectionGlass}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div>
            <h3 className={styles.landingSectionTitle}>Catálogo de Servicios</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "3px" }}>Selecciona tu servicio y agenda tu hora en línea de forma inmediata</p>
          </div>
          <button 
            type="button" 
            onClick={() => onStartBooking()}
            className={styles.heroPrimaryBtn}
            style={{ padding: "9px 20px", fontSize: "13.5px", fontWeight: "750" }}
          >
            Ver Todos
          </button>
        </div>

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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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
            <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: "16px 0" }}>No hay servicios disponibles por el momento.</p>
          )}
        </div>
      </section>

      {/* Módulo 3: SOBRE NOSOTROS Y CONTACTO */}
      {aboutText && (
        <section className={styles.landingSectionGlass}>
          <h3 className={styles.landingSectionTitle}>Sobre Nosotros</h3>
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
                  <span className={styles.contactLabel}>Dirección Física</span>
                  <span className={styles.contactValue}>{address}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Módulo 4: ¿POR QUÉ ELEGIRNOS? */}
      {features && features.length > 0 && (
        <section className={styles.landingSectionGlass}>
          <h3 className={styles.landingSectionTitle}>¿Por qué elegirnos?</h3>
          <div className={styles.featuresGridModular}>
            {features.map((feat, index) => {
              let svgIcon = (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              );
              if (index === 1) {
                svgIcon = (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 11 13 15 9" />
                  </svg>
                );
              } else if (index === 2) {
                svgIcon = (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                );
              }

              return (
                <div key={index} className={styles.featureCardModular}>
                  <div className={styles.featureIconWrapper}>
                    {svgIcon}
                  </div>
                  <div>
                    <h4 className={styles.featureTitle}>{feat.title}</h4>
                    <p className={styles.featureDesc}>{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Módulo 5: TESTIMONIOS DE CLIENTES (solo si hay testimonios válidos con texto) */}
      {testimonials.length > 0 && (
        <section className={styles.landingSectionGlass}>
          <h3 className={styles.landingSectionTitle}>Opiniones de Clientes</h3>
          <div className={styles.testimonialsGridModular}>
            {testimonials.map((test, index) => (
              <div key={index} className={styles.testimonialCardGlass}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "750", fontSize: "14px", color: "#0f172a" }}>{test.author}</span>
                  <span style={{ color: "#ffcc00", fontSize: "13px" }}>{"★".repeat(test.rating || 5)}</span>
                </div>
                <p className={styles.testimonialText}>&quot;{test.text}&quot;</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Módulo 6: BANNER SECUNDARIO / CTA FINAL */}
      {business.landingSecondaryCoverUrl ? (
        <div 
          className={styles.landingSecondaryBanner}
          style={{ backgroundImage: `url(${business.landingSecondaryCoverUrl})`, cursor: "pointer" }}
          onClick={() => onStartBooking()}
        >
          <div className={styles.landingSecondaryBannerOverlay}>
            <span className={styles.landingSecondaryBannerText}>Reserva tu cita hoy en {business.name} ⚡️</span>
          </div>
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #0066FF 0%, #0044B3 100%)", borderRadius: "24px", padding: "32px 24px", textAlign: "center", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", boxShadow: "0 12px 30px rgba(0,102,255,0.25)" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "850" }}>¿Listo para agendar tu atención?</h3>
          <p style={{ fontSize: "14px", opacity: 0.9, maxWidth: "500px" }}>Elige tu servicio y profesional favorito de manera rápida, cómoda e inmediata.</p>
          <button 
            type="button" 
            onClick={() => onStartBooking()}
            style={{ padding: "12px 28px", borderRadius: "99px", background: "white", color: "var(--primary)", border: "none", fontSize: "15px", fontWeight: "850", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.15)", marginTop: "4px" }}
          >
            ⚡ Reservar Cita Online Ahora
          </button>
        </div>
      )}

      {/* Floating Call to Action */}
      <div className={styles.floatingCTA}>
        <button 
          type="button" 
          className={styles.ctaBtn} 
          onClick={() => onStartBooking()}
        >
          ⚡ Reservar Cita Online
        </button>
      </div>
    </div>
  );
}
