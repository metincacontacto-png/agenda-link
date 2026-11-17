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
  selectedService?: Service | null;
  selectedServices?: Service[];
  selectedProfessional: Professional | null;
  selectedDate: string;
  selectedTime: string;
  slots: string[];
  bookedSlots?: string[];
  submitting: boolean;
  serviceLimitWarning?: string | null;
  formatPrice: (price: number, currency: string) => string;
  onBackToLanding: () => void;
  onSelectService?: (service: Service) => void;
  onToggleService?: (service: Service) => void;
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
  selectedServices,
  selectedProfessional,
  selectedDate,
  selectedTime,
  slots,
  bookedSlots = [],
  submitting,
  serviceLimitWarning,
  formatPrice,
  onBackToLanding,
  onSelectService,
  onToggleService,
  onSelectProfessional,
  onSelectDate,
  onSelectTime,
  onBook,
}: BookingFlowProps) {
  const activeServices = selectedServices && selectedServices.length > 0
    ? selectedServices
    : (selectedService ? [selectedService] : []);
  const maxServices = business.maxServicesPerBooking ?? 1;
  const totalDuration = activeServices.reduce((acc, s) => acc + s.duration, 0);
  const totalPrice = activeServices.reduce((acc, s) => acc + s.price, 0);

  const handleServiceClick = (service: Service) => {
    if (onToggleService) {
      onToggleService(service);
    } else if (onSelectService) {
      onSelectService(service);
    }
  };
  return (
    <>
      <div className={styles.backHeaderBtn}>
        <button
          type="button"
          onClick={onBackToLanding}
          className={styles.btnSecondary}
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

        {maxServices > 1 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(0, 102, 255, 0.08)",
              color: "var(--primary)",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            <span>ℹ️</span>
            <span>Puedes seleccionar hasta {maxServices} servicios para tu cita</span>
          </div>
        )}

        {serviceLimitWarning && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "13.5px",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            <span>⚠️</span>
            <span>{serviceLimitWarning}</span>
          </div>
        )}

        <div className={styles.serviceList}>
          {business.services.map((service) => {
            const isSelected = activeServices.some((s) => s.id === service.id);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => handleServiceClick(service)}
                className={`${styles.serviceItem} ${isSelected ? styles.serviceItemActive : ""}`}
                aria-pressed={isSelected}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: maxServices > 1 ? "4px" : "50%",
                      border: isSelected ? "2px solid var(--primary)" : "2px solid #94a3b8",
                      backgroundColor: isSelected ? "var(--primary)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  {service.imageUrl ? (
                    <img src={service.imageUrl} alt={service.name} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  )}
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                    <span className={styles.serviceName}>{service.name}</span>
                    <span className={styles.serviceMeta}>{service.duration} min</span>
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                  <span className={styles.price}>{formatPrice(service.price, business.currency)}</span>
                  {isSelected && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", background: "rgba(0, 102, 255, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                      Seleccionado
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {activeServices.length > 0 && (
          <div
            style={{
              marginTop: "-12px",
              marginBottom: "8px",
              padding: "12px 16px",
              background: "rgba(0, 102, 255, 0.06)",
              border: "1px solid rgba(0, 102, 255, 0.18)",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>✨</span>
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--foreground)" }}>
                {activeServices.length === 1
                  ? "1 servicio seleccionado"
                  : `${activeServices.length} servicios seleccionados`}
              </span>
            </div>
            <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--primary)" }}>
              ⏱️ {totalDuration} min · {formatPrice(totalPrice, business.currency)}
            </div>
          </div>
        )}
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

      {activeServices.length > 0 && (
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
            bookedSlots={bookedSlots}
          />
        </div>
      )}

      <div className={styles.footerBar}>
        <button
          type="button"
          disabled={activeServices.length === 0 || !selectedTime || submitting}
          onClick={onBook}
          className={styles.bookBtn}
        >
          {submitting
            ? "Enviando..."
            : activeServices.length === 0
              ? "Selecciona un servicio"
              : !selectedTime
                ? "Selecciona fecha y hora"
                : `Enviar Solicitud (${totalDuration} min)`}
        </button>
      </div>
    </>
  );
}
