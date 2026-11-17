"use client";

import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from "react";
import type { BusinessAdminDTO } from "@/features/businesses/contracts";
import styles from "../admin.module.css";

type ServiceDTO = BusinessAdminDTO["services"][number];

interface ServicesTabProps {
  slug: string;
  services: ServiceDTO[];
  currency: string;
  formatPrice: (price: number, currency: string) => string;
  onServicesChanged: () => Promise<void>;
  maxServicesPerBooking?: number;
}

export default function ServicesTab({
  slug,
  services,
  currency,
  formatPrice,
  onServicesChanged,
  maxServicesPerBooking = 1,
}: ServicesTabProps) {
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("30");
  const [serviceImage, setServiceImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingMaxServices, setPendingMaxServices] = useState<number | null>(null);
  const [isSavingMaxServices, setIsSavingMaxServices] = useState(false);
  const [maxServicesSuccess, setMaxServicesSuccess] = useState(false);
  const [maxServicesError, setMaxServicesError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const currentMaxServices = pendingMaxServices ?? maxServicesPerBooking;

  const handleMaxServicesChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLimit = Number(event.target.value);
    setPendingMaxServices(nextLimit);
    setIsSavingMaxServices(true);
    setMaxServicesSuccess(false);
    setMaxServicesError(null);
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          maxServicesPerBooking: nextLimit,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || (data && data.success === false)) {
        setMaxServicesError(data?.error || "Error al actualizar el límite de servicios");
        setPendingMaxServices(null);
        return;
      }

      await onServicesChanged();
      setPendingMaxServices(null);
      setMaxServicesSuccess(true);
      timerRef.current = setTimeout(() => {
        setMaxServicesSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating max services per booking:", error);
      setMaxServicesSuccess(false);
      setMaxServicesError("Error de conexión al guardar");
      setPendingMaxServices(null);
    } finally {
      setIsSavingMaxServices(false);
    }
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setServiceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!serviceName || !servicePrice) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: serviceName,
          price: Number.parseFloat(servicePrice),
          duration: Number.parseInt(serviceDuration, 10),
          imageUrl: serviceImage || null,
        }),
      });
      if (!response.ok) {
        alert("Error al agregar servicio");
        return;
      }
      setServiceName("");
      setServicePrice("");
      setServiceDuration("30");
      setServiceImage("");
      await onServicesChanged();
    } catch (error) {
      console.error("Error adding service:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este servicio?")) return;
    try {
      const response = await fetch(`/api/services?id=${serviceId}`, { method: "DELETE" });
      if (response.ok) {
        await onServicesChanged();
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Error al eliminar servicio");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Error de conexión al eliminar servicio");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <section className={styles.glassCard} style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ flex: "1 1 340px", maxWidth: "600px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 6px 0" }}>
              Límite de servicios por cita
            </h3>
            <p id="max-services-description" style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Define cuántos servicios distintos puede seleccionar un cliente en una misma reserva. El calendario reservará automáticamente la suma del tiempo de todos los servicios elegidos.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "220px" }}>
            <label
              htmlFor="max-services-select"
              style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}
            >
              Límite de servicios por cita
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <select
                id="max-services-select"
                aria-label="Límite de servicios por cita"
                aria-describedby="max-services-description"
                value={currentMaxServices}
                onChange={handleMaxServicesChange}
                disabled={isSavingMaxServices}
                className={styles.formInput}
                style={{ minWidth: "220px", cursor: isSavingMaxServices ? "not-allowed" : "pointer" }}
              >
                <option value={1}>1 servicio (por defecto)</option>
                <option value={2}>Hasta 2 servicios</option>
                <option value={3}>Hasta 3 servicios</option>
                <option value={4}>Hasta 4 servicios</option>
                <option value={5}>Hasta 5 servicios</option>
              </select>
            </div>
            <div aria-live="polite" style={{ minHeight: "18px", fontSize: "12px" }}>
              {isSavingMaxServices && (
                <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                  Guardando cambios...
                </span>
              )}
              {!isSavingMaxServices && maxServicesSuccess && (
                <span style={{ color: "var(--success, #34c759)", fontWeight: "600" }}>
                  Guardado ✓
                </span>
              )}
              {!isSavingMaxServices && maxServicesError && (
                <span style={{ color: "var(--danger, #ef4444)", fontWeight: "600" }}>
                  {maxServicesError}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "32px" }}>
      <div>
        <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Agregar Servicio / Actividad</h3>
        <form onSubmit={handleAddService} className={styles.adminForm}>
          <div className={styles.formGroup}>
            <label>Nombre del Servicio</label>
            <input
              type="text"
              required
              placeholder="Ej. Corte Masculino + Lavado"
              value={serviceName}
              onChange={(event) => setServiceName(event.target.value)}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Precio</label>
            <input
              type="number"
              required
              placeholder="Ej. 15000"
              value={servicePrice}
              onChange={(event) => setServicePrice(event.target.value)}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Duración (Minutos)</label>
            <select value={serviceDuration} onChange={(event) => setServiceDuration(event.target.value)} className={styles.formInput}>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos</option>
              <option value="90">90 minutos</option>
              <option value="120">120 minutos</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Foto de Servicio (Miniatura)</label>
            <input
              type="file"
              id="service-image-upload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageFileChange}
            />
            <label htmlFor="service-image-upload" className={styles.uploadBtnLabel}>
              {serviceImage ? "Cambiar Foto" : "Subir Foto de Servicio"}
            </label>
            {serviceImage && (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <img src={serviceImage} alt="Vista previa del servicio" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                <button type="button" onClick={() => setServiceImage("")} style={{ border: "none", background: "none", color: "var(--danger)", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>Eliminar</button>
              </div>
            )}
          </div>
          <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? "Creando..." : "Crear Servicio"}
          </button>
        </form>
      </div>

      <div>
        <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Catálogo de Servicios</h3>
        {services.length === 0 ? (
          <p style={{ fontStyle: "italic", color: "var(--text-secondary)", fontSize: "13px" }}>
            No tienes servicios cargados aún.
          </p>
        ) : (
          <div className={styles.menuItemList}>
            {services.map((service) => (
              <div key={service.id} className={styles.menuItemCard}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  {service.imageUrl && (
                    <img src={service.imageUrl} alt={service.name} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                  )}
                  <div className={styles.menuItemInfo}>
                    <div className={styles.menuItemName}>{service.name}</div>
                    <div className={styles.menuItemDesc}>{service.duration} min de duración</div>
                  </div>
                </div>
                <div className={styles.menuItemActions}>
                  <span className={styles.menuItemPrice}>{formatPrice(service.price, currency)}</span>
                  <button
                    className={styles.deleteBtn}
                    style={{ position: "relative", top: 0, right: 0, opacity: 0.6 }}
                    onClick={() => void handleDeleteService(service.id)}
                    title="Eliminar Servicio"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
