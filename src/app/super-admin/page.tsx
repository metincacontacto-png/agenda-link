"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./super-admin.module.css";

interface Business {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  email: string;
  landingPhone: string | null;
  category: string;
  country: string;
  teamSize: string;
  plan: string;
  billingBypass: boolean;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionPlan: string | null;
  currentPeriodEnd: string | null;
  customDomain: string | null;
  mercadoPagoConnected: boolean;
  createdAt: string;
  _count?: {
    appointments: number;
    services: number;
    professionals: number;
  };
}

type FilterCategory = "all" | "active" | "trial" | "expired" | "bypass" | "mp";

function getBusinessStatus(biz: Business): {
  key: "bypass" | "active" | "trial" | "expired" | "cancelled";
  label: string;
  badgeStyle: React.CSSProperties;
  details: string;
} {
  if (biz.billingBypass) {
    return {
      key: "bypass",
      label: "⭐ Bypass Activo",
      badgeStyle: { background: "rgba(168, 85, 247, 0.12)", color: "#9333ea", border: "1px solid rgba(168, 85, 247, 0.25)" },
      details: "Acceso libre concedido",
    };
  }

  if (biz.subscriptionStatus === "ACTIVE") {
    const end = biz.currentPeriodEnd ? new Date(biz.currentPeriodEnd).toLocaleDateString("es-CL") : null;
    return {
      key: "active",
      label: "🟢 Activa (Pagando)",
      badgeStyle: { background: "rgba(34, 197, 94, 0.12)", color: "#16a34a", border: "1px solid rgba(34, 197, 94, 0.25)" },
      details: end ? `Renueva: ${end}` : "Suscripción activa",
    };
  }

  if (biz.subscriptionStatus === "CANCELLED" || biz.subscriptionStatus === "PAST_DUE") {
    return {
      key: "cancelled",
      label: "🔴 Cancelado / Impago",
      badgeStyle: { background: "rgba(239, 68, 68, 0.12)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.25)" },
      details: "Suscripción inactiva",
    };
  }

  // TRIALING
  if (biz.trialEndsAt) {
    const remainingDays = Math.ceil((new Date(biz.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (remainingDays > 0) {
      return {
        key: "trial",
        label: `⏱️ En Prueba (${remainingDays}d)`,
        badgeStyle: { background: "rgba(59, 130, 246, 0.12)", color: "#2563eb", border: "1px solid rgba(59, 130, 246, 0.25)" },
        details: `${remainingDays} días restantes`,
      };
    } else {
      return {
        key: "expired",
        label: "⚠️ Prueba Expirada",
        badgeStyle: { background: "rgba(245, 158, 11, 0.15)", color: "#b45309", border: "1px solid rgba(245, 158, 11, 0.3)" },
        details: "Requiere activar plan",
      };
    }
  }

  return {
    key: "trial",
    label: "⏱️ En Prueba",
    badgeStyle: { background: "rgba(59, 130, 246, 0.12)", color: "#2563eb", border: "1px solid rgba(59, 130, 246, 0.25)" },
    details: "Período de prueba",
  };
}

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterCategory>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // States for Editing Custom Domain
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [tempDomain, setTempDomain] = useState("");

  // States for Maintenance Mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);

  const verifyAndLoad = async () => {
    try {
      const res = await fetch("/api/super-admin");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBusinesses(data.businesses);
          setMaintenanceMode(data.maintenanceMode || false);
          setIsAuthenticated(true);
          setAuthError("");
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setIsAuthenticated(false);
        setAuthError(res.status === 403
          ? "Tu cuenta no tiene permisos de Super Admin."
          : res.status === 401
            ? "Inicia sesión para continuar."
            : `No se pudo validar el acceso (${res.status}): ${errData.error || "Error"}`);
      }
    } catch (err) {
      console.error(err);
      setAuthError("Error de conexión al validar el acceso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void verifyAndLoad(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setIsAuthenticated(false);
    setBusinesses([]);
    setAuthError("Sesión cerrada.");
  };

  const handleToggleMaintenance = async () => {
    setIsMaintenanceLoading(true);
    const newValue = !maintenanceMode;
    
    try {
      const res = await fetch("/api/super-admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isMaintenanceToggle: true,
          maintenanceMode: newValue
        })
      });

      const data = await res.json();
      if (data.success) {
        setMaintenanceMode(data.maintenanceMode);
        alert(
          data.maintenanceMode 
            ? "⚠️ Modo Mantenimiento ACTIVADO globalmente. Todas las páginas mostrarán la pantalla de mantenimiento." 
            : "✅ Modo Mantenimiento DESACTIVADO globalmente. Acceso normal restablecido."
        );
      } else {
        alert(data.error || "Error al cambiar modo mantenimiento");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red al cambiar modo mantenimiento");
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  const handleUpdateField = async (
    slug: string,
    field: "plan" | "billingBypass" | "customDomain" | "subscriptionStatus",
    value: string | boolean | null
  ) => {
    setActionLoading(`${slug}_${field}`);
    
    try {
      const res = await fetch("/api/super-admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          [field]: value
        })
      });

      const data = await res.json();
      if (data.success) {
        setBusinesses(prev => prev.map(biz => {
          if (biz.slug === slug) {
            return { ...biz, [field]: value };
          }
          return biz;
        }));
        
        if (field === "customDomain") {
          setEditingSlug(null);
        }
      } else {
        alert(data.error || "Error al actualizar campo");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red al actualizar");
    } finally {
      setActionLoading(null);
    }
  };

  // KPIs
  const totalCount = businesses.length;
  const activeCount = businesses.filter(b => b.subscriptionStatus === "ACTIVE").length;
  const trialCount = businesses.filter(b => {
    const s = getBusinessStatus(b);
    return s.key === "trial";
  }).length;
  const expiredCount = businesses.filter(b => {
    const s = getBusinessStatus(b);
    return s.key === "expired" || s.key === "cancelled";
  }).length;
  const bypassCount = businesses.filter(b => b.billingBypass).length;
  const mpCount = businesses.filter(b => b.mercadoPagoConnected).length;

  const filteredBusinesses = businesses.filter(biz => {
    // 1. Filtro de búsqueda
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      biz.name.toLowerCase().includes(q) ||
      biz.slug.toLowerCase().includes(q) ||
      biz.ownerName.toLowerCase().includes(q) ||
      (biz.email && biz.email.toLowerCase().includes(q)) ||
      (biz.landingPhone && biz.landingPhone.includes(q))
    );

    if (!matchesSearch) return false;

    // 2. Filtro de categoría
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return biz.subscriptionStatus === "ACTIVE";
    if (statusFilter === "trial") {
      const s = getBusinessStatus(biz);
      return s.key === "trial";
    }
    if (statusFilter === "expired") {
      const s = getBusinessStatus(biz);
      return s.key === "expired" || s.key === "cancelled";
    }
    if (statusFilter === "bypass") return biz.billingBypass;
    if (statusFilter === "mp") return biz.mercadoPagoConnected;

    return true;
  });

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Cargando Super Admin...</p>
      </div>
    );
  }

  // 1. Acceso protegido por sesión y rol global
  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "36px" }}>🔒</span>
            <h1 className={styles.loginTitle}>AgendaLink Super Admin</h1>
            <p className={styles.loginSubtitle}>Se requiere una cuenta con rol global de Super Admin.</p>
          </div>

          {authError && <div className={styles.authError}>{authError}</div>}
          <Link href="/login?next=%2Fsuper-admin" className={styles.submitBtn} style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  // 2. Dashboard de Super Admin
  return (
    <div className={styles.adminWrapper}>
      {/* Cabecera */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel de Super Admin</h1>
          <p className={styles.subtitle}>Supervisión en tiempo real de cuentas activas, planes, contactos y suscripciones.</p>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Cerrar Sesión ➔
        </button>
      </header>

      {/* Alerta de mantenimiento activo */}
      {maintenanceMode && (
        <div style={{ background: "rgba(255, 59, 48, 0.08)", border: "1px solid rgba(255, 59, 48, 0.2)", padding: "14px 20px", borderRadius: "16px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>⚠️</span>
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#ff3b30", margin: 0 }}>Modo Mantenimiento Activo</h3>
            <p style={{ fontSize: "12px", color: "#8e8e93", margin: "2px 0 0 0" }}>La plataforma completa se encuentra bloqueada para clientes y dueños de negocio. Solo el Super Admin tiene acceso.</p>
          </div>
        </div>
      )}

      {/* Tarjeta de Mantenimiento Global */}
      <section className={styles.glassCard} style={{ padding: "18px 24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "4px", color: "var(--foreground)" }}>🔧 Modo Mantenimiento Global</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0 }}>Pausa el acceso general a todas las landings y agendas de la plataforma ante actualizaciones mayores.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            disabled={isMaintenanceLoading}
            onClick={handleToggleMaintenance}
            className={`${styles.iosToggle} ${maintenanceMode ? styles.iosToggleActive : ""}`}
            style={maintenanceMode ? { backgroundColor: "#ff3b30" } : {}}
            aria-label="Toggle modo mantenimiento"
          >
            <span className={styles.iosToggleDot} />
          </button>
          <span style={{ fontSize: "13px", fontWeight: "750", color: maintenanceMode ? "#ff3b30" : "var(--text-secondary)" }}>
            {maintenanceMode ? "Mantenimiento Activo" : "Plataforma Online"}
          </span>
        </div>
      </section>

      {/* Tarjetas KPI de Resumen de Cuentas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", border: "1px solid var(--card-border)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Cuentas</span>
          <strong style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", marginTop: "4px" }}>{totalCount}</strong>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Registradas en el sistema</span>
        </div>
        <div style={{ background: "rgba(34, 197, 94, 0.05)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px" }}>🟢 Pagando Activo</span>
          <strong style={{ fontSize: "28px", fontWeight: "900", color: "#16a34a", marginTop: "4px" }}>{activeCount}</strong>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Suscripciones MP al día</span>
        </div>
        <div style={{ background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>⏱️ En Período de Prueba</span>
          <strong style={{ fontSize: "28px", fontWeight: "900", color: "#2563eb", marginTop: "4px" }}>{trialCount}</strong>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Pruebas vigentes (14 días)</span>
        </div>
        <div style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#b45309", textTransform: "uppercase", letterSpacing: "0.5px" }}>⚠️ Prueba Vencida</span>
          <strong style={{ fontSize: "28px", fontWeight: "900", color: "#b45309", marginTop: "4px" }}>{expiredCount}</strong>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Sin suscripción activa</span>
        </div>
        <div style={{ background: "rgba(168, 85, 247, 0.05)", border: "1px solid rgba(168, 85, 247, 0.2)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#9333ea", textTransform: "uppercase", letterSpacing: "0.5px" }}>⭐ Con Bypass</span>
          <strong style={{ fontSize: "28px", fontWeight: "900", color: "#9333ea", marginTop: "4px" }}>{bypassCount}</strong>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Acceso gratis habilitado</span>
        </div>
        <div style={{ background: "rgba(0, 102, 255, 0.05)", border: "1px solid rgba(0, 102, 255, 0.2)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#0066FF", textTransform: "uppercase", letterSpacing: "0.5px" }}>💳 Mercado Pago</span>
          <strong style={{ fontSize: "28px", fontWeight: "900", color: "#0066FF", marginTop: "4px" }}>{mpCount}</strong>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Cobros directos activos</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        {/* Pills de Filtrado Rápido */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "99px",
              border: statusFilter === "all" ? "1px solid #0066FF" : "1px solid #e2e8f0",
              background: statusFilter === "all" ? "#0066FF" : "#ffffff",
              color: statusFilter === "all" ? "#ffffff" : "#475569",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Todos ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            style={{
              padding: "6px 14px",
              borderRadius: "99px",
              border: statusFilter === "active" ? "1px solid #16a34a" : "1px solid #e2e8f0",
              background: statusFilter === "active" ? "#16a34a" : "#ffffff",
              color: statusFilter === "active" ? "#ffffff" : "#475569",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🟢 Activos / Pagando ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("trial")}
            style={{
              padding: "6px 14px",
              borderRadius: "99px",
              border: statusFilter === "trial" ? "1px solid #2563eb" : "1px solid #e2e8f0",
              background: statusFilter === "trial" ? "#2563eb" : "#ffffff",
              color: statusFilter === "trial" ? "#ffffff" : "#475569",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ⏱️ En Prueba ({trialCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("expired")}
            style={{
              padding: "6px 14px",
              borderRadius: "99px",
              border: statusFilter === "expired" ? "1px solid #b45309" : "1px solid #e2e8f0",
              background: statusFilter === "expired" ? "#b45309" : "#ffffff",
              color: statusFilter === "expired" ? "#ffffff" : "#475569",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ⚠️ Vencidos ({expiredCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("bypass")}
            style={{
              padding: "6px 14px",
              borderRadius: "99px",
              border: statusFilter === "bypass" ? "1px solid #9333ea" : "1px solid #e2e8f0",
              background: statusFilter === "bypass" ? "#9333ea" : "#ffffff",
              color: statusFilter === "bypass" ? "#ffffff" : "#475569",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ⭐ Con Bypass ({bypassCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("mp")}
            style={{
              padding: "6px 14px",
              borderRadius: "99px",
              border: statusFilter === "mp" ? "1px solid #0066FF" : "1px solid #e2e8f0",
              background: statusFilter === "mp" ? "#eff6ff" : "#ffffff",
              color: statusFilter === "mp" ? "#0066FF" : "#475569",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            💳 Cobros MP Activos ({mpCount})
          </button>
        </div>

        {/* Input Buscador */}
        <div className={styles.topControlRow}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por negocio, slug, dueño, email o teléfono..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
            Mostrando {filteredBusinesses.length} de {businesses.length}
          </div>
        </div>
      </div>

      {/* Tabla Enriquecida de Negocios */}
      <section className={styles.glassCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Negocio & Enlaces</th>
                <th>Dueño & Contacto</th>
                <th>Estado de Suscripción</th>
                <th>Plan SaaS</th>
                <th>Cobros Directos MP</th>
                <th>Actividad</th>
                <th>Bypass (Acceso Libre)</th>
                <th>Dominio Propio</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                    No se encontraron negocios con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((biz) => {
                  const isPlanLoading = actionLoading === `${biz.slug}_plan`;
                  const isBypassLoading = actionLoading === `${biz.slug}_billingBypass`;
                  const isDomainLoading = actionLoading === `${biz.slug}_customDomain`;
                  const isStatusLoading = actionLoading === `${biz.slug}_subscriptionStatus`;
                  const statusInfo = getBusinessStatus(biz);
                  const cleanPhone = (biz.landingPhone || "").replace(/\D/g, "");
                  
                  return (
                    <tr key={biz.id}>
                      {/* 1. Negocio y Enlaces */}
                      <td>
                        <div style={{ fontWeight: "700", color: "var(--foreground)", fontSize: "14px" }}>
                          {biz.name}
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                          <a 
                            href={`/${biz.slug}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className={styles.businessLink}
                            title="Ver página pública de reservas"
                          >
                            /{biz.slug} ↗
                          </a>
                          <span style={{ color: "#cbd5e1" }}>•</span>
                          <a
                            href={`/admin/${biz.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: "11px", color: "#0066FF", textDecoration: "none", fontWeight: "600" }}
                            title="Entrar a su panel de administración"
                          >
                            Panel ⚙️
                          </a>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          Reg: {new Date(biz.createdAt).toLocaleDateString("es-CL")}
                        </div>
                      </td>

                      {/* 2. Dueño & Contacto */}
                      <td>
                        <div style={{ fontWeight: "600", color: "#1e293b" }}>{biz.ownerName}</div>
                        {biz.email ? (
                          <div style={{ marginTop: "2px" }}>
                            <a
                              href={`mailto:${biz.email}`}
                              style={{ fontSize: "12px", color: "#0066FF", textDecoration: "none" }}
                              title="Enviar correo"
                            >
                              ✉️ {biz.email}
                            </a>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Sin email</span>
                        )}
                        {biz.landingPhone && (
                          <div style={{ marginTop: "2px" }}>
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "11.5px", color: "#16a34a", textDecoration: "none", fontWeight: "600" }}
                              title="Contactar por WhatsApp"
                            >
                              💬 {biz.landingPhone}
                            </a>
                          </div>
                        )}
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {biz.category} • {biz.country}
                        </div>
                      </td>

                      {/* 3. Estado de Suscripción */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span
                            style={{
                              ...statusInfo.badgeStyle,
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              display: "inline-block",
                              width: "fit-content",
                            }}
                          >
                            {statusInfo.label}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {statusInfo.details}
                          </span>
                          
                          {/* Cambiar estado manual */}
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                            <select
                              value={biz.subscriptionStatus}
                              disabled={isStatusLoading}
                              onChange={e => handleUpdateField(biz.slug, "subscriptionStatus", e.target.value)}
                              style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", border: "1px solid #cbd5e1", background: "#f8fafc" }}
                            >
                              <option value="TRIALING">TRIALING (Prueba)</option>
                              <option value="ACTIVE">ACTIVE (Pagada)</option>
                              <option value="PAST_DUE">PAST_DUE (Vencida)</option>
                              <option value="CANCELLED">CANCELLED (Cancelada)</option>
                            </select>
                            {isStatusLoading && <span className={styles.actionSpinner} />}
                          </div>
                        </div>
                      </td>

                      {/* 4. Plan SaaS */}
                      <td>
                        <select
                          value={biz.plan}
                          disabled={isPlanLoading}
                          onChange={e => handleUpdateField(biz.slug, "plan", e.target.value)}
                          className={styles.tableSelect}
                          style={biz.plan === "NEGOCIO" ? { borderColor: "var(--primary)", fontWeight: "bold" } : {}}
                        >
                          <option value="INDIVIDUAL">Individual ($10.000)</option>
                          <option value="EQUIPO">Básico ($29.000)</option>
                          <option value="NEGOCIO">Premium ($49.000)</option>
                        </select>
                        {isPlanLoading && <span className={styles.actionSpinner} />}
                      </td>

                      {/* 5. Cobros Directos Mercado Pago */}
                      <td>
                        {biz.mercadoPagoConnected ? (
                          <span
                            style={{
                              background: "rgba(34, 197, 94, 0.1)",
                              color: "#16a34a",
                              border: "1px solid rgba(34, 197, 94, 0.25)",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            ✓ Conectado
                          </span>
                        ) : (
                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#64748b",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                            }}
                          >
                            – Solo en local
                          </span>
                        )}
                      </td>

                      {/* 6. Actividad */}
                      <td>
                        <div style={{ fontSize: "12px", color: "#1e293b", fontWeight: "600" }}>
                          📅 {biz._count?.appointments || 0} reservas
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          ✂️ {biz._count?.services || 0} servicios • 👤 {biz._count?.professionals || 0} prof.
                        </div>
                      </td>

                      {/* 7. Bypass de Pago */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            disabled={isBypassLoading}
                            onClick={() => handleUpdateField(biz.slug, "billingBypass", !biz.billingBypass)}
                            className={`${styles.iosToggle} ${biz.billingBypass ? styles.iosToggleActive : ""}`}
                            aria-label={`Toggle bypass para ${biz.name}`}
                          >
                            <span className={styles.iosToggleDot} />
                          </button>
                          <span style={{ fontSize: "11.5px", fontWeight: "600", color: biz.billingBypass ? "var(--success)" : "var(--text-secondary)" }}>
                            {biz.billingBypass ? "Activo" : "No"}
                          </span>
                        </div>
                      </td>

                      {/* 8. Dominio Personalizado */}
                      <td>
                        {editingSlug === biz.slug ? (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <input
                              type="text"
                              value={tempDomain}
                              onChange={e => setTempDomain(e.target.value)}
                              placeholder="ej. estilobelen.cl"
                              className={styles.domainInput}
                            />
                            <button
                              onClick={() => handleUpdateField(biz.slug, "customDomain", tempDomain)}
                              disabled={isDomainLoading}
                              className={styles.saveBtn}
                              title="Guardar dominio"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingSlug(null)}
                              className={styles.cancelBtn}
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {biz.customDomain ? (
                              <span className={styles.domainBadge}>
                                {biz.customDomain}
                              </span>
                            ) : (
                              <span style={{ fontStyle: "italic", color: "var(--text-secondary)", fontSize: "12px" }}>
                                Ninguno
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setEditingSlug(biz.slug);
                                setTempDomain(biz.customDomain || "");
                              }}
                              className={styles.editBtn}
                              title="Editar dominio"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
