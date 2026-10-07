"use client";

import Calendar from "@/components/Calendar";
import type { PublicBusinessDTO } from "@/features/booking/public-business-dto";
import styles from "../page.module.css";

type Service = PublicBusinessDTO["services"][number];
type Professional = PublicBusinessDTO["professionals"][number];

interface BookingFlowProps {
  slug: string;
  business: PublicBusinessDTO;
  professionals: Professional[];
  selectedService: Service | null;
  selectedProfessional: Professional | null;
  selectedDate: string;
  selectedTime: string;
  slots: string[];
  submitting: boolean;
  formatPrice: (price: number, currency: string) => string;
  onBackToLanding: () => void;
  onSelectService: (service: Service) => void;
  onSelectProfessional: (professional: Professional) => void;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onBook: () => void;
}

export default function BookingFlow({
  slug,
  business,
  professionals,
  selectedService,
  selectedProfessional,
  selectedDate,
  selectedTime,
  slots,
  submitting,
  formatPrice,
  onBackToLanding,
  onSelectService,
  onSelectProfessional,
  onSelectDate,
  onSelectTime,
  onBook,
}: BookingFlowProps) {
  return (
    <>
      <div className={styles.backHeaderBtn}>
        <button
          type="button"
          onClick={onBackToLanding}
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

      <div style={{ marginBottom: "24px" }}>
        <h2 className={styles.sectionTitle}>1. Selecciona un Servicio</h2>
        <div className={styles.serviceList}>
          {business.services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelectService(service)}
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
              <span className={styles.price}>{formatPrice(service.price, business.currency)}</span>
            </button>
          ))}
        </div>
      </div>

      {professionals.length > 1 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 className={styles.sectionTitle}>2. Selecciona un Profesional</h2>
          <div className={styles.profList}>
            {professionals.map((professional) => (
              <button
                key={professional.id}
                type="button"
                onClick={() => onSelectProfessional(professional)}
                className={`${styles.profItem} ${selectedProfessional?.id === professional.id ? styles.profItemActive : ""}`}
              >
                <div className={styles.profAvatar}>
                  {professional.avatar || professional.name.substring(0, 2).toUpperCase()}
                </div>
                <div className={styles.profName}>{professional.name}</div>
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
            timeZone={business.timezone || "America/Santiago"}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            selectedTime={selectedTime}
            onSelectTime={onSelectTime}
            slots={slots}
          />
        </div>
      )}

      <div className={styles.footerBar}>
        <button
          type="button"
          disabled={!selectedService || !selectedTime || submitting}
          onClick={onBook}
          className={styles.bookBtn}
        >
          {submitting
            ? "Reservando..."
            : !selectedTime
              ? "Selecciona fecha y hora"
              : "Confirmar Reserva"}
        </button>
      </div>
    </>
  );
}
