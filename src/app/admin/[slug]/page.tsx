"use client";

import React, { useState } from "react";
import Link from "next/link";
import { calculateDashboardMetrics } from "@/features/businesses/dashboard-metrics";
import { useAdminBusiness } from "@/features/businesses/use-admin-business";
import { useBrandingEditor } from "@/features/branding/use-branding-editor";
import { useAdminAppointmentActions } from "@/features/booking/use-admin-appointment-actions";
import { useAdminCalendar } from "@/features/schedule/use-admin-calendar";
import AgendaTab from "./tabs/AgendaTab";
import AdminHeader from "./tabs/AdminHeader";
import AdminSidebar from "./tabs/AdminSidebar";
import BrandingTab from "./tabs/BrandingTab";
import ClientsTab from "./tabs/ClientsTab";
import DashboardTab from "./tabs/DashboardTab";
import BusinessAiTab from "./tabs/BusinessAiTab";
import MarketingAiTab from "./tabs/MarketingAiTab";
import SecretaryAiTab from "./tabs/SecretaryAiTab";
import ReservationsTab from "./tabs/ReservationsTab";
import SalesTab from "./tabs/SalesTab";
import SettingsTab from "./tabs/SettingsTab";
import TeamTab from "./tabs/TeamTab";
import BillingModal from "./tabs/BillingModal";
import QrDownloader from "@/components/QrDownloader";
import { isSubscriptionActive } from "@/features/businesses/subscription-policy";
import type { AdminSettingsSubTab, AdminTabKey } from "./tabs/types";
import styles from "./admin.module.css";

export default function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const {
    business,
    accessDenied,
    appointmentPagination,
    loadingMoreAppointments,
    loading,
    newBookingAlert,
    dismissNewBookingAlert,
    loadAdminData,
    loadMoreAppointments,
  } = useAdminBusiness(slug);
  const brandingEditor = useBrandingEditor(business, slug, loadAdminData);
  const calendar = useAdminCalendar(business?.appointments ?? []);
  const appointmentActions = useAdminAppointmentActions(business?.timezone ?? "UTC", loadAdminData);

  const ownerName = business?.ownerName || "Juan Ortega";
  const ownerInitials = (() => {
    if (!business?.ownerName) return "JO";
    const parts = business.ownerName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return business.ownerName.substring(0, 2).toUpperCase();
  })();

  const [activeTab, setActiveTab] = useState<AdminTabKey>("dashboard");
  const [adminSubTab, setAdminSubTab] = useState<AdminSettingsSubTab>("servicios");
  const [todayReservationsCollapsed, setTodayReservationsCollapsed] = useState(false);
  const [isGearDropdownOpen, setIsGearDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Modales de Cabecera
  const [isFirstStepsModalOpen, setIsFirstStepsModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [hasPromptedPaywall, setHasPromptedPaywall] = useState(false);

  React.useEffect(() => {
    if (business && !isSubscriptionActive(business) && !hasPromptedPaywall) {
      setIsBillingModalOpen(true);
      setHasPromptedPaywall(true);
    }
  }, [business, hasPromptedPaywall]);

  // Estados de la Guía Paso a Paso
  const [isFirstStepsCollapsed, setIsFirstStepsCollapsed] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const [firstStepsChecked, setFirstStepsChecked] = useState<{
    profile: boolean;
    services: boolean;
    whatsapp: boolean;
    payments: boolean;
    share: boolean;
  }>({
    profile: true,
    services: false,
    whatsapp: false,
    payments: false,
    share: false,
  });

  // Sincronizar checklist con datos reales del negocio y localStorage
  React.useEffect(() => {
    if (!business) return;

    const hasCustomProfile = Boolean(
      business.logoUrl ||
      business.landingTitle ||
      business.landingSubtitle ||
      business.landingAbout ||
      business.landingCoverUrl ||
      business.landingPhone
    );
    const hasServices = (business.services?.length || 0) > 0;
    const hasWhatsApp = Boolean(business.landingPhone);
    const hasPayments = Boolean(business.mercadoPagoConnected);

    let savedChecked: Partial<typeof firstStepsChecked> = {};
    try {
      const stored = localStorage.getItem(`agendalink_steps_${slug}`);
      if (stored) savedChecked = JSON.parse(stored);
      const storedCollapsed = localStorage.getItem(`agendalink_steps_collapsed_${slug}`);
      if (storedCollapsed !== null) {
        setIsFirstStepsCollapsed(storedCollapsed === "true");
      }
    } catch {}

    setFirstStepsChecked({
      profile: savedChecked.profile !== undefined ? savedChecked.profile : (hasCustomProfile || true),
      services: savedChecked.services !== undefined ? savedChecked.services : hasServices,
      whatsapp: savedChecked.whatsapp !== undefined ? savedChecked.whatsapp : hasWhatsApp,
      payments: savedChecked.payments !== undefined ? savedChecked.payments : hasPayments,
      share: savedChecked.share !== undefined ? savedChecked.share : false,
    });
  }, [business, slug]);

  const toggleStep = (stepKey: keyof typeof firstStepsChecked) => {
    setFirstStepsChecked(prev => {
      const updated = { ...prev, [stepKey]: !prev[stepKey] };
      try {
        localStorage.setItem(`agendalink_steps_${slug}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleToggleCollapse = () => {
    setIsFirstStepsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(`agendalink_steps_collapsed_${slug}`, String(next));
      } catch {}
      return next;
    });
  };

  const firstStepsProgress = (() => {
    const checkedCount = Object.values(firstStepsChecked).filter(Boolean).length;
    return Math.round((checkedCount / 5) * 100);
  })();

  const formatPrice = (price: number, currency: string) => {
    if (currency === "CLP") {
      return `$${price.toLocaleString("es-CL")}`;
    } else if (currency === "MXN") {
      return `$${price.toLocaleString("es-MX")} MXN`;
    }
    return `$${price.toFixed(2)} USD`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--foreground)" }}>
        <div className={styles.glassCard} style={{ textAlign: "center", padding: "30px" }}>
          <p style={{ fontWeight: 600, fontSize: "16px" }}>Cargando Centro de Control...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--foreground)", padding: "20px" }}>
        <div className={styles.glassCard} style={{ textAlign: "center", maxWidth: "420px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "12px" }}>Acceso restringido</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>Inicia sesión con una cuenta que pertenezca a este negocio.</p>
          <Link href={`/login?next=${encodeURIComponent(`/admin/${slug}`)}`} className={styles.submitButton} style={{ display: "inline-block", width: "auto", padding: "10px 20px" }}>Iniciar sesión</Link>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--foreground)", padding: "20px" }}>
        <div className={styles.glassCard} style={{ textAlign: "center", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "12px" }}>Negocio no encontrado</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>El panel administrativo solicitado no existe.</p>
          <Link href="/" style={{ background: "var(--primary)", color: "white", padding: "10px 20px", borderRadius: "9999px", display: "inline-block", fontWeight: 600 }}>Volver a Inicio</Link>
        </div>
      </div>
    );
  }

  const dashboardMetrics = calculateDashboardMetrics({
    appointments: business.appointments,
    totalAppointments: appointmentPagination.total,
    professionalsCount: business.professionals.length || 1,
    weekDates: calendar.weekDates,
  });
  return (
    <main className={styles.adminContainer}>
      {/* Background Glowing Orbs */}
      <div className={styles.adminGlowOrb1} />
      <div className={styles.adminGlowOrb2} />

      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSettingsTabChange={setAdminSubTab}
      />

      <div className={styles.contentArea}>
        {newBookingAlert && (
          <div
            role="alert"
            style={{
              position: "sticky",
              top: 16,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              background: "linear-gradient(135deg, #0066FF 0%, #004ecc 100%)",
              color: "#ffffff",
              padding: "12px 20px",
              borderRadius: "14px",
              boxShadow: "0 8px 24px rgba(0, 102, 255, 0.35)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "14px", fontWeight: 700 }}>
              <span style={{ fontSize: "18px" }}>🔔</span>
              <span>{newBookingAlert}</span>
            </div>
            <button
              type="button"
              onClick={dismissNewBookingAlert}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "#ffffff",
                width: 26,
                height: 26,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: 14,
              }}
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        )}
        <AdminHeader
          business={business}
          ownerName={ownerName}
          ownerInitials={ownerInitials}
          onTabChange={setActiveTab}
          onSettingsTabChange={setAdminSubTab}
          isGearDropdownOpen={isGearDropdownOpen}
          onGearDropdownChange={setIsGearDropdownOpen}
          isProfileDropdownOpen={isProfileDropdownOpen}
          onProfileDropdownChange={setIsProfileDropdownOpen}
          onOpenFirstSteps={() => {
            setIsFirstStepsCollapsed(false);
            const el = document.getElementById("guia-paso-a-paso");
            if (el) {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              setIsFirstStepsModalOpen(true);
            }
          }}
          onOpenBillingModal={() => setIsBillingModalOpen(true)}
        />

        {!isSubscriptionActive(business) ? (
          <div className={styles.glassCard} style={{ textAlign: "center", padding: "48px 24px", margin: "24px 0", borderRadius: 20 }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>⏱️</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Tu período de prueba gratis ha concluido</h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 540, margin: "0 auto 24px", lineHeight: 1.6 }}>
              Para continuar gestionando citas, consultar tu calendario, ver clientes y reactivar tus reservas públicas en línea, activa tu suscripción mensual protegida por Mercado Pago.
            </p>
            <button
              type="button"
              onClick={() => setIsBillingModalOpen(true)}
              className={styles.submitButton}
              style={{ display: "inline-block", width: "auto", padding: "14px 32px", fontSize: 16, fontWeight: 700 }}
            >
              Ver Planes y Activar Suscripción →
            </button>
          </div>
        ) : (
          <>
            {/* WIDGET PERSISTENTE INTERACTIVO: PRIMEROS PASOS (PASO A PASO) */}
            <section
              id="guia-paso-a-paso"
              className={styles.glassCard}
              style={{
                padding: isFirstStepsCollapsed ? "14px 22px" : "22px 26px",
                borderRadius: "18px",
                marginBottom: "24px",
                border: "1.5px solid rgba(37, 99, 235, 0.2)",
                background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.92) 100%)",
                boxShadow: "0 8px 24px rgba(37, 99, 235, 0.08)",
                transition: "all 0.25s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 12, background: "rgba(37, 99, 235, 0.1)" }}>🚀</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                      Primeros Pasos para lanzar tu Negocio (Paso a Paso)
                    </h3>
                    {!isFirstStepsCollapsed && (
                      <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                        Sigue esta guía paso a paso para configurar tu landing, servicios, WhatsApp, pagos y dejar tu AgendaLink al 100%.
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: "800", color: firstStepsProgress === 100 ? "#16a34a" : "var(--primary)" }}>
                      {firstStepsProgress === 100 ? "🎉 ¡100% Completado!" : `${firstStepsProgress}% completado`}
                    </span>
                    <div className={styles.progressBarBg} style={{ width: "130px", height: "8px", marginTop: "4px" }}>
                      <div
                        className={styles.progressBarFill}
                        style={{
                          width: `${firstStepsProgress}%`,
                          background: firstStepsProgress === 100 ? "#16a34a" : "var(--primary)",
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleCollapse}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      padding: "7px 14px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      color: "#0f172a",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isFirstStepsCollapsed ? "Mostrar pasos 🚀" : "Minimizar ➖"}
                  </button>
                </div>
              </div>

              {!isFirstStepsCollapsed && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px", marginTop: "18px" }}>
                  {/* Paso 1: Landing Page */}
                  <div
                    style={{
                      background: activeTab === "landing" ? "rgba(37, 99, 235, 0.08)" : firstStepsChecked.profile ? "rgba(34, 197, 94, 0.05)" : "#ffffff",
                      border: activeTab === "landing" ? "1.5px solid var(--primary)" : firstStepsChecked.profile ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "14px 15px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: firstStepsChecked.profile ? "#15803d" : "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Paso 1 {activeTab === "landing" && "(Editando)"}
                      </span>
                      <input
                        type="checkbox"
                        checked={firstStepsChecked.profile}
                        onChange={() => toggleStep("profile")}
                        style={{ cursor: "pointer", width: "17px", height: "17px", accentColor: "var(--primary)" }}
                        aria-label="Marcar Paso 1 como completado"
                      />
                    </div>
                    <div>
                      <strong style={{ fontSize: "13px", display: "block", color: "#0f172a", marginBottom: "2px" }}>
                        1. Personalizar Landing
                      </strong>
                      <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4, display: "block" }}>
                        Logo, fotos de portada, historia y dirección.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("landing")}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "var(--primary)",
                        cursor: "pointer",
                      }}
                    >
                      {activeTab === "landing" ? "En esta sección ↓" : "Editar Landing →"}
                    </button>
                  </div>

                  {/* Paso 2: Catálogo de Servicios */}
                  <div
                    style={{
                      background: (activeTab === "administracion" && adminSubTab === "servicios") ? "rgba(37, 99, 235, 0.08)" : firstStepsChecked.services ? "rgba(34, 197, 94, 0.05)" : "#ffffff",
                      border: (activeTab === "administracion" && adminSubTab === "servicios") ? "1.5px solid var(--primary)" : firstStepsChecked.services ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "14px 15px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: firstStepsChecked.services ? "#15803d" : "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Paso 2 {(activeTab === "administracion" && adminSubTab === "servicios") && "(Editando)"}
                      </span>
                      <input
                        type="checkbox"
                        checked={firstStepsChecked.services}
                        onChange={() => toggleStep("services")}
                        style={{ cursor: "pointer", width: "17px", height: "17px", accentColor: "var(--primary)" }}
                        aria-label="Marcar Paso 2 como completado"
                      />
                    </div>
                    <div>
                      <strong style={{ fontSize: "13px", display: "block", color: "#0f172a", marginBottom: "2px" }}>
                        2. Catálogo de Servicios
                      </strong>
                      <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4, display: "block" }}>
                        Nombres, precios y duración de tus citas.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setActiveTab("administracion"); setAdminSubTab("servicios"); }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "var(--primary)",
                        cursor: "pointer",
                      }}
                    >
                      {(activeTab === "administracion" && adminSubTab === "servicios") ? "En esta sección ↓" : "Ver Servicios →"}
                    </button>
                  </div>

                  {/* Paso 3: Vincular WhatsApp */}
                  <div
                    style={{
                      background: (activeTab === "administracion" && adminSubTab === "whatsapp") ? "rgba(37, 99, 235, 0.08)" : firstStepsChecked.whatsapp ? "rgba(34, 197, 94, 0.05)" : "#ffffff",
                      border: (activeTab === "administracion" && adminSubTab === "whatsapp") ? "1.5px solid var(--primary)" : firstStepsChecked.whatsapp ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "14px 15px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: firstStepsChecked.whatsapp ? "#15803d" : "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Paso 3 {(activeTab === "administracion" && adminSubTab === "whatsapp") && "(Editando)"}
                      </span>
                      <input
                        type="checkbox"
                        checked={firstStepsChecked.whatsapp}
                        onChange={() => toggleStep("whatsapp")}
                        style={{ cursor: "pointer", width: "17px", height: "17px", accentColor: "var(--primary)" }}
                        aria-label="Marcar Paso 3 como completado"
                      />
                    </div>
                    <div>
                      <strong style={{ fontSize: "13px", display: "block", color: "#0f172a", marginBottom: "2px" }}>
                        3. Recordatorios WhatsApp
                      </strong>
                      <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4, display: "block" }}>
                        Confirmaciones y avisos en 1 clic gratis.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setActiveTab("administracion"); setAdminSubTab("whatsapp"); }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "var(--primary)",
                        cursor: "pointer",
                      }}
                    >
                      {(activeTab === "administracion" && adminSubTab === "whatsapp") ? "En esta sección ↓" : "Configurar WhatsApp →"}
                    </button>
                  </div>

                  {/* Paso 4: Cobros con Mercado Pago */}
                  <div
                    style={{
                      background: (activeTab === "administracion" && adminSubTab === "pagos") ? "rgba(37, 99, 235, 0.08)" : firstStepsChecked.payments ? "rgba(34, 197, 94, 0.05)" : "#ffffff",
                      border: (activeTab === "administracion" && adminSubTab === "pagos") ? "1.5px solid var(--primary)" : firstStepsChecked.payments ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "14px 15px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: firstStepsChecked.payments ? "#15803d" : "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Paso 4 {(activeTab === "administracion" && adminSubTab === "pagos") && "(Editando)"}
                      </span>
                      <input
                        type="checkbox"
                        checked={firstStepsChecked.payments}
                        onChange={() => toggleStep("payments")}
                        style={{ cursor: "pointer", width: "17px", height: "17px", accentColor: "var(--primary)" }}
                        aria-label="Marcar Paso 4 como completado"
                      />
                    </div>
                    <div>
                      <strong style={{ fontSize: "13px", display: "block", color: "#0f172a", marginBottom: "2px" }}>
                        4. Cobros Mercado Pago
                      </strong>
                      <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4, display: "block" }}>
                        Recibe pagos online con Redcompra y tarjetas.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setActiveTab("administracion"); setAdminSubTab("pagos"); }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "var(--primary)",
                        cursor: "pointer",
                      }}
                    >
                      {(activeTab === "administracion" && adminSubTab === "pagos") ? "En esta sección ↓" : "Configurar Cobros →"}
                    </button>
                  </div>

                  {/* Paso 5: Compartir tu Link y QR */}
                  <div
                    style={{
                      background: firstStepsChecked.share ? "rgba(34, 197, 94, 0.05)" : "#ffffff",
                      border: firstStepsChecked.share ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "14px 15px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: firstStepsChecked.share ? "#15803d" : "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Paso 5
                      </span>
                      <input
                        type="checkbox"
                        checked={firstStepsChecked.share}
                        onChange={() => toggleStep("share")}
                        style={{ cursor: "pointer", width: "17px", height: "17px", accentColor: "var(--primary)" }}
                        aria-label="Marcar Paso 5 como completado"
                      />
                    </div>
                    <div>
                      <strong style={{ fontSize: "13px", display: "block", color: "#0f172a", marginBottom: "2px" }}>
                        5. Compartir con Clientes
                      </strong>
                      <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4, display: "block" }}>
                        Link para Instagram, WhatsApp y QR listo.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "var(--primary)",
                        cursor: "pointer",
                      }}
                    >
                      Ver Enlaces & QR →
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* --- VISTA: GUÍA PASO A PASO DETALLADA --- */}
            {activeTab === "paso-a-paso" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div className={styles.glassCard} style={{ padding: "28px", borderRadius: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "28px" }}>📋</span>
                    <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                      Guía Completa Paso a Paso para tu AgendaLink
                    </h2>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 700, margin: "0 0 24px" }}>
                    Sigue esta secuencia para tener tu plataforma de reservas 100% operativa. Cada paso te llevará directamente a la sección correspondiente del panel.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Item 1 */}
                    <div style={{ display: "flex", gap: "16px", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", background: firstStepsChecked.profile ? "rgba(34, 197, 94, 0.04)" : "#fff", alignItems: "flex-start" }}>
                      <input
                        type="checkbox"
                        checked={firstStepsChecked.profile}
                        onChange={() => toggleStep("profile")}
                        style={{ marginTop: "4px", width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--primary)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", textTransform: "uppercase" }}>Paso 1</span>
                          <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#0f172a" }}>Personalizar Landing Page</h3>
                          {firstStepsChecked.profile && <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", background: "rgba(34, 197, 94, 0.12)", padding: "2px 8px", borderRadius: "99px" }}>✓ Completado</span>}
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
                          Configura el logo de tu negocio, fotos de portada, texto de bienvenida, dirección y redes sociales para que tu landing luzca profesional frente a tus clientes.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab("landing")}
                          className={styles.submitButton}
                          style={{ width: "auto", display: "inline-block", padding: "8px 18px", fontSize: "13px" }}
                        >
                          Ir a Personalizar Landing →
                        </button>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div style={{ display: "flex", gap: "16px", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", background: firstStepsChecked.services ? "rgba(34, 197, 94, 0.04)" : "#fff", alignItems: "flex-start" }}>
                      <input
                        type="checkbox"
                        checked={firstStepsChecked.services}
                        onChange={() => toggleStep("services")}
                        style={{ marginTop: "4px", width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--primary)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", textTransform: "uppercase" }}>Paso 2</span>
                          <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#0f172a" }}>Cargar Catálogo de Servicios</h3>
                          {firstStepsChecked.services && <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", background: "rgba(34, 197, 94, 0.12)", padding: "2px 8px", borderRadius: "99px" }}>✓ Completado</span>}
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
                          Agrega los servicios que ofreces con sus precios en CLP y duración en minutos. El sistema calculará automáticamente los bloques de disponibilidad en tu calendario.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setActiveTab("administracion"); setAdminSubTab("servicios"); }}
                          className={styles.submitButton}
                          style={{ width: "auto", display: "inline-block", padding: "8px 18px", fontSize: "13px" }}
                        >
                          Administrar Servicios →
                        </button>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div style={{ display: "flex", gap: "16px", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", background: firstStepsChecked.whatsapp ? "rgba(34, 197, 94, 0.04)" : "#fff", alignItems: "flex-start" }}>
                      <input
                        type="checkbox"
                        checked={firstStepsChecked.whatsapp}
                        onChange={() => toggleStep("whatsapp")}
                        style={{ marginTop: "4px", width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--primary)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", textTransform: "uppercase" }}>Paso 3</span>
                          <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#0f172a" }}>Recordatorios por WhatsApp en 1 Clic</h3>
                          {firstStepsChecked.whatsapp && <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", background: "rgba(34, 197, 94, 0.12)", padding: "2px 8px", borderRadius: "99px" }}>✓ Completado</span>}
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
                          Configura tu número de WhatsApp para atender dudas de clientes y enviar recordatorios personalizados desde la lista de reservas sin costos adicionales de mensajería.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setActiveTab("administracion"); setAdminSubTab("whatsapp"); }}
                          className={styles.submitButton}
                          style={{ width: "auto", display: "inline-block", padding: "8px 18px", fontSize: "13px" }}
                        >
                          Configurar WhatsApp →
                        </button>
                      </div>
                    </div>

                    {/* Item 4 */}
                    <div style={{ display: "flex", gap: "16px", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", background: firstStepsChecked.payments ? "rgba(34, 197, 94, 0.04)" : "#fff", alignItems: "flex-start" }}>
                      <input
                        type="checkbox"
                        checked={firstStepsChecked.payments}
                        onChange={() => toggleStep("payments")}
                        style={{ marginTop: "4px", width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--primary)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", textTransform: "uppercase" }}>Paso 4</span>
                          <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#0f172a" }}>Cobros Online con Mercado Pago Chile</h3>
                          {firstStepsChecked.payments && <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", background: "rgba(34, 197, 94, 0.12)", padding: "2px 8px", borderRadius: "99px" }}>✓ Conectado</span>}
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
                          Conecta tus credenciales de Mercado Pago para permitir que tus clientes paguen online con Redcompra, tarjetas de débito y crédito al momento de agendar.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setActiveTab("administracion"); setAdminSubTab("pagos"); }}
                          className={styles.submitButton}
                          style={{ width: "auto", display: "inline-block", padding: "8px 18px", fontSize: "13px" }}
                        >
                          Configurar Mercado Pago →
                        </button>
                      </div>
                    </div>

                    {/* Item 5 */}
                    <div style={{ display: "flex", gap: "16px", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", background: firstStepsChecked.share ? "rgba(34, 197, 94, 0.04)" : "#fff", alignItems: "flex-start" }}>
                      <input
                        type="checkbox"
                        checked={firstStepsChecked.share}
                        onChange={() => toggleStep("share")}
                        style={{ marginTop: "4px", width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--primary)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", textTransform: "uppercase" }}>Paso 5</span>
                          <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#0f172a" }}>Compartir tu Link y Código QR</h3>
                          {firstStepsChecked.share && <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", background: "rgba(34, 197, 94, 0.12)", padding: "2px 8px", borderRadius: "99px" }}>✓ Completado</span>}
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
                          Copia tu link público para ponerlo en tu biografía de Instagram, en tu estado de WhatsApp, o descarga tu código QR oficial listo para imprimir en tu local.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsShareModalOpen(true)}
                          className={styles.submitButton}
                          style={{ width: "auto", display: "inline-block", padding: "8px 18px", fontSize: "13px" }}
                        >
                          Ver Enlaces & Descargar QR →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "dashboard" && (
          <DashboardTab
            businessCurrency={business.currency}
            businessTimezone={business.timezone}
            metrics={dashboardMetrics}
            todayReservationsCollapsed={todayReservationsCollapsed}
            formatPrice={formatPrice}
            onToggleTodayReservations={() => setTodayReservationsCollapsed((collapsed) => !collapsed)}
            onViewReservations={() => setActiveTab("reservas")}
          />
        )}



        {activeTab === "calendario" && (
          <AgendaTab
            businessCurrency={business.currency}
            weekDates={calendar.weekDates}
            hourSlots={calendar.hourSlots}
            weekRangeLabel={calendar.weekRangeLabel}
            getAppointmentsForSlot={calendar.getAppointmentsForSlot}
            formatPrice={formatPrice}
            onPreviousWeek={calendar.onPreviousWeek}
            onNextWeek={calendar.onNextWeek}
          />
        )}

        {activeTab === "reservas" && (
          <ReservationsTab
            appointments={business.appointments}
            pagination={appointmentPagination}
            timezone={business.timezone}
            currency={business.currency}
            businessName={business.name}
            reschedulingId={appointmentActions.reschedulingAppointmentId}
            rescheduleDate={appointmentActions.rescheduleDate}
            rescheduleTime={appointmentActions.rescheduleTime}
            actionLoadingId={appointmentActions.loadingAppointmentId}
            loadingMore={loadingMoreAppointments}
            formatPrice={formatPrice}
            onDateChange={appointmentActions.setRescheduleDate}
            onTimeChange={appointmentActions.setRescheduleTime}
            onStartRescheduling={appointmentActions.startRescheduling}
            onCancelRescheduling={appointmentActions.cancelRescheduling}
            onChangeAppointment={(id, change) => void appointmentActions.changeAppointment(id, change)}
            onLoadMore={() => void loadMoreAppointments()}
          />
        )}

        {activeTab === "team" && <TeamTab professionals={business.professionals} />}

        {activeTab === "ventas" && (
          <SalesTab
            appointments={business.appointments}
            timezone={business.timezone}
            currency={business.currency}
            piiRedacted={appointmentPagination.piiRedacted}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === "clientes" && (
          <ClientsTab
            appointments={business.appointments}
            pagination={appointmentPagination}
            timezone={business.timezone}
            loadingMore={loadingMoreAppointments}
            onLoadMore={() => void loadMoreAppointments()}
          />
        )}

        {activeTab === "secretary" && (
          <SecretaryAiTab
            slug={slug}
            businessName={business.name}
            serviceCount={business.services.length}
            services={business.services}
          />
        )}

        {activeTab === "marketing" && (
          <MarketingAiTab
            slug={slug}
            businessName={business.name}
          />
        )}

        {activeTab === "business" && (
          <BusinessAiTab
            slug={slug}
            metrics={dashboardMetrics}
            serviceCount={business.services.length}
            professionalCount={business.professionals.length}
            currency={business.currency}
          />
        )}

        {/* --- VISTA: PERSONALIZAR LANDING --- */}
        {activeTab === "landing" && (
          <BrandingTab
            business={business}
            state={brandingEditor.state}
            isSaving={brandingEditor.isSaving}
            onSave={brandingEditor.save}
            onImageFileChange={brandingEditor.handleImageFileChange}
          />
        )}

        {/* --- VISTA: AJUSTES DE NEGOCIO --- */}
        {activeTab === "administracion" && (
          <SettingsTab
            slug={slug}
            business={business}
            subTab={adminSubTab}
            onSubTabChange={setAdminSubTab}
            formatPrice={formatPrice}
            onServicesChanged={loadAdminData}
          />
        )}
          </>
        )}

        {/* --- MODAL: PRIMEROS PASOS --- */}
        {isFirstStepsModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsFirstStepsModalOpen(false)}>
            <div className={styles.modalContent} style={{ maxWidth: "480px" }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Primeros Pasos en AgendaLink</h3>
                <button className={styles.modalCloseBtn} onClick={() => setIsFirstStepsModalOpen(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                    <span>Progreso de Configuración</span>
                    <span>{firstStepsProgress}%</span>
                  </div>
                  <div className={styles.progressBarBg} style={{ height: "8px" }}>
                    <div className={styles.progressBarFill} style={{ width: `${firstStepsProgress}%`, background: "var(--primary)" }} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className={styles.configToggleRow} style={{ padding: "10px 14px" }}>
                    <div>
                      <strong style={{ fontSize: "13px" }}>1. Personalizar tu Landing Page</strong>
                      <span onClick={() => { setActiveTab("landing"); setIsFirstStepsModalOpen(false); }} style={{ display: "block", fontSize: "11px", color: "var(--primary)", marginTop: "2px", cursor: "pointer" }}>Ir a Personalizar →</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={firstStepsChecked.profile} 
                      onChange={() => toggleStep("profile")}
                      style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }}
                    />
                  </div>

                  <div className={styles.configToggleRow} style={{ padding: "10px 14px" }}>
                    <div>
                      <strong style={{ fontSize: "13px" }}>2. Catálogo de Servicios</strong>
                      <span onClick={() => { setActiveTab("administracion"); setAdminSubTab("servicios"); setIsFirstStepsModalOpen(false); }} style={{ display: "block", fontSize: "11px", color: "var(--primary)", marginTop: "2px", cursor: "pointer" }}>Ir a Servicios →</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={firstStepsChecked.services} 
                      onChange={() => toggleStep("services")}
                      style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }}
                    />
                  </div>

                  <div className={styles.configToggleRow} style={{ padding: "10px 14px" }}>
                    <div>
                      <strong style={{ fontSize: "13px" }}>3. Recordatorios por WhatsApp</strong>
                      <span onClick={() => { setActiveTab("administracion"); setAdminSubTab("whatsapp"); setIsFirstStepsModalOpen(false); }} style={{ display: "block", fontSize: "11px", color: "var(--primary)", marginTop: "2px", cursor: "pointer" }}>Configurar WhatsApp →</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={firstStepsChecked.whatsapp} 
                      onChange={() => toggleStep("whatsapp")}
                      style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }}
                    />
                  </div>

                  <div className={styles.configToggleRow} style={{ padding: "10px 14px" }}>
                    <div>
                      <strong style={{ fontSize: "13px" }}>4. Cobros Online con Mercado Pago</strong>
                      <span onClick={() => { setActiveTab("administracion"); setAdminSubTab("pagos"); setIsFirstStepsModalOpen(false); }} style={{ display: "block", fontSize: "11px", color: "var(--primary)", marginTop: "2px", cursor: "pointer" }}>Conectar Cobros →</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={firstStepsChecked.payments} 
                      onChange={() => toggleStep("payments")}
                      style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }}
                    />
                  </div>

                  <div className={styles.configToggleRow} style={{ padding: "10px 14px" }}>
                    <div>
                      <strong style={{ fontSize: "13px" }}>5. Compartir Enlaces y Código QR</strong>
                      <span onClick={() => { setIsFirstStepsModalOpen(false); setIsShareModalOpen(true); }} style={{ display: "block", fontSize: "11px", color: "var(--primary)", marginTop: "2px", cursor: "pointer" }}>Ver Enlaces y QR →</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={firstStepsChecked.share} 
                      onChange={() => toggleStep("share")}
                      style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: COMPARTIR ENLACES Y CÓDIGO QR --- */}
        {isShareModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsShareModalOpen(false)}>
            <div className={styles.modalContent} style={{ maxWidth: "540px", padding: "26px" }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader} style={{ marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    🚀 Comparte tu AgendaLink
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                    Tus clientes podrán reservar 24/7 sin descargar apps ni contraseñas.
                  </p>
                </div>
                <button className={styles.modalCloseBtn} onClick={() => setIsShareModalOpen(false)}>✕</button>
              </div>

              <div className={styles.modalBody} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Enlace directo */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                    Tu enlace público de reservas:
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== "undefined" ? `${window.location.origin}/${business.slug}` : `https://agendalink.cl/${business.slug}`}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "13.5px",
                        fontWeight: "600",
                        color: "#0f172a",
                        background: "#f8fafc",
                      }}
                      onFocus={e => e.target.select()}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/${business.slug}`;
                        navigator.clipboard.writeText(url);
                        setCopiedShareLink(true);
                        setTimeout(() => setCopiedShareLink(false), 2500);
                        if (!firstStepsChecked.share) toggleStep("share");
                      }}
                      className={styles.submitButton}
                      style={{ width: "auto", padding: "10px 18px", whiteSpace: "nowrap", fontSize: "13px" }}
                    >
                      {copiedShareLink ? "✓ ¡Copiado!" : "Copiar Link"}
                    </button>
                  </div>
                </div>

                {/* Acciones directas de difusión */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Hola! Ya puedes agendar tu cita online directamente aquí: ${typeof window !== "undefined" ? window.location.origin : "https://agendalink.cl"}/${business.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => { if (!firstStepsChecked.share) toggleStep("share"); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#25D366",
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "13px",
                      textDecoration: "none",
                    }}
                  >
                    <span>💬</span> Enviar por WhatsApp
                  </a>

                  <Link
                    href={`/${business.slug}`}
                    target="_blank"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      background: "#fff",
                      color: "#0f172a",
                      fontWeight: "700",
                      fontSize: "13px",
                      textDecoration: "none",
                    }}
                  >
                    <span>🔗</span> Ver Link Público ↗
                  </Link>
                </div>

                {/* Consejo Instagram */}
                <div style={{ background: "#f1f5f9", padding: "12px 14px", borderRadius: "10px", fontSize: "12.5px", color: "#334155", lineHeight: 1.5 }}>
                  💡 <strong>Tip pro:</strong> Pega tu enlace en la biografía de Instagram o TikTok y agrégalo en tu respuesta automática de WhatsApp Business.
                </div>

                {/* Código QR con descarga/impresión */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", textAlign: "center" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "10px" }}>
                    Código QR para Vitrinas, Mesas o Mostrador
                  </label>
                  <QrDownloader slug={business.slug} businessName={business.name} />
                </div>
              </div>
            </div>
          </div>
        )}
 
        <BillingModal
          business={business}
          isOpen={isBillingModalOpen}
          onClose={() => setIsBillingModalOpen(false)}
          isEnforcedPaywall={!isSubscriptionActive(business)}
        />

      </div>
    </main>
  );
}
