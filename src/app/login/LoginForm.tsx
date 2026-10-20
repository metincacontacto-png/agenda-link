"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const destination =
        requestedPath?.startsWith("/") &&
        !requestedPath.startsWith("//") &&
        !requestedPath.includes("\\")
          ? requestedPath
          : "/";
      window.location.assign(destination);
    } catch {
      setError("No se pudo iniciar sesión. Comprueba tu conexión e inténtalo otra vez.");
    } finally {
      setSubmitting(false);
    }
  }

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
              <a
                href="https://wa.me/56985967325?text=Hola,%20olvid%C3%A9%20mi%20contrase%C3%B1a%20de%20AgendaLink"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, fontWeight: 600, color: "#0066FF", textDecoration: "none" }}
              >
                ¿Olvidaste tu contraseña?
              </a>
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
    </main>
  );
}
