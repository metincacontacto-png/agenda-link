"use client";

import React, { useState, useEffect } from "react";
import styles from "./super-admin.module.css";

interface Business {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  category: string;
  country: string;
  teamSize: string;
  plan: string;
  billingBypass: boolean;
  customDomain: string | null;
  createdAt: string;
}

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // States for Editing Custom Domain
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [tempDomain, setTempDomain] = useState("");

  // States for Maintenance Mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);

  const verifyAndLoad = async (passToVerify: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin?password=${passToVerify}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBusinesses(data.businesses);
          setMaintenanceMode(data.maintenanceMode || false);
          setIsAuthenticated(true);
          localStorage.setItem("super_admin_pass", passToVerify);
          setAuthError("");
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setAuthError("Contraseña incorrecta");
        } else {
          setAuthError(`Error de servidor (${res.status}): ${errData.error || 'Desconocido'}`);
        }
        localStorage.removeItem("super_admin_pass");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Error de conexión al autenticar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedPassword = localStorage.getItem("super_admin_pass");
    if (savedPassword) {
      setTimeout(() => {
        verifyAndLoad(savedPassword);
      }, 0);
    } else {
      setTimeout(() => setLoading(false), 0);
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAndLoad(password);
  };

  const handleLogout = () => {
    localStorage.removeItem("super_admin_pass");
    setIsAuthenticated(false);
    setPassword("");
    setBusinesses([]);
  };

  const handleToggleMaintenance = async () => {
    setIsMaintenanceLoading(true);
    const pass = localStorage.getItem("super_admin_pass") || "";
    const newValue = !maintenanceMode;
    
    try {
      const res = await fetch(`/api/super-admin?password=${pass}`, {
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

  const handleUpdateField = async (slug: string, field: "plan" | "billingBypass" | "customDomain", value: string | boolean | null) => {
    setActionLoading(`${slug}_${field}`);
    const pass = localStorage.getItem("super_admin_pass") || "";
    
    try {
      const res = await fetch(`/api/super-admin?password=${pass}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          [field]: value
        })
      });

      const data = await res.json();
      if (data.success) {
        // Actualizar localmente
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

  const filteredBusinesses = businesses.filter(biz => 
    biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    biz.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    biz.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Cargando Super Admin...</p>
      </div>
    );
  }

  // 1. Pantalla de Login de Super Admin
  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "36px" }}>🔑</span>
            <h1 className={styles.loginTitle}>AgendaLink Super Admin</h1>
            <p className={styles.loginSubtitle}>Ingresa tu contraseña de administrador para gestionar la plataforma.</p>
          </div>

          {authError && <div className={styles.authError}>{authError}</div>}

          <form onSubmit={handleLoginSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ingresa clave de super admin"
                className={styles.input}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn}>
              Acceder al Panel
            </button>
          </form>
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
          <p className={styles.subtitle}>Gestión estratégica de negocios, planes y dominios.</p>
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
      <section className={styles.glassCard} style={{ padding: "20px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px", color: "var(--foreground)" }}>🔧 Modo Mantenimiento Global</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Activa este modo para mostrar una pantalla de mantenimiento a todos los visitantes del sistema.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            disabled={isMaintenanceLoading}
            onClick={handleToggleMaintenance}
            className={`${styles.iosToggle} ${maintenanceMode ? styles.iosToggleActive : ""}`}
            style={maintenanceMode ? { backgroundColor: "#ff3b30" } : {}}
          >
            <span className={styles.iosToggleDot} />
          </button>
          <span style={{ fontSize: "13px", fontWeight: "750", color: maintenanceMode ? "#ff3b30" : "var(--text-secondary)" }}>
            {maintenanceMode ? "Mantenimiento Activo" : "Plataforma Online"}
          </span>
        </div>
      </section>

      {/* Buscador e Información rápida */}
      <div className={styles.topControlRow}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por negocio, slug o dueño..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.kpiCard}>
          <strong>{businesses.length}</strong>
          <span>Negocios Registrados</span>
        </div>
      </div>

      {/* Tabla de Negocios */}
      <section className={styles.glassCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Negocio / Slug</th>
                <th>Dueño</th>
                <th>Rubro / País</th>
                <th>Plan de Pago</th>
                <th>Bypass de Pago (Acceso Libre)</th>
                <th>Dominio Personalizado</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                    No se encontraron negocios.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((biz) => {
                  const isPlanLoading = actionLoading === `${biz.slug}_plan`;
                  const isBypassLoading = actionLoading === `${biz.slug}_billingBypass`;
                  const isDomainLoading = actionLoading === `${biz.slug}_customDomain`;
                  
                  return (
                    <tr key={biz.id}>
                      {/* Negocio y Link */}
                      <td>
                        <div style={{ fontWeight: "700", color: "var(--foreground)" }}>{biz.name}</div>
                        <a 
                          href={`/${biz.slug}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className={styles.businessLink}
                        >
                          /{biz.slug}
                        </a>
                      </td>

                      {/* Dueño */}
                      <td>
                        <div style={{ fontWeight: "500" }}>{biz.ownerName}</div>
                      </td>

                      {/* Rubro y País */}
                      <td>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{biz.category}</div>
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--primary)" }}>{biz.country} ({biz.teamSize})</div>
                      </td>

                      {/* Plan Dropdown */}
                      <td>
                        <select
                          value={biz.plan}
                          disabled={isPlanLoading}
                          onChange={e => handleUpdateField(biz.slug, "plan", e.target.value)}
                          className={styles.tableSelect}
                          style={biz.plan === "NEGOCIO" ? { borderColor: "var(--primary)", fontWeight: "bold" } : {}}
                        >
                          <option value="INDIVIDUAL">Individual ($9.900)</option>
                          <option value="EQUIPO">Equipo ($19.990)</option>
                          <option value="NEGOCIO">Negocio ($39.990)</option>
                        </select>
                        {isPlanLoading && <span className={styles.actionSpinner} />}
                      </td>

                      {/* Bypass Toggle */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            disabled={isBypassLoading}
                            onClick={() => handleUpdateField(biz.slug, "billingBypass", !biz.billingBypass)}
                            className={`${styles.iosToggle} ${biz.billingBypass ? styles.iosToggleActive : ""}`}
                          >
                            <span className={styles.iosToggleDot} />
                          </button>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: biz.billingBypass ? "var(--success)" : "var(--text-secondary)" }}>
                            {biz.billingBypass ? "Bypass Activo" : "Requiere Pago"}
                          </span>
                        </div>
                      </td>

                      {/* Dominio Personalizado */}
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
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingSlug(null)}
                              className={styles.cancelBtn}
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
