"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./OnboardingForm.module.css";
import QrDownloader from "@/components/QrDownloader";

interface OnboardingFormProps {
  initialName?: string;
  initialTeamSize?: string;
  embedded?: boolean;
}

export default function OnboardingForm({
  initialName = "",
  initialTeamSize = "1 persona",
  embedded = false,
}: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: initialName,
    ownerName: "",
    email: "",
    password: "",
    category: "Peluquería",
    teamSize: initialTeamSize,
    country: "Chile",
    serviceName: "",
    serviceDuration: "30",
    servicePrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (formData.password.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedSlug(data.slug);
        setStep(3);
      } else {
        alert(data.error || "Algo salió mal al crear tu AgendaLink");
      }
    } catch (err) {
      console.error(err);
      alert("Error al enviar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const url = `${window.location.origin}/${createdSlug}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!successful) throw new Error("copy failed");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar el link:", err);
      alert("No se pudo copiar automáticamente. Por favor, selecciona y copia el link manualmente.");
    }
  };

  const namePlaceholder =
    formData.category === "Profesionales"
      ? "Ej. Consultoría Inmobiliaria o Estudio Jurídico"
      : formData.category === "Salud"
      ? "Ej. Centro Médico Alameda"
      : formData.category === "Fitness"
      ? "Ej. Gimnasio UpFit"
      : "Ej. Peluquería Bella Vista";

  return (
    <div className={`${styles.page} ${embedded ? styles.embeddedPage : ""}`}>
      <div className={styles.backgroundGlow} />

      {!embedded && (
        <div className={styles.topbar}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <i /><i /><i />
              <i /><i /><i />
              <i /><i /><i />
            </span>
            <span>agenda link</span>
          </Link>
          <Link href="/" className={styles.backLink}>
            Volver al inicio
          </Link>
        </div>
      )}

      <section className={styles.card} aria-labelledby="onboarding-title">
        <div className={styles.cardIntro}>
          <span className={styles.eyebrow}>Empieza gratis</span>
          <h1 id="onboarding-title">Crea tu AgendaLink</h1>
          <p>Configura tu página y empieza a recibir solicitudes de reserva en menos de 10 minutos.</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <label>
              Nombre de tu negocio
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={namePlaceholder}
                required
              />
            </label>

            <label>
              Tu nombre
              <input
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                required
              />
            </label>

            <label>
              Correo electrónico
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej. juan.perez@correo.com"
                required
              />
            </label>

            <label>
              Contraseña para tu cuenta
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
              {!formData.password ? (
                <span className={styles.passwordHint}>
                  Mínimo 8 caracteres (puedes combinar letras, números y símbolos)
                </span>
              ) : formData.password.length < 8 ? (
                <span className={styles.passwordHintWarning}>
                  ⚠️ Debe tener al menos 8 caracteres (llevas {formData.password.length} de 8)
                </span>
              ) : (
                <span className={styles.passwordHintSuccess}>
                  ✓ Contraseña válida ({formData.password.length} caracteres)
                </span>
              )}
            </label>

            <div className={styles.formGrid}>
              <label>
                Rubro
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="Peluquería">Peluquería y Barbería</option>
                  <option value="Salud">Salud y Bienestar</option>
                  <option value="Fitness">Fitness y Deporte</option>
                  <option value="Profesionales">Servicios Profesionales</option>
                  <option value="Otros">Otros servicios</option>
                </select>
              </label>

              <label>
                Equipo / plan
                <select name="teamSize" value={formData.teamSize} onChange={handleChange}>
                  <option value="1 persona">Solo yo (Plan Individual)</option>
                  <option value="2-5 personas">2 a 5 personas (Plan Equipo)</option>
                  <option value="6+ personas">6 o más personas (Plan Negocio)</option>
                </select>
              </label>
            </div>

            <label>
              País
              <select name="country" value={formData.country} onChange={handleChange}>
                <option value="Chile">Chile</option>
                <option value="México">México</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={
                loading ||
                !formData.name ||
                !formData.ownerName ||
                !formData.email ||
                formData.password.length < 8
              }
              className={styles.submitButton}
            >
              {loading ? "Creando tu link..." : "Crear mi link"}
              <span aria-hidden="true">→</span>
            </button>

            <p className={styles.legal}>
              Al registrarte aceptas los términos de uso y la política de privacidad de AgendaLink.
            </p>
          </form>
        ) : (
          <div className={styles.success}>
            <div className={styles.successIcon} aria-hidden="true">✓</div>
            <h2>¡Tu AgendaLink está lista!</h2>
            <p>Comparte este link para que tus clientes consulten servicios y soliciten reservas.</p>

            <div className={styles.linkBox}>
              <span>{typeof window !== "undefined" ? window.location.origin : "https://agendalink.cl"}/{createdSlug}</span>
              <button type="button" onClick={handleCopy}>
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>

            <div className={styles.qrBox}>
              <strong>Tu código QR de reservas</strong>
              <QrDownloader slug={createdSlug} businessName={formData.name} />
            </div>

            <div className={styles.successActions}>
              <Link href={`/${createdSlug}`} className={styles.secondaryButton}>
                Ver link público
              </Link>
              <Link href={`/admin/${createdSlug}`} className={styles.primaryButton}>
                Panel de Control
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
