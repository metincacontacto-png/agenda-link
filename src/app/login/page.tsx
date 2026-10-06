"use client";

import { useState, type FormEvent } from "react";

export default function LoginPage() {
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
        setError(response.status === 503
          ? "El inicio de sesión no está configurado. Inténtalo más tarde."
          : "Email o contraseña incorrectos.");
        return;
      }

      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const destination = requestedPath?.startsWith("/") &&
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
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f7fb" }}>
      <section style={{ width: "100%", maxWidth: 420, padding: 32, borderRadius: 20, background: "white", boxShadow: "0 16px 48px rgba(24, 39, 75, .12)" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800 }}>Iniciar sesión</h1>
        <p style={{ margin: "0 0 24px", color: "#667085" }}>Accede al panel de tu negocio en AgendaLink.</p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 14, fontWeight: 600 }}>
            Email
            <input name="email" type="email" autoComplete="username" required maxLength={254} style={{ padding: 12, border: "1px solid #d0d5dd", borderRadius: 10 }} />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 14, fontWeight: 600 }}>
            Contraseña
            <input name="password" type="password" autoComplete="current-password" required maxLength={128} style={{ padding: 12, border: "1px solid #d0d5dd", borderRadius: 10 }} />
          </label>
          {error && <p role="alert" style={{ margin: 0, color: "#b42318", fontSize: 14 }}>{error}</p>}
          <button type="submit" disabled={submitting} style={{ padding: 12, border: 0, borderRadius: 10, color: "white", background: "#2563eb", fontWeight: 700, cursor: submitting ? "wait" : "pointer" }}>
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}
