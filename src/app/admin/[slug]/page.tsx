"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

interface Appointment {
  id: string;
  clientName: string;
  clientWhatsApp: string;
  dateTime: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentAmount: number | null;
  service: { name: string; duration: number; price: number };
  professional: { name: string };
  peopleCount?: number | null;
  tableId?: string | null;
  table?: { number: number; capacity: number } | null;
}

interface Table {
  id: string;
  number: number;
  capacity: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
}

interface Business {
  name: string;
  slug: string;
  teamSize: string;
  currency: string;
  category: string;
  appointments: Appointment[];
  services: { name: string }[];
  tables?: Table[];
  menuItems?: MenuItem[];
  professionals?: { name: string }[];
}

export default function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendario" | "reservas" | "secretary" | "marketing" | "business" | "mesas" | "carta">("dashboard");
  const [timePeriod, setTimePeriod] = useState("week");
  const [todayReservationsCollapsed, setTodayReservationsCollapsed] = useState(false);

  // Formulario de Mesas
  const [tableNumber, setTableNumber] = useState("");
  const [tableCapacity, setTableCapacity] = useState("4");
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // Formulario de Carta
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuDesc, setMenuDesc] = useState("");
  const [menuCategory, setMenuCategory] = useState("Fondos");
  const [isSubmittingMenu, setIsSubmittingMenu] = useState(false);

  // Selector de mapa visual de mesas
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState("13:00");

  // Navegación de semana en el calendario
  const [currentWeekRef, setCurrentWeekRef] = useState(new Date());

  // Chat animado de Linki Secretary
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "bot"; text: string; time: string }[]>([
    { sender: "user", text: "Hola, me gustaría agendar una cita para mañana por la tarde.", time: "14:02" }
  ]);
  const [secretaryTyping, setSecretaryTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadAdminData = async () => {
    try {
      const res = await fetch(`/api/admin?slug=${slug}`);
      if (!res.ok) {
        setBusiness(null);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setBusiness(data.business);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [slug]);

  // Redirigir por defecto si es Restaurante
  useEffect(() => {
    if (business && business.category === "Restaurante" && activeTab === "calendario") {
      setActiveTab("mesas");
    }
  }, [business]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber || !tableCapacity) return;
    setIsSubmittingTable(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          number: parseInt(tableNumber, 10),
          capacity: parseInt(tableCapacity, 10),
        }),
      });
      if (res.ok) {
        setTableNumber("");
        await loadAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Error al agregar mesa");
      }
    } catch (err) {
      console.error("Error adding table:", err);
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta mesa?")) return;
    try {
      const res = await fetch(`/api/tables?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadAdminData();
      } else {
        alert("Error al eliminar mesa");
      }
    } catch (err) {
      console.error("Error deleting table:", err);
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName || !menuPrice) return;
    setIsSubmittingMenu(true);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: menuName,
          price: parseFloat(menuPrice),
          description: menuDesc,
          category: menuCategory,
        }),
      });
      if (res.ok) {
        setMenuName("");
        setMenuPrice("");
        setMenuDesc("");
        await loadAdminData();
      } else {
        alert("Error al agregar plato");
      }
    } catch (err) {
      console.error("Error adding menu item:", err);
    } finally {
      setIsSubmittingMenu(false);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este plato?")) return;
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadAdminData();
      } else {
        alert("Error al eliminar plato");
      }
    } catch (err) {
      console.error("Error deleting menu item:", err);
    }
  };

  const getReservationForTable = (tableId: string) => {
    if (!business?.appointments) return null;
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const [year, month, day] = selectedDate.split("-").map(Number);
    const selectedDateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);

    return business.appointments.find((app) => {
      if (app.tableId !== tableId) return false;
      const appDateTime = new Date(app.dateTime);
      const diffMs = Math.abs(selectedDateObj.getTime() - appDateTime.getTime());
      const diffMinutes = diffMs / (1000 * 60);
      return diffMinutes < 120;
    }) || null;
  };

  // Simulación de escritura progresiva de Linki Secretary
  useEffect(() => {
    if (activeTab !== "secretary") return;

    // Reset chat
    setChatMessages([
      { sender: "user", text: "Hola, me gustaría agendar una cita para mañana por la tarde.", time: "14:02" }
    ]);
    setSecretaryTyping(false);
    
    const messagesScript = [
      { sender: "bot", text: "¡Hola! Con gusto. Para mañana tengo horas disponibles a las 15:30 y 16:30. ¿Te sirve alguna?", delay: 2000 },
      { sender: "user", text: "La de las 15:30 me acomoda. ¿Cuál es el valor?", delay: 5500 },
      { sender: "bot", text: "Perfecto. El servicio es 'Corte de Cabello' con Juan Pérez y tiene un valor de $15.000 CLP. Para confirmar la reserva, debes ingresar al siguiente link de pago simulado: agendalink.com/democut/pay. ¿Deseas proceder?", delay: 9000 },
      { sender: "user", text: "Sí, acabo de pagar en el link.", delay: 13500 },
      { sender: "bot", text: "¡Recibido! Tu pago fue aprobado. He agendado tu cita para mañana a las 15:30 hrs. ¡Te esperamos! ⚡️", delay: 17000 }
    ];

    let timeouts: NodeJS.Timeout[] = [];

    messagesScript.forEach((msg, idx) => {
      const t = setTimeout(() => {
        setSecretaryTyping(msg.sender === "bot");
        const typingTimeout = setTimeout(() => {
          setSecretaryTyping(false);
          const timeStr = new Date();
          timeStr.setMinutes(timeStr.getMinutes() + idx * 3);
          const timeFormatted = timeStr.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
          setChatMessages(prev => [...prev, { sender: msg.sender as any, text: msg.text, time: timeFormatted }]);
        }, msg.sender === "bot" ? 1200 : 0);
        timeouts.push(typingTimeout);
      }, msg.delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(t => clearTimeout(t));
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, secretaryTyping]);

  const formatPrice = (price: number, currency: string) => {
    if (currency === "CLP") {
      return `$${price.toLocaleString("es-CL")}`;
    } else if (currency === "MXN") {
      return `$${price.toLocaleString("es-MX")} MXN`;
    }
    return `$${price.toFixed(2)} USD`;
  };

  // Helper para calcular los días de la semana actual (Lunes a Domingo)
  const getWeekDates = (refDate: Date) => {
    const temp = new Date(refDate);
    const day = temp.getDay();
    // En JS, 0 es Domingo. Queremos que Lunes sea el primer día.
    const distance = day === 0 ? -6 : 1 - day;
    temp.setDate(temp.getDate() + distance);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(temp);
      d.setDate(temp.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeekRef);
  const hourSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  const getAppointmentsForSlot = (date: Date, hourStr: string) => {
    if (!business?.appointments) return [];
    const slotHour = parseInt(hourStr.split(":")[0]);
    return business.appointments.filter((app) => {
      const appDate = new Date(app.dateTime);
      return (
        appDate.getFullYear() === date.getFullYear() &&
        appDate.getMonth() === date.getMonth() &&
        appDate.getDate() === date.getDate() &&
        appDate.getHours() === slotHour
      );
    });
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekRef);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekRef(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekRef);
    next.setDate(next.getDate() + 7);
    setCurrentWeekRef(next);
  };

  const getWeekRangeString = () => {
    if (weekDates.length === 0) return "";
    const first = weekDates[0];
    const last = weekDates[6];
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${first.toLocaleDateString("es-ES", options)} - ${last.toLocaleDateString("es-ES", options)}, ${first.getFullYear()}`;
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

  // --- CALCULOS DEL DASHBOARD ---
  const totalReservations = business.appointments?.length || 0;

  const totalSales = business.appointments
    ?.filter((app) => app.paymentStatus === "PAID")
    ?.reduce((acc, app) => acc + (app.paymentAmount || app.service?.price || 0), 0) || 0;

  const uniqueClients = new Set(business.appointments?.map((app) => app.clientWhatsApp)).size;

  const professionalsCount = business.professionals?.length || 1;
  const tablesCount = business.tables?.length || 1;
  const totalWeeklySlots = business.category === "Restaurante" 
    ? 70 * tablesCount 
    : 70 * professionalsCount;
  
  const currentWeekAppointments = business.appointments?.filter((app) => {
    const appDate = new Date(app.dateTime);
    const startOfWeek = weekDates[0];
    const endOfWeek = weekDates[6];
    return appDate >= startOfWeek && appDate <= endOfWeek;
  })?.length || 0;

  const occupancyRate = totalWeeklySlots > 0 
    ? Math.round((currentWeekAppointments / totalWeeklySlots) * 100) 
    : 0;

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const todayAppointments = business.appointments?.filter((app) => {
    const appDate = new Date(app.dateTime);
    return appDate >= todayStart && appDate <= todayEnd;
  }) || [];

  const applePayAppointments = business.appointments?.filter((app) => app.paymentStatus === "PAID" && app.paymentMethod === "Apple Pay") || [];
  const visaAppointments = business.appointments?.filter((app) => app.paymentStatus === "PAID" && app.paymentMethod !== "Apple Pay") || [];
  
  const applePaySales = applePayAppointments.reduce((acc, app) => acc + (app.paymentAmount || app.service?.price || 0), 0);
  const visaSales = visaAppointments.reduce((acc, app) => acc + (app.paymentAmount || app.service?.price || 0), 0);
  
  const applePayPercent = totalSales > 0 ? Math.round((applePaySales / totalSales) * 100) : 0;
  const visaPercent = totalSales > 0 ? Math.round((visaSales / totalSales) * 100) : 0;

  const whatsappSent = totalReservations * 2;
  const emailsSent = totalReservations;

  return (
    <main className={styles.adminContainer}>
      {/* Background Glowing Orbs */}
      <div className={styles.adminGlowOrb1} />
      <div className={styles.adminGlowOrb2} />

      <div className={styles.sidebar}>
        <div className={styles.brandLogo}>
          <img src="/logo.png" alt="AgendaLink" style={{ height: "24px" }} />
        </div>
        
        <span className={styles.navSectionTitle}>Operación</span>
        <nav className={styles.navList}>
          <button className={`${styles.navItem} ${activeTab === "dashboard" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("dashboard")}>
            <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Dashboard Resumen
          </button>
          {business.category === "Restaurante" && (
            <>
              <button className={`${styles.navItem} ${activeTab === "mesas" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("mesas")}>
                <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                </svg>
                Distribución de Mesas
              </button>
              <button className={`${styles.navItem} ${activeTab === "carta" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("carta")}>
                <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Carta Digital
              </button>
            </>
          )}
          <button className={`${styles.navItem} ${activeTab === "calendario" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("calendario")}>
            <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Vista Calendario
          </button>
          <button className={`${styles.navItem} ${activeTab === "reservas" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("reservas")}>
            <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="15" y2="16" />
              <line x1="9" y1="8" x2="10" y2="8" />
            </svg>
            Lista de Reservas
          </button>
        </nav>
 
        <span className={styles.navSectionTitle}>Asistentes Linki IA</span>
        <nav className={styles.navList}>
          <button className={`${styles.navItem} ${activeTab === "secretary" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("secretary")}>
            <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Linki Secretary
          </button>
          <button className={`${styles.navItem} ${activeTab === "marketing" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("marketing")}>
            <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 6l-8.5 8.5-5-5L1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Linki Marketing
          </button>
          <button className={`${styles.navItem} ${activeTab === "business" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("business")}>
            <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-4.12 2.5 2.5 0 0 1 0-4.12A2.5 2.5 0 0 0 14.5 2z" />
            </svg>
            Linki Business
          </button>
        </nav>
      </div>

      <div className={styles.contentArea}>
        <header className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.dashboardTitle}>{business.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                Panel de Administración · Plan Automático: {business.teamSize}
              </p>
              <span className={styles.statusBadge}>
                <span className={styles.statusDot} />
                Activo
              </span>
            </div>
          </div>
          <Link href={`/${business.slug}`} target="_blank" className={styles.publicLinkBtn}>
            Ver link público ↗
          </Link>
        </header>

        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Periodo de Tiempo Selector */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Periodo de tiempo</span>
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className={styles.controlSelect}
                  style={{ minWidth: "180px" }}
                >
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                  <option value="year">Este año</option>
                </select>
              </div>
            </div>

            {/* Fila de KPIs */}
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCardDark}>
                <span className={styles.kpiLabel}>Total de reservas</span>
                <div className={styles.kpiValue}>{totalReservations}</div>
                <button onClick={() => setActiveTab("reservas")} className={styles.kpiLink}>Ver detalles</button>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Factor de ocupación</span>
                <div className={styles.kpiValue}>{occupancyRate}%</div>
                <span className={styles.kpiTrendDown}>
                  ↓ 0% <span style={{ color: "var(--text-secondary)", fontWeight: "normal" }}>vs periodo anterior</span>
                </span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Nuevos clientes</span>
                <div className={styles.kpiValue}>{uniqueClients}</div>
                <span className={styles.kpiTrendUp}>
                  ↑ 100% <span style={{ color: "var(--text-secondary)", fontWeight: "normal" }}>vs periodo anterior</span>
                </span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Ventas facturadas</span>
                <div className={styles.kpiValue}>{formatPrice(totalSales, business.currency)}</div>
                <span className={styles.kpiTrendDown}>
                  ↓ 0% <span style={{ color: "var(--text-secondary)", fontWeight: "normal" }}>vs periodo anterior</span>
                </span>
              </div>
            </div>

            {/* Ver detalle de reservas de hoy (Colapsable) */}
            <div className={styles.collapsibleWrapper}>
              <button 
                onClick={() => setTodayReservationsCollapsed(!todayReservationsCollapsed)} 
                className={styles.collapsibleHeader}
              >
                <span>Ver detalle de reservas de hoy ({todayAppointments.length})</span>
                <span className={styles.collapsibleArrow}>{todayReservationsCollapsed ? "▲" : "▼"}</span>
              </button>
              
              {!todayReservationsCollapsed && (
                <div className={styles.collapsibleContent}>
                  {todayAppointments.length === 0 ? (
                    <p style={{ margin: 0, padding: "16px", color: "var(--text-secondary)", fontSize: "13.5px", textAlign: "center" }}>
                      No tienes reservas programadas para el día de hoy.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px" }}>
                      {todayAppointments.map((app) => (
                        <div key={app.id} className={styles.todayAppointmentRow}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span className={styles.todayTimeBadge}>
                              {new Date(app.dateTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <div>
                              <strong style={{ fontSize: "14px", color: "var(--foreground)" }}>{app.clientName}</strong>
                              <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "8px" }}>
                                {business.category === "Restaurante" ? `Mesa ${app.table?.number || "General"}` : app.service?.name}
                              </span>
                            </div>
                          </div>
                          <button onClick={() => setActiveTab("reservas")} className={styles.todayDetailsBtn}>Ver Ficha</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grid de Reportes Gráficos */}
            <div className={styles.reportGrid}>
              {/* Widget 1: Pagos en línea */}
              <div className={styles.reportCard}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportIconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <h3 className={styles.reportCardTitle}>Pagos en línea</h3>
                </div>
                <p className={styles.reportCardDesc}>Estado de tus transacciones y distribución de métodos de pago en el periodo.</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
                  <div className={styles.statProgressBarRow}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: "600", marginBottom: "4px" }}>
                      <span> Pay</span>
                      <span>{applePayPercent}% ({formatPrice(applePaySales, business.currency)})</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: `${applePayPercent}%`, background: "var(--foreground)" }} />
                    </div>
                  </div>
                  <div className={styles.statProgressBarRow}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: "600", marginBottom: "4px" }}>
                      <span>Tarjetas de Crédito/Débito</span>
                      <span>{visaPercent}% ({formatPrice(visaSales, business.currency)})</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: `${visaPercent}%`, background: "var(--primary)" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 2: Factor de Ocupación */}
              <div className={styles.reportCard}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportIconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                      <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                    </svg>
                  </div>
                  <h3 className={styles.reportCardTitle}>Factor de ocupación</h3>
                </div>
                <p className={styles.reportCardDesc}>Visualización del uso de capacidad operativa (profesionales o mesas) esta semana.</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Capacidad Operativa:</span>
                    <strong style={{ color: "var(--foreground)" }}>{totalWeeklySlots} turnos/semana</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Turnos Agendados:</span>
                    <strong style={{ color: "var(--primary)" }}>{currentWeekAppointments} reservas</strong>
                  </div>
                  <div className={styles.progressBarBg} style={{ height: "8px", marginTop: "8px" }}>
                    <div className={styles.progressBarFill} style={{ width: `${occupancyRate}%`, background: "var(--primary)" }} />
                  </div>
                </div>
              </div>

              {/* Widget 3: Origen de las reservas */}
              <div className={styles.reportCard}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportIconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="6"></circle>
                    </svg>
                  </div>
                  <h3 className={styles.reportCardTitle}>Origen de las reservas</h3>
                </div>
                
                <div className={styles.donutLayout}>
                  <div className={styles.donutSvgWrapper}>
                    <svg width="100%" height="110" viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="100" cy="100" r="70" fill="transparent" stroke="rgba(0, 102, 255, 0.05)" strokeWidth="24" />
                      <circle 
                        cx="100" 
                        cy="100" 
                        r="70" 
                        fill="transparent" 
                        stroke="var(--primary)" 
                        strokeWidth="24" 
                        strokeDasharray="439.8" 
                        strokeDashoffset={totalReservations > 0 ? "0" : "439.8"} 
                        style={{ transition: "stroke-dashoffset 0.5s ease" }} 
                      />
                    </svg>
                    <div className={styles.donutCenterText}>
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--foreground)" }}>
                        {totalReservations > 0 ? "100%" : "0%"}
                      </span>
                      <span style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700" }}>Online</span>
                    </div>
                  </div>
                  
                  <div className={styles.donutStats}>
                    <div className={styles.donutStatItem}>
                      <span className={styles.donutStatIndicatorBlue} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--foreground)" }}>Reservas en línea</span>
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{totalReservations > 0 ? "100%" : "0%"} • {totalReservations} reserv.</span>
                      </div>
                    </div>
                    <div className={styles.donutStatItem}>
                      <span className={styles.donutStatIndicatorGray} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)" }}>Reservas desde agenda</span>
                        <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>0% • 0 reserv.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Segunda Fila de Widgets */}
            <div className={styles.reportGrid}>
              {/* Ventas Facturadas Widget */}
              <div className={styles.reportCard}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportIconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                      <line x1="12" y1="10" x2="12" y2="10"></line>
                      <line x1="12" y1="14" x2="12" y2="14"></line>
                    </svg>
                  </div>
                  <h3 className={styles.reportCardTitle}>Ventas Facturadas</h3>
                </div>
                <div style={{ margin: "20px 0 10px 0" }}>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--foreground)" }}>{formatPrice(totalSales, business.currency)}</div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Total acumulado cobrado con tarjeta o Apple Pay en la plataforma.</p>
                </div>
              </div>

              {/* Recordatorios WhatsApp Widget */}
              <div className={styles.reportCard}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportIconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                  </div>
                  <h3 className={styles.reportCardTitle}>Recordatorios WhatsApp</h3>
                </div>
                <div style={{ margin: "20px 0 10px 0" }}>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--primary)" }}>{whatsappSent}</div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Mensajes automáticos de confirmación y recordatorio enviados por Linki Secretary IA.</p>
                </div>
              </div>

              {/* Recordatorios Email Widget */}
              <div className={styles.reportCard}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportIconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <h3 className={styles.reportCardTitle}>Recordatorios Email</h3>
                </div>
                <div style={{ margin: "20px 0 10px 0" }}>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--primary)" }}>{emailsSent}</div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Correos electrónicos de notificación de turnos y marketing automatizado enviados.</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === "mesas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <section className={styles.glassCard}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Mapa de Distribución de Mesas</h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Monitorea el estado de tus mesas en tiempo real. Selecciona una fecha y hora para verificar la ocupación.
              </p>

              <div className={styles.controlsRow}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>Fecha</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.controlSelect}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>Turno / Hora</span>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className={styles.controlSelect}
                  >
                    <optgroup label="Almuerzo">
                      <option value="12:00">12:00 hrs</option>
                      <option value="12:30">12:30 hrs</option>
                      <option value="13:00">13:00 hrs</option>
                      <option value="13:30">13:30 hrs</option>
                      <option value="14:00">14:00 hrs</option>
                      <option value="14:30">14:30 hrs</option>
                    </optgroup>
                    <optgroup label="Cena">
                      <option value="19:00">19:00 hrs</option>
                      <option value="19:30">19:30 hrs</option>
                      <option value="20:00">20:00 hrs</option>
                      <option value="20:30">20:30 hrs</option>
                      <option value="21:00">21:00 hrs</option>
                      <option value="21:30">21:30 hrs</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {business.tables?.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
                  No hay mesas registradas. Usa el formulario de abajo para agregar tu primera mesa.
                </p>
              ) : (
                <div className={styles.tableGrid}>
                  {business.tables?.map((table) => {
                    const reservation = getReservationForTable(table.id);
                    const isReserved = !!reservation;
                    return (
                      <div
                        key={table.id}
                        className={`${styles.tableCard} ${isReserved ? styles.tableCardReserved : styles.tableCardAvailable}`}
                      >
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteTable(table.id)}
                          title="Eliminar Mesa"
                        >
                          ✕
                        </button>
                        
                        <div className={styles.tableIconContainer}>
                          {Array.from({ length: table.capacity }).map((_, i) => {
                            const angle = (i * 360) / table.capacity;
                            const x = 45 + 36 * Math.cos((angle * Math.PI) / 180);
                            const y = 45 + 36 * Math.sin((angle * Math.PI) / 180);
                            return (
                              <div
                                key={i}
                                className={`${styles.chair} ${isReserved ? styles.chairReserved : styles.chairAvailable}`}
                                style={{
                                  left: `${x - 7}px`,
                                  top: `${y - 7}px`,
                                }}
                              />
                            );
                          })}

                          <div
                            className={`${styles.tableIcon} ${
                              isReserved ? styles.tableIconReserved : styles.tableIconAvailable
                            }`}
                          >
                            {table.number}
                          </div>
                        </div>

                        <div className={styles.tableInfo}>
                          <h3 className={styles.tableNumberTitle}>Mesa {table.number}</h3>
                          <p className={styles.tableCapacityText}>Capacidad: {table.capacity} personas</p>
                          <span
                            className={`${styles.statusBadge} ${
                              isReserved ? styles.statusBadgeReserved : styles.statusBadgeAvailable
                            }`}
                          >
                            {isReserved ? "Reservada" : "Disponible"}
                          </span>

                          {isReserved && (
                            <div className={styles.reservedDetail}>
                              <div className={styles.reservedClientName}>{reservation.clientName}</div>
                              <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                                WhatsApp: {reservation.clientWhatsApp}
                              </div>
                              <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                                {reservation.peopleCount} comensales
                              </div>
                              <div className={styles.reservedTime}>
                                {new Date(reservation.dateTime).toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" hrs"}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={styles.glassCard} style={{ maxWidth: "480px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Agregar Nueva Mesa</h3>
              <form onSubmit={handleAddTable} className={styles.adminForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="table-num">Número de Mesa</label>
                  <input
                    id="table-num"
                    type="number"
                    min="1"
                    required
                    placeholder="Ej. 6"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="table-cap">Capacidad de Comensales</label>
                  <select
                    id="table-cap"
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="2">2 personas</option>
                    <option value="4">4 personas</option>
                    <option value="6">6 personas</option>
                    <option value="8">8 personas</option>
                    <option value="10">10 personas</option>
                  </select>
                </div>
                <button type="submit" disabled={isSubmittingTable} className={styles.submitButton}>
                  {isSubmittingTable ? "Creando..." : "Crear Mesa"}
                </button>
              </form>
            </section>
          </div>
        )}

        {activeTab === "carta" && (
          <section className={styles.glassCard}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Carta Digital del Restaurante</h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "24px" }}>
              Administra los platos de tu menú. Los cambios se verán reflejados inmediatamente en tu página pública.
            </p>

            <div className={styles.menuGrid}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Agregar Plato</h3>
                <form onSubmit={handleAddMenuItem} className={styles.adminForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="menu-name">Nombre del Plato</label>
                    <input
                      id="menu-name"
                      type="text"
                      required
                      placeholder="Ej. Spaghetti a la Carbonara"
                      value={menuName}
                      onChange={(e) => setMenuName(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="menu-cat">Categoría</label>
                    <select
                      id="menu-cat"
                      value={menuCategory}
                      onChange={(e) => setMenuCategory(e.target.value)}
                      className={styles.formInput}
                    >
                      <option value="Entradas">Entradas</option>
                      <option value="Fondos">Platos de Fondo</option>
                      <option value="Postres">Postres</option>
                      <option value="Bebidas">Bebidas / Tragos</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="menu-price">Precio</label>
                    <input
                      id="menu-price"
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="Ej. 12000"
                      value={menuPrice}
                      onChange={(e) => setMenuPrice(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="menu-desc">Descripción</label>
                    <textarea
                      id="menu-desc"
                      placeholder="Ingredientes o detalles del plato..."
                      value={menuDesc}
                      onChange={(e) => setMenuDesc(e.target.value)}
                      className={styles.formInput}
                      style={{ minHeight: "80px", resize: "vertical" }}
                    />
                  </div>
                  <button type="submit" disabled={isSubmittingMenu} className={styles.submitButton}>
                    {isSubmittingMenu ? "Agregando..." : "Agregar al Menú"}
                  </button>
                </form>
              </div>

              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Platos en la Carta</h3>
                {["Entradas", "Fondos", "Postres", "Bebidas"].map((cat) => {
                  const items = business.menuItems?.filter((item) => item.category === cat) || [];
                  return (
                    <div key={cat} className={styles.menuSection}>
                      <h4 className={styles.menuSectionTitle}>
                        {cat === "Fondos" ? "Platos de Fondo" : cat} ({items.length})
                      </h4>
                      {items.length === 0 ? (
                        <p style={{ fontStyle: "italic", color: "var(--text-secondary)", fontSize: "13px", paddingLeft: "8px" }}>
                          No hay platos registrados en esta categoría.
                        </p>
                      ) : (
                        <div className={styles.menuItemList}>
                          {items.map((item) => (
                            <div key={item.id} className={styles.menuItemCard}>
                              <div className={styles.menuItemInfo}>
                                <div className={styles.menuItemName}>{item.name}</div>
                                {item.description && <div className={styles.menuItemDesc}>{item.description}</div>}
                              </div>
                              <div className={styles.menuItemActions}>
                                <span className={styles.menuItemPrice}>{formatPrice(item.price, business.currency)}</span>
                                <button
                                  className={styles.deleteBtn}
                                  style={{ position: "relative", top: 0, right: 0, opacity: 0.6 }}
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  title="Eliminar Plato"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === "calendario" && (
          <section className={styles.glassCard} style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Agenda de Turnos</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button onClick={handlePrevWeek} className={styles.navItemActive} style={{ width: "32px", height: "32px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
                  &lt;
                </button>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)", minWidth: "150px", textAlign: "center" }}>
                  {getWeekRangeString()}
                </span>
                <button onClick={handleNextWeek} className={styles.navItemActive} style={{ width: "32px", height: "32px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
                  &gt;
                </button>
              </div>
            </div>

            <div className={styles.calendarWrapper}>
              <table className={styles.calendarTable}>
                <thead>
                  <tr>
                    <th className={styles.calendarTimeHeaderCell}>Hora</th>
                    {weekDates.map((date, idx) => {
                      const dayName = date.toLocaleDateString("es-ES", { weekday: "short" });
                      const dayNum = date.getDate();
                      const isToday = new Date().toDateString() === date.toDateString();
                      return (
                        <th key={idx} className={styles.calendarHeaderCell} style={isToday ? { color: "var(--primary)", borderBottomColor: "var(--primary)" } : {}}>
                          <span style={{ display: "block", textTransform: "capitalize", fontSize: "10px", color: "var(--text-secondary)" }}>{dayName}</span>
                          <span style={{ fontSize: "16px", fontWeight: "800" }}>{dayNum}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {hourSlots.map((hour, rowIdx) => (
                    <tr key={rowIdx} className={styles.calendarRow}>
                      <td className={styles.calendarTimeCell}>{hour}</td>
                      {weekDates.map((date, colIdx) => {
                        const slotApps = getAppointmentsForSlot(date, hour);
                        return (
                          <td key={colIdx} className={styles.calendarCell}>
                            {slotApps.map((app) => {
                              const isPaid = app.paymentStatus === "PAID";
                              return (
                                <div key={app.id} className={`${styles.appointmentBlock} ${isPaid ? styles.appointmentBlockPaid : ""}`}>
                                  <div className={styles.appointmentClientName}>{app.clientName}</div>
                                  <div className={styles.appointmentServiceName}>{app.service?.name}</div>
                                  <div className={`${styles.appointmentPriceBadge} ${isPaid ? styles.appointmentPriceBadgePaid : ""}`} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                    {isPaid && (
                                      <svg className={styles.badgeIcon} style={{ width: "10px", height: "10px", marginRight: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                    {formatPrice(app.paymentAmount || app.service?.price || 0, business.currency)}
                                  </div>
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "reservas" && (
          <section className={styles.glassCard}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Próximas Reservas Recibidas</h2>
            {business.appointments?.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
                Aún no tienes citas agendadas. Comparte tu link para empezar.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {business.appointments?.map((app) => (
                  <div key={app.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)" }}>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: "700" }}>{app.clientName}</h3>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>WhatsApp: {app.clientWhatsApp}</p>
                      <p style={{ fontSize: "12px", color: "var(--primary)", marginTop: "4px", fontWeight: "600" }}>
                        {business.category === "Restaurante" && app.table ? (
                          `Mesa ${app.table.number} (${app.peopleCount} personas)`
                        ) : (
                          `${app.service?.name} con ${app.professional?.name}`
                        )}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", display: "block" }}>
                        {new Date(app.dateTime).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div style={{ marginTop: "4px" }}>
                        {business.category === "Restaurante" ? (
                          <span className={styles.badgePaid} style={{ background: "rgba(52, 199, 89, 0.12)", color: "#248a3d" }}>
                            <svg className={styles.badgeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            RESERVA CONFIRMADA
                          </span>
                        ) : app.paymentStatus === "PAID" ? (
                          <span className={styles.badgePaid}>
                            <svg className={styles.badgeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            PAGADO ({formatPrice(app.paymentAmount || app.service?.price || 0, business.currency)} por {app.paymentMethod || "Visa Sim"})
                          </span>
                        ) : (
                          <span className={styles.badgePaid} style={{ background: "rgba(255, 149, 0, 0.12)", color: "#b25900" }}>
                            <svg className={styles.badgeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            PENDIENTE DE PAGO ({formatPrice(app.service?.price || 0, business.currency)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "secretary" && (
          <section className={styles.glassCard}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>Linki Secretary · Agendador de WhatsApp 24/7</h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Monitorea en tiempo real cómo tu asistente de inteligencia artificial conversa con tus clientes para reservar cupos.
            </p>
            <div className={styles.chatWindow}>
              <div className={styles.chatHeader}>
                <div className={styles.chatAvatar}>LS</div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>Linki Secretary</div>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>En línea • Respondiendo automáticamente</div>
                </div>
              </div>
              <div className={styles.chatBody}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={msg.sender === "user" ? styles.msgIn : styles.msgOut}>
                    {msg.text}
                    <div style={{ fontSize: "9px", color: "gray", textAlign: "right", marginTop: "4px" }}>{msg.time}</div>
                  </div>
                ))}
                {secretaryTyping && (
                  <div className={styles.msgOut} style={{ fontStyle: "italic", color: "gray" }}>
                    Linki Secretary está escribiendo...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </section>
        )}

        {activeTab === "marketing" && (
          <section className={styles.glassCard}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Linki Marketing · Reactivación de Clientes</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "rgba(255,255,255,0.06)", padding: "16px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: "24px", fontWeight: "800", display: "block" }}>32</span>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>Clientes Inactivos Detectados</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", padding: "16px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: "24px", fontWeight: "800", display: "block" }}>28</span>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>WhatsApp Promocionales Enviados</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", padding: "16px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: "24px", fontWeight: "800", display: "block" }}>14%</span>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>Tasa de Retorno y Agendamiento</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Campaña Activa: Fidelización de 30 Días</h3>
              <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "13px", lineHeight: "1.5", border: "1px solid var(--card-border)" }}>
                <strong>Mensaje automático enviado:</strong><br />
                <p style={{ marginTop: "6px", fontStyle: "italic" }}>
                  "¡Hola [Nombre]! Te extrañamos en {business.name}. Hace un mes que no nos visitas. Agenda tu hora hoy y obtén un 10% de descuento usando tu link de reservas: agendalink.com/{business.slug} ⚡️"
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === "business" && (
          <section className={styles.glassCard}>
            <div className={styles.reportTitle}>
              <svg className={styles.interiorIcon} style={{ width: "22px", height: "22px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-4.12 2.5 2.5 0 0 1 0-4.12A2.5 2.5 0 0 0 14.5 2z" />
              </svg>
              Linki Business • Reporte Semanal Estratégico
            </div>
            <div style={{ borderLeft: "4px solid var(--primary)", paddingLeft: "16px", margin: "16px 0" }}>
              <p className={styles.reportParagraph} style={{ fontStyle: "italic", fontWeight: "500" }}>
                "Hola. He analizado el rendimiento del negocio durante los últimos 7 días. Aquí tienes mi balance estratégico:"
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p className={styles.reportParagraph}>
                <svg className={styles.interiorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                <strong>Rendimiento General:</strong> Las reservas de esta semana aumentaron un <strong>12%</strong> comparado con la semana anterior, registrando una facturación simulada de <strong>{formatPrice(business.appointments?.reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0) || 120000, business.currency)}</strong>.
              </p>
              <p className={styles.reportParagraph}>
                <svg className={styles.interiorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <strong>Servicios y Staff Estrella:</strong> Tu servicio más demandado fue {business.services?.[0]?.name || "el servicio estrella"} y tu profesional con más reservas fue {business.appointments?.[0]?.professional?.name || "el profesional estrella"}. Hay alta retención en el bloque de las 15:30 hrs.
              </p>
              <p className={styles.reportParagraph}>
                <svg className={styles.interiorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                  <line x1="9" y1="18" x2="15" y2="18" />
                  <line x1="10" y1="22" x2="14" y2="22" />
                </svg>
                <strong>Consejo de IA:</strong> He notado que los días martes por la mañana tienen baja ocupación (menos del 20%). Le he sugerido a <strong>Linki Marketing</strong> programar un recordatorio automático con un descuento especial para incentivar reservas los martes temprano.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
