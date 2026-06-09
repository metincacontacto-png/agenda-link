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
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
}

interface Business {
  id: string;
  name: string;
  category: string;
  currency: string;
  services: Service[];
  professionals: Professional[];
  menuItems?: MenuItem[];
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

  return (
    <main className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          {business.name.substring(0, 2).toUpperCase()}
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
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                      <span className={styles.serviceName}>{service.name}</span>
                      <span className={styles.serviceMeta}>{service.duration} min</span>
                    </span>
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
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start", flex: 1, paddingRight: "12px" }}>
                      <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--foreground)" }}>{item.name}</span>
                      {item.description && <span style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "left" }}>{item.description}</span>}
                    </div>
                    <span style={{ fontWeight: "700", color: "var(--primary)", fontSize: "14px" }}>
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
