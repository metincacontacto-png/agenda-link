"use client";

import { useState } from "react";
import Link from "next/link";
import type { BusinessAdminDTO } from "@/features/businesses/contracts";
import { getTrialDaysRemaining } from "@/features/businesses/subscription-policy";
import styles from "../admin.module.css";
import type { AdminSettingsSubTab, AdminTabKey } from "./types";

interface AdminHeaderProps {
  business: BusinessAdminDTO;
  ownerName: string;
  ownerInitials: string;
  onTabChange: (tab: AdminTabKey) => void;
  onSettingsTabChange: (tab: AdminSettingsSubTab) => void;
  isGearDropdownOpen: boolean;
  onGearDropdownChange: (open: boolean) => void;
  isProfileDropdownOpen: boolean;
  onProfileDropdownChange: (open: boolean) => void;
  onOpenFirstSteps: () => void;
  onOpenBillingModal: () => void;
}

export default function AdminHeader({
  business,
  ownerName,
  ownerInitials,
  onTabChange,
  onSettingsTabChange,
  isGearDropdownOpen,
  onGearDropdownChange,
  isProfileDropdownOpen,
  onProfileDropdownChange,
  onOpenFirstSteps,
  onOpenBillingModal,
}: AdminHeaderProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = async () => {
    try {
      const url = typeof window !== "undefined"
        ? `${window.location.origin}/${business.slug}`
        : `https://agendalink.cl/${business.slug}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const daysRemaining = getTrialDaysRemaining(business.trialEndsAt);
  const isTrial = business.subscriptionStatus === "TRIALING" && !business.billingBypass;
  const isActive = business.subscriptionStatus === "ACTIVE" || business.billingBypass;

  return (
    <header className={styles.dashboardHeader}>
      <div>
        <h1 className={styles.dashboardTitle}>{business.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Panel de Administración · Plan: {business.subscriptionPlan || business.plan}
          </p>
          {business.billingBypass ? (
            <span className={styles.statusBadge} style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0369a1" }}>
              Bypass Activo
            </span>
          ) : business.subscriptionStatus === "ACTIVE" ? (
            <span className={styles.statusBadge}>
              <span className={styles.statusDot} />
              Suscripción Activa
            </span>
          ) : isTrial && daysRemaining > 0 ? (
            <button
              type="button"
              onClick={onOpenBillingModal}
              style={{
                background: daysRemaining <= 3 ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                color: daysRemaining <= 3 ? "#b45309" : "#047857",
                border: "none",
                borderRadius: 999,
                padding: "2px 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              title="Haz clic para ver o activar planes de suscripción"
            >
              <span>⏱️ {daysRemaining} {daysRemaining === 1 ? "día de prueba" : "días de prueba"}</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>· Ver planes</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenBillingModal}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                color: "#b91c1c",
                border: "none",
                borderRadius: 999,
                padding: "2px 10px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Período de prueba terminado. Haz clic para activar tu plan."
            >
              ⚠️ Prueba expirada · Activar plan
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
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
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            whiteSpace: "nowrap",
          }}
          title="Copiar link público para compartir con clientes"
        >
          {copiedLink ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              ¡Link Copiado!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copiar Link
            </>
          )}
        </button>
        <Link href={`/${business.slug}`} target="_blank" className={styles.publicLinkBtn}>Ver link público ↗</Link>
        <button
          type="button"
          aria-label="Configuración rápida"
          className={styles.settingsGearBtn}
          onClick={() => { onGearDropdownChange(!isGearDropdownOpen); onProfileDropdownChange(false); }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </button>
        <button
          type="button"
          aria-label="Perfil de usuario"
          className={styles.profileAvatarBtn}
          onClick={() => { onProfileDropdownChange(!isProfileDropdownOpen); onGearDropdownChange(false); }}
        >
          {ownerInitials}
        </button>

        {isGearDropdownOpen && (
          <div className={styles.settingsDropdown}>
            <button className={styles.profileDropdownItem} onClick={() => { onTabChange("landing"); onGearDropdownChange(false); }}>Configuraciones</button>
            <button className={styles.profileDropdownItem} onClick={() => { onTabChange("administracion"); onSettingsTabChange("servicios"); onGearDropdownChange(false); }}>Servicios y recursos</button>
            <button className={styles.profileDropdownItem} onClick={() => { onTabChange("administracion"); onSettingsTabChange("pagos"); onGearDropdownChange(false); }}>Cobros Online (Mercado Pago)</button>
            <button className={styles.profileDropdownItem} onClick={() => { onOpenBillingModal(); onGearDropdownChange(false); }}>Facturación y Planes</button>
          </div>
        )}

        {isProfileDropdownOpen && (
          <div className={styles.profileDropdown}>
            <div className={styles.profileDropdownHeader}>
              <div className={styles.profileHeaderAvatar}>{ownerInitials}</div>
              <div>
                <div style={{ fontWeight: "bold", fontSize: 14 }}>{ownerName}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Administrador</div>
              </div>
            </div>
            <div className={styles.profileDropdownDivider} />
            <button className={styles.profileDropdownItem} onClick={() => { onOpenFirstSteps(); onProfileDropdownChange(false); }}>
              Primeros pasos
            </button>
            <button className={styles.profileDropdownItem} disabled title="No hay recursos descargables disponibles">Descargas no disponibles</button>
            <button className={styles.profileDropdownItem} disabled title="El programa de referidos no está habilitado">Referidos no disponibles</button>
            <button className={styles.profileDropdownItem} disabled title="No hay tutoriales publicados todavía">Tutoriales no disponibles</button>
            <button className={styles.profileDropdownItem} onClick={() => { onTabChange("administracion"); onSettingsTabChange("pagos"); onProfileDropdownChange(false); }}>Cobros con Mercado Pago</button>
            <div className={styles.profileDropdownDivider} />
            <Link href="/" className={styles.profileDropdownItemLogout}>Cerrar sesión</Link>
          </div>
        )}
      </div>
    </header>
  );
}
