"use client";

import type { PublicBusinessDTO } from "@/features/booking/public-business-dto";
import { parseLandingFeatures, parseLandingTestimonials } from "@/features/branding/content";
import styles from "../page.module.css";

interface PublicLandingProps {
  business: PublicBusinessDTO;
  formatPrice: (price: number, currency: string) => string;
  onStartBooking: () => void;
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
  const testimonials = parseLandingTestimonials(business.landingTestimonialsJson);

  return (
    <div className={styles.landingContainer}>
      <div
        className={styles.landingHero}
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : "none",
          background: coverUrl ? "none" : "var(--brand-gradient)",
        }}
      >
        <div className={styles.landingHeroOverlay}>
          <div className={styles.landingLogo}>
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              business.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <h1 className={styles.landingHeroTitle}>{heroTitle}</h1>
          <p className={styles.landingHeroSubtitle}>{heroSubtitle}</p>
          <span className={styles.landingActiveBadge}>
            <span className={styles.pulseDot} /> Disponible para Reservar
          </span>
        </div>
      </div>

      <div className={styles.landingLayoutGrid}>
        <div className={styles.landingLeftColumn}>
          {aboutText && (
            <section className={styles.landingSectionGlass}>
              <h3 className={styles.landingSectionTitle}>Sobre Nosotros</h3>
              <p className={styles.aboutText}>{aboutText}</p>
            </section>
          )}

          <div className={styles.quickContactGrid}>
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
                  <span className={styles.contactLabel}>Horario</span>
                  <span className={styles.contactValue}>{hours}</span>
                </div>
              </div>
            )}
            {address && (
              <div className={styles.contactPillGlass} style={{ gridColumn: "span 2" }}>
                <span className={styles.contactIcon}>📍</span>
                <div className={styles.contactText}>
                  <span className={styles.contactLabel}>Dirección</span>
                  <span className={styles.contactValue}>{address}</span>
                </div>
              </div>
            )}
          </div>

          <section className={styles.landingSectionGlass}>
            <h3 className={styles.landingSectionTitle}>¿Por qué elegirnos?</h3>
            <div className={styles.featuresList}>
              {features.map((feature, index) => {
                let icon = (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                    <circle cx="12" cy="8" r="7" />
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                );
                if (index === 1) {
                  icon = (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 11 11 13 15 9" />
                    </svg>
                  );
                } else if (index === 2) {
                  icon = (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  );
                }

                return (
                  <div key={index} className={styles.featureItem}>
                    <div className={styles.featureIconWrapper}>{icon}</div>
                    <div style={{ textAlign: "left" }}>
                      <h4 className={styles.featureTitle}>{feature.title}</h4>
                      <p className={styles.featureDesc}>{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className={styles.landingRightColumn}>
          <section className={styles.landingSectionGlass}>
            <h3 className={styles.landingSectionTitle}>Nuestros Servicios</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {business.services.length > 0 ? (
                business.services.slice(0, 3).map((service) => (
                  <div key={service.id} className={styles.landingServiceCardGlass}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      {service.imageUrl ? (
                        <img src={service.imageUrl} alt={service.name} style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>✨</div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start", textAlign: "left" }}>
                        <span style={{ fontWeight: "700", fontSize: "14px" }}>{service.name}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{service.duration} min</span>
                      </div>
                    </div>
                    <span style={{ fontWeight: "800", color: "var(--primary)", fontSize: "14px" }}>
                      {formatPrice(service.price, business.currency)}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "16px 0" }}>No hay servicios cargados.</p>
              )}
            </div>
          </section>

          {testimonials.length > 0 && (
            <section className={styles.landingSectionGlass}>
              <h3 className={styles.landingSectionTitle}>Opiniones de Clientes</h3>
              <div className={styles.testimonialsContainer}>
                <div className={styles.testimonialsGridGlass}>
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className={styles.testimonialCardGlass}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontWeight: "700", fontSize: "12px" }}>{testimonial.author}</span>
                        <span style={{ color: "#ffcc00", fontSize: "11px" }}>{"★".repeat(testimonial.rating)}</span>
                      </div>
                      <p className={styles.testimonialText}>&quot;{testimonial.text}&quot;</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      <div className={styles.floatingCTA}>
        <button type="button" className={styles.ctaBtn} onClick={onStartBooking}>
          ⚡ Reservar Cita Online
        </button>
      </div>
    </div>
  );
}
