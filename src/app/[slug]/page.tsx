"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import Calendar from "@/components/Calendar";
import OtpModal from "@/components/OtpModal";

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

interface Business {
  id: string;
  name: string;
  category: string;
  currency: string;
  services: Service[];
  professionals: Professional[];
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
  const [showOtp, setShowOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    
    async function loadData() {
      try {
        const res = await fetch(`/api/availability?slug=${slug}&date=${selectedDate}`);
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
      } catch (err) {
        console.error(err);
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, selectedDate]);

  const handleBookClick = () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return;
    setShowOtp(true);
  };

  const handleOtpSuccess = async (clientName: string, clientWhatsApp: string) => {
    if (!selectedService || !selectedProfessional) return;
    setShowOtp(false);
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          serviceId: selectedService.id,
          professionalId: selectedProfessional.id,
          clientName,
          clientWhatsApp,
          date: selectedDate,
          time: selectedTime,
        }),
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

  return (
    <main className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          {business.name.substring(0, 2).toUpperCase()}
        </div>
        <h1 className={styles.businessName}>{business.name}</h1>
        <p className={styles.category}>{business.category}</p>
      </div>

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

      {professionals.length > 1 && (
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

      {selectedService && (
        <div style={{ marginBottom: "24px" }}>
          <h2 className={styles.sectionTitle}>
            {professionals.length > 1 ? "3. Elige Fecha y Hora" : "2. Elige Fecha y Hora"}
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
          disabled={!selectedService || !selectedTime || submitting}
          onClick={handleBookClick}
          className={styles.bookBtn}
        >
          {submitting
            ? "Agendando..."
            : !selectedService
            ? "Elige un servicio"
            : !selectedTime
            ? "Selecciona fecha y hora"
            : "Confirmar Reserva"}
        </button>
      </div>

      {showOtp && selectedService && selectedProfessional && (
        <OtpModal
          onClose={() => setShowOtp(false)}
          onSuccess={handleOtpSuccess}
        />
      )}
    </main>
  );
}
