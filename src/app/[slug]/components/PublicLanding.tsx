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
    "Reserva tu hora en segundos sin llamadas ni demoras. Selecciona tu servicio y asegura tu atención de inmediato.";
  const coverUrl = business.landingCoverUrl || business.landingMobileCoverUrl || "";
  const phone = business.landingPhone || "";
  const address = business.landingAddress || "";
  const hours = business.landingHours || "";

  const whatsAppInquiryUrl = phone
    ? buildDirectWhatsAppUrl(
        phone,
        `¡Hola ${business.name}! 👋 Tengo una consulta sobre los servicios y disponibilidad de horas.`
      )
    : "";

  return (
    <div className={styles.landingContainer}>
      <div className={styles.classicCardContainer}>
        {/* 1. PORTADA HERO LIMPIA */}
        <div className={styles.classicCoverBanner}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={business.name}
              className={styles.classicCoverImg}
              loading="eager"
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0066FF 0%, #3b82f6 50%, #0284c7 100%)" }} />
          )}

          <div className={styles.classicCoverBadge}>
            <span className={styles.pulseDot} style={{ background: "#16a34a" }}></span>
            <span>Atención Hoy</span>
          </div>
        </div>

        {/* 2. CABECERA DEL NEGOCIO & BOTÓN PRINCIPAL DE AGENDAR */}
        <div className={styles.classicHeaderSection}>
          <div className={styles.classicAvatarWrapper}>
            <div className={styles.classicAvatar}>
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className={styles.classicAvatarImg}
                />
              ) : (
                <div className={styles.classicAvatarFallback}>
                  {business.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
              {address && <span>📍 {address.split(",")[0]}</span>}
              <span style={{ color: "#eab308", fontWeight: 800 }}>★ 5.0</span>
            </div>
          </div>

          {business.category && (
            <span className={styles.classicMetaBadge}>{business.category}</span>
          )}

          <h1 className={styles.classicBusinessName}>{heroTitle}</h1>
          <p className={styles.classicSubtitle}>{heroSubtitle}</p>

          {/* BOTÓN GIGANTE DE ALTA CONVERSIÓN (El centro de atención) */}
          <div className={styles.classicHeroCtaBox}>
            <button
              type="button"
              className={styles.classicPrimaryBtn}
              onClick={() => onStartBooking()}
            >
              <span>⚡</span>
              <span>Agendar Cita Online Ahora</span>
              <span style={{ fontSize: "18px" }}>→</span>
            </button>

            <div className={styles.classicHeroTrust}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#16a34a", fontWeight: 700 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Confirmación Inmediata
              </span>
              <span>•</span>
              <span>Sin esperas</span>
              <span>•</span>
              <span>Aviso a WhatsApp</span>
            </div>
          </div>
        </div>

        {/* 3. CATÁLOGO DE SERVICIOS DIRECTO */}
        <div className={styles.classicServicesSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
            <h2 className={styles.classicSectionTitle}>Servicios Disponibles</h2>
            {business.services && business.services.length > 0 && (
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#0066FF", background: "#eff6ff", padding: "2px 8px", borderRadius: "999px" }}>
                {business.services.length} {business.services.length === 1 ? "servicio" : "servicios"}
              </span>
            )}
          </div>
          <p className={styles.classicSectionSub}>Selecciona el servicio que deseas agendar:</p>

          <div className={styles.classicServicesList}>
            {business.services && business.services.length > 0 ? (
              business.services.map((service) => (
                <div
                  key={service.id}
                  className={styles.classicServiceCard}
                  onClick={() => onStartBooking(service)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                    <div className={styles.classicServiceIcon}>
                      {service.imageUrl ? (
                        <img src={service.imageUrl} alt={service.name} className={styles.classicServiceImg} />
                      ) : (
                        <span>⚡</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0, textAlign: "left" }}>
                      <h3 className={styles.classicServiceTitle}>{service.name}</h3>
                      <span className={styles.classicServiceDuration}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {service.duration} min
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                    <span className={styles.classicServicePrice}>
                      {formatPrice(service.price, business.currency)}
                    </span>
                    <span className={styles.classicReservePill}>
                      Reservar →
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: "16px 0" }}>
                No hay servicios configurados por el momento.
              </p>
            )}
          </div>
        </div>

        {/* 4. INFORMACIÓN DEL LOCAL & HORARIOS (Si existen) */}
        {(address || hours) && (
          <div className={styles.classicInfoStrip}>
            {address && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>📍</span>
                <div>
                  <span style={{ fontWeight: 700, color: "#0f172a", display: "block" }}>Dirección</span>
                  <span>{address}</span>
                </div>
              </div>
            )}
            {hours && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>🕒</span>
                <div>
                  <span style={{ fontWeight: 700, color: "#0f172a", display: "block" }}>Horario de Atención</span>
                  <span>{hours}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. DUDAS Y CONSULTAS AL WHATSAPP */}
        {phone && whatsAppInquiryUrl && (
          <div className={styles.classicWhatsAppCard}>
            <div style={{ textAlign: "inherit" }}>
              <div style={{ fontSize: "13.5px", fontWeight: 750, color: "#0f172a" }}>
                ¿Tienes alguna duda antes de agendar?
              </div>
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                Escríbenos directamente y te responderemos a la brevedad.
              </div>
            </div>
            <a
              href={whatsAppInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.classicWhatsAppBtn}
            >
              <span>💬</span>
              <span>Escribir al WhatsApp</span>
            </a>
          </div>
        )}
      </div>

      {/* Floating Action Bar para Móviles */}
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
