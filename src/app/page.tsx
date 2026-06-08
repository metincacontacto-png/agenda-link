"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import QrDownloader from "@/components/QrDownloader";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    category: "Peluquería",
    teamSize: "1 persona",
    country: "Chile",
    serviceName: "",
    serviceDuration: "30",
    servicePrice: "",
  });

  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSlug(data.slug);
        setStep(3);
      } else {
        alert(data.error || "Algo salió mal");
      }
    } catch (err) {
      console.error(err);
      alert("Error al enviar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Agenda Link</h1>
          <p className={styles.subtitle}>Un link. Todo resuelto.</p>
        </div>

        {step < 3 && (
          <div className={styles.stepIndicator}>
            <div className={`${styles.dot} ${step === 1 ? styles.dotActive : ""}`} />
            <div className={`${styles.dot} ${step === 2 ? styles.dotActive : ""}`} />
          </div>
        )}

        {step === 1 && (
          <div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre de tu Negocio</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Peluquería Bella Vista"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tu Nombre</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Rubro</label>
              <select name="category" value={formData.category} onChange={handleChange} className={styles.select}>
                <option value="Peluquería">Peluquería</option>
                <option value="Salud">Salud y Bienestar</option>
                <option value="Fitness">Fitness y Deporte</option>
                <option value="Restaurante">Restaurante</option>
                <option value="Otros">Otros servicios</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>¿Cuántas personas trabajan en tu negocio?</label>
              <select name="teamSize" value={formData.teamSize} onChange={handleChange} className={styles.select}>
                <option value="1 persona">Solo yo (Plan Link Individual)</option>
                <option value="2-5 personas">2 a 5 personas (Plan Link Equipo)</option>
                <option value="6+ personas">6 o más personas (Plan Link Negocio)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>País</label>
              <select name="country" value={formData.country} onChange={handleChange} className={styles.select}>
                <option value="Chile">Chile</option>
                <option value="México">México</option>
              </select>
            </div>
            <div className={styles.buttonRow}>
              <button
                disabled={!formData.name || !formData.ownerName}
                onClick={nextStep}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "16px", marginBottom: "20px", textAlign: "center" }}>Agrega tu primer servicio</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre del Servicio</label>
              <input
                type="text"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
                placeholder="Ej. Corte de Cabello Caballero"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Duración (minutos)</label>
              <select name="serviceDuration" value={formData.serviceDuration} onChange={handleChange} className={styles.select}>
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1 hora y media</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Precio ({formData.country === "Chile" ? "CLP" : "MXN"})</label>
              <input
                type="number"
                name="servicePrice"
                value={formData.servicePrice}
                onChange={handleChange}
                placeholder="Ej. 15000"
                className={styles.input}
              />
            </div>
            <div className={styles.buttonRow}>
              <button onClick={prevStep} className={`${styles.btn} ${styles.btnSecondary}`}>
                Atrás
              </button>
              <button
                disabled={!formData.serviceName || !formData.servicePrice || loading}
                onClick={handleSubmit}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                {loading ? "Creando..." : "Completar Onboarding"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className={styles.successTitle}>¡Configuración Completa!</h2>
            <p className={styles.successText}>Tu página de agendamiento ya está en línea. Compártela con tus clientes:</p>

            <div className={styles.linkBox}>
              <span className={styles.linkText}>
                agendalink.com/{slug}
              </span>
              <button onClick={copyLink} className={styles.copyBtn}>
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>

            <div className={styles.qrContainer}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)" }}>
                Descarga tu QR imprimible
              </p>
              {slug && <QrDownloader slug={slug} businessName={formData.name} />}
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
              <Link href={`/${slug}`} className={`${styles.btn} ${styles.btnPrimary}`} style={{ display: "block" }}>
                Ver Link Público
              </Link>
              <Link href={`/admin/${slug}`} className={`${styles.btn} ${styles.btnSecondary}`} style={{ display: "block" }}>
                Panel de Administración
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
