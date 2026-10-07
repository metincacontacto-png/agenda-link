"use client";

import type { ReactNode } from "react";
import styles from "../admin.module.css";
import type { AdminSettingsSubTab, AdminTabKey } from "./types";

interface AdminSidebarProps {
  activeTab: AdminTabKey;
  onTabChange: (tab: AdminTabKey) => void;
  onSettingsTabChange: (tab: AdminSettingsSubTab) => void;
}

export default function AdminSidebar({ activeTab, onTabChange, onSettingsTabChange }: AdminSidebarProps) {
  const navButton = (tab: AdminTabKey, label: string, icon: ReactNode) => (
    <button className={`${styles.navItem} ${activeTab === tab ? styles.navItemActive : ""}`} onClick={() => onTabChange(tab)}>
      {icon}
      {label}
    </button>
  );

  return (
    <div className={styles.sidebar}>
      <div className={styles.brandLogo}>
        <img src="/logo.png" alt="AgendaLink" style={{ height: 24 }} />
        <span style={{ fontWeight: 800, fontSize: 19, color: "#000000", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.04em" }}>agenda link</span>
      </div>

      <span className={styles.navSectionTitle}>Operación</span>
      <nav className={styles.navList}>
        {navButton("dashboard", "Dashboard Resumen", <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>)}
        {navButton("calendario", "Vista Calendario", <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>)}
        {navButton("reservas", "Lista de Reservas", <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="15" y2="16" /><line x1="9" y1="8" x2="10" y2="8" /></svg>)}
        {navButton("team", "Equipo", <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>)}
        {navButton("ventas", "Ventas y Caja", <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>)}
        {navButton("clientes", "Base de Clientes", <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>)}
      </nav>

      <span className={styles.navSectionTitle}>Asistentes Linki IA</span>
      <nav className={styles.navList}>
        {navButton("secretary", "Linki Secretary", <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>)}
        {navButton("marketing", "Linki Marketing", <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 6l-8.5 8.5-5-5L1 18" /><polyline points="17 6 23 6 23 12" /></svg>)}
        {navButton("business", "Linki Business", <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-4.12 2.5 2.5 0 0 1 0-4.12A2.5 2.5 0 0 0 14.5 2z" /></svg>)}
      </nav>

      <span className={styles.navSectionTitle}>Configuración</span>
      <nav className={styles.navList}>
        {navButton("landing", "Personalizar Landing", <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>)}
        <button className={`${styles.navItem} ${activeTab === "administracion" ? styles.navItemActive : ""}`} onClick={() => { onTabChange("administracion"); onSettingsTabChange("servicios"); }}>
          <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          Ajustes de Negocio
        </button>
      </nav>
    </div>
  );
}
