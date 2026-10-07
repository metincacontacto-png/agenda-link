"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import BookingContactModal from "@/components/BookingContactModal";
import type { PublicBusinessDTO } from "@/features/booking/public-business-dto";
import { dateStringAtTimeZone } from "@/features/schedule/time";
import BookingFlow from "./components/BookingFlow";
import PublicLanding from "./components/PublicLanding";

type Professional = PublicBusinessDTO["professionals"][number];
type Service = PublicBusinessDTO["services"][number];

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  
  const [business, setBusiness] = useState<PublicBusinessDTO | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => dateStringAtTimeZone(new Date(), "America/Santiago"));
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const initializedBusinessTimeZone = useRef(false);
  
  const [loading, setLoading] = useState(true);
  const [showBookingContact, setShowBookingContact] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"landing" | "booking">("landing");

  useEffect(() => {
    if (!slug) return;
    
    async function loadData() {
      try {
        const query = new URLSearchParams({ slug, date: selectedDate });
        if (selectedService?.id) query.set("serviceId", selectedService.id);
        if (selectedProfessional?.id) query.set("professionalId", selectedProfessional.id);
        const res = await fetch(`/api/availability?${query.toString()}`);
        if (!res.ok) {
          setBusiness(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        
        setBusiness(data.business);
        setSlots(data.availableSlots || []);
        if (!initializedBusinessTimeZone.current) {
          setSelectedDate(dateStringAtTimeZone(new Date(), data.business.timezone || "America/Santiago"));
          initializedBusinessTimeZone.current = true;
        }
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
  }, [slug, selectedDate, selectedService?.id, selectedProfessional?.id]);

  const handleBookClick = () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return;
    setShowBookingContact(true);
  };

  const handleBookingSubmit = async (clientName: string, clientWhatsApp: string) => {
    if (!selectedService || !selectedProfessional) return;
    setSubmitting(true);
    
    try {
      const payload = {
        slug,
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        clientName,
        clientWhatsApp,
        date: selectedDate,
        time: selectedTime,
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success && result.appointment) {
        setShowBookingContact(false);
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
      {viewMode === "landing" ? (
        <PublicLanding
          business={business}
          formatPrice={formatPrice}
          onStartBooking={() => setViewMode("booking")}
        />
      ) : (
        <BookingFlow
          slug={slug}
          business={business}
          professionals={professionals}
          selectedService={selectedService}
          selectedProfessional={selectedProfessional}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          slots={slots}
          submitting={submitting}
          formatPrice={formatPrice}
          onBackToLanding={() => setViewMode("landing")}
          onSelectService={(service) => {
            setSelectedService(service);
            setSelectedTime("");
          }}
          onSelectProfessional={(professional) => {
            setSelectedProfessional(professional);
            setSelectedTime("");
          }}
          onSelectDate={setSelectedDate}
          onSelectTime={setSelectedTime}
          onBook={handleBookClick}
        />
      )}

      {showBookingContact && (
        <BookingContactModal
          submitting={submitting}
          onClose={() => setShowBookingContact(false)}
          onSubmit={handleBookingSubmit}
        />
      )}
    </main>
  );
}
