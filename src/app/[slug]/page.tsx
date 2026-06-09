"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import Calendar from "@/components/Calendar";
import OtpModal from "@/components/OtpModal";
import PaymentModal from "@/components/PaymentModal";

interface Professional {
  id: string;
  name: string;
  avatar: string | null;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  imageUrl?: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl?: string | null;
}

interface Business {
  id: string;
  name: string;
  category: string;
  currency: string;
  services: Service[];
  professionals: Professional[];
  menuItems?: MenuItem[];
  logoUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  landingAbout?: string | null;
  landingCoverUrl?: string | null;
  landingSecondaryCoverUrl?: string | null;
  landingPhone?: string | null;
  landingAddress?: string | null;
  landingHours?: string | null;
  landingFeaturesJson?: string | null;
  landingTestimonialsJson?: string | null;
}

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [business, setBusiness] = useState<Business | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [showOtp, setShowOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"landing" | "booking">("landing");

  // Restaurant specific states
  const [activeTab, setActiveTab] = useState<"reserva" | "carta">("reserva");
  const [peopleCount, setPeopleCount] = useState(2);

  useEffect(() => {
    if (!slug) return;
    
    async function loadData() {
      try {
        const res = await fetch(`/api/availability?slug=${slug}&date=${selectedDate}&people=${peopleCount}`);
        if (!res.ok) {
          setBusiness(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        
        setBusiness(data.business);
        setSlots(data.availableSlots || []);
        const bizProfs = data.business?.professionals || [];
        setProfessionals(bizProfs);
        
        // Auto-seleccionar primer profesional si no hay ninguno seleccionado
        if (bizProfs.length > 0 && !selectedProfessional) {
          setSelectedProfessional(bizProfs[0]);
        }

        // Auto-seleccionar primer servicio si es restaurante
        if (data.business?.category === "Restaurante" && data.business?.services?.length > 0 && !selectedService) {
          setSelectedService(data.business.services[0]);
        }
      } catch (err) {
        console.error(err);
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, selectedDate, peopleCount]);

  const handleBookClick = () => {
    if (business?.category === "Restaurante") {
      if (!selectedDate || !selectedTime) return;
      setShowOtp(true);
    } else {
      if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return;
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = (method: string) => {
    setShowPayment(false);
    setPaymentMethod(method);
    if (selectedService) {
      setPaidAmount(selectedService.price);
    }
    setShowOtp(true);
  };

  const handleOtpSuccess = async (clientName: string, clientWhatsApp: string) => {
    if (!selectedService || !selectedProfessional) return;
    setShowOtp(false);
    setSubmitting(true);
    
    try {
      const isRestaurant = business?.category === "Restaurante";
      const payload = {
        slug,
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        clientName,
        clientWhatsApp,
        date: selectedDate,
        time: selectedTime,
        paymentStatus: isRestaurant ? "PENDING" : "PAID",
        paymentMethod: isRestaurant ? "Reserva Mesa" : paymentMethod,
        paymentAmount: isRestaurant ? 0 : paidAmount,
        peopleCount: isRestaurant ? peopleCount : null,
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success && result.appointment) {
        window.location.href = `/${slug}/success?appId=${result.appointment.id}`;
      } else {
        alert(result.error || "Error al agendar la cita. Por favor intenta de nuevo.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al agendar cita.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "CLP") {
      return `$${price.toLocaleString("es-CL")}`;
    } else if (currency === "MXN") {
      return `$${price.toLocaleString("es-MX")} MXN`;
    }
    return `$${price.toFixed(2)} USD`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--text-secondary)" }}>
        Cargando...
      </div>
    );
  }

  if (!business) {
    return (
      <main className={styles.container}>
        <div className={styles.notFound}>
          <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px" }}>Negocio no encontrado</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            El enlace que ingresaste no corresponde a un negocio registrado.
          </p>
          <Link href="/" className={styles.btn}>Ir al Registro</Link>
        </div>
      </main>
    );
  }

  // Agrupar menú por categoría para restaurantes
  const menuByCategory = business.menuItems?.reduce((acc: Record<string, MenuItem[]>, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {}) || {};

  // Rubro/Categoría
  const isRestaurant = business.category === "Restaurante";

  // Fallbacks
  const heroTitle = business.landingTitle || (isRestaurant ? `Descubre el sabor único de ${business.name}` : `Reserva tu cita en segundos con ${business.name}`);
  const heroSubtitle = business.landingSubtitle || (isRestaurant ? "Reserva tu mesa en línea o explora nuestra carta digital en pocos clics." : "Selecciona tu servicio y profesional favorito para agendar de forma inmediata.");
  const aboutText = business.landingAbout || (isRestaurant ? `En ${business.name} nos apasiona ofrecer platos excepcionales con ingredientes seleccionados y frescos, combinando cocina tradicional con técnicas modernas. Ven a vivir una experiencia gastronómica única.` : `Somos un equipo altamente calificado y dedicado a entregarte la mejor experiencia en ${business.name}. Ven a visitarnos y disfruta de una atención personalizada en nuestro local.`);
  const coverUrl = business.landingCoverUrl || "";
  const phone = business.landingPhone || "+56 9 9999 8888";
  const address = business.landingAddress || "Santiago, Chile";
  const hours = business.landingHours || (isRestaurant ? "Lun a Sáb: 12:30 - 23:00" : "Lun a Sáb: 09:00 - 20:00");

  // Parsear Características
  let features = [];
  try {
    if (business.landingFeaturesJson) {
      features = JSON.parse(business.landingFeaturesJson);
    }
  } catch (e) {
    console.error("Error parsing features", e);
  }
  if (!Array.isArray(features) || features.length === 0) {
    features = isRestaurant ? [
      { icon: "🍴", title: "Chef de Alta Cocina", desc: "Platos preparados por expertos culinarios." },
      { icon: "✨", title: "Ambiente Exclusivo", desc: "Espacios cómodos y de primer nivel." },
      { icon: "🌱", title: "Ingredientes Frescos", desc: "Insumos locales y de temporada." }
    ] : [
      { icon: "✨", title: "Atención Personalizada", desc: "Adaptados a tus necesidades." },
      { icon: "👤", title: "Profesionales Expertos", desc: "Personal certificado y con amplia trayectoria." },
      { icon: "⚡", title: "Confirmación Inmediata", desc: "Tu cupo queda asegurado al instante." }
    ];
  }

  // Parsear Testimonios
  let testimonials = [];
  try {
    if (business.landingTestimonialsJson) {
      testimonials = JSON.parse(business.landingTestimonialsJson);
    }
  } catch (e) {
    console.error("Error parsing testimonials", e);
  }
  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    testimonials = [
      { author: "Camila R.", rating: 5, text: "Excelente servicio, la atención es espectacular." },
      { author: "Diego S.", rating: 5, text: "Muy fácil de agendar online, 100% recomendado." }
    ];
  }

  return (
    <main className={styles.container}>
      {viewMode === "landing" ? (
        <div className={styles.landingContainer}>
          {/* Cover Hero Banner */}
          <div 
            className={styles.landingHero} 
            style={{ 
              backgroundImage: coverUrl ? `url(${coverUrl})` : "none",
              background: coverUrl ? "none" : "var(--brand-gradient)"
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
                <span className={styles.pulseDot}></span> Disponible para Reservar
              </span>
            </div>
          </div>

          {/* Quick Contacts */}
          <div className={styles.quickContactGrid}>
            {phone && (
              <div className={styles.contactPill}>
                <span className={styles.contactIcon}>📞</span>
                <div className={styles.contactText}>
                  <span className={styles.contactLabel}>WhatsApp / Teléfono</span>
                  <span className={styles.contactValue}>{phone}</span>
                </div>
              </div>
            )}
            {hours && (
              <div className={styles.contactPill}>
                <span className={styles.contactIcon}>🕒</span>
                <div className={styles.contactText}>
                  <span className={styles.contactLabel}>Horario</span>
                  <span className={styles.contactValue}>{hours}</span>
                </div>
              </div>
            )}
          </div>
          {address && (
            <div style={{ marginTop: "10px" }}>
              <div className={styles.contactPill} style={{ justifyContent: "center" }}>
                <span className={styles.contactIcon}>📍</span>
                <div className={styles.contactText}>
                  <span className={styles.contactLabel}>Dirección</span>
                  <span className={styles.contactValue}>{address}</span>
                </div>
              </div>
            </div>
          )}

          {/* Sobre Nosotros */}
          <section className={styles.landingSection}>
            <h3 className={styles.landingSectionTitle}>Sobre Nosotros</h3>
            <p className={styles.aboutText}>{aboutText}</p>
          </section>

          {/* Servicios / Carta Destacada */}
          <section className={styles.landingSection}>
            <h3 className={styles.landingSectionTitle}>
              {isRestaurant ? "Nuestra Carta" : "Nuestros Servicios"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {isRestaurant && business.menuItems && business.menuItems.length > 0 ? (
                business.menuItems.slice(0, 3).map((item) => (
                  <div key={item.id} className={styles.landingServiceCard}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>🍔</div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start", textAlign: "left" }}>
                        <span style={{ fontWeight: "700", fontSize: "14px" }}>{item.name}</span>
                        {item.description && <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{item.description}</span>}
                      </div>
                    </div>
                    <span style={{ fontWeight: "800", color: "var(--primary)", fontSize: "14px" }}>
                      {formatPrice(item.price, business.currency)}
                    </span>
                  </div>
                ))
              ) : business.services && business.services.length > 0 ? (
                business.services.slice(0, 3).map((service) => (
                  <div key={service.id} className={styles.landingServiceCard}>
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

          {/* Banner Secundario divisor */}
          <div 
            className={styles.landingSecondaryBanner}
            style={{
              backgroundImage: business.landingSecondaryCoverUrl ? `url(${business.landingSecondaryCoverUrl})` : "none",
              background: business.landingSecondaryCoverUrl ? "none" : "linear-gradient(135deg, #7000ff 0%, #0072ff 100%)"
            }}
          >
            <div className={styles.landingSecondaryBannerOverlay}>
              <span className={styles.landingSecondaryBannerText}>
                Confirmación al instante vía WhatsApp
              </span>
            </div>
          </div>

          {/* Ventajas */}
          <section className={styles.landingSection}>
            <h3 className={styles.landingSectionTitle}>¿Por qué elegirnos?</h3>
            <div className={styles.featuresList}>
              {features.map((feat, index) => {
                // Seleccionar un icono SVG representativo según el índice de la ventaja
                let svgIcon = (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                    <circle cx="12" cy="8" r="7" />
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                );
                if (index === 1) {
                  svgIcon = (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 11 11 13 15 9" />
                    </svg>
                  );
                } else if (index === 2) {
                  svgIcon = (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  );
                }

                return (
                  <div key={index} className={styles.featureItem}>
                    <div className={styles.featureIconWrapper}>
                      {svgIcon}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <h4 className={styles.featureTitle}>{feat.title}</h4>
                      <p className={styles.featureDesc}>{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Testimonios */}
          <section className={styles.landingSection}>
            <h3 className={styles.landingSectionTitle}>Opiniones de Clientes</h3>
            <div className={styles.testimonialsGrid}>
              {testimonials.map((test, index) => (
                <div key={index} className={styles.testimonialCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>{test.author}</span>
                    <span style={{ color: "#ffcc00", fontSize: "11px" }}>{"★".repeat(test.rating || 5)}</span>
                  </div>
                  <p className={styles.testimonialText}>&quot;{test.text}&quot;</p>
                </div>
              ))}
            </div>
          </section>

          {/* Floating Call to Action */}
          <div className={styles.floatingCTA}>
            {isRestaurant ? (
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <button 
                  type="button" 
                  className={styles.ctaBtn} 
                  style={{ flex: 1, background: "rgba(255, 255, 255, 0.95)", color: "#1d1d1f", border: "1px solid rgba(0,0,0,0.1)" }}
                  onClick={() => {
                    setActiveTab("carta");
                    setViewMode("booking");
                  }}
                >
                  📋 Ver Carta Digital
                </button>
                <button 
                  type="button" 
                  className={styles.ctaBtn} 
                  style={{ flex: 1 }}
                  onClick={() => {
                    setActiveTab("reserva");
                    setViewMode("booking");
                  }}
                >
                  🍴 Reservar Mesa
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                className={styles.ctaBtn} 
                onClick={() => setViewMode("booking")}
              >
                ⚡ Reservar Cita Online
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Botón de retroceso a la landing page */}
          <div className={styles.backHeaderBtn}>
            <button
              type="button"
              onClick={() => setViewMode("landing")}
              className={styles.btnSecondary}
              style={{ padding: "8px 16px", fontSize: "13px", fontWeight: "700" }}
            >
              ← Volver a Presentación
            </button>
          </div>

          <div className={styles.profileCard}>
            <div className={styles.avatar}>
              {business.logoUrl ? (
                <img src={business.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                business.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <h1 className={styles.businessName}>{business.name}</h1>
            <p className={styles.category}>{business.category}</p>
          </div>

          {business.category === "Restaurante" && (
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              <button
                type="button"
                className={`${styles.btn} ${activeTab === "reserva" ? styles.btnPrimary : styles.btnSecondary}`}
                onClick={() => setActiveTab("reserva")}
                style={{ flex: 1, padding: "10px 12px", fontSize: "14px" }}
              >
                🍴 Reservar Mesa
              </button>
              <button
                type="button"
                className={`${styles.btn} ${activeTab === "carta" ? styles.btnPrimary : styles.btnSecondary}`}
                onClick={() => setActiveTab("carta")}
                style={{ flex: 1, padding: "10px 12px", fontSize: "14px" }}
              >
                📋 Carta Digital
              </button>
            </div>
          )}

          {activeTab === "reserva" ? (
            <>
              {business.category === "Restaurante" ? (
                <div style={{ marginBottom: "24px" }}>
                  <h2 className={styles.sectionTitle}>1. Selecciona número de comensales</h2>
                  <select
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(parseInt(e.target.value, 10))}
                    className={styles.select}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "persona" : "personas"}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ marginBottom: "24px" }}>
                  <h2 className={styles.sectionTitle}>1. Selecciona un Servicio</h2>
                  <div className={styles.serviceList}>
                    {business.services?.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedService(service)}
                        className={`${styles.serviceItem} ${selectedService?.id === service.id ? styles.serviceItemActive : ""}`}
                      >
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          {service.imageUrl ? (
                            <img src={service.imageUrl} alt={service.name} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>✨</div>
                          )}
                          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                            <span className={styles.serviceName}>{service.name}</span>
                            <span className={styles.serviceMeta}>{service.duration} min</span>
                          </span>
                        </div>
                        <span className={styles.price}>
                          {formatPrice(service.price, business.currency)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {business.category !== "Restaurante" && professionals.length > 1 && (
                <div style={{ marginBottom: "24px" }}>
                  <h2 className={styles.sectionTitle}>2. Selecciona un Profesional</h2>
                  <div className={styles.profList}>
                    {professionals.map((prof) => (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => setSelectedProfessional(prof)}
                        className={`${styles.profItem} ${selectedProfessional?.id === prof.id ? styles.profItemActive : ""}`}
                      >
                        <div className={styles.profAvatar}>
                          {prof.avatar || prof.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className={styles.profName}>{prof.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(selectedService || business.category === "Restaurante") && (
                <div style={{ marginBottom: "24px" }}>
                  <h2 className={styles.sectionTitle}>
                    {business.category === "Restaurante" ? "2. Elige Fecha y Hora" : professionals.length > 1 ? "3. Elige Fecha y Hora" : "2. Elige Fecha y Hora"}
                  </h2>
                  <Calendar
                    slug={slug}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    selectedTime={selectedTime}
                    onSelectTime={setSelectedTime}
                    slots={slots}
                  />
                </div>
              )}

              <div className={styles.footerBar}>
                <button
                  type="button"
                  disabled={(business.category === "Restaurante" ? !selectedTime : (!selectedService || !selectedTime)) || submitting}
                  onClick={handleBookClick}
                  className={styles.bookBtn}
                >
                  {submitting
                    ? "Reservando..."
                    : !selectedTime
                    ? "Selecciona fecha y hora"
                    : business.category === "Restaurante"
                    ? "Confirmar Reserva de Mesa"
                    : "Confirmar Reserva"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {Object.keys(menuByCategory).map((catName) => (
                <div key={catName}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid var(--card-border)", paddingBottom: "6px", marginBottom: "12px", color: "var(--foreground)" }}>
                    {catName}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {menuByCategory[catName].map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "16px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, paddingRight: "12px", overflow: "hidden" }}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>🍔</div>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start", textAlign: "left", overflow: "hidden" }}>
                            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--foreground)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>{item.name}</span>
                            {item.description && <span style={{ fontSize: "12px", color: "var(--text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>{item.description}</span>}
                          </div>
                        </div>
                        <span style={{ fontWeight: "700", color: "var(--primary)", fontSize: "14px", flexShrink: 0 }}>
                          {formatPrice(item.price, business.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(!business.menuItems || business.menuItems.length === 0) && (
                <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "13px", margin: "40px 0" }}>No hay platos en el menú todavía.</p>
              )}
            </div>
          )}
        </>
      )}

      {showPayment && selectedService && (
        <PaymentModal
          amount={selectedService.price}
          formattedAmount={formatPrice(selectedService.price, business.currency)}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showOtp && selectedService && selectedProfessional && (
        <OtpModal
          onClose={() => setShowOtp(false)}
          onSuccess={handleOtpSuccess}
        />
      )}
    </main>
  );
}

