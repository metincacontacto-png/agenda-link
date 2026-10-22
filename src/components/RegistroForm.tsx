"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./RegistroForm.module.css";
import QrDownloader from "@/components/QrDownloader";
import TurnstileCaptcha from "@/components/TurnstileCaptcha";
import { cleanSlugInput, isValidSlug } from "@/lib/reserved-slugs";

interface RegistroFormProps {
  initialPlan?: string;
  initialSlug?: string;
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: (slug: string) => void;
}

export default function RegistroForm({
  initialPlan = "individual",
  initialSlug = "",
  isModal = false,
  onSuccess,
}: RegistroFormProps) {
  // Convert initialPlan to teamSize
  const mapPlanToTeamSize = (plan?: string) => {
    if (!plan) return "1 persona";
    const p = plan.toLowerCase();
    if (p.includes("basico") || p.includes("básico") || p.includes("equipo")) return "2-5 personas";
    if (p.includes("premium") || p.includes("business") || p.includes("negocio")) return "6+ personas";
    return "1 persona";
  };

  const validateSlug = (candidate: string): boolean => {
    if (!candidate) {
      setSlugError("");
      return false;
    }
    if (!isValidSlug(candidate)) {
      setSlugError("Ese link no está disponible. Prueba con otro.");
      return false;
    }
    setSlugError("");
    return true;
  };

  const [step, setStep] = useState<1 | 3>(1);
  const [formData, setFormData] = useState(() => ({
    name: "",
    slug: initialSlug ? cleanSlugInput(initialSlug) : "",
    ownerName: "",
    email: "",
    password: "",
    category: "Peluquería",
    teamSize: mapPlanToTeamSize(initialPlan),
    country: "Chile",
  }));

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialSlug));
  const [slugError, setSlugError] = useState(() => {
    if (!initialSlug) return "";
    const cleaned = cleanSlugInput(initialSlug);
    return isValidSlug(cleaned) ? "" : "Ese link no está disponible. Prueba con otro.";
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (!slugManuallyEdited) {
      const generated = cleanSlugInput(newName);
      setFormData((prev) => ({ ...prev, name: newName, slug: generated }));
      validateSlug(generated);
    } else {
      setFormData((prev) => ({ ...prev, name: newName }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    const cleaned = cleanSlugInput(e.target.value);
    setFormData((prev) => ({ ...prev, slug: cleaned }));
    validateSlug(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.name.trim() || !formData.slug.trim()) {
      setFormError("Por favor completa el nombre de tu negocio y tu link.");
      return;
    }

    if (!isValidSlug(formData.slug)) {
      setSlugError("Ese link no está disponible. Prueba con otro.");
      setFormError("Revisa el link de tu negocio.");
      return;
    }

    if (formData.password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (!termsAccepted) {
      setFormError("Debes aceptar los Términos del Servicio y la Política de Privacidad para continuar.");
      return;
    }

    if (!captchaVerified) {
      setFormError("Por favor completa la verificación de seguridad.");
      return;
    }

    setLoading(true);
    setFormError("");

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
      if (res.ok && data.success && data.slug) {
        setCreatedSlug(data.slug);
        setStep(3);
        if (onSuccess) onSuccess(data.slug);
      } else {
        setFormError(data.error || "No se pudo crear el negocio. Inténtalo de nuevo.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Error de conexión al procesar el registro.");
    } finally {
      setLoading(false);
    }
  };

  const copyCreatedLink = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://agendalink.cl";
    const url = `${origin}/${createdSlug}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setFormError("Copia el link manualmente: " + url);
    }
  };

  const content = (
    <div className={isModal ? styles.modalContent : styles.standaloneCard}>
      {step === 1 && (
        <>
          <div className={styles.header}>
            <h2 id="registro-title" className={styles.title}>
              Crea tu AgendaLink
            </h2>
            <p className={styles.subtitle}>
              14 días gratis, sin tarjeta.
            </p>
          </div>

          {formError && <div className={styles.errorBanner}>{formError}</div>}

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

            {/* Nombre del negocio */}
            <div className={styles.formGroup}>
              <label htmlFor="reg-name" className={styles.label}>
                Nombre de tu negocio
              </label>
              <input
                ref={firstInputRef}
                id="reg-name"
                name="name"
                type="text"
                autoComplete="organization"
                placeholder="Ej. Valentina Studio"
                value={formData.name}
                onChange={handleNameChange}
                className={styles.input}
                required
              />
            </div>

            {/* Tu link con prefijo agendalink.cl/ y vista previa */}
            <div className={styles.formGroup}>
              <label htmlFor="reg-slug" className={styles.label}>
                Tu link
              </label>
              <div className={styles.slugInputWrapper}>
                <span className={styles.slugPrefix}>agendalink.cl/</span>
                <input
                  id="reg-slug"
                  name="slug"
                  type="text"
                  autoComplete="off"
                  placeholder="tunegocio"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  className={styles.slugInput}
                  required
                />
              </div>
              <div className={styles.previewText}>
                <span>Vista previa:</span>
                <span className={styles.previewHighlight}>
                  agendalink.cl/{formData.slug || "tunegocio"}
                </span>
              </div>
              {slugError && <div className={styles.fieldError}>{slugError}</div>}
            </div>

            {/* Tu nombre */}
            <div className={styles.formGroup}>
              <label htmlFor="reg-owner-name" className={styles.label}>
                Tu nombre
              </label>
              <input
                id="reg-owner-name"
                name="ownerName"
                type="text"
                autoComplete="name"
                placeholder="Ej. Valentina Morales"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className={styles.input}
                required
              />
            </div>

            {/* Correo */}
            <div className={styles.formGroup}>
              <label htmlFor="reg-email" className={styles.label}>
                Correo electrónico
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Ej. contacto@valentina.cl"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={styles.input}
                required
              />
            </div>

            {/* Contraseña */}
            <div className={styles.formGroup}>
              <label htmlFor="reg-password" className={styles.label}>
                Contraseña para tu cuenta
              </label>
              <input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={8}
                maxLength={128}
                className={styles.input}
                required
              />
              <div style={{ fontSize: "12px", marginTop: "2px" }}>
                {!formData.password ? (
                  <span style={{ color: "#64748b" }}>
                    Mínimo 8 caracteres (puedes combinar letras, números y símbolos)
                  </span>
                ) : formData.password.length < 8 ? (
                  <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                    ⚠️ Debe tener al menos 8 caracteres (llevas {formData.password.length} de 8)
                  </span>
                ) : (
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                    ✓ Contraseña válida ({formData.password.length} caracteres)
                  </span>
                )}
              </div>
            </div>

            {/* Rubro y Plan */}
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="reg-category" className={styles.label}>
                  Rubro
                </label>
                <select
                  id="reg-category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={styles.select}
                >
                  <option value="Peluquería">Peluquería y Barbería</option>
                  <option value="Salud">Salud y Bienestar</option>
                  <option value="Fitness">Fitness y Deporte</option>
                  <option value="Profesionales">Servicios Profesionales</option>
                  <option value="Otros">Otros servicios</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="reg-plan" className={styles.label}>
                  Equipo / Plan
                </label>
                <select
                  id="reg-plan"
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  className={styles.select}
                >
                  <option value="1 persona">Plan Individual (1 profesional - $10.000/mes + IVA)</option>
                  <option value="2-5 personas">Plan Básico (2 profesionales - $29.000/mes + IVA)</option>
                  <option value="6+ personas">Plan Premium (5 profesionales - $49.000/mes + IVA)</option>
                </select>
                <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", marginBottom: 0 }}>
                  14 días gratis, sin tarjeta. Si te gusta, activas tu plan y se renueva automáticamente cada mes.
                </p>
              </div>
            </div>

            {/* País */}
            <div className={styles.formGroup}>
              <label htmlFor="reg-country" className={styles.label}>
                País
              </label>
              <select
                id="reg-country"
                name="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={styles.select}
              >
                <option value="Chile">Chile</option>
              </select>
            </div>

            {/* Casilla de aceptación activa de términos */}
            <div style={{ margin: "20px 0 16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <input
                id="reg-terms-accepted"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: "3px", width: "18px", height: "18px", accentColor: "#0066FF", cursor: "pointer", flexShrink: 0 }}
                required
              />
              <label htmlFor="reg-terms-accepted" style={{ fontSize: "13px", color: "#475569", lineHeight: "1.45", cursor: "pointer" }}>
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

            {/* Verificación de seguridad (Cloudflare Turnstile) */}
            <div style={{ marginBottom: "16px" }}>
              <TurnstileCaptcha
                onVerify={(verified, token) => {
                  setCaptchaVerified(verified);
                  if (token) setTurnstileToken(token);
                }}
              />
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={
                loading ||
                !captchaVerified ||
                !termsAccepted ||
                !formData.name.trim() ||
                !formData.slug.trim() ||
                Boolean(slugError) ||
                !formData.ownerName.trim() ||
                !formData.email.trim() ||
                formData.password.length < 8
              }
            >
              {loading ? "Creando tu link..." : "Crear mi link gratis"}
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <div className={styles.successStep}>
          <div className={styles.successEmoji}>🎉</div>
          <h2 className={styles.title}>¡Tu AgendaLink está lista!</h2>
          <p className={styles.subtitle}>
            Ya puedes compartir este link con tus clientes para recibir solicitudes de reserva.
          </p>

          <div className={styles.linkCard}>
            <span className={styles.linkUrl}>
              {(typeof window !== "undefined" ? window.location.origin : "https://agendalink.cl") +
                "/" +
                createdSlug}
            </span>
            <button type="button" onClick={copyCreatedLink} className={styles.copyBtn}>
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>

          <div style={{ margin: "24px 0" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "10px" }}>
              CÓDIGO QR OFICIAL
            </p>
            <QrDownloader slug={createdSlug} businessName={formData.name} />
          </div>

          <div className={styles.actionsRow}>
            <Link href={`/${createdSlug}`} className={styles.btnSecondary}>
              Ver link público
            </Link>
            <Link href={`/admin/${createdSlug}`} className={styles.btnPrimary}>
              Ir al Panel →
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return content;
  }

  return (
    <div className={styles.pageWrapper}>
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <Link href="/">
          <img src="/logo-horizontal.png" alt="AgendaLink" style={{ height: 36, width: "auto" }} />
        </Link>
      </div>
      {content}
    </div>
  );
}
