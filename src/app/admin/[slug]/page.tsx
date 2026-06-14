"use client";
/* eslint-disable react-hooks/set-state-in-effect */

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
}


interface Client {
  name: string;
  whatsapp: string;
  count: number;
  lastDate: string;
  notes: string;
}

interface Business {
  name: string;
  slug: string;
  ownerName?: string | null;
  teamSize: string;
  currency: string;
  category: string;
  appointments: Appointment[];
  services: { id: string; name: string; price: number; duration: number; imageUrl?: string | null }[];

  professionals?: { name: string }[];
  logoUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  landingAbout?: string | null;
  landingCoverUrl?: string | null;
  landingSecondaryCoverUrl?: string | null;
  landingPhone?: string | null;
  landingAddress?: string | null;
  landingHours?: string | null;
  landingFeaturesJson?: string | null;
  landingTestimonialsJson?: string | null;
  plan: string;
  billingBypass: boolean;
  customDomain?: string | null;
}

export default function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const [business, setBusiness] = useState<Business | null>(null);

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
          {featureName} es una función Premium
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "480px", lineHeight: "1.5", marginBottom: "24px" }}>
          Tu negocio se encuentra en el <strong>Plan {business?.plan}</strong>. Para acceder a esta herramienta de Inteligencia Artificial necesitas mejorar tu plan al <strong>Plan {planRequired}</strong>.
        </p>
        <button 
          onClick={() => {
            alert(`¡Solicitud de Upgrade al Plan ${planRequired} enviada con éxito! Nos contactaremos a la brevedad.`);
          }}
          className={styles.submitButton}
          style={{ width: "auto", padding: "10px 24px" }}
        >
          Mejorar Plan ahora ⚡️
        </button>
      </section>
    );
  };
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "ventas" | "clientes" | "administracion" | "calendario" | "reservas" | "secretary" | "marketing" | "business" | "landing">("dashboard");
  const [adminSubTab, setAdminSubTab] = useState<"servicios" | "whatsapp">("servicios");
  const [salesSubTab, setSalesSubTab] = useState<"transacciones" | "membresias" | "giftcards" | "caja">("transacciones");
  const [clientsSubTab, setClientsSubTab] = useState<"base" | "recordatorios" | "crece">("base");
  const [timePeriod, setTimePeriod] = useState("week");
  const [todayReservationsCollapsed, setTodayReservationsCollapsed] = useState(false);
  const [isGearDropdownOpen, setIsGearDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Modales de Cabecera
  const [isFirstStepsModalOpen, setIsFirstStepsModalOpen] = useState(false);
  const [isDownloadsModalOpen, setIsDownloadsModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Reembolso Modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedRefundApp, setSelectedRefundApp] = useState<Appointment | null>(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Stripe Simulator
  const [paymentCardName, setPaymentCardName] = useState("");
  const [paymentCardNumber, setPaymentCardNumber] = useState("");
  const [paymentExpiry, setPaymentExpiry] = useState("");
  const [paymentCvv, setPaymentCvv] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([
    { id: "INV-001", date: "01/06/2026", amount: 29900, status: "PAID" },
    { id: "INV-002", date: "01/05/2026", amount: 29900, status: "PAID" }
  ]);
  const [selectedPlanId, setSelectedPlanId] = useState<"INDIVIDUAL" | "EQUIPO" | "NEGOCIO">("INDIVIDUAL");

  useEffect(() => {
    if (business?.plan) {
      setSelectedPlanId(business.plan as any);
    }
  }, [business?.plan]);

  // Memberships State
  const [memberships, setMemberships] = useState([
    { id: 1, name: "Plan 10 Sesiones - Masaje Descontracturante", clientName: "María Jesús", phone: "+56 9 8765 4321", current: 4, total: 10, status: "Activo" },
    { id: 2, name: "Pase Mensual - Spa Completo", clientName: "Rodrigo A.", phone: "+56 9 1234 5678", current: 22, total: 30, status: "Activo" }
  ]);
  const [editingMembershipId, setEditingMembershipId] = useState<number | null>(null);
  const [editingMembershipName, setEditingMembershipName] = useState("");
  const [editingMembershipClient, setEditingMembershipClient] = useState("");
  const [editingMembershipPhone, setEditingMembershipPhone] = useState("");
  const [editingMembershipCurrent, setEditingMembershipCurrent] = useState(0);
  const [editingMembershipTotal, setEditingMembershipTotal] = useState(10);
  const [editingMembershipStatus, setEditingMembershipStatus] = useState("Activo");

  // Gift Cards State
  const [giftCards, setGiftCards] = useState([
    { id: "COD-GIFT-9827", beneficiary: "Antonia Valenzuela", amount: 50000, status: "Vigente" },
    { id: "COD-GIFT-1102", beneficiary: "Ignacio Pérez", amount: 25000, status: "Vigente" }
  ]);
  const [giftCardBeneficiary, setGiftCardBeneficiary] = useState("");
  const [giftCardAmount, setGiftCardAmount] = useState("");
  const [editingGiftCardId, setEditingGiftCardId] = useState<string | null>(null);
  const [editingGiftCardBeneficiary, setEditingGiftCardBeneficiary] = useState("");
  const [editingGiftCardAmount, setEditingGiftCardAmount] = useState(0);
  const [editingGiftCardStatus, setEditingGiftCardStatus] = useState("Vigente");

  // Propinas Liquidadas State
  const [liquidatedTips, setLiquidatedTips] = useState(0);

  // Checklist de Primeros Pasos
  const [firstStepsChecked, setFirstStepsChecked] = useState({
    profile: true,
    services: false,
    whatsapp: false,
    share: false
  });

  const firstStepsProgress = (() => {
    const checkedCount = Object.values(firstStepsChecked).filter(Boolean).length;
    return Math.round((checkedCount / 4) * 100);
  })();

  // Clientes Drawer
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Recordatorios Switches (iOS Toggle)
  const [reminderWhatsApp24h, setReminderWhatsApp24h] = useState(true);
  const [reminderWhatsApp1h, setReminderWhatsApp1h] = useState(false);
  const [reminderMarketing, setReminderMarketing] = useState(true);

  // Vincular WhatsApp
  const [whatsAppProgress, setWhatsAppProgress] = useState(0);
  const [isLinkingWhatsApp, setIsLinkingWhatsApp] = useState(false);
  const [whatsAppLinked, setWhatsAppLinked] = useState(false);

  // Formulario y Estados de Servicios CRUD
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("30");
  const [serviceImage, setServiceImage] = useState("");
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  // Personalización de Landing Page
  const [landingTitle, setLandingTitle] = useState("");
  const [landingSubtitle, setLandingSubtitle] = useState("");
  const [landingAbout, setLandingAbout] = useState("");
  const [landingCoverUrl, setLandingCoverUrl] = useState("");
  const [landingSecondaryCoverUrl, setLandingSecondaryCoverUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [landingPhone, setLandingPhone] = useState("");
  const [landingAddress, setLandingAddress] = useState("");
  const [landingHours, setLandingHours] = useState("");
  
  // Ventajas (3 ventajas)
  const [feat1Title, setFeat1Title] = useState("");
  const [feat1Desc, setFeat1Desc] = useState("");
  const [feat2Title, setFeat2Title] = useState("");
  const [feat2Desc, setFeat2Desc] = useState("");
  const [feat3Title, setFeat3Title] = useState("");
  const [feat3Desc, setFeat3Desc] = useState("");

  // Testimonios (2 testimonios)
  const [test1Name, setTest1Name] = useState("");
  const [test1Text, setTest1Text] = useState("");
  const [test1Stars, setTest1Stars] = useState(5);
  const [test2Name, setTest2Name] = useState("");
  const [test2Text, setTest2Text] = useState("");
  const [test2Stars, setTest2Stars] = useState(5);

  const [isSavingLanding, setIsSavingLanding] = useState(false);



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



  // Cargar datos en los campos de edición
  useEffect(() => {
    if (business) {
      setLandingTitle(business.landingTitle || "");
      setLandingSubtitle(business.landingSubtitle || "");
      setLandingAbout(business.landingAbout || "");
      setLandingCoverUrl(business.landingCoverUrl || "");
      setLandingSecondaryCoverUrl(business.landingSecondaryCoverUrl || "");
      setLogoUrl(business.logoUrl || "");
      setLandingPhone(business.landingPhone || "");
      setLandingAddress(business.landingAddress || "");
      setLandingHours(business.landingHours || "");

      // Parse landingFeaturesJson
      try {
        if (business.landingFeaturesJson) {
          const feats = JSON.parse(business.landingFeaturesJson as string);
          if (feats && feats.length >= 3) {
            setFeat1Title(feats[0]?.title || "");
            setFeat1Desc(feats[0]?.desc || "");
            setFeat2Title(feats[1]?.title || "");
            setFeat2Desc(feats[1]?.desc || "");
            setFeat3Title(feats[2]?.title || "");
            setFeat3Desc(feats[2]?.desc || "");
          }
        }
      } catch (e) {
        console.error("Error parsing landingFeaturesJson:", e);
      }

      // Parse landingTestimonialsJson
      try {
        if (business.landingTestimonialsJson) {
          const tests = JSON.parse(business.landingTestimonialsJson as string);
          if (tests && tests.length >= 2) {
            setTest1Name(tests[0]?.name || "");
            setTest1Text(tests[0]?.text || "");
            setTest1Stars(tests[0]?.stars || 5);
            setTest2Name(tests[1]?.name || "");
            setTest2Text(tests[1]?.text || "");
            setTest2Stars(tests[1]?.stars || 5);
          }
        }
      } catch (e) {
        console.error("Error parsing landingTestimonialsJson:", e);
      }
    }
  }, [business]);

  // Helper para Base64
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Guardar Landing en D1
  const handleSaveLanding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLanding(true);
    
    const landingFeaturesJson = JSON.stringify([
      { title: feat1Title, desc: feat1Desc },
      { title: feat2Title, desc: feat2Desc },
      { title: feat3Title, desc: feat3Desc }
    ]);

    const landingTestimonialsJson = JSON.stringify([
      { name: test1Name, text: test1Text, stars: test1Stars },
      { name: test2Name, text: test2Text, stars: test2Stars }
    ]);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: business?.name,
          category: business?.category,
          teamSize: business?.teamSize,
          currency: business?.currency,
          logoUrl: logoUrl || null,
          landingTitle: landingTitle || null,
          landingSubtitle: landingSubtitle || null,
          landingAbout: landingAbout || null,
          landingCoverUrl: landingCoverUrl || null,
          landingSecondaryCoverUrl: landingSecondaryCoverUrl || null,
          landingPhone: landingPhone || null,
          landingAddress: landingAddress || null,
          landingHours: landingHours || null,
          landingFeaturesJson,
          landingTestimonialsJson
        }),
      });
      if (res.ok) {
        alert("¡Cambios guardados con éxito en la Landing Page!");
        await loadAdminData();
      } else {
        alert("Error al guardar cambios de la Landing Page");
      }
    } catch (err) {
      console.error("Error saving landing:", err);
      alert("Error de conexión al guardar cambios");
    } finally {
      setIsSavingLanding(false);
    }
  };

  // CRUD Servicios
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !servicePrice) return;
    setIsSubmittingService(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: serviceName,
          price: parseFloat(servicePrice),
          duration: parseInt(serviceDuration, 10),
          imageUrl: serviceImage || null,
        }),
      });
      if (res.ok) {
        setServiceName("");
        setServicePrice("");
        setServiceDuration("30");
        setServiceImage("");
        await loadAdminData();
      } else {
        alert("Error al agregar servicio");
      }
    } catch (err) {
      console.error("Error adding service:", err);
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este servicio?")) return;
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadAdminData();
      } else {
        alert("Error al eliminar servicio");
      }
    } catch (err) {
      console.error("Error deleting service:", err);
    }
  };

  // Stripe Simulator Payment
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          plan: selectedPlanId,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al actualizar el plan");
      }

      const data = await res.json();
      if (data.success && data.business) {
        setBusiness(data.business);
      }
    } catch (err) {
      console.error("Error updating plan:", err);
    }

    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        const nextInvNum = paymentHistory.length + 1;
        const todayStr = new Date().toLocaleDateString("es-ES");
        
        let planPriceAmount = 3999000; // default Negocio
        if (selectedPlanId === "INDIVIDUAL") planPriceAmount = 990000;
        else if (selectedPlanId === "EQUIPO") planPriceAmount = 1999000;

        setPaymentHistory(prev => [
          { id: `INV-00${nextInvNum}`, date: todayStr, amount: planPriceAmount, status: "PAID" },
          ...prev
        ]);
        setPaymentCardName("");
        setPaymentCardNumber("");
        setPaymentExpiry("");
        setPaymentCvv("");
      }, 1000);
    }, 2000);
  };

  // Refund Simulator
  const handleProcessRefund = () => {
    if (!selectedRefundApp) return;
    setIsProcessingRefund(true);
    setTimeout(() => {
      setIsProcessingRefund(false);
      setIsRefundModalOpen(false);
      if (business) {
        const updatedAppointments = business.appointments.map(app => {
          if (app.id === selectedRefundApp.id) {
            return { ...app, paymentStatus: "REFUNDED" };
          }
          return app;
        });
        setBusiness({ ...business, appointments: updatedAppointments });
      }
      setSelectedRefundApp(null);
    }, 1500);
  };

  // Format inputs
  const handlePaymentCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) return;
    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
    setPaymentCardNumber(formatted);
  };

  const handlePaymentExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) return;
    if (val.length > 2) {
      const formattedVal = val.substring(0, 2) + "/" + val.substring(2);
      setPaymentExpiry(formattedVal);
    } else {
      setPaymentExpiry(val);
    }
  };

  const handlePaymentCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length > 3) return;
    setPaymentCvv(val);
  };

  // WhatsApp linking progressive bar
  useEffect(() => {
    if (!isLinkingWhatsApp) return;
    setWhatsAppProgress(0);
    const interval = setInterval(() => {
      setWhatsAppProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLinkingWhatsApp(false);
          setWhatsAppLinked(true);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isLinkingWhatsApp]);



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
      { sender: "bot", text: "Perfecto. El servicio es 'Corte de Cabello' con Juan Pérez y tiene un valor de $15.000 CLP. Para confirmar la reserva, debes ingresar al siguiente link de pago simulado: agendalink.cl/democut/pay. ¿Deseas proceder?", delay: 9000 },
      { sender: "user", text: "Sí, acabo de pagar en el link.", delay: 13500 },
      { sender: "bot", text: "¡Recibido! Tu pago fue aprobado. He agendado tu cita para mañana a las 15:30 hrs. ¡Te esperamos! ⚡️", delay: 17000 }
    ];

    const timeouts: NodeJS.Timeout[] = [];

    messagesScript.forEach((msg, idx) => {
      const t = setTimeout(() => {
        setSecretaryTyping(msg.sender === "bot");
        const typingTimeout = setTimeout(() => {
          setSecretaryTyping(false);
          const timeStr = new Date();
          timeStr.setMinutes(timeStr.getMinutes() + idx * 3);
          const timeFormatted = timeStr.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
          setChatMessages(prev => [...prev, { sender: msg.sender as "user" | "bot", text: msg.text, time: timeFormatted }]);
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
  const totalWeeklySlots = 70 * professionalsCount;
  
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
          <button className={`${styles.navItem} ${activeTab === "ventas" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("ventas")}>
            <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Ventas y Caja
          </button>
          <button className={`${styles.navItem} ${activeTab === "clientes" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("clientes")}>
            <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Base de Clientes
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

        <span className={styles.navSectionTitle}>Configuración</span>
        <nav className={styles.navList}>
          <button className={`${styles.navItem} ${activeTab === "landing" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("landing")}>
            <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            Personalizar Landing
          </button>
          <button className={`${styles.navItem} ${activeTab === "administracion" ? styles.navItemActive : ""}`} onClick={() => { setActiveTab("administracion"); setAdminSubTab("servicios"); }}>
            <svg className={styles.sidebarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Ajustes de Negocio
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
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
            <Link href={`/${business.slug}`} target="_blank" className={styles.publicLinkBtn}>
              Ver link público ↗
            </Link>
            
            {/* Botón de Engranaje */}
            <button 
              className={styles.settingsGearBtn}
              onClick={() => {
                setIsGearDropdownOpen(!isGearDropdownOpen);
                setIsProfileDropdownOpen(false);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            
            {/* Botón de Perfil */}
            <button 
              className={styles.profileAvatarBtn}
              onClick={() => {
                setIsProfileDropdownOpen(!isProfileDropdownOpen);
                setIsGearDropdownOpen(false);
              }}
            >
              {ownerInitials}
            </button>

            {/* Dropdown de Engranaje */}
            {isGearDropdownOpen && (
              <div className={styles.settingsDropdown}>
                <button 
                  className={styles.profileDropdownItem}
                  onClick={() => {
                    setActiveTab("landing");
                    setIsGearDropdownOpen(false);
                  }}
                >
                  Configuraciones
                </button>
                <button 
                  className={styles.profileDropdownItem}
                  onClick={() => {
                    setActiveTab("administracion");
                    setAdminSubTab("servicios");
                    setIsGearDropdownOpen(false);
                  }}
                >
                  Usuarios
                </button>
                <button 
                  className={styles.profileDropdownItem}
                  onClick={() => {
                    setIsPaymentModalOpen(true);
                    setIsGearDropdownOpen(false);
                  }}
                >
                  Cuenta y Facturación
                </button>
              </div>
            )}

            {/* Dropdown de Perfil */}
            {isProfileDropdownOpen && (
              <div className={styles.profileDropdown}>
                <div className={styles.profileDropdownHeader}>
                  <div className={styles.profileHeaderAvatar}>{ownerInitials}</div>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>{ownerName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Administrador</div>
                  </div>
                </div>
                <div className={styles.profileDropdownDivider} />
                <button 
                  className={styles.profileDropdownItem}
                  onClick={() => {
                    setIsFirstStepsModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <svg className={styles.profileItemIcon} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                  </svg>
                  Primeros pasos
                </button>
                <button 
                  className={styles.profileDropdownItem}
                  onClick={() => {
                    setIsDownloadsModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <svg className={styles.profileItemIcon} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Mis Descargas
                </button>
                <button 
                  className={styles.profileDropdownItem}
                  onClick={() => {
                    setIsReferralModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <svg className={styles.profileItemIcon} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Invita y gana
                </button>
                <button 
                  className={styles.profileDropdownItem}
                  onClick={() => {
                    setIsAcademyModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <svg className={styles.profileItemIcon} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                  </svg>
                  Academia
                </button>
                <button 
                  className={styles.profileDropdownItem}
                  onClick={() => {
                    setIsPaymentModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <svg className={styles.profileItemIcon} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Pagar
                </button>
                <div className={styles.profileDropdownDivider} />
                <Link href="/" className={styles.profileDropdownItemLogout}>
                  <svg className={styles.profileItemIcon} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Cerrar sesión
                </Link>
              </div>
            )}
          </div>
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
                                {app.service?.name}
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
                        {`${app.service?.name} con ${app.professional?.name}`}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", display: "block" }}>
                        {new Date(app.dateTime).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div style={{ marginTop: "4px" }}>
                        {app.paymentStatus === "PAID" ? (
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
          isFeatureRestricted("EQUIPO") ? renderUpgradePrompt("EQUIPO", "Linki Secretary") : (
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
          )
        )}

        {activeTab === "marketing" && (
          isFeatureRestricted("EQUIPO") ? renderUpgradePrompt("EQUIPO", "Linki Marketing") : (
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
                    &quot;¡Hola [Nombre]! Te extrañamos en {business.name}. Hace un mes que no nos visitas. Agenda tu hora hoy y obtén un 10% de descuento usando tu link de reservas: agendalink.cl/{business.slug} ⚡️&quot;
                  </p>
                </div>
              </div>
            </section>
          )
        )}

        {activeTab === "business" && (
          isFeatureRestricted("NEGOCIO") ? renderUpgradePrompt("NEGOCIO", "Linki Business") : (
            <section className={styles.glassCard}>
              <div className={styles.reportTitle}>
                <svg className={styles.interiorIcon} style={{ width: "22px", height: "22px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-4.12 2.5 2.5 0 0 1 0-4.12A2.5 2.5 0 0 0 14.5 2z" />
                </svg>
                Linki Business • Reporte Semanal Estratégico
              </div>
              <div style={{ borderLeft: "4px solid var(--primary)", paddingLeft: "16px", margin: "16px 0" }}>
                <p className={styles.reportParagraph} style={{ fontStyle: "italic", fontWeight: "500" }}>
                  &quot;Hola. He analizado el rendimiento del negocio durante los últimos 7 días. Aquí tienes mi balance estratégico:&quot;
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
          )
        )}
        {/* --- VISTA: PERSONALIZAR LANDING --- */}
        {activeTab === "landing" && (
          <div className={styles.perfilLayoutGrid}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <section className={styles.glassCard}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Personalizar Landing Page</h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Edita los contenidos, fotos y banners de tu página de presentación. Los cambios se reflejarán de inmediato en el simulador.
                </p>
                
                <form onSubmit={handleSaveLanding} className={styles.adminForm}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className={styles.formGroup}>
                      <label>Título Principal</label>
                      <input 
                        type="text" 
                        value={landingTitle} 
                        onChange={e => setLandingTitle(e.target.value)} 
                        placeholder="Ej. Corte y Estilo Exclusivo" 
                        className={styles.formInput} 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Subtítulo</label>
                      <input 
                        type="text" 
                        value={landingSubtitle} 
                        onChange={e => setLandingSubtitle(e.target.value)} 
                        placeholder="Ej. Agenda tu cita en segundos." 
                        className={styles.formInput} 
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Sobre Nosotros (Historia del Negocio)</label>
                    <textarea 
                      value={landingAbout} 
                      onChange={e => setLandingAbout(e.target.value)} 
                      placeholder="Describe tu negocio, experiencia y propuesta de valor..." 
                      className={styles.formInput} 
                      style={{ minHeight: "80px", resize: "vertical" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                    <div className={styles.formGroup}>
                      <label>Logotipo del Negocio</label>
                      <input 
                        type="file" 
                        id="logo-upload" 
                        accept="image/*" 
                        style={{ display: "none" }} 
                        onChange={e => handleImageFileChange(e, setLogoUrl)} 
                      />
                      <label htmlFor="logo-upload" className={styles.uploadBtnLabel}>
                        {logoUrl ? "Cambiar Logotipo" : "Subir Logotipo"}
                      </label>
                      {logoUrl && (
                        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <img src={logoUrl} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                          <button type="button" onClick={() => setLogoUrl("")} style={{ border: "none", background: "none", color: "var(--danger)", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>Eliminar</button>
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Banner Principal (Hero)</label>
                      <input 
                        type="file" 
                        id="cover-upload" 
                        accept="image/*" 
                        style={{ display: "none" }} 
                        onChange={e => handleImageFileChange(e, setLandingCoverUrl)} 
                      />
                      <label htmlFor="cover-upload" className={styles.uploadBtnLabel}>
                        {landingCoverUrl ? "Cambiar Banner" : "Subir Banner"}
                      </label>
                      {landingCoverUrl && (
                        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "60px", height: "32px", borderRadius: "4px", backgroundImage: `url(${landingCoverUrl})`, backgroundSize: "cover" }} />
                          <button type="button" onClick={() => setLandingCoverUrl("")} style={{ border: "none", background: "none", color: "var(--danger)", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>Eliminar</button>
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Banner Secundario</label>
                      <input 
                        type="file" 
                        id="sec-cover-upload" 
                        accept="image/*" 
                        style={{ display: "none" }} 
                        onChange={e => handleImageFileChange(e, setLandingSecondaryCoverUrl)} 
                      />
                      <label htmlFor="sec-cover-upload" className={styles.uploadBtnLabel}>
                        {landingSecondaryCoverUrl ? "Cambiar Banner Sec." : "Subir Banner Sec."}
                      </label>
                      {landingSecondaryCoverUrl && (
                        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "60px", height: "32px", borderRadius: "4px", backgroundImage: `url(${landingSecondaryCoverUrl})`, backgroundSize: "cover" }} />
                          <button type="button" onClick={() => setLandingSecondaryCoverUrl("")} style={{ border: "none", background: "none", color: "var(--danger)", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>Eliminar</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                    <div className={styles.formGroup}>
                      <label>Teléfono de Contacto</label>
                      <input 
                        type="text" 
                        value={landingPhone} 
                        onChange={e => setLandingPhone(e.target.value)} 
                        placeholder="+56 9 1234 5678" 
                        className={styles.formInput} 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Dirección</label>
                      <input 
                        type="text" 
                        value={landingAddress} 
                        onChange={e => setLandingAddress(e.target.value)} 
                        placeholder="Ej. Av. Providencia 1234" 
                        className={styles.formInput} 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Horario de Atención</label>
                      <input 
                        type="text" 
                        value={landingHours} 
                        onChange={e => setLandingHours(e.target.value)} 
                        placeholder="Ej. Lun a Sáb: 9:00 - 20:00" 
                        className={styles.formInput} 
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(0,102,255,0.08)", paddingTop: "16px", marginTop: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Ventajas Principales (¿Por qué elegirnos?)</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                        <input type="text" value={feat1Title} onChange={e => setFeat1Title(e.target.value)} placeholder="Ventaja 1" className={styles.formInput} />
                        <input type="text" value={feat1Desc} onChange={e => setFeat1Desc(e.target.value)} placeholder="Descripción Ventaja 1" className={styles.formInput} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                        <input type="text" value={feat2Title} onChange={e => setFeat2Title(e.target.value)} placeholder="Ventaja 2" className={styles.formInput} />
                        <input type="text" value={feat2Desc} onChange={e => setFeat2Desc(e.target.value)} placeholder="Descripción Ventaja 2" className={styles.formInput} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                        <input type="text" value={feat3Title} onChange={e => setFeat3Title(e.target.value)} placeholder="Ventaja 3" className={styles.formInput} />
                        <input type="text" value={feat3Desc} onChange={e => setFeat3Desc(e.target.value)} placeholder="Descripción Ventaja 3" className={styles.formInput} />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(0,102,255,0.08)", paddingTop: "16px", marginTop: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Testimonios de Clientes</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ padding: "12px", background: "rgba(0,0,0,0.01)", borderRadius: "12px", border: "1px solid var(--input-border)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "8px" }}>
                          <input type="text" value={test1Name} onChange={e => setTest1Name(e.target.value)} placeholder="Nombre Cliente 1" className={styles.formInput} />
                          <select value={test1Stars} onChange={e => setTest1Stars(parseInt(e.target.value))} className={styles.formInput}>
                            <option value="5">5 estrellas</option>
                            <option value="4">4 estrellas</option>
                            <option value="3">3 estrellas</option>
                          </select>
                        </div>
                        <input type="text" value={test1Text} onChange={e => setTest1Text(e.target.value)} placeholder="Texto del testimonio 1" className={styles.formInput} />
                      </div>

                      <div style={{ padding: "12px", background: "rgba(0,0,0,0.01)", borderRadius: "12px", border: "1px solid var(--input-border)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "8px" }}>
                          <input type="text" value={test2Name} onChange={e => setTest2Name(e.target.value)} placeholder="Nombre Cliente 2" className={styles.formInput} />
                          <select value={test2Stars} onChange={e => setTest2Stars(parseInt(e.target.value))} className={styles.formInput}>
                            <option value="5">5 estrellas</option>
                            <option value="4">4 estrellas</option>
                            <option value="3">3 estrellas</option>
                          </select>
                        </div>
                        <input type="text" value={test2Text} onChange={e => setTest2Text(e.target.value)} placeholder="Texto del testimonio 2" className={styles.formInput} />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={isSavingLanding} className={styles.submitButton} style={{ marginTop: "20px" }}>
                    {isSavingLanding ? "Guardando Cambios..." : "Guardar Cambios"}
                  </button>
                </form>
              </section>

              <section className={styles.glassCard}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  🌐 Dominio Personalizado
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Configura tu propia dirección web (ej: <code>mi-negocio.cl</code>) para que tus clientes accedan directamente a tu landing page y agenda de reservas.
                </p>

                {business.customDomain ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(52, 199, 89, 0.08)", border: "1px solid rgba(52, 199, 89, 0.2)", padding: "14px 16px", borderRadius: "12px", marginBottom: "20px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#34c759", display: "block", letterSpacing: "0.5px" }}>Estado del Dominio</span>
                        <a href={`https://${business.customDomain}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "15px", fontWeight: "700", color: "var(--primary)", textDecoration: "underline", display: "inline-block", marginTop: "4px" }}>
                          {business.customDomain}
                        </a>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34c759", display: "inline-block", boxShadow: "0 0 8px #34c759" }} />
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#34c759" }}>Activo</span>
                      </div>
                    </div>

                    <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "16px" }}>
                      <h3 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", color: "var(--foreground)" }}>Instrucciones de Configuración DNS</h3>
                      <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "12px" }}>
                        Para activar y mantener enlazado tu dominio, debes configurar los siguientes registros en tu proveedor de DNS (ej: NIC Chile, GoDaddy, Cloudflare, etc.):
                      </p>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 2fr", gap: "8px", background: "rgba(0,0,0,0.02)", padding: "10px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--card-border)" }}>
                          <div><strong>Tipo:</strong> CNAME</div>
                          <div><strong>Nombre/Host:</strong> <code>@</code> (o raíz)</div>
                          <div><strong>Valor/Destino:</strong> <code>agendalink.cl</code></div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 2fr", gap: "8px", background: "rgba(0,0,0,0.02)", padding: "10px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--card-border)" }}>
                          <div><strong>Tipo:</strong> CNAME</div>
                          <div><strong>Nombre/Host:</strong> <code>www</code></div>
                          <div><strong>Valor/Destino:</strong> <code>agendalink.cl</code></div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "14px", background: "rgba(0, 102, 255, 0.05)", border: "1px solid rgba(0, 102, 255, 0.1)", padding: "10px 12px", borderRadius: "8px" }}>
                        <span style={{ fontSize: "16px" }}>💡</span>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                          La propagación de los cambios en el DNS puede tardar desde unos minutos hasta 24 horas dependiendo de tu proveedor.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(0, 102, 255, 0.05)", border: "1px solid rgba(0, 102, 255, 0.1)", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
                      <span style={{ fontSize: "24px" }}>💎</span>
                      <div style={{ textAlign: "left" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--foreground)", margin: "0 0 4px 0" }}>Dale un toque profesional a tu negocio</h3>
                        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                          Con un dominio personalizado, tus clientes verán una dirección como <code>www.tualianza.cl</code> en vez de <code>agendalink.cl/{business.slug}</code>.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", textAlign: "center", padding: "10px 0" }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          window.open(`https://wa.me/56982731102?text=Hola,%20quisiera%20solicitar%20un%20dominio%20personalizado%20para%20mi%20negocio%20${business.slug}`, "_blank");
                        }}
                        className={styles.submitButton}
                        style={{ width: "auto", padding: "10px 24px", background: "var(--primary)" }}
                      >
                        Solicitar Dominio Personalizado 🚀
                      </button>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        *Disponible para planes Premium. Nuestro equipo lo configurará por ti de inmediato.
                      </span>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* iPhone Simulator Live Preview */}
            <div className={styles.previewContainer}>
              <div className={styles.iphoneWrapper}>
                <div className={styles.iphoneScreen}>
                  <div className={styles.iphoneStatusBar}>
                    <span>9:41 AM</span>
                    <div style={{ display: "flex", gap: "3px" }}>
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>

                  {/* Header */}
                  <div className={styles.previewHeader}>
                    {logoUrl ? (
                      <img src={logoUrl} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", marginBottom: "6px" }} />
                    ) : (
                      <div className={styles.previewLogo} style={{ marginBottom: "6px" }}>
                        {business.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <h4 style={{ fontSize: "13px", fontWeight: "800", margin: 0 }}>{business.name}</h4>
                    <span className={styles.statusBadge} style={{ transform: "scale(0.8)", margin: "4px 0" }}>
                      <span className={styles.statusDot} />
                      Disponible
                    </span>
                  </div>

                  {/* Hero Image */}
                  <div className={styles.previewHero} style={{ backgroundImage: landingCoverUrl ? `url(${landingCoverUrl})` : "linear-gradient(135deg, #00c6ff, #0072ff)" }}>
                    <div className={styles.previewHeroOverlay}>
                      <h2 style={{ color: "white", fontSize: "14px", fontWeight: "800", margin: 0 }}>
                        {landingTitle || "Tu Belleza y Estilo"}
                      </h2>
                      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "10px", margin: "2px 0 0 0" }}>
                        {landingSubtitle || "Reserva con nosotros online."}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div className={styles.previewContactPill}>
                      <span>📞</span>
                      <span>{landingPhone || (business.category === "Profesionales" ? "+56 9 9999 8888" : "+56 9 1234 5678")}</span>
                    </div>
                    <div className={styles.previewContactPill}>
                      <span>📍</span>
                      <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{landingAddress || "Av. Las Condes 999"}</span>
                    </div>
                    <div className={styles.previewContactPill}>
                      <span>⏰</span>
                      <span>{landingHours || "Lun a Sáb: 9:00 - 19:30"}</span>
                    </div>
                  </div>

                  {/* About Section */}
                  <div style={{ padding: "0 12px 12px 12px", textAlign: "left" }}>
                    <h5 style={{ fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>Sobre Nosotros</h5>
                    <p style={{ fontSize: "10px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                      {landingAbout || "Somos una empresa líder ofreciendo los mejores servicios a nuestros distinguidos clientes."}
                    </p>
                  </div>

                  {/* Banner Secundario */}
                  {landingSecondaryCoverUrl && (
                    <div style={{ height: "70px", backgroundImage: `url(${landingSecondaryCoverUrl})`, backgroundSize: "cover", backgroundPosition: "center", margin: "0 12px 12px 12px", borderRadius: "10px", display: "flex", alignItems: "center", padding: "10px", boxSizing: "border-box" }}>
                      <div style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(4px)", padding: "4px 8px", borderRadius: "6px", fontSize: "9px", fontWeight: "bold", color: "#1d1d1f" }}>
                        Calidad de Nivel Mundial
                      </div>
                    </div>
                  )}

                  {/* Advantages / Características con Iconos Azules */}
                  <div style={{ padding: "0 12px 12px 12px", textAlign: "left" }}>
                    <h5 style={{ fontSize: "11px", fontWeight: "700", marginBottom: "8px" }}>¿Por qué elegirnos?</h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div className={styles.featureIconWrapper}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                            <circle cx="12" cy="8" r="7" />
                            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                          </svg>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "10px", fontWeight: "600" }}>{feat1Title || (business.category === "Profesionales" ? "Asesoría Experta" : "Atención Personalizada")}</span>
                          <span style={{ fontSize: "9px", color: "var(--text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "200px" }}>{feat1Desc || (business.category === "Profesionales" ? "Consultores y especialistas certificados." : "Adaptados a tus necesidades.")}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div className={styles.featureIconWrapper}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <polyline points="9 11 11 13 15 9" />
                          </svg>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "10px", fontWeight: "600" }}>{feat2Title || (business.category === "Profesionales" ? "Horarios Flexibles" : "Profesionales Expertos")}</span>
                          <span style={{ fontSize: "9px", color: "var(--text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "200px" }}>{feat2Desc || (business.category === "Profesionales" ? "Reserva tu hora y conéctate cómodamente." : "Personal certificado y con experiencia.")}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div className={styles.featureIconWrapper}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.flatBlueIcon}>
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "10px", fontWeight: "600" }}>{feat3Title || "Confirmación Inmediata"}</span>
                          <span style={{ fontSize: "9px", color: "var(--text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "200px" }}>{feat3Desc || "Tu cupo queda asegurado al instante."}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Testimonios */}
                  <div style={{ padding: "0 12px 12px 12px", textAlign: "left" }}>
                    <h5 style={{ fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>Opiniones</h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ background: "white", padding: "6px 8px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: "700" }}>
                          <span>{test1Name || "María Jesús"}</span>
                          <span style={{ color: "#ff9500" }}>{"★".repeat(test1Stars)}</span>
                        </div>
                        <p style={{ fontSize: "8px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                          {test1Text || "Me encanta la atención, súper rápido y recomendado."}
                        </p>
                      </div>
                      <div style={{ background: "white", padding: "6px 8px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: "700" }}>
                          <span>{test2Name || "Rodrigo A."}</span>
                          <span style={{ color: "#ff9500" }}>{"★".repeat(test2Stars)}</span>
                        </div>
                        <p style={{ fontSize: "8px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                          {test2Text || "El mejor servicio en toda la ciudad."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer CTA */}
                  <div className={styles.previewFooterCTA}>
                    <button className={styles.previewBookBtn} type="button">
                      Reservar Cita Online
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA: VENTAS Y CAJA --- */}
        {activeTab === "ventas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className={styles.segmentedControl}>
              <button 
                className={`${styles.segmentedButton} ${salesSubTab === "transacciones" ? styles.segmentedButtonActive : ""}`} 
                onClick={() => setSalesSubTab("transacciones")}
              >
                Transacciones
              </button>
              <button 
                className={`${styles.segmentedButton} ${salesSubTab === "membresias" ? styles.segmentedButtonActive : ""}`} 
                onClick={() => setSalesSubTab("membresias")}
              >
                Membresías
              </button>
              <button 
                className={`${styles.segmentedButton} ${salesSubTab === "giftcards" ? styles.segmentedButtonActive : ""}`} 
                onClick={() => setSalesSubTab("giftcards")}
              >
                Gift Cards
              </button>
              <button 
                className={`${styles.segmentedButton} ${salesSubTab === "caja" ? styles.segmentedButtonActive : ""}`} 
                onClick={() => setSalesSubTab("caja")}
              >
                Caja y Propinas
              </button>
            </div>

            {salesSubTab === "transacciones" && (
              <section className={styles.glassCard}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Historial Financiero</h2>
                <div className={styles.tableWrapper}>
                  <table className={styles.financialTable}>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>WhatsApp</th>
                        <th>Fecha</th>
                        <th>Servicio</th>
                        <th>Monto</th>
                        <th>Estado de Pago</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {business.appointments?.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary)" }}>
                            No hay transacciones registradas.
                          </td>
                        </tr>
                      ) : (
                        business.appointments.map((app) => (
                          <tr key={app.id}>
                            <td style={{ fontWeight: "700" }}>{app.clientName}</td>
                            <td>{app.clientWhatsApp}</td>
                            <td>{new Date(app.dateTime).toLocaleDateString("es-ES")}</td>
                            <td>{app.service?.name}</td>
                            <td style={{ fontWeight: "800", color: "var(--primary)" }}>
                              {formatPrice(app.paymentAmount || app.service?.price || 0, business.currency)}
                            </td>
                            <td>
                              {app.paymentStatus === "PAID" ? (
                                <span className={styles.badgePaid}>PAGADO ({app.paymentMethod || "Visa Sim"})</span>
                              ) : app.paymentStatus === "REFUNDED" ? (
                                <span className={styles.badgePaid} style={{ background: "rgba(255, 59, 48, 0.12)", color: "#ff3b30", borderColor: "rgba(255, 59, 48, 0.2)" }}>
                                  REEMBOLSADO
                                </span>
                              ) : (
                                <span className={styles.badgePaid} style={{ background: "rgba(255, 149, 0, 0.12)", color: "#b25900", borderColor: "rgba(255, 149, 0, 0.2)" }}>
                                  PENDIENTE
                                </span>
                              )}
                            </td>
                            <td>
                              {app.paymentStatus === "PAID" ? (
                                <button 
                                  className={styles.refundBtn}
                                  onClick={() => {
                                    setSelectedRefundApp(app);
                                    setIsRefundModalOpen(true);
                                  }}
                                >
                                  Reembolsar
                                </button>
                              ) : (
                                <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {salesSubTab === "membresias" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
                <section className={styles.glassCard}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Membresías de Clientes</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {memberships.map((m) => {
                      const percent = Math.min(100, Math.round((m.current / m.total) * 100));
                      const isSessions = m.name.toLowerCase().includes("sesion") || m.name.toLowerCase().includes("sesión");
                      const progressLabel = isSessions ? "Progreso de Sesiones Consumidas" : "Días Restantes de Acceso";
                      const progressValue = isSessions ? `${m.current} / ${m.total} (${percent}%)` : `${m.current} / ${m.total} días (${percent}%)`;
                      const progressBarColor = isSessions ? "var(--primary)" : "var(--success)";

                      return (
                        <div key={m.id} className={styles.configToggleRow} style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px", background: "rgba(0,0,0,0.01)", border: "1px solid var(--card-border)", padding: "16px", borderRadius: "16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <strong style={{ fontSize: "14px" }}>{m.name}</strong>
                            <span className={m.status === "Activo" ? styles.badgePaid : styles.badgeRefunded} style={{ fontSize: "10px", padding: "2px 8px" }}>{m.status}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              Cliente: {m.clientName} (WhatsApp: {m.phone})
                            </span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {/* Quick edit buttons */}
                              <button
                                onClick={() => {
                                  setMemberships(prev => prev.map(item => item.id === m.id ? { ...item, current: Math.max(0, item.current - 1) } : item));
                                }}
                                style={{ border: "1px solid var(--card-border)", background: "white", borderRadius: "4px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                                title="Disminuir"
                              >-</button>
                              <button
                                onClick={() => {
                                  setMemberships(prev => prev.map(item => item.id === m.id ? { ...item, current: Math.min(item.total, item.current + 1) } : item));
                                }}
                                style={{ border: "1px solid var(--card-border)", background: "white", borderRadius: "4px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                                title="Incrementar"
                              >+</button>
                              <button
                                onClick={() => {
                                  setEditingMembershipId(m.id);
                                  setEditingMembershipName(m.name);
                                  setEditingMembershipClient(m.clientName);
                                  setEditingMembershipPhone(m.phone);
                                  setEditingMembershipCurrent(m.current);
                                  setEditingMembershipTotal(m.total);
                                  setEditingMembershipStatus(m.status);
                                }}
                                style={{ border: "1px solid var(--primary)", background: "rgba(0,102,255,0.05)", color: "var(--primary)", borderRadius: "4px", padding: "0 8px", fontSize: "11px", height: "24px", cursor: "pointer", fontWeight: "600" }}
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                          <div style={{ width: "100%", marginTop: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                              <span>{progressLabel}</span>
                              <span>{progressValue}</span>
                            </div>
                            <div className={styles.progressBarBg}>
                              <div className={styles.progressBarFill} style={{ width: `${percent}%`, background: progressBarColor }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className={styles.glassCard}>
                  {editingMembershipId ? (
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Editar Membresía</h3>
                      <form onSubmit={e => {
                        e.preventDefault();
                        setMemberships(prev => prev.map(item => item.id === editingMembershipId ? {
                          ...item,
                          name: editingMembershipName,
                          clientName: editingMembershipClient,
                          phone: editingMembershipPhone,
                          current: Number(editingMembershipCurrent),
                          total: Number(editingMembershipTotal),
                          status: editingMembershipStatus
                        } : item));
                        setEditingMembershipId(null);
                        alert("Membresía actualizada con éxito");
                      }} className={styles.adminForm}>
                        <div className={styles.formGroup}>
                          <label>Nombre del Plan</label>
                          <input type="text" required value={editingMembershipName} onChange={e => setEditingMembershipName(e.target.value)} className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Nombre del Cliente</label>
                          <input type="text" required value={editingMembershipClient} onChange={e => setEditingMembershipClient(e.target.value)} className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                          <label>WhatsApp / Teléfono</label>
                          <input type="text" required value={editingMembershipPhone} onChange={e => setEditingMembershipPhone(e.target.value)} className={styles.formInput} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div className={styles.formGroup}>
                            <label>Consumido</label>
                            <input type="number" required value={editingMembershipCurrent} onChange={e => setEditingMembershipCurrent(Number(e.target.value))} className={styles.formInput} />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Total Plan</label>
                            <input type="number" required value={editingMembershipTotal} onChange={e => setEditingMembershipTotal(Number(e.target.value))} className={styles.formInput} />
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estado</label>
                          <select value={editingMembershipStatus} onChange={e => setEditingMembershipStatus(e.target.value)} className={styles.formInput} style={{ background: "white" }}>
                            <option value="Activo">Activo</option>
                            <option value="Vencido">Vencido</option>
                            <option value="Pausado">Pausado</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                          <button type="submit" className={styles.submitButton} style={{ flex: 1 }}>Guardar</button>
                          <button type="button" onClick={() => setEditingMembershipId(null)} className={styles.todayDetailsBtn} style={{ flex: 1, minHeight: "42px" }}>Cancelar</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Crear Membresía</h3>
                      <form onSubmit={e => {
                        e.preventDefault();
                        const target = e.target as any;
                        const name = target.planName.value;
                        const clientName = target.clientName.value;
                        const phone = target.phone.value;
                        const total = Number(target.total.value);
                        
                        const newM: any = {
                          id: memberships.length + 1,
                          name,
                          clientName,
                          phone,
                          current: 0,
                          total,
                          status: "Activo"
                        };
                        setMemberships(prev => [...prev, newM]);
                        target.reset();
                        alert("Membresía creada con éxito");
                      }} className={styles.adminForm}>
                        <div className={styles.formGroup}>
                          <label>Nombre del Plan</label>
                          <input type="text" name="planName" required placeholder="Ej. Plan 5 Sesiones Kinesiología" className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Nombre del Cliente</label>
                          <input type="text" name="clientName" required placeholder="Ej. Camila Silva" className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                          <label>WhatsApp / Teléfono</label>
                          <input type="text" name="phone" required placeholder="Ej. +56 9 1234 5678" className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Cantidad de Sesiones o Días</label>
                          <input type="number" name="total" required placeholder="Ej. 10" className={styles.formInput} />
                        </div>
                        <button type="submit" className={styles.submitButton}>Crear Membresía</button>
                      </form>
                    </div>
                  )}
                </section>
              </div>
            )}

            {salesSubTab === "giftcards" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
                <section className={styles.glassCard}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Tarjetas de Regalo Emitidas</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {giftCards.map((gc) => (
                      <div key={gc.id} className={styles.giftCardItem} style={{ border: "1px solid var(--card-border)", borderRadius: "12px", padding: "14px", background: "white" }}>
                        <div className={styles.giftCardHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ fontSize: "14px", color: "var(--primary)" }}>{gc.id}</strong>
                            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>Beneficiario: {gc.beneficiary}</p>
                          </div>
                          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                            <span style={{ fontSize: "16px", fontWeight: "800" }}>{formatPrice(gc.amount, business?.currency || "CLP")}</span>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <span className={gc.status === "Vigente" ? styles.badgePaid : styles.badgeRefunded} style={{ fontSize: "9px", padding: "2px 6px" }}>{gc.status}</span>
                              <button
                                onClick={() => {
                                  setEditingGiftCardId(gc.id);
                                  setEditingGiftCardBeneficiary(gc.beneficiary);
                                  setEditingGiftCardAmount(gc.amount);
                                  setEditingGiftCardStatus(gc.status);
                                }}
                                style={{ border: "1px solid var(--primary)", background: "rgba(0,102,255,0.05)", color: "var(--primary)", borderRadius: "4px", padding: "2px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "600" }}
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={styles.glassCard}>
                  {editingGiftCardId ? (
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Editar Gift Card</h3>
                      <form onSubmit={e => {
                        e.preventDefault();
                        setGiftCards(prev => prev.map(item => item.id === editingGiftCardId ? {
                          ...item,
                          beneficiary: editingGiftCardBeneficiary,
                          amount: Number(editingGiftCardAmount),
                          status: editingGiftCardStatus
                        } : item));
                        setEditingGiftCardId(null);
                        alert("¡Gift Card actualizada exitosamente!");
                      }} className={styles.adminForm}>
                        <div className={styles.formGroup}>
                          <label>Código Tarjeta</label>
                          <input type="text" disabled value={editingGiftCardId} className={styles.formInput} style={{ background: "#f5f5f7", cursor: "not-allowed" }} />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Nombre del Beneficiario</label>
                          <input type="text" required value={editingGiftCardBeneficiary} onChange={e => setEditingGiftCardBeneficiary(e.target.value)} className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Monto</label>
                          <input type="number" required value={editingGiftCardAmount} onChange={e => setEditingGiftCardAmount(Number(e.target.value))} className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estado</label>
                          <select value={editingGiftCardStatus} onChange={e => setEditingGiftCardStatus(e.target.value)} className={styles.formInput} style={{ background: "white" }}>
                            <option value="Vigente">Vigente</option>
                            <option value="Canjeada">Canjeada</option>
                            <option value="Expirada">Expirada</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                          <button type="submit" className={styles.submitButton} style={{ flex: 1 }}>Guardar</button>
                          <button type="button" onClick={() => setEditingGiftCardId(null)} className={styles.todayDetailsBtn} style={{ flex: 1, minHeight: "42px" }}>Cancelar</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Crear Gift Card</h3>
                      <form onSubmit={e => {
                        e.preventDefault();
                        const nextCode = `COD-GIFT-${Math.floor(1000 + Math.random() * 9000)}`;
                        setGiftCards(prev => [...prev, {
                          id: nextCode,
                          beneficiary: giftCardBeneficiary,
                          amount: Number(giftCardAmount),
                          status: "Vigente"
                        }]);
                        setGiftCardBeneficiary("");
                        setGiftCardAmount("");
                        alert("¡Gift Card emitida exitosamente!");
                      }} className={styles.adminForm}>
                        <div className={styles.formGroup}>
                          <label>Nombre del Beneficiario</label>
                          <input type="text" required placeholder="Ej. Juan Gómez" value={giftCardBeneficiary} onChange={e => setGiftCardBeneficiary(e.target.value)} className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Monto</label>
                          <input type="number" required placeholder="Ej. 15000" value={giftCardAmount} onChange={e => setGiftCardAmount(e.target.value)} className={styles.formInput} />
                        </div>
                        <button type="submit" className={styles.submitButton}>Emitir Tarjeta</button>
                      </form>
                    </div>
                  )}
                </section>
              </div>
            )}

            {salesSubTab === "caja" && (
              <section className={styles.glassCard}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Caja Diaria y Liquidación de Propinas</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ padding: "20px", background: "rgba(0,0,0,0.01)", border: "1px solid var(--card-border)", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: "var(--text-secondary)" }}>Arqueo de Caja del Día</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Apertura de Caja:</span>
                        <strong>$50.000 CLP</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Ingresos Online Tarjeta:</span>
                        <strong>{formatPrice(totalSales, business?.currency || "CLP")}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "8px", fontSize: "15px" }}>
                        <span>Total Balance Caja:</span>
                        <strong style={{ color: "var(--primary)" }}>{formatPrice(totalSales + 50000, business?.currency || "CLP")}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "20px", background: "rgba(0,0,0,0.01)", border: "1px solid var(--card-border)", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: "var(--text-secondary)" }}>Liquidación de Propinas</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Propinas Acumuladas 10%:</span>
                        <strong>{formatPrice(totalSales * 0.1, business?.currency || "CLP")}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Propinas por Liquidar:</span>
                        <strong>{formatPrice(Math.max(0, (totalSales * 0.1) - liquidatedTips), business?.currency || "CLP")}</strong>
                      </div>
                      <button 
                        onClick={() => {
                          const toLiquidate = Math.max(0, (totalSales * 0.1) - liquidatedTips);
                          if (toLiquidate <= 0) {
                            alert("No hay propinas pendientes por liquidar.");
                            return;
                          }
                          setLiquidatedTips(totalSales * 0.1);
                          alert(`¡Propinas por un monto de ${formatPrice(toLiquidate, business?.currency || "CLP")} liquidadas con éxito al staff de turno!`);
                        }}
                        className={styles.submitButton} 
                        style={{ marginTop: "12px", minHeight: "36px" }}
                        disabled={Math.max(0, (totalSales * 0.1) - liquidatedTips) <= 0}
                      >
                        Liquidar Propinas
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* --- VISTA: BASE DE CLIENTES --- */}
        {activeTab === "clientes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className={styles.segmentedControl}>
              <button 
                className={`${styles.segmentedButton} ${clientsSubTab === "base" ? styles.segmentedButtonActive : ""}`} 
                onClick={() => setClientsSubTab("base")}
              >
                Base de Clientes
              </button>
              <button 
                className={`${styles.segmentedButton} ${clientsSubTab === "recordatorios" ? styles.segmentedButtonActive : ""}`} 
                onClick={() => setClientsSubTab("recordatorios")}
              >
                Recordatorios
              </button>
              <button 
                className={`${styles.segmentedButton} ${clientsSubTab === "crece" ? styles.segmentedButtonActive : ""}`} 
                onClick={() => setClientsSubTab("crece")}
              >
                Fidelización IA
              </button>
            </div>

            {clientsSubTab === "base" && (
              <section className={styles.glassCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Listado de Clientes</h2>
                  <input 
                    type="text" 
                    value={clientSearchQuery}
                    onChange={e => setClientSearchQuery(e.target.value)}
                    placeholder="Buscar cliente por nombre o WhatsApp..." 
                    className={styles.formInput} 
                    style={{ maxWidth: "280px", minHeight: "36px", padding: "8px 12px", fontSize: "13px" }}
                  />
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.financialTable}>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>WhatsApp</th>
                        <th>Total Reservas</th>
                        <th>Última Cita</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const clientMap = new Map();
                        business.appointments?.forEach(app => {
                          if (!clientMap.has(app.clientWhatsApp)) {
                            clientMap.set(app.clientWhatsApp, {
                              name: app.clientName,
                              whatsapp: app.clientWhatsApp,
                              count: 0,
                              lastDate: app.dateTime,
                              notes: "Cliente recurrente, prefiere atención en las tardes."
                            });
                          }
                          const c = clientMap.get(app.clientWhatsApp);
                          c.count += 1;
                          if (new Date(app.dateTime) > new Date(c.lastDate)) {
                            c.lastDate = app.dateTime;
                          }
                        });

                        const clients = Array.from(clientMap.values()).filter(c => 
                          c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                          c.whatsapp.includes(clientSearchQuery)
                        );

                        if (clients.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary)" }}>
                                No hay clientes encontrados.
                              </td>
                            </tr>
                          );
                        }

                        return clients.map((c, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: "700" }}>{c.name}</td>
                            <td>{c.whatsapp}</td>
                            <td>{c.count} citas</td>
                            <td>{new Date(c.lastDate).toLocaleDateString("es-ES")}</td>
                            <td>
                              <button 
                                className={styles.todayDetailsBtn}
                                onClick={() => setSelectedClient(c)}
                              >
                                Ver Ficha
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {clientsSubTab === "recordatorios" && (
              <section className={styles.glassCard} style={{ maxWidth: "540px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>Configuración de Notificaciones</h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Habilita o deshabilita los mensajes automáticos enviados por Linki Secretary en WhatsApp.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className={styles.configToggleRow}>
                    <div>
                      <strong style={{ fontSize: "14px" }}>Recordatorio 24 horas antes</strong>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Recordatorio de cita automático un día antes de la hora acordada.</p>
                    </div>
                    <button 
                      className={`${styles.iosToggle} ${reminderWhatsApp24h ? styles.iosToggleActive : ""}`}
                      onClick={() => setReminderWhatsApp24h(!reminderWhatsApp24h)}
                    >
                      <span className={styles.iosToggleDot} />
                    </button>
                  </div>

                  <div className={styles.configToggleRow}>
                    <div>
                      <strong style={{ fontSize: "14px" }}>Aviso de confirmación inmediata</strong>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Envía el link de confirmación y detalles al instante de agendar.</p>
                    </div>
                    <button 
                      className={`${styles.iosToggle} ${reminderWhatsApp1h ? styles.iosToggleActive : ""}`}
                      onClick={() => setReminderWhatsApp1h(!reminderWhatsApp1h)}
                    >
                      <span className={styles.iosToggleDot} />
                    </button>
                  </div>

                  <div className={styles.configToggleRow}>
                    <div>
                      <strong style={{ fontSize: "14px" }}>Promociones automáticas (Fidelización)</strong>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Contacta automáticamente a clientes inactivos después de 30 días.</p>
                    </div>
                    <button 
                      className={`${styles.iosToggle} ${reminderMarketing ? styles.iosToggleActive : ""}`}
                      onClick={() => setReminderMarketing(!reminderMarketing)}
                    >
                      <span className={styles.iosToggleDot} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {clientsSubTab === "crece" && (
              <section className={styles.glassCard}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>Programa de Puntos IA y Retención</h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Configura campañas automatizadas impulsadas por inteligencia artificial para retener clientes.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ padding: "20px", background: "rgba(0,0,0,0.01)", border: "1px solid var(--card-border)", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Puntos por Cita</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Los clientes acumulan 100 puntos por cada reserva online completada. Al juntar 1000 puntos obtienen 50% desc.</p>
                    <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
                      <span className={styles.badgePaid}>Programa Activo</span>
                      <button onClick={() => alert("Programa de Puntos configurado")} className={styles.todayDetailsBtn}>Configurar</button>
                    </div>
                  </div>
                  <div style={{ padding: "20px", background: "rgba(0,0,0,0.01)", border: "1px solid var(--card-border)", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Reactivación Inteligente</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Linki IA detecta el ciclo de visitas promedio del cliente. Si se pasa del plazo, le ofrece un agendamiento prioritario.</p>
                    <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
                      <span className={styles.badgePaid}>IA Activa</span>
                      <button onClick={() => alert("IA Reactivadora de Clientes activa")} className={styles.todayDetailsBtn}>Ajustes Avanzados</button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* --- VISTA: AJUSTES DE NEGOCIO --- */}
        {activeTab === "administracion" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className={styles.segmentedControl}>
              <button 
                className={`${styles.segmentedButton} ${adminSubTab === "servicios" ? styles.segmentedButtonActive : ""}`} 
                onClick={() => setAdminSubTab("servicios")}
              >
                Servicios y Recursos
              </button>
              <button 
                className={`${styles.segmentedButton} ${adminSubTab === "whatsapp" ? styles.segmentedButtonActive : ""}`} 
                onClick={() => setAdminSubTab("whatsapp")}
              >
                Vincular WhatsApp
              </button>
            </div>

            {adminSubTab === "servicios" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "32px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Agregar Servicio / Actividad</h3>
                  <form onSubmit={handleAddService} className={styles.adminForm}>
                    <div className={styles.formGroup}>
                      <label>Nombre del Servicio</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ej. Corte Masculino + Lavado" 
                        value={serviceName} 
                        onChange={e => setServiceName(e.target.value)} 
                        className={styles.formInput} 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Precio</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="Ej. 15000" 
                        value={servicePrice} 
                        onChange={e => setServicePrice(e.target.value)} 
                        className={styles.formInput} 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Duración (Minutos)</label>
                      <select 
                        value={serviceDuration} 
                        onChange={e => setServiceDuration(e.target.value)} 
                        className={styles.formInput}
                      >
                        <option value="15">15 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="45">45 minutos</option>
                        <option value="60">60 minutos</option>
                        <option value="90">90 minutos</option>
                        <option value="120">120 minutos</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Foto de Servicio (Miniatura)</label>
                      <input 
                        type="file" 
                        id="service-image-upload" 
                        accept="image/*" 
                        style={{ display: "none" }} 
                        onChange={e => handleImageFileChange(e, setServiceImage)} 
                      />
                      <label htmlFor="service-image-upload" className={styles.uploadBtnLabel}>
                        {serviceImage ? "Cambiar Foto" : "Subir Foto de Servicio"}
                      </label>
                      {serviceImage && (
                        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <img src={serviceImage} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                          <button type="button" onClick={() => setServiceImage("")} style={{ border: "none", background: "none", color: "var(--danger)", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>Eliminar</button>
                        </div>
                      )}
                    </div>
                    <button type="submit" disabled={isSubmittingService} className={styles.submitButton}>
                      {isSubmittingService ? "Creando..." : "Crear Servicio"}
                    </button>
                  </form>
                </div>

                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>Catálogo de Servicios</h3>
                  {business.services?.length === 0 ? (
                    <p style={{ fontStyle: "italic", color: "var(--text-secondary)", fontSize: "13px" }}>
                      No tienes servicios cargados aún.
                    </p>
                  ) : (
                    <div className={styles.menuItemList}>
                      {business.services?.map((svc) => (
                        <div key={svc.id} className={styles.menuItemCard}>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            {svc.imageUrl && (
                              <img src={svc.imageUrl} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                            )}
                            <div className={styles.menuItemInfo}>
                              <div className={styles.menuItemName}>{svc.name}</div>
                              <div className={styles.menuItemDesc}>{svc.duration} min de duración</div>
                            </div>
                          </div>
                          <div className={styles.menuItemActions}>
                            <span className={styles.menuItemPrice}>{formatPrice(svc.price, business.currency)}</span>
                            <button
                              className={styles.deleteBtn}
                              style={{ position: "relative", top: 0, right: 0, opacity: 0.6 }}
                              onClick={() => handleDeleteService(svc.id)}
                              title="Eliminar Servicio"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {adminSubTab === "whatsapp" && (
              <section className={styles.glassCard} style={{ maxWidth: "560px", textAlign: "center" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Vincular WhatsApp de Reservas</h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Vincula tu número celular de trabajo para habilitar el agente inteligente Linki Secretary.
                </p>

                {whatsAppLinked ? (
                  <div style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "36px" }}>✅</div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--success)", margin: 0 }}>¡WhatsApp Vinculado con Éxito!</h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      Linki Secretary está activo y respondiendo de forma autónoma a tus clientes en el número +56 9 8273 1102.
                    </p>
                    <button 
                      onClick={() => setWhatsAppLinked(false)} 
                      className={styles.submitButton}
                      style={{ background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", width: "fit-content", alignSelf: "center", minHeight: "36px", marginTop: "12px" }}
                    >
                      Desvincular WhatsApp
                    </button>
                  </div>
                ) : isLinkingWhatsApp ? (
                  <div style={{ padding: "24px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "12px" }}>Estableciendo conexión segura...</h3>
                    <div className={styles.progressBarBg} style={{ height: "10px", borderRadius: "9999px" }}>
                      <div className={styles.progressBarFill} style={{ width: `${whatsAppProgress}%`, background: "var(--success)" }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "8px" }}>{whatsAppProgress}% sincronizado</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                    <div className={styles.qrContainer} style={{ position: "relative" }}>
                      <div className={styles.qrScanLine} />
                      <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="1.5">
                        <rect x="2" y="2" width="6" height="6" fill="#1d1d1f" />
                        <rect x="16" y="2" width="6" height="6" fill="#1d1d1f" />
                        <rect x="2" y="16" width="6" height="6" fill="#1d1d1f" />
                        <path d="M10 2h4M10 6h2M14 6h2M10 10h12M2 10h6M2 14h10M14 14h4M20 14h2M10 16h4M18 16h2M10 20h2M14 20h8" strokeWidth="2" strokeLinecap="square" />
                      </svg>
                    </div>
                    <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", maxWidth: "340px" }}>
                      Escanea este código QR con la cámara de tu celular o WhatsApp y entra a Dispositivos Vinculados para conectar tu cuenta.
                    </p>
                    <button 
                      onClick={() => setIsLinkingWhatsApp(true)} 
                      className={styles.submitButton}
                    >
                      Escanear Código QR
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
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
                      <strong style={{ fontSize: "13.5px" }}>3. Vincular WhatsApp de Reservas</strong>
                      <span onClick={() => { setActiveTab("administracion"); setAdminSubTab("whatsapp"); setIsFirstStepsModalOpen(false); }} style={{ display: "block", fontSize: "11px", color: "var(--primary)", marginTop: "2px", cursor: "pointer" }}>Ir a WhatsApp →</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={firstStepsChecked.whatsapp} 
                      onChange={() => setFirstStepsChecked(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                  </div>

                  <div className={styles.configToggleRow} style={{ padding: "12px 16px" }}>
                    <div>
                      <strong style={{ fontSize: "13.5px" }}>4. Compartir Link con tus Clientes</strong>
                      <span onClick={() => { setIsReferralModalOpen(true); setIsFirstStepsModalOpen(false); }} style={{ display: "block", fontSize: "11px", color: "var(--primary)", marginTop: "2px", cursor: "pointer" }}>Ver Enlaces →</span>
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

        {/* --- MODAL: MIS DESCARGAS --- */}
        {isDownloadsModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsDownloadsModalOpen(false)}>
            <div className={styles.modalContent} style={{ maxWidth: "480px" }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Descargar Recursos de AgendaLink</h3>
                <button className={styles.modalCloseBtn} onClick={() => setIsDownloadsModalOpen(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div className={styles.giftCardItem} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "14px" }}>Stand QR de Sobremesa (Acrílico)</strong>
                      <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Plantilla imprimible lista para poner en tus mesas o recepción.</p>
                    </div>
                    <button onClick={() => alert("Stand QR descargado")} className={styles.todayDetailsBtn}>Descargar</button>
                  </div>

                  <div className={styles.giftCardItem} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "14px" }}>Plantillas de Instagram Stories</strong>
                      <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Sets de imágenes editables con el QR y logo de tu link.</p>
                    </div>
                    <button onClick={() => alert("Plantillas IG descargadas")} className={styles.todayDetailsBtn}>Descargar</button>
                  </div>

                  <div className={styles.giftCardItem} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "14px" }}>Aplicación Móvil Android (APK)</strong>
                      <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Instala el administrador oficial de AgendaLink en tu celular.</p>
                    </div>
                    <button onClick={() => alert("APK de AgendaLink descargado")} className={styles.todayDetailsBtn}>Descargar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: INVITA Y GANA --- */}
        {isReferralModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsReferralModalOpen(false)}>
            <div className={styles.modalContent} style={{ maxWidth: "440px" }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Programa de Referidos: ¡Invita y gana!</h3>
                <button className={styles.modalCloseBtn} onClick={() => setIsReferralModalOpen(false)}>✕</button>
              </div>
              <div className={styles.modalBody} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>🎁</div>
                <h4 style={{ fontSize: "15px", fontWeight: "750", margin: "0 0 6px 0" }}>Obtén 3 Meses Gratis de Plan Premium</h4>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4", margin: "0 0 16px 0" }}>
                  Comparte tu enlace de recomendación con otros dueños de negocios. Cuando se registren y activen su cuenta, ambos recibirán 3 meses de suscripción gratis.
                </p>
                <div style={{ display: "flex", gap: "8px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--input-border)", borderRadius: "12px", padding: "8px 12px", alignItems: "center", justifyContent: "space-between" }}>
                  <code style={{ fontSize: "12px", fontWeight: "bold" }}>agendalink.cl/ref/JO123</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText("agendalink.cl/ref/JO123");
                      alert("Enlace copiado al portapapeles");
                    }}
                    className={styles.todayDetailsBtn}
                    style={{ minHeight: "28px", padding: "4px 8px", fontSize: "11px" }}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: ACADEMIA --- */}
        {isAcademyModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsAcademyModalOpen(false)}>
            <div className={styles.modalContent} style={{ maxWidth: "520px" }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Academia AgendaLink: Video Tutoriales</h3>
                <button className={styles.modalCloseBtn} onClick={() => setIsAcademyModalOpen(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div onClick={() => alert("Reproduciendo: Configura tu Carta")} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ height: "110px", borderRadius: "12px", background: "#111", border: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <span style={{ fontSize: "24px" }}>▶</span>
                      <span style={{ position: "absolute", bottom: "6px", right: "6px", fontSize: "9px", background: "rgba(0,0,0,0.7)", color: "white", padding: "2px 4px", borderRadius: "3px" }}>3:45</span>
                    </div>
                    <strong style={{ fontSize: "12.5px" }}>Cómo configurar tu Carta</strong>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Aprende a agregar platos, precios y fotos.</span>
                  </div>

                  <div onClick={() => alert("Reproduciendo: WhatsApp Linki Secretary")} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ height: "110px", borderRadius: "12px", background: "#111", border: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <span style={{ fontSize: "24px" }}>▶</span>
                      <span style={{ position: "absolute", bottom: "6px", right: "6px", fontSize: "9px", background: "rgba(0,0,0,0.7)", color: "white", padding: "2px 4px", borderRadius: "3px" }}>5:12</span>
                    </div>
                    <strong style={{ fontSize: "12.5px" }}>Vincular WhatsApp e IA</strong>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Configura el asistente inteligente 24/7.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: PAGAR (SUSCRIPCIÓN STRIPE SIMULATOR) --- */}
        {isPaymentModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsPaymentModalOpen(false)}>
            <div className={styles.modalContent} style={{ maxWidth: "440px" }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Cuenta y Suscripción Premium</h3>
                <button className={styles.modalCloseBtn} onClick={() => setIsPaymentModalOpen(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                {paymentSuccess ? (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(52, 199, 89, 0.1)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto 12px auto" }}>✓</div>
                    <h4 style={{ fontWeight: 600, color: "var(--success)" }}>¡Pago Procesado Exitosamente!</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Tu suscripción se encuentra activa. Factura agregada a tu cuenta.</p>
                  </div>
                                ) : (
                  <div>
                    {/* Segmented plan selector */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      background: "rgba(0,0,0,0.05)",
                      padding: "4px",
                      borderRadius: "10px",
                      marginBottom: "16px",
                      gap: "4px"
                    }}>
                      {(["INDIVIDUAL", "EQUIPO", "NEGOCIO"] as const).map(pKey => (
                        <button
                          key={pKey}
                          type="button"
                          onClick={() => setSelectedPlanId(pKey)}
                          style={{
                            border: "none",
                            background: selectedPlanId === pKey ? "white" : "transparent",
                            padding: "8px 4px",
                            borderRadius: "7px",
                            fontSize: "11px",
                            fontWeight: selectedPlanId === pKey ? "bold" : "normal",
                            color: selectedPlanId === pKey ? "var(--primary)" : "var(--text-secondary)",
                            cursor: "pointer",
                            boxShadow: selectedPlanId === pKey ? "0 2px 5px rgba(0,0,0,0.05)" : "none",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {pKey === "INDIVIDUAL" ? "Individual" : pKey === "EQUIPO" ? "Equipo" : "Negocio"}
                        </button>
                      ))}
                    </div>

                    {/* Plan features/price box */}
                    {(() => {
                      const PLANS_DETAILS = {
                        INDIVIDUAL: {
                          name: "Plan Individual",
                          priceStr: "$9.900 CLP",
                          desc: "Para profesionales independientes.",
                          features: [
                            "✓ 1 profesional / recurso",
                            "✓ Calendario online en tiempo real",
                            "✓ Código QR para tu local",
                            "✓ Soporte estándar por email"
                          ]
                        },
                        EQUIPO: {
                          name: "Plan Equipo",
                          priceStr: "$19.990 CLP",
                          desc: "Para centros y equipos pequeños.",
                          features: [
                            "✓ Hasta 5 profesionales / recursos",
                            "✓ Gestión de asignación de mesas",
                            "✓ Historial de clientes y fichas",
                            "✓ Soporte estándar WhatsApp"
                          ]
                        },
                        NEGOCIO: {
                          name: "Plan Negocio (Premium)",
                          priceStr: "$39.990 CLP",
                          desc: "Para negocios consolidados e IA.",
                          features: [
                            "✓ Profesionales y recursos ilimitados",
                            "✓ Asistente de IA (WhatsApp Secretary 24/7)",
                            "✓ Módulo de fidelización y puntos IA",
                            "✓ Soporte prioritario 24/7"
                          ]
                        }
                      };

                      const currentDetails = PLANS_DETAILS[selectedPlanId];
                      const isCurrentPlan = business?.plan === selectedPlanId;

                      return (
                        <div style={{
                          background: "rgba(0, 102, 255, 0.04)",
                          border: "1px solid rgba(0, 102, 255, 0.1)",
                          padding: "14px",
                          borderRadius: "12px",
                          marginBottom: "16px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <strong style={{ fontSize: "14px", color: "var(--foreground)" }}>{currentDetails.name}</strong>
                              <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{currentDetails.desc}</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--primary)" }}>{currentDetails.priceStr}</span>
                              {isCurrentPlan && (
                                <span style={{ display: "block", fontSize: "10px", color: "var(--success)", fontWeight: "bold", marginTop: "2px" }}>✓ Plan actual</span>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ borderTop: "1px solid rgba(0,0,0,0.04)", marginTop: "10px", paddingTop: "8px" }}>
                            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "4px", listStyleType: "none", textAlign: "left" }}>
                              {currentDetails.features.map((feat, fIdx) => (
                                <li key={fIdx} style={{ paddingLeft: "0", marginLeft: "-12px" }}>{feat}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })()}

                    <form onSubmit={handleProcessPayment} className={styles.adminForm}>
                      <div className={styles.formGroup}>
                        <label>Nombre en la Tarjeta</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ej. Juan Ortega" 
                          className={styles.formInput} 
                          value={paymentCardName}
                          onChange={e => setPaymentCardName(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Número de Tarjeta (Stripe Sandbox)</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="4242 4242 4242 4242" 
                          className={styles.formInput} 
                          value={paymentCardNumber}
                          onChange={handlePaymentCardNumberChange}
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div className={styles.formGroup}>
                          <label>Expiración</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="MM/AA" 
                            className={styles.formInput} 
                            value={paymentExpiry}
                            onChange={handlePaymentExpiryChange}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>CVC</label>
                          <input 
                            type="password" 
                            required 
                            placeholder="123" 
                            className={styles.formInput} 
                            value={paymentCvv}
                            onChange={handlePaymentCvvChange}
                          />
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        disabled={isProcessingPayment || business?.plan === selectedPlanId} 
                        className={styles.submitButton} 
                        style={{ marginTop: "8px" }}
                      >
                        {isProcessingPayment 
                          ? "Procesando cobro Stripe..." 
                          : business?.plan === selectedPlanId 
                            ? "Tu plan actual (Activo)" 
                            : `Upgrade a ${selectedPlanId === "INDIVIDUAL" ? "Plan Individual" : selectedPlanId === "EQUIPO" ? "Plan Equipo" : "Plan Negocio"}`}
                      </button>
                    </form>

                    <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: "20px", paddingTop: "12px" }}>
                      <h4 style={{ fontSize: "13px", fontWeight: "750", marginBottom: "8px" }}>Historial de Facturación</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {paymentHistory.map((inv, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", background: "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.03)" }}>
                            <div>
                              <strong style={{ color: "var(--foreground)" }}>{inv.id}</strong>
                              <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginLeft: "8px" }}>{inv.date}</span>
                            </div>
                            <span style={{ color: "var(--success)", fontWeight: "700" }}>✓ {formatPrice(inv.amount / 100, "CLP")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: REEMBOLSOS --- */}
        {isRefundModalOpen && selectedRefundApp && (
          <div className={styles.modalOverlay} onClick={() => setIsRefundModalOpen(false)}>
            <div className={styles.modalContent} style={{ maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Confirmar Reembolso</h3>
                <button className={styles.modalCloseBtn} onClick={() => setIsRefundModalOpen(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                <p style={{ fontSize: "13.5px", lineHeight: "1.5", margin: "0 0 16px 0" }}>
                  ¿Seguro que deseas reembolsar el pago de <strong>{formatPrice(selectedRefundApp.paymentAmount || selectedRefundApp.service?.price || 0, business.currency)}</strong> realizado por <strong>{selectedRefundApp.clientName}</strong>?
                </p>
                <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Esta simulación reembolsará los fondos de prueba a través de la pasarela y marcará el estado de la cita como REEMBOLSADO.
                </p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button onClick={() => setIsRefundModalOpen(false)} className={styles.todayDetailsBtn}>Cancelar</button>
                  <button 
                    onClick={handleProcessRefund} 
                    disabled={isProcessingRefund}
                    className={styles.submitButton}
                    style={{ background: "var(--danger)", color: "white", minHeight: "36px", padding: "8px 16px", fontSize: "13px" }}
                  >
                    {isProcessingRefund ? "Reembolsando..." : "Confirmar Reembolso"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- DRAWER LATERAL: DETALLES DE CLIENTE --- */}
        {selectedClient && (
          <>
            <div className={styles.drawerOverlay} onClick={() => setSelectedClient(null)} />
            <div className={styles.clientDrawer} style={{ display: "flex", flexDirection: "column" }}>
              <div className={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Ficha del Cliente</h3>
                <button className={styles.modalCloseBtn} onClick={() => setSelectedClient(null)}>✕</button>
              </div>
              <div className={styles.modalBody} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--primary)", color: "white", fontSize: "24px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px auto" }}>
                    {selectedClient.name.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: "800", margin: 0 }}>{selectedClient.name}</h3>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>WhatsApp: {selectedClient.whatsapp}</span>
                </div>

                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "12px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: "750", marginBottom: "6px" }}>Notas y Ficha Técnica</h4>
                  <textarea 
                    value={selectedClient.notes}
                    onChange={e => {
                      const updated = { ...selectedClient, notes: e.target.value };
                      setSelectedClient(updated);
                    }}
                    className={styles.formInput} 
                    style={{ minHeight: "80px", fontSize: "12.5px", lineHeight: "1.4" }}
                  />
                  <button 
                    onClick={() => alert("Notas de cliente actualizadas con éxito")}
                    className={styles.todayDetailsBtn} 
                    style={{ marginTop: "6px", fontSize: "11px", minHeight: "28px" }}
                  >
                    Guardar Notas
                  </button>
                </div>

                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "12px", flex: 1 }}>
                  <h4 style={{ fontSize: "13px", fontWeight: "750", marginBottom: "8px" }}>Historial de Reservas</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {business.appointments?.filter(app => app.clientWhatsApp === selectedClient.whatsapp).map((app) => (
                      <div key={app.id} style={{ background: "white", border: "1px solid rgba(0,0,0,0.03)", padding: "10px", borderRadius: "10px", fontSize: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                          <span>{app.service?.name}</span>
                          <span>{new Date(app.dateTime).toLocaleDateString("es-ES")}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          <span>Profesional: {app.professional?.name}</span>
                          <span style={{ color: app.paymentStatus === "PAID" ? "var(--success)" : "var(--primary)", fontWeight: "bold" }}>
                            {app.paymentStatus === "PAID" ? "PAGADO" : "PENDIENTE"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
