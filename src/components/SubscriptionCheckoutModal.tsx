"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./SubscriptionCheckoutModal.module.css";
import TurnstileCaptcha from "@/components/TurnstileCaptcha";
import { cleanSlugInput, isValidSlug } from "@/lib/reserved-slugs";
import { SUBSCRIPTION_PLANS, getPlanPricing } from "@/features/businesses/subscription-policy";

export interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: "INDIVIDUAL" | "EQUIPO" | "NEGOCIO";
  billingPeriod: "monthly" | "yearly";
  initialSlug?: string;
}

const PLAN_TEAM_SIZE: Record<"INDIVIDUAL" | "EQUIPO" | "NEGOCIO", string> = {
  INDIVIDUAL: "1 persona",
  EQUIPO: "2-5 personas",
  NEGOCIO: "6+ personas",
};

function extractSlug(input: string): string {
  let val = input.trim();
  val = val.replace(/^https?:\/\//i, "");
  val = val.replace(/^(www\.)?agendalink\.cl\//i, "");
  val = val.split("/")[0].split("?")[0];
  return cleanSlugInput(val);
}

function SubscriptionCheckoutModalContent({
  onClose,
  plan,
  billingPeriod,
  initialSlug = "",
}: Omit<SubscriptionCheckoutModalProps, "isOpen">) {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  const planName = planConfig?.name || plan;
  const pricing = getPlanPricing(plan, billingPeriod);

  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");

  // Tab 1: New Business
  const [name, setName] = useState("");
  const [slug, setSlug] = useState(() => (initialSlug ? cleanSlugInput(initialSlug) : ""));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialSlug));
  const [slugError, setSlugError] = useState(() => {
    if (!initialSlug) return "";
    const cleaned = cleanSlugInput(initialSlug);
    return isValidSlug(cleaned) ? "" : "Ese link no está disponible o formato inválido.";
  });
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now() - 2000);

  // Tab 2: Existing Business
  const [existingSlug, setExistingSlug] = useState(() => (initialSlug ? cleanSlugInput(initialSlug) : ""));

  // Common status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (typeof window !== "undefined" && window.innerWidth > 640) {
      firstInputRef.current?.focus();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!slugManuallyEdited) {
      const generated = cleanSlugInput(newName);
      setSlug(generated);
      if (generated.length > 0 && !isValidSlug(generated)) {
        setSlugError("Ese link no está disponible o formato inválido.");
      } else {
        setSlugError("");
      }
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    const cleaned = cleanSlugInput(e.target.value);
    setSlug(cleaned);
    if (cleaned.length > 0 && !isValidSlug(cleaned)) {
      setSlugError("Ese link no está disponible o formato inválido.");
    } else {
      setSlugError("");
    }
  };

  const isSlugValid = slug.length >= 2 && isValidSlug(slug);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 8;
  const isNewFormValid =
    name.trim().length > 0 &&
    isSlugValid &&
    ownerName.trim().length > 0 &&
    isEmailValid &&
    isPasswordValid &&
    termsAccepted &&
    captchaVerified;

  const cleanExisting = extractSlug(existingSlug);
  const isExistingFormValid = cleanExisting.length >= 2;

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedName = name.trim();
    const trimmedSlug = cleanSlugInput(slug);
    const trimmedOwner = ownerName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedSlug) {
      setError("Por favor completa el nombre de tu negocio y tu link.");
      return;
    }
    if (!isValidSlug(trimmedSlug)) {
      setSlugError("Ese link no está disponible o formato inválido.");
      setError("Revisa el link de tu agenda.");
      return;
    }
    if (!trimmedOwner) {
      setError("Por favor ingresa tu nombre y apellido.");
      return;
    }
    if (!isEmailValid) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }
    if (password.length < 8) {
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
    setError("");

    try {
      const onboardingRes = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          slug: trimmedSlug,
          ownerName: trimmedOwner,
          email: trimmedEmail,
          password,
          category: "Servicios",
          teamSize: PLAN_TEAM_SIZE[plan],
          country: "Chile",
          website_hp: honeypot,
          formStartedAt,
          termsAccepted: true,
          termsAcceptedAt: new Date().toISOString(),
          termsVersion: "2026-10-20",
          turnstileToken,
        }),
      });

      const onboardingData = (await onboardingRes.json()) as {
        success?: boolean;
        slug?: string;
        error?: string;
      };

      if (!onboardingRes.ok || !onboardingData.success || !onboardingData.slug) {
        setError(onboardingData.error || "No se pudo registrar tu negocio. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }

      const checkoutRes = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: onboardingData.slug,
          plan,
          billingPeriod,
        }),
      });

      const checkoutData = (await checkoutRes.json()) as {
        success?: boolean;
        initPoint?: string;
        error?: string;
      };

      if (!checkoutRes.ok || !checkoutData.success || !checkoutData.initPoint) {
        setError(
          checkoutData.error ||
            "Se creó tu cuenta, pero ocurrió un problema al conectar con Mercado Pago. Podrás completar el pago desde tu panel.",
        );
        setLoading(false);
        return;
      }

      window.location.href = checkoutData.initPoint;
    } catch (err) {
      console.error("Error during onboarding checkout:", err);
      setError("Error de conexión al procesar la solicitud. Inténtalo nuevamente.");
      setLoading(false);
    }
  };

  const handleExistingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!cleanExisting) {
      setError("Por favor ingresa el link de tu agenda registrada.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const checkoutRes = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: cleanExisting,
          plan,
          billingPeriod,
        }),
      });

      const checkoutData = (await checkoutRes.json()) as {
        success?: boolean;
        initPoint?: string;
        error?: string;
      };

      if (!checkoutRes.ok || !checkoutData.success || !checkoutData.initPoint) {
        setError(checkoutData.error || "No se pudo iniciar el proceso de pago o el negocio no fue encontrado.");
        setLoading(false);
        return;
      }

      window.location.href = checkoutData.initPoint;
    } catch (err) {
      console.error("Error during existing checkout:", err);
      setError("Error de conexión con Mercado Pago. Inténtalo nuevamente.");
      setLoading(false);
    }
  };

  const noticeText =
    billingPeriod === "monthly"
      ? "Suscripción mensual automática protegida por Mercado Pago"
      : "Pago anual único con 2 meses gratis protegido por Mercado Pago";

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-checkout-title"
        aria-describedby="subscription-checkout-notice"
      >
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h2 id="subscription-checkout-title" className={styles.title}>
                  Contratar Plan {planName}
                </h2>
                <span className={styles.priceBadge}>{pricing.formatted}</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>
          <div id="subscription-checkout-notice" className={styles.noticeBanner}>
            <span className={styles.noticeIcon}>🛡️</span>
            <span>{noticeText}</span>
          </div>
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            id="tab-new"
            aria-selected={activeTab === "new"}
            aria-controls="panel-new"
            className={`${styles.tabBtn} ${activeTab === "new" ? styles.tabActive : ""}`}
            onClick={() => {
              setActiveTab("new");
              setError("");
            }}
          >
            Soy nuevo
          </button>
          <button
            type="button"
            role="tab"
            id="tab-existing"
            aria-selected={activeTab === "existing"}
            aria-controls="panel-existing"
            className={`${styles.tabBtn} ${activeTab === "existing" ? styles.tabActive : ""}`}
            onClick={() => {
              setActiveTab("existing");
              setError("");
            }}
          >
            Ya tengo cuenta
          </button>
        </div>

        <div className={styles.content}>
          {error && (
            <div className={styles.errorBanner} role="alert" style={{ marginBottom: 14 }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {activeTab === "new" ? (
            <form
              id="panel-new"
              role="tabpanel"
              aria-labelledby="tab-new"
              onSubmit={handleNewSubmit}
              className={styles.form}
            >
              <div className={styles.formGroup}>
                <label htmlFor="checkout-name" className={styles.label}>
                  Nombre de tu negocio <span className={styles.required}>*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="checkout-name"
                  type="text"
                  className={styles.input}
                  placeholder="Ej: Barbería Don Tito, Peluquería Estilo"
                  value={name}
                  onChange={handleNameChange}
                  maxLength={100}
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="checkout-slug" className={styles.label}>
                  Link de tu agenda <span className={styles.required}>*</span>
                </label>
                <div
                  className={`${styles.slugWrapper} ${
                    slugError ? styles.slugWrapperError : ""
                  }`}
                >
                  <span className={styles.slugPrefix}>agendalink.cl/</span>
                  <input
                    id="checkout-slug"
                    type="text"
                    className={`${styles.input} ${styles.slugInput}`}
                    placeholder="tu-negocio"
                    value={slug}
                    onChange={handleSlugChange}
                    maxLength={40}
                    required
                    disabled={loading}
                  />
                </div>
                {slugError ? (
                  <span className={styles.errorText}>{slugError}</span>
                ) : (
                  <span className={styles.helperText}>
                    Tus clientes ingresarán a <strong>agendalink.cl/{slug || "tu-negocio"}</strong> para agendar.
                  </span>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="checkout-owner" className={styles.label}>
                    Tu nombre y apellido <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="checkout-owner"
                    type="text"
                    className={styles.input}
                    placeholder="Ej: Juan Pérez"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    maxLength={100}
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="checkout-email" className={styles.label}>
                    Correo electrónico <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    className={styles.input}
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={254}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="checkout-password" className={styles.label}>
                  Contraseña para administrar tu negocio <span className={styles.required}>*</span>
                </label>
                <input
                  id="checkout-password"
                  type="password"
                  className={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  required
                  disabled={loading}
                />
                <span className={styles.helperText}>
                  La usarás para ingresar a tu panel de administración.
                </span>
              </div>

              {/* Honeypot field */}
              <div style={{ display: "none" }} aria-hidden="true">
                <input
                  type="text"
                  name="website_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className={styles.checkboxContainer}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                    disabled={loading}
                  />
                  <span className={styles.checkboxText}>
                    Acepto los{" "}
                    <Link
                      href="/terminos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      Términos del Servicio
                    </Link>
                    , la{" "}
                    <Link
                      href="/privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      Política de Privacidad
                    </Link>{" "}
                    y el{" "}
                    <Link
                      href="/legal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      Aviso Legal
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <div className={styles.captchaSection}>
                <TurnstileCaptcha
                  onVerify={(verified, token) => {
                    setCaptchaVerified(verified);
                    setTurnstileToken(token || "");
                  }}
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!isNewFormValid || loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    <span>Preparando tu pago seguro...</span>
                  </>
                ) : (
                  <span>
                    Continuar al Pago Seguro con Mercado Pago ({pricing.formatted})
                  </span>
                )}
              </button>

              <div className={styles.trustFooter}>
                <span>🔒 Pagos cifrados por Mercado Pago · Cancela en cualquier momento sin permanencia</span>
              </div>
            </form>
          ) : (
            <form
              id="panel-existing"
              role="tabpanel"
              aria-labelledby="tab-existing"
              onSubmit={handleExistingSubmit}
              className={styles.form}
            >
              <div className={styles.existingHint}>
                Si ya tienes un negocio creado en AgendaLink, ingresa el link de tu agenda para continuar al pago y activar tu plan inmediatamente.
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="checkout-existing-slug" className={styles.label}>
                  Link de tu negocio o correo registrado <span className={styles.required}>*</span>
                </label>
                <div className={styles.slugWrapper}>
                  <span className={styles.slugPrefix}>agendalink.cl/</span>
                  <input
                    ref={firstInputRef}
                    id="checkout-existing-slug"
                    type="text"
                    className={`${styles.input} ${styles.slugInput}`}
                    placeholder="mi-negocio"
                    value={existingSlug}
                    onChange={(e) => setExistingSlug(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <span className={styles.helperText}>
                  Ejemplo: si tu link es <strong>agendalink.cl/barberia-centro</strong>, escribe <strong>barberia-centro</strong>.
                </span>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!isExistingFormValid || loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    <span>Conectando con Mercado Pago...</span>
                  </>
                ) : (
                  <span>
                    Pagar suscripción con Mercado Pago ({pricing.formatted})
                  </span>
                )}
              </button>

              <div className={styles.trustFooter}>
                <span>🔒 Redirección oficial y protegida hacia Mercado Pago</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionCheckoutModal(props: SubscriptionCheckoutModalProps) {
  if (!props.isOpen) return null;
  return <SubscriptionCheckoutModalContent {...props} />;
}
