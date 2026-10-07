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
import BusinessOverviewTab from "./tabs/BusinessOverviewTab";
import ClientsTab from "./tabs/ClientsTab";
import DashboardTab from "./tabs/DashboardTab";
import IntegrationStatusTab from "./tabs/IntegrationStatusTab";
import ReservationsTab from "./tabs/ReservationsTab";
import SalesTab from "./tabs/SalesTab";
import SettingsTab from "./tabs/SettingsTab";
import TeamTab from "./tabs/TeamTab";
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

  const isFeatureRestricted = (requiredPlan: "EQUIPO" | "NEGOCIO"): boolean => {
    if (!business) return true;
    if (business.billingBypass) return false;
    
    if (requiredPlan === "EQUIPO") {
      return business.plan === "INDIVIDUAL";
    }
    if (requiredPlan === "NEGOCIO") {
      return business.plan === "INDIVIDUAL" || business.plan === "EQUIPO";
    }
    return false;
  };

  const renderUpgradePrompt = (planRequired: "EQUIPO" | "NEGOCIO", featureName: string) => {
    return (
      <section className={styles.glassCard} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "54px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px", color: "var(--foreground)" }}>
          {featureName} no está habilitado
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "480px", lineHeight: "1.5", marginBottom: "24px" }}>
          Esta función requiere configuración adicional y un proveedor real. No se activará automáticamente al cambiar el plan.
        </p>
        <span role="status" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Plan actual: {business?.plan} · Plan requerido: {planRequired}</span>
      </section>
    );
  };
  const [activeTab, setActiveTab] = useState<AdminTabKey>("dashboard");
  const [adminSubTab, setAdminSubTab] = useState<AdminSettingsSubTab>("servicios");
  const [todayReservationsCollapsed, setTodayReservationsCollapsed] = useState(false);
  const [isGearDropdownOpen, setIsGearDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Modales de Cabecera
  const [isFirstStepsModalOpen, setIsFirstStepsModalOpen] = useState(false);

  // Checklist de Primeros Pasos
  const [firstStepsChecked, setFirstStepsChecked] = useState({
    profile: true,
    services: false,
    share: false
  });

  const firstStepsProgress = (() => {
    const checkedCount = Object.values(firstStepsChecked).filter(Boolean).length;
    return Math.round((checkedCount / 3) * 100);
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
          onOpenFirstSteps={() => setIsFirstStepsModalOpen(true)}
        />

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
          isFeatureRestricted("EQUIPO")
            ? renderUpgradePrompt("EQUIPO", "Linki Secretary")
            : <IntegrationStatusTab title="Linki Secretary" description="El asistente de WhatsApp no está conectado. No se envían mensajes ni se confirman reservas automáticamente." />
        )}

        {activeTab === "marketing" && (
          isFeatureRestricted("EQUIPO")
            ? renderUpgradePrompt("EQUIPO", "Linki Marketing")
            : <IntegrationStatusTab title="Linki Marketing" description="Las campañas y los mensajes promocionales no están disponibles hasta conectar y configurar un proveedor de mensajería." />
        )}

        {activeTab === "business" && (
          isFeatureRestricted("NEGOCIO")
            ? renderUpgradePrompt("NEGOCIO", "Linki Business")
            : <BusinessOverviewTab
                metrics={dashboardMetrics}
                serviceCount={business.services.length}
                professionalCount={business.professionals.length}
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

        {/* --- MODAL: PRIMEROS PASOS --- */}
        {isFirstStepsModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsFirstStepsModalOpen(false)}>
            <div className={styles.modalContent} style={{ maxWidth: "460px" }} onClick={e => e.stopPropagation()}>
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

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className={styles.configToggleRow} style={{ padding: "12px 16px" }}>
                    <div>
                      <strong style={{ fontSize: "13.5px" }}>1. Personalizar tu Landing Page</strong>
                      <span onClick={() => { setActiveTab("landing"); setIsFirstStepsModalOpen(false); }} style={{ display: "block", fontSize: "11px", color: "var(--primary)", marginTop: "2px", cursor: "pointer" }}>Ir a Personalizar →</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={firstStepsChecked.profile} 
                      onChange={() => setFirstStepsChecked(prev => ({ ...prev, profile: !prev.profile }))}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                  </div>

                  <div className={styles.configToggleRow} style={{ padding: "12px 16px" }}>
                    <div>
                      <strong style={{ fontSize: "13.5px" }}>2. Cargar tu Catálogo de Servicios</strong>
                      <span onClick={() => { setActiveTab("administracion"); setAdminSubTab("servicios"); setIsFirstStepsModalOpen(false); }} style={{ display: "block", fontSize: "11px", color: "var(--primary)", marginTop: "2px", cursor: "pointer" }}>Ir a Servicios →</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={firstStepsChecked.services} 
                      onChange={() => setFirstStepsChecked(prev => ({ ...prev, services: !prev.services }))}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                  </div>

                  <div className={styles.configToggleRow} style={{ padding: "12px 16px" }}>
                    <div>
                      <strong style={{ fontSize: "13.5px" }}>3. Compartir Link con tus Clientes</strong>
                      <Link href={`/${business.slug}`} target="_blank" onClick={() => setIsFirstStepsModalOpen(false)} style={{ display: "block", fontSize: "11px", color: "var(--primary)", marginTop: "2px", cursor: "pointer" }}>Abrir enlace público →</Link>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={firstStepsChecked.share} 
                      onChange={() => setFirstStepsChecked(prev => ({ ...prev, share: !prev.share }))}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
