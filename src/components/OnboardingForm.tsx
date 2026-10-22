"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./OnboardingForm.module.css";
import QrDownloader from "@/components/QrDownloader";
import TurnstileCaptcha from "@/components/TurnstileCaptcha";

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
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setError(null);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!termsAccepted) {
      setError("Debes aceptar los Términos del Servicio y la Política de Privacidad.");
      return;
    }
    if (!captchaVerified) {
      setError("Por favor completa la verificación de seguridad.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        website_hp: honeypot,
        formStartedAt,
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: "2026-10-20",
        turnstileToken,
      };
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedSlug(data.slug);
        setStep(3);
      } else {
        setError(data.error || "Algo salió mal al crear tu AgendaLink");
      }
    } catch (err) {
      console.error(err);
      setError("Error de red al enviar la configuración. Intenta nuevamente.");
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
      setError("No se pudo copiar automáticamente. Por favor, selecciona y copia el link manualmente.");
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
          <span className={styles.eyebrow}>14 días de prueba gratis</span>
          <h1 id="onboarding-title">Crea tu AgendaLink</h1>
          <p>14 días gratis, sin tarjeta. Configura tu página y empieza a recibir solicitudes de reserva.</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Honeypot anti-spam field */}
            <div style={{ display: "none", position: "absolute", left: "-9999px" }} aria-hidden="true">
              <input
                type="text"
                name="website_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span aria-hidden="true">⚠️</span>
                <span>{error}</span>
              </div>
            )}

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
                  <option value="1 persona">Plan Individual (1 profesional - $9.990/mes + IVA)</option>
                  <option value="2-5 personas">Plan Básico (2 profesionales - $28.990/mes + IVA)</option>
                  <option value="6+ personas">Plan Premium (5 profesionales - $48.990/mes + IVA)</option>
                </select>
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  14 días gratis, sin tarjeta. Si te gusta, activas tu plan y se renueva automáticamente cada mes.
                </span>
              </label>
            </div>

            <label>
              País
              <select name="country" value={formData.country} onChange={handleChange}>
                <option value="Chile">Chile</option>
              </select>
            </label>

            <div style={{ margin: "16px 0 12px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <input
                id="onb-terms-accepted"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: "3px", width: "18px", height: "18px", accentColor: "#0066FF", cursor: "pointer", flexShrink: 0 }}
                required
              />
              <label htmlFor="onb-terms-accepted" style={{ fontSize: "13px", color: "#475569", lineHeight: "1.45", cursor: "pointer" }}>
                He leído y acepto los{" "}
                <Link href="/terminos" target="_blank" rel="noopener" style={{ color: "#0066FF", textDecoration: "underline", fontWeight: 600 }}>
                  Términos del Servicio
                </Link>
                , la{" "}
                <Link href="/privacidad" target="_blank" rel="noopener" style={{ color: "#0066FF", textDecoration: "underline", fontWeight: 600 }}>
                  Política de Privacidad
                </Link>{" "}
                y el{" "}
                <Link href="/legal" target="_blank" rel="noopener" style={{ color: "#0066FF", textDecoration: "underline", fontWeight: 600 }}>
                  Resguardo Legal e IA
                </Link>
                .
              </label>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <TurnstileCaptcha
                onVerify={(verified, token) => {
                  setCaptchaVerified(verified);
                  if (token) setTurnstileToken(token);
                }}
              />
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !captchaVerified ||
                !termsAccepted ||
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
