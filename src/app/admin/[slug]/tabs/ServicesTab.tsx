"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import type { BusinessAdminDTO } from "@/features/businesses/contracts";
import styles from "../admin.module.css";

type ServiceDTO = BusinessAdminDTO["services"][number];

interface ServicesTabProps {
  slug: string;
  services: ServiceDTO[];
  currency: string;
  formatPrice: (price: number, currency: string) => string;
  onServicesChanged: () => Promise<void>;
}

export default function ServicesTab({ slug, services, currency, formatPrice, onServicesChanged }: ServicesTabProps) {
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("30");
  const [serviceImage, setServiceImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        alert("Error al eliminar servicio");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  return (
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
  );
}
