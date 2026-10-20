"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import BookingContactModal from "@/components/BookingContactModal";
import type { PublicBusinessDTO } from "@/features/booking/public-business-dto";
import { dateStringAtTimeZone } from "@/features/schedule/time";
import BookingFlow from "./components/BookingFlow";
import PublicLanding from "./components/PublicLanding";
import { FEATURES } from "@/lib/features";

type Professional = PublicBusinessDTO["professionals"][number];
type Service = PublicBusinessDTO["services"][number];

export default function BookingClient({
  slug,
  initialBusinessName,
}: {
  slug: string;
  initialBusinessName?: string;
}) {
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
  const [modalError, setModalError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"landing" | "booking">("landing");

  useEffect(() => {
    if (!slug) return;

    async function loadData() {
      try {
        const query = new URLSearchParams({ slug, date: selectedDate });
        if (selectedService?.id) {
          query.set("serviceId", selectedService.id);
          if (selectedProfessional?.id) query.set("professionalId", selectedProfessional.id);
        }
        const res = await fetch(`/api/availability?${query.toString()}`);
        if (!res.ok) {
          if (res.status === 404) setBusiness(null);
          else setSlots([]);
          return;
        }
        const data = await res.json();

        setBusiness(data.business);
        setSlots(data.availableSlots || []);
        if (!initializedBusinessTimeZone.current) {
          setSelectedDate(dateStringAtTimeZone(new Date(), data.business?.timezone || "America/Santiago"));
          initializedBusinessTimeZone.current = true;
        }
        const bizProfs = data.business?.professionals || [];
        setProfessionals(bizProfs);

        if (bizProfs.length > 0 && !selectedProfessional) {
          setSelectedProfessional(bizProfs[0]);
        }
      } catch (err) {
        console.error(err);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, selectedDate, selectedService?.id, selectedProfessional?.id]);

  const handleBookClick = () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return;
    setModalError(null);
    setShowBookingContact(true);
  };

  const handleBookingSubmit = async (
    clientName: string,
    clientWhatsApp: string,
    clientEmail: string,
    paymentChoice: "mercadopago" | "local" = "mercadopago"
  ) => {
    if (!selectedService || !selectedProfessional) return;
    setSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        slug,
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        clientName,
        clientWhatsApp,
        clientEmail,
        date: selectedDate,
        time: selectedTime,
      };

      if (paymentChoice === "mercadopago" && FEATURES.pagosOnline) {
        const res = await fetch("/api/payments/mercadopago/preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (res.ok && result.success && (result.initPoint || result.sandboxInitPoint)) {
          setShowBookingContact(false);
          const redirectUrl = result.initPoint || result.sandboxInitPoint;
          window.location.href = redirectUrl;
          return;
        } else {
          setModalError(
            result.error || "No se pudo conectar con Mercado Pago. Intenta nuevamente o elige pagar en el local."
          );
          setSubmitting(false);
          return;
        }
      }

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
        setModalError(result.error || "Error al agendar la cita. Por favor intenta de nuevo.");
      }
    } catch (err) {
      console.error(err);
      setModalError("Error de conexión al agendar la cita. Por favor revisa tu conexión e inténtalo otra vez.");
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

  const isDemo = slug === "valentina";

  if (loading) {
    return (
      <main className={styles.container}>
        {isDemo && (
          <div
            style={{
              background: "#fef3c7",
              color: "#92400e",
              border: "1px solid #fde68a",
              padding: "10px 16px",
              textAlign: "center",
              fontWeight: 700,
              fontSize: "13.5px",
              borderRadius: "10px",
              marginBottom: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            ⚠️ Negocio de demostración — las reservas no son reales
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
            color: "var(--text-secondary)",
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          Cargando {initialBusinessName || "agenda"}...
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main className={styles.container}>
        <div className={styles.notFound}>
          <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px" }}>Negocio no encontrado</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            El enlace que ingresaste no corresponde a un negocio registrado o está temporalmente inactivo.
          </p>
          <Link href="/" className={styles.btn}>Ir al Inicio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      {isDemo && (
        <div
          style={{
            background: "#fef3c7",
            color: "#92400e",
            border: "1px solid #fde68a",
            padding: "10px 16px",
            textAlign: "center",
            fontWeight: 700,
            fontSize: "13.5px",
            borderRadius: "10px",
            marginBottom: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          ⚠️ Negocio de demostración — las reservas no son reales
        </div>
      )}

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
          businessName={business.name}
          isDemo={isDemo}
          acceptsOnlinePayments={Boolean(business.acceptsOnlinePayments)}
          cancellationPolicy={business.cancellationPolicy}
          submitting={submitting}
          errorMessage={modalError || undefined}
          onClose={() => {
            setShowBookingContact(false);
            setModalError(null);
          }}
          onSubmit={handleBookingSubmit}
        />
      )}
    </main>
  );
}
