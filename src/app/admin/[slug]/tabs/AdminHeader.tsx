"use client";

import Link from "next/link";
import type { BusinessAdminDTO } from "@/features/businesses/contracts";
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
}: AdminHeaderProps) {
  return (
    <header className={styles.dashboardHeader}>
      <div>
        <h1 className={styles.dashboardTitle}>{business.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Panel de Administración · Plan Automático: {business.teamSize}
          </p>
          <span className={styles.statusBadge}><span className={styles.statusDot} />Activo</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
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
            <button className={styles.profileDropdownItem} disabled title="El cobro de suscripciones no está conectado">Facturación no disponible</button>
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
            <button className={styles.profileDropdownItem} disabled title="El cobro de reservas no está conectado">Pagos no disponibles</button>
            <div className={styles.profileDropdownDivider} />
            <Link href="/" className={styles.profileDropdownItemLogout}>Cerrar sesión</Link>
          </div>
        )}
      </div>
    </header>
  );
}
