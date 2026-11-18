"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import styles from "../admin.module.css";
import type { BeforeInstallPromptEvent } from "./AdminHeader";

interface InstallAppModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onDirectInstall?: () => void;
}

export default function InstallAppModal({
  slug,
  isOpen,
  onClose,
  deferredPrompt,
  onDirectInstall,
}: InstallAppModalProps) {
  const [activeTab, setActiveTab] = useState<"ios" | "android" | "qr">("ios");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Generate QR Code for the admin mobile URL
  useEffect(() => {
    if (!isOpen) return;
    const adminUrl = typeof window !== "undefined"
      ? `${window.location.origin}/admin/${slug}`
      : `https://agendalink.cl/admin/${slug}`;

    QRCode.toDataURL(adminUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [isOpen, slug]);

  if (!isOpen) return null;

  const adminUrl = typeof window !== "undefined"
    ? `${window.location.origin}/admin/${slug}`
    : `https://agendalink.cl/admin/${slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(adminUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalContent} style={{ maxWidth: 560, maxHeight: "90vh" }}>
        <div className={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 20,
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              }}
            >
              📲
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                Descargar App en tu Teléfono
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--text-secondary)" }}>
                Accede a tu panel en 1 toque directo desde tu pantalla de inicio
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody} style={{ padding: "20px 24px" }}>
          {/* Quick Install Banner if browser supports native PWA prompt */}
          {deferredPrompt && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)",
                border: "1.5px solid rgba(37, 99, 235, 0.3)",
                borderRadius: 14,
                padding: "16px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1d4ed8" }}>
                  ¡Instalación rápida disponible!
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                  Tu navegador permite instalar la app directamente.
                </div>
              </div>
              <button
                type="button"
                onClick={onDirectInstall}
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                }}
              >
                📲 Instalar ahora
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "rgba(0, 0, 0, 0.04)",
              padding: 4,
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("ios")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 9,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "ios" ? "#ffffff" : "transparent",
                color: activeTab === "ios" ? "#0f172a" : "var(--text-secondary)",
                boxShadow: activeTab === "ios" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>🍎</span> iPhone (Safari)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("android")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 9,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "android" ? "#ffffff" : "transparent",
                color: activeTab === "android" ? "#0f172a" : "var(--text-secondary)",
                boxShadow: activeTab === "android" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>🤖</span> Android (Chrome)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 9,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "qr" ? "#ffffff" : "transparent",
                color: activeTab === "qr" ? "#0f172a" : "var(--text-secondary)",
                boxShadow: activeTab === "qr" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>📷</span> Abrir en Móvil (QR)
            </button>
          </div>

          {/* TAB 1: iOS Safari */}
          {activeTab === "ios" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: "#fff",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(37, 99, 235, 0.12)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                  Abre este panel en <strong>Safari</strong> en tu iPhone. Si estás en tu computador, usa la pestaña <strong>Abrir en Móvil (QR)</strong> arriba para escanearlo.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: "#fff",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(37, 99, 235, 0.12)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                  Toca el botón <strong>Compartir</strong> (el ícono cuadrado con una flecha hacia arriba <strong>⎋</strong> en la barra inferior de Safari).
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: "#fff",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(37, 99, 235, 0.12)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                  Baja en el menú y selecciona <strong>&quot;Agregar a pantalla de inicio&quot;</strong> (o &quot;Añadir a pantalla de inicio&quot; con el ícono ➕).
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: "#fff",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(37, 99, 235, 0.12)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  4
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                  Toca <strong>&quot;Agregar&quot;</strong> arriba a la derecha. ¡Listo! Se creará el ícono de tu app para entrar siempre directamente con 1 toque.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Android Chrome */}
          {activeTab === "android" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: "#fff",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                  Abre este panel en <strong>Google Chrome</strong> en tu teléfono Android.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: "#fff",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                  Toca los <strong>tres puntos verticales (⋮)</strong> en la esquina superior derecha del navegador.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: "#fff",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                  Selecciona la opción <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Agregar a la pantalla principal&quot;</strong>.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: "#fff",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  4
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                  Confirma tocando <strong>&quot;Instalar&quot;</strong>. AgendaLink se instalará en tu cajón de aplicaciones y pantalla de inicio.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QR Code to open on Mobile */}
          {activeTab === "qr" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 400 }}>
                Apunta con la cámara de tu celular a este código QR para abrir tu panel administrativo al instante:
              </div>

              {qrCodeDataUrl ? (
                <div
                  style={{
                    background: "#ffffff",
                    padding: 12,
                    borderRadius: 16,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                    display: "inline-block",
                  }}
                >
                  <img
                    src={qrCodeDataUrl}
                    alt="Código QR para abrir en celular"
                    style={{ width: 180, height: 180, display: "block" }}
                  />
                </div>
              ) : (
                <div style={{ width: 180, height: 180, background: "#f1f5f9", borderRadius: 16 }} />
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: copiedLink ? "rgba(34, 197, 94, 0.12)" : "rgba(0, 102, 255, 0.08)",
                    color: copiedLink ? "#16a34a" : "var(--primary)",
                    border: `1.5px solid ${copiedLink ? "rgba(34, 197, 94, 0.4)" : "rgba(0, 102, 255, 0.25)"}`,
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {copiedLink ? "✓ ¡Enlace copiado!" : "📋 Copiar link del panel"}
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Abre tu panel de AgendaLink en tu celular para instalarlo: ${adminUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(37, 211, 102, 0.12)",
                    color: "#059669",
                    border: "1.5px solid rgba(37, 211, 102, 0.35)",
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span>💬</span> Enviármelo por WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* Bottom Perks */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: "1px solid rgba(0, 0, 0, 0.06)",
              display: "flex",
              justifyContent: "space-around",
              fontSize: 12,
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            <div>⚡ <strong>Carga instantánea</strong></div>
            <div>🔔 <strong>Notificaciones y citas</strong></div>
            <div>📱 <strong>Icono en pantalla</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
