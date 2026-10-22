"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      if (!response.ok) {
        setError(
          response.status === 503
            ? "El inicio de sesión no está configurado. Inténtalo más tarde."
            : "Email o contraseña incorrectos."
        );
        return;
      }

      const data = await response.json().catch(() => null);
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const destination =
        requestedPath?.startsWith("/") &&
        !requestedPath.startsWith("//") &&
        !requestedPath.includes("\\")
          ? requestedPath
          : data?.slug
            ? `/admin/${data.slug}`
            : "/";
      window.location.assign(destination);
    } catch {
      setError("No se pudo iniciar sesión. Comprueba tu conexión e inténtalo otra vez.");
    } finally {
      setSubmitting(false);
    }
  }

  const recoveryWhatsAppUrl = `https://wa.me/56985967325?text=${encodeURIComponent(
    "Hola Soporte AgendaLink, necesito restablecer la contraseña de mi cuenta.\n\n• Correo registrado:\n• Link de mi negocio: agendalink.cl/"
  )}`;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f5f7fb",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 36,
          borderRadius: 20,
          background: "white",
          boxShadow: "0 16px 48px rgba(24, 39, 75, .08)",
          border: "1px solid #eef2f6",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link href="/" style={{ display: "inline-block" }}>
            <img
              src="/logo-horizontal.png"
              alt="AgendaLink"
              style={{ height: 36, width: "auto", display: "block", margin: "0 auto" }}
            />
          </Link>
        </div>

        <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, color: "#0f172a", textAlign: "center" }}>
          Iniciar sesión
        </h1>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14, textAlign: "center" }}>
          Accede al panel de tu negocio en AgendaLink.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label htmlFor="login-email" style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
              Correo electrónico
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="tu@correo.com"
              style={{
                padding: "12px 14px",
                border: "1px solid #d0d5dd",
                borderRadius: 12,
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(true)}
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0066FF",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textDecoration: "none",
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              placeholder="••••••••"
              style={{
                padding: "12px 14px",
                border: "1px solid #d0d5dd",
                borderRadius: 12,
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {error && (
            <p role="alert" style={{ margin: 0, color: "#b42318", fontSize: 13, fontWeight: 600 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "13px 18px",
              border: 0,
              borderRadius: 12,
              color: "white",
              background: "linear-gradient(135deg, #0066FF, #0052cc)",
              fontWeight: 700,
              fontSize: 15,
              cursor: submitting ? "wait" : "pointer",
              transition: "transform 0.15s",
              fontFamily: "inherit",
            }}
          >
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9", textAlign: "center", fontSize: 13, color: "#64748b" }}>
          ¿No tienes cuenta?{" "}
          <Link href="/registro" style={{ color: "#0066FF", fontWeight: 700, textDecoration: "none" }}>
            Crea tu link gratis
          </Link>
        </div>
      </section>

      {/* Modal Protocolo de Recuperación de Identidad */}
      {showRecoveryModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRecoveryModal(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              maxWidth: 460,
              width: "100%",
              padding: "28px 24px",
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.2)",
              border: "1px solid #e2e8f0",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#eff6ff",
                  color: "#0066FF",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                🔒
              </div>
              <div>
                <h3 id="recovery-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                  Recuperación Segura
                </h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>Protocolo de comprobación de identidad</span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }}>
              Para resguardar los datos de tu negocio y evitar que terceros suplanten tu identidad, seguimos 3 pasos de verificación antes de restablecer tu acceso:
            </p>

            <ol
              style={{
                margin: "0 0 20px",
                paddingLeft: 20,
                fontSize: 13,
                color: "#334155",
                lineHeight: 1.6,
                display: "grid",
                gap: 8,
              }}
            >
              <li>
                <strong>Solicitud:</strong> Escríbenos a soporte vía WhatsApp indicando tu correo registrado y el link de tu negocio.
              </li>
              <li>
                <strong>Código de verificación:</strong> Nuestro equipo enviará un código de seguridad único a tu <em>correo registrado</em>.
              </li>
              <li>
                <strong>Confirmación:</strong> Tras confirmar dicho código, generaremos un enlace seguro para crear tu nueva clave.
              </li>
            </ol>

            <div style={{ display: "grid", gap: 10 }}>
              <a
                href={recoveryWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "13px 18px",
                  background: "#25D366",
                  color: "#ffffff",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                <span>💬</span>
                <span>Contactar a Soporte por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                style={{
                  padding: "11px 18px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: 0,
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
