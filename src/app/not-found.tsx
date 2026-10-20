import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada (Error 404)",
  description: "La página o negocio que buscas no existe o ha sido modificado.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f8fafc",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          padding: "44px 36px",
          background: "#ffffff",
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          boxShadow: "0 12px 36px -4px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Link href="/" style={{ display: "inline-block" }}>
            <img
              src="/logo-horizontal.png"
              alt="AgendaLink"
              style={{ height: 38, width: "auto", display: "block", margin: "0 auto" }}
            />
          </Link>
        </div>

        <div
          style={{
            fontSize: "64px",
            fontWeight: "900",
            color: "var(--blue, #0066FF)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            marginBottom: 12,
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "#0f172a",
            margin: "0 0 10px",
            letterSpacing: "-0.02em",
          }}
        >
          Página o negocio no encontrado
        </h1>

        <p
          style={{
            color: "#64748b",
            fontSize: "14.5px",
            lineHeight: "1.6",
            margin: "0 0 32px",
          }}
        >
          El link que ingresaste no corresponde a un negocio registrado o la dirección fue modificada.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 22px",
              borderRadius: "12px",
              background: "var(--blue, #0066FF)",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "14px",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0, 102, 255, 0.25)",
            }}
          >
            ← Volver al inicio
          </Link>
          <Link
            href="/registro"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 22px",
              borderRadius: "12px",
              background: "#f1f5f9",
              color: "#334155",
              fontWeight: "700",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Crear mi link
          </Link>
        </div>
      </div>
    </main>
  );
}
