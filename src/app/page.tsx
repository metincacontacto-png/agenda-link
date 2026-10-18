"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import QrDownloader from "@/components/QrDownloader";

const convos = [
  {
    n: "Linki Secretary",
    m: [
      { type: "in", text: "Hola! ¿tienen hora para corte mañana en la tarde?" },
      { type: "out", text: "¡Hola! 👋 Sí, mañana martes tengo 15:30 y 18:30 con Pía. El corte + brushing cuesta $18.000." },
      { type: "in", text: "Las 18:30 porfa" },
      { type: "out", text: "Listo ✅ Reserva tu hora aquí en 20 segundos: agendalink.cl/valentina. Te recordaré un día antes." },
    ],
  },
  {
    n: "Linki Marketing",
    m: [
      { type: "out", text: "📊 Detecté 23 clientes que no vienen hace más de 60 días." },
      { type: "out", text: 'Te propongo enviarles: "¡Te echamos de menos! 15% en tu próxima visita esta semana" 💙' },
      { type: "in", text: "Dale, envíalo" },
      { type: "out", text: "Enviado por WhatsApp. Te aviso cuando lleguen las reservas. 🚀" },
    ],
  },
  {
    n: "Linki Business",
    m: [
      { type: "in", text: "¿Cómo me fue este mes?" },
      { type: "out", text: "Vendiste más que el mes pasado y tu servicio estrella fue Color completo. 📈" },
      { type: "out", text: "Ojo: los martes en la mañana tienes 40% de horas libres. Una promo ese bloque podría llenarlo." },
      { type: "in", text: "Buena idea, armemos la promo" },
    ],
  },
];

const faqs = [
  {
    q: "¿Mis clientes necesitan descargar una app o crear cuenta?",
    a: "No. Entran a tu link desde Instagram, WhatsApp o un QR, eligen servicio, día y hora, y reservan en unos 20 segundos. Sin registro ni descargas.",
  },
  {
    q: "¿Necesito saber de tecnología para configurarlo?",
    a: "No. El panel te guía en 5 pasos: personalizar tu landing, cargar servicios, vincular WhatsApp, instalar la app en tu celular y compartir tu link. Se hace en una tarde.",
  },
  {
    q: "¿Cómo funcionan los recordatorios por WhatsApp?",
    a: "Al vincular tu WhatsApp, recibes un aviso con cada reserva nueva y tus clientes reciben recordatorios antes de su cita. Así bajan las inasistencias.",
  },
  {
    q: "¿Qué hacen los asistentes Linki IA?",
    a: "Linki Secretary responde consultas de tus clientes, Linki Marketing te ayuda a reactivar clientes que dejaron de venir y Linki Business analiza tu negocio para darte recomendaciones concretas.",
  },
  {
    q: "¿Puedo cobrar al momento de la reserva?",
    a: "Sí. Puedes recibir pagos con tarjeta y Apple Pay directamente desde tu link, para asegurar la hora y reducir cancelaciones.",
  },
  {
    q: "¿Puedo cambiar de plan o cancelar?",
    a: "Sí. Puedes subir o bajar de plan a medida que tu equipo crece, y cancelar cuando quieras. El plan anual tiene un 20% de descuento.",
  },
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [activeAgent, setActiveAgent] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [finalSlug, setFinalSlug] = useState("");

  // Modales
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Registro Form State
  const [regStep, setRegStep] = useState(1);
  const [regFormData, setRegFormData] = useState({
    name: "",
    ownerName: "",
    email: "",
    password: "",
    category: "Peluquería",
    teamSize: "1 persona",
    country: "Chile",
  });
  const [regLoading, setRegLoading] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [regError, setRegError] = useState("");

  // Login Form State
  const [loginSlug, setLoginSlug] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for .rv elements
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll(`.${styles.rv}`);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.rvIn);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    elements.forEach((el, i) => {
      (el as HTMLElement).style.transitionDelay = `${(i % 4) * 70}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // Auto cycle agent chat
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveAgent((prev) => (prev + 1) % convos.length);
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeAgent]);

  // Open register modal with optional prefill
  const openRegister = (plan?: string, initialSlug?: string) => {
    if (plan) {
      if (plan === "individual") setRegFormData((prev) => ({ ...prev, teamSize: "1 persona" }));
      if (plan === "equipo") setRegFormData((prev) => ({ ...prev, teamSize: "2-5 personas" }));
      if (plan === "business") setRegFormData((prev) => ({ ...prev, teamSize: "6+ personas" }));
    }
    if (initialSlug) {
      setRegFormData((prev) => ({ ...prev, name: initialSlug }));
    }
    setRegStep(1);
    setRegError("");
    setRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFormData.password || regFormData.password.length < 8) {
      setRegError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setRegLoading(true);
    setRegError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regFormData),
      });
      const data = await res.json();
      if (data.success && data.slug) {
        setCreatedSlug(data.slug);
        setRegStep(3);
      } else {
        setRegError(data.error || "No se pudo crear el negocio. Inténtalo de nuevo.");
      }
    } catch (err) {
      console.error(err);
      setRegError("Error de conexión al procesar el registro.");
    } finally {
      setRegLoading(false);
    }
  };

  const copyCreatedLink = () => {
    const url = `${window.location.origin}/${createdSlug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginSlug) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      window.location.href = `/admin/${loginSlug}`;
    } catch (err) {
      console.error(err);
      setLoginError("Error de conexión. Inténtalo de nuevo.");
      setLoginLoading(false);
    }
  };

  return (
    <div className={styles.landingPage} ref={containerRef}>
      {/* ===== NAV ===== */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <div className={styles.wrap}>
          <Link href="/" className={styles.logoLink}>
            <img src="/logo-horizontal-blanco.png" alt="AgendaLink" className={styles.logoImg} />
          </Link>
          <div className={styles.navLinks}>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#linki">Linki IA</a>
            <a href="#precios">Precios</a>
            <a href="#faq">Preguntas</a>
          </div>
          <div className={styles.navCta}>
            <button className={styles.loginBtn} onClick={() => setLoginModalOpen(true)}>
              Iniciar sesión
            </button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openRegister()}>
              Crear mi link gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div className={styles.rv}>
            <div className={styles.pill}>
              <span>NUEVO</span> Linki IA: tu secretaria que responde WhatsApp 24/7
            </div>
            <h1 className={styles.heroH1}>
              Tu negocio agenda solo.
              <br />
              <span className={styles.gradText}>Tú solo atiendes.</span>
            </h1>
            <p className={styles.lead}>
              Reservas online, pagos, recordatorios por WhatsApp y un panel para ver cuánto vendes. Todo desde un solo link
              que tus clientes usan en 20 segundos, sin descargar nada.
            </p>
            <div className={styles.heroCtas}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openRegister()}>
                Crear mi link ahora
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
              <a href="#como-funciona" className={`${styles.btn} ${styles.btnGhost}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Ver cómo funciona
              </a>
            </div>
            <div className={styles.heroProof}>
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                Listo en 5 pasos
              </div>
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                Sin contratos
              </div>
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                Todo Chile
              </div>
            </div>
          </div>

          <div className={`${styles.stage} ${styles.rv}`}>
            <div className={styles.phone}>
              <div className={styles.screen}>
                <div className={styles.notch} />
                <div className={styles.scrHead}>
                  <div className={styles.avatar}>VS</div>
                  <h4>Valentina Studio</h4>
                  <small>Disponible hoy</small>
                </div>
                <div className={styles.scrBody}>
                  <div className={styles.cardS}>
                    <div className={styles.lbl}>1 · Elige servicio</div>
                    <div className={`${styles.svc} ${styles.svcSel}`}>
                      <div>
                        <b>Corte + brushing</b>
                        <em>60 min</em>
                      </div>
                      <span className={styles.pr}>$18.000</span>
                    </div>
                    <div className={styles.svc}>
                      <div>
                        <b>Color completo</b>
                        <em>120 min</em>
                      </div>
                      <span className={styles.pr}>$45.000</span>
                    </div>
                  </div>
                  <div className={styles.cardS}>
                    <div className={styles.lbl}>2 · Día y hora</div>
                    <div className={styles.days}>
                      <div>
                        Lun<b>12</b>
                      </div>
                      <div className={styles.dayOn}>
                        Mar<b>13</b>
                      </div>
                      <div>
                        Mié<b>14</b>
                      </div>
                      <div>
                        Jue<b>15</b>
                      </div>
                      <div>
                        Vie<b>16</b>
                      </div>
                    </div>
                    <div className={styles.slots}>
                      <span className={styles.slotOff}>10:00</span>
                      <span className={styles.slotOn}>11:30</span>
                      <span>13:00</span>
                      <span>15:30</span>
                      <span className={styles.slotOff}>17:00</span>
                      <span>18:30</span>
                    </div>
                  </div>
                  <div className={styles.bookBtn}>Confirmar reserva →</div>
                </div>
              </div>
            </div>

            <div className={`${styles.float} ${styles.f1}`}>
              <div className={styles.ic}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z" />
                </svg>
              </div>
              <div>
                <b>Nueva reserva</b>
                <small>Camila · Mar 13, 11:30</small>
              </div>
            </div>

            <div className={`${styles.float} ${styles.f2}`}>
              <div className={styles.ic}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <div>
                <b>+$18.000 pagado</b>
                <small>Tarjeta · Apple Pay</small>
              </div>
            </div>

            <div className={`${styles.float} ${styles.f3}`}>
              <div className={styles.ic}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 3l1.9 5.8L20 10l-5 3.6 1.9 6L12 16l-4.9 3.6 1.9-6L4 10l6.1-1.2z" />
                </svg>
              </div>
              <div>
                <b>Linki recordó la cita</b>
                <small>Cero inasistencias hoy</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== RUBROS MARQUEE ===== */}
      <div className={styles.rubros}>
        <p>Hecho para negocios que viven de su agenda</p>
        <div className={styles.marqueeOuter}>
          <div className={styles.track}>
            <span>✂️ Barberías</span>
            <span>💇 Peluquerías</span>
            <span>💅 Manicure</span>
            <span>✨ Centros de estética</span>
            <span>🖋️ Tatuajes</span>
            <span>🦴 Kinesiología</span>
            <span>🧠 Psicología</span>
            <span>🥗 Nutrición</span>
            <span>🏋️ Entrenadores</span>
            <span>📸 Fotografía</span>
            <span>🐾 Peluquería canina</span>
            <span>🎨 Estudios creativos</span>
            <span>💆 Masajes y spa</span>
            <span>🦷 Consultas</span>
            <span>✂️ Barberías</span>
            <span>💇 Peluquerías</span>
            <span>💅 Manicure</span>
            <span>✨ Centros de estética</span>
            <span>🖋️ Tatuajes</span>
            <span>🦴 Kinesiología</span>
            <span>🧠 Psicología</span>
            <span>🥗 Nutrición</span>
            <span>🏋️ Entrenadores</span>
            <span>📸 Fotografía</span>
            <span>🐾 Peluquería canina</span>
            <span>🎨 Estudios creativos</span>
            <span>💆 Masajes y spa</span>
            <span>🦷 Consultas</span>
          </div>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className={`${styles.wrap} ${styles.stats}`}>
        <div className={`${styles.stat} ${styles.rv}`}>
          <b>20s</b>
          <span>para que tu cliente reserve, sin crear cuenta</span>
        </div>
        <div className={`${styles.stat} ${styles.rv}`}>
          <b>24/7</b>
          <span>tu agenda abierta, aunque estés atendiendo o durmiendo</span>
        </div>
        <div className={`${styles.stat} ${styles.rv}`}>
          <b>3</b>
          <span>asistentes con IA trabajando para tu negocio</span>
        </div>
        <div className={`${styles.stat} ${styles.rv}`}>
          <b>0</b>
          <span>apps que tu cliente tenga que descargar</span>
        </div>
      </div>

      {/* ===== PROBLEMA / SOLUCIÓN ===== */}
      <section className={styles.section}>
        <div className={`${styles.wrap} ${styles.center} ${styles.rv}`}>
          <span className={styles.eyebrow}>El problema</span>
          <h2 className={styles.h2}>
            Deja de agendar por WhatsApp
            <br />
            a las 11 de la noche.
          </h2>
          <p className={styles.lead}>
            Cada mensaje de &quot;¿tienes hora mañana?&quot; es tiempo que no estás cobrando. AgendaLink se encarga de eso.
          </p>
        </div>
        <div className={`${styles.wrap} ${styles.vs}`}>
          <div className={`${styles.vsCol} ${styles.vsBad} ${styles.rv}`}>
            <h3>
              Sin AgendaLink <span className={styles.tag} style={{ background: "#fee2e2", color: "#dc2626" }}>Hoy</span>
            </h3>
            <ul>
              <li>
                <i>✕</i>Respondes mensajes todo el día para cuadrar una hora
              </li>
              <li>
                <i>✕</i>Clientes que no llegan y nadie les recordó
              </li>
              <li>
                <i>✕</i>La agenda en un cuaderno, la caja en otro y los clientes en tu memoria
              </li>
              <li>
                <i>✕</i>No sabes cuánto vendiste en el mes hasta que sacas la cuenta
              </li>
              <li>
                <i>✕</i>Clientes que vinieron una vez y nunca más volvieron
              </li>
            </ul>
          </div>
          <div className={`${styles.vsCol} ${styles.vsGood} ${styles.rv}`}>
            <h3>
              Con AgendaLink <span className={styles.tag} style={{ background: "var(--blue)", color: "#fff" }}>Desde hoy</span>
            </h3>
            <ul>
              <li>
                <i>✓</i>Tus clientes eligen servicio, día y hora solos desde tu link
              </li>
              <li>
                <i>✓</i>Recordatorios automáticos por WhatsApp que bajan las inasistencias
              </li>
              <li>
                <i>✓</i>Calendario, reservas, ventas y clientes en un solo panel
              </li>
              <li>
                <i>✓</i>Ves tus ventas y caja del día en tiempo real, desde el celular
              </li>
              <li>
                <i>✓</i>Linki Marketing reactiva a los clientes que dejaron de venir
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className={`${styles.section} ${styles.stepsSec}`} id="como-funciona">
        <div className={`${styles.wrap} ${styles.center} ${styles.rv}`}>
          <span className={styles.eyebrow}>Cómo funciona</span>
          <h2 className={styles.h2}>Tu negocio online en una tarde.</h2>
          <p className={styles.lead}>
            Sin programadores ni diseñadores. El panel te guía paso a paso hasta dejar tu AgendaLink al 100%.
          </p>
        </div>
        <div className={`${styles.wrap} ${styles.steps}`}>
          <div className={`${styles.step} ${styles.rv}`}>
            <span className={styles.time}>~10 min</span>
            <div className={styles.num}>1</div>
            <h3>Crea tu página</h3>
            <p>Sube tu logo, fotos, historia, dirección y horario. Tu landing queda lista con vista previa en vivo mientras editas.</p>
          </div>
          <div className={`${styles.step} ${styles.rv}`}>
            <span className={styles.time}>~10 min</span>
            <div className={styles.num}>2</div>
            <h3>Carga tus servicios</h3>
            <p>Agrega servicios, precios y duración. Conecta tu WhatsApp para recibir cada reserva al instante.</p>
          </div>
          <div className={`${styles.step} ${styles.rv}`}>
            <span className={styles.time}>~5 min</span>
            <div className={styles.num}>3</div>
            <h3>Comparte tu link</h3>
            <p>Ponlo en tu bio de Instagram, en WhatsApp o imprime tu código QR. Desde ahí, las reservas llegan solas.</p>
          </div>
        </div>
      </section>

      {/* ===== FUNCIONALIDADES (BENTO) ===== */}
      <section className={styles.section} id="funcionalidades">
        <div className={`${styles.wrap} ${styles.center} ${styles.rv}`}>
          <span className={styles.eyebrow}>Todo incluido</span>
          <h2 className={styles.h2}>
            Una sola herramienta.
            <br />
            Todo tu negocio.
          </h2>
          <p className={styles.lead}>
            Deja de pagar y saltar entre cinco apps distintas. Agenda, cobros, clientes y marketing en un mismo lugar.
          </p>
        </div>
        <div className={`${styles.wrap} ${styles.bento}`}>
          <div className={`${styles.b} ${styles.b4} ${styles.bWide} ${styles.rv}`}>
            <div className={styles.ico}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="17" rx="3" />
                <path d="M3 9h18M8 2v4M16 2v4" />
              </svg>
            </div>
            <h3>Calendario inteligente</h3>
            <p>Vista por día y semana, bloqueo de horas, varios profesionales y cero choques de horario.</p>
            <div className={styles.miniCal}>
              <span />
              <span className={styles.mh}>Pía</span>
              <span className={styles.mh}>Tomás</span>
              <span className={styles.mh}>Javi</span>
              <span className={styles.mh}>Fran</span>
              <span className={styles.mt}>10:00</span>
              <div className={`${styles.ev} ${styles.evA}`}>Corte · Diego</div>
              <div className={styles.mc} />
              <div className={`${styles.ev} ${styles.evC}`}>Barba · Leo</div>
              <div className={styles.mc} />
              <span className={styles.mt}>11:00</span>
              <div className={styles.mc} />
              <div className={`${styles.ev} ${styles.evB}`}>Color · Ana</div>
              <div className={styles.mc} />
              <div className={`${styles.ev} ${styles.evD}`}>Uñas · Sofi</div>
              <span className={styles.mt}>12:00</span>
              <div className={`${styles.ev} ${styles.evA}`}>Brushing · Mía</div>
              <div className={styles.mc} />
              <div className={styles.mc} />
              <div className={`${styles.ev} ${styles.evC}`}>Corte · Raúl</div>
            </div>
          </div>

          <div className={`${styles.b} ${styles.b2} ${styles.bDark} ${styles.rv}`}>
            <div className={styles.ico}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <h3>Ventas y caja</h3>
            <p>Lo que entra hoy, esta semana y este mes. Sin planillas.</p>
            <div className={styles.money}>
              $486.000<small>↑ hoy</small>
            </div>
            <div className={styles.bars}>
              <i style={{ height: "40%" }} />
              <i style={{ height: "62%" }} />
              <i style={{ height: "48%" }} />
              <i style={{ height: "80%" }} />
              <i style={{ height: "66%" }} />
              <i style={{ height: "92%" }} />
              <i style={{ height: "100%" }} />
            </div>
          </div>

          <div className={`${styles.b} ${styles.b2} ${styles.rv}`}>
            <div className={styles.ico}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M2 10h20M6 15h4" />
              </svg>
            </div>
            <h3>Pagos online</h3>
            <p>Cobra con tarjeta o Apple Pay al reservar. Asegura la hora y reduce las cancelaciones.</p>
          </div>

          <div className={`${styles.b} ${styles.b2} ${styles.rv}`}>
            <div className={styles.ico}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="8" r="4" />
                <path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 100-6M22 21c0-3-2-5-5-5.5" />
              </svg>
            </div>
            <h3>Base de clientes</h3>
            <p>Historial, frecuencia y datos de cada cliente. Sabes quién viene seguido y quién dejó de venir.</p>
          </div>

          <div className={`${styles.b} ${styles.b2} ${styles.rv}`}>
            <div className={styles.ico}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H8a2.5 2.5 0 110-5c3 0 4 5 4 5zM12 7h4a2.5 2.5 0 100-5c-3 0-4 5-4 5z" />
              </svg>
            </div>
            <h3>Gift cards y fidelización</h3>
            <p>Vende tarjetas de regalo y premia a tus clientes frecuentes para que vuelvan.</p>
          </div>

          <div className={`${styles.b} ${styles.b3} ${styles.rv}`}>
            <div className={styles.ico}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h3>Tu propia landing page</h3>
            <p>Una página profesional con tu marca, historia, fotos, ventajas y contacto. Mejor que un sitio web que nadie actualiza.</p>
            <div className={styles.chips}>
              <span>Logo y colores</span>
              <span>Sobre nosotros</span>
              <span>¿Por qué elegirnos?</span>
              <span>Ubicación y horario</span>
            </div>
          </div>

          <div className={`${styles.b} ${styles.b3} ${styles.rv}`} style={{ paddingRight: "120px" }}>
            <div className={styles.ico}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3M21 14v7h-4M14 18v3" />
              </svg>
            </div>
            <h3>QR e impresos automáticos</h3>
            <p>Se generan solos: QR para tu mesón, vitrina o tarjetas, y enlaces listos para Instagram y WhatsApp.</p>
            <div className={styles.qrMock} />
          </div>

          <div className={`${styles.b} ${styles.bWide} ${styles.rv}`} style={{ gridColumn: "1/-1", display: "flex", gap: "28px", alignItems: "center", flexWrap: "wrap" }}>
            <div className={styles.ico} style={{ margin: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="6" y="2" width="12" height="20" rx="3" />
                <path d="M11 18h2" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <h3>App en tu celular, sin tiendas</h3>
              <p>Instala AgendaLink en la pantalla de inicio y gestiona reservas, caja y clientes desde donde estés.</p>
            </div>
            <button className={`${styles.btn} ${styles.btnLight}`} onClick={() => openRegister()}>
              Probar ahora →
            </button>
          </div>
        </div>
      </section>

      {/* ===== LINKI IA ===== */}
      <section className={`${styles.section} ${styles.ai}`} id="linki">
        <div className={`${styles.wrap} ${styles.center} ${styles.rv}`}>
          <span className={styles.eyebrow}>Asistentes Linki IA</span>
          <h2 className={styles.h2}>
            Un equipo con inteligencia artificial,
            <br />
            <span className={styles.gradText}>incluido en tu plan.</span>
          </h2>
          <p className={styles.lead}>
            Tres asistentes que trabajan por ti: atienden, venden y te ayudan a tomar mejores decisiones.
          </p>
        </div>
        <div className={`${styles.wrap} ${styles.aiGrid}`}>
          <div className={`${styles.agents} ${styles.rv}`}>
            <button
              type="button"
              className={`${styles.agent} ${activeAgent === 0 ? styles.agentOn : ""}`}
              onClick={() => setActiveAgent(0)}
            >
              <div className={styles.ico} style={{ background: "rgba(37,211,102,.15)", color: "#4ade80" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />
                </svg>
              </div>
              <div>
                <h3>Linki Secretary</h3>
                <p>Responde dudas por WhatsApp, entrega precios y horarios, y lleva al cliente a reservar. 24/7.</p>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.agent} ${activeAgent === 1 ? styles.agentOn : ""}`}
              onClick={() => setActiveAgent(1)}
            >
              <div className={styles.ico} style={{ background: "rgba(124,58,237,.2)", color: "#c4b5fd" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
                </svg>
              </div>
              <div>
                <h3>Linki Marketing</h3>
                <p>Detecta clientes que dejaron de venir y te propone campañas para traerlos de vuelta.</p>
              </div>
            </button>

            <button
              type="button"
              className={`${styles.agent} ${activeAgent === 2 ? styles.agentOn : ""}`}
              onClick={() => setActiveAgent(2)}
            >
              <div className={styles.ico} style={{ background: "rgba(34,211,238,.15)", color: "var(--cyan)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
                </svg>
              </div>
              <div>
                <h3>Linki Business</h3>
                <p>Tu consultor: analiza tus ventas y servicios y te dice dónde está la oportunidad.</p>
              </div>
            </button>
          </div>

          <div className={`${styles.chat} ${styles.rv}`}>
            <div className={styles.chatTop}>
              <div className={styles.av}>L</div>
              <div>
                <b>{convos[activeAgent].n}</b>
                <small>● en línea</small>
              </div>
            </div>
            <div className={styles.msgs}>
              {convos[activeAgent].m.map((msg, idx) => (
                <div
                  key={`${activeAgent}-${idx}`}
                  className={`${styles.msg} ${msg.type === "in" ? styles.msgIn : styles.msgOut}`}
                  style={{ animationDelay: `${idx * 0.4}s` }}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PANEL ===== */}
      <section className={styles.section}>
        <div className={`${styles.wrap} ${styles.center} ${styles.rv}`}>
          <span className={styles.eyebrow}>Tu panel</span>
          <h2 className={styles.h2}>Todo tu negocio, en una pantalla.</h2>
          <p className={styles.lead}>
            Reservas, ocupación, clientes nuevos y ventas de la semana. Claro, rápido y pensado para usarlo entre un cliente y otro.
          </p>
        </div>
        <div className={styles.wrap}>
          <div className={`${styles.dashWrap} ${styles.rv}`}>
            <div className={styles.browser}>
              <div className={styles.bbar}>
                <i />
                <i />
                <i />
                <span>agendalink.cl/panel</span>
              </div>
              <div className={styles.dash}>
                <aside>
                  <img src="/logo-horizontal.png" alt="AgendaLink" className={styles.sidebarLogo} />
                  <h6>OPERACIÓN</h6>
                  <a className={styles.dashOn}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 20v-6M12 20V4M18 20v-10" />
                    </svg>
                    Dashboard Resumen
                  </a>
                  <a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="17" rx="2" />
                      <path d="M3 9h18M8 2v4M16 2v4" />
                    </svg>
                    Vista Calendario
                  </a>
                  <a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="3" width="14" height="18" rx="2" />
                      <path d="M9 3v2h6V3M9 11h6M9 15h6" />
                    </svg>
                    Lista de Reservas
                  </a>
                  <a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                    Ventas y Caja
                  </a>
                  <a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="8" r="4" />
                      <path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 100-6M22 21c0-3-2-5-5-5.5" />
                    </svg>
                    Base de Clientes
                  </a>
                  <h6>ASISTENTES LINKI IA</h6>
                  <a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Linki Secretary
                  </a>
                  <a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
                    </svg>
                    Linki Marketing
                  </a>
                  <a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v6M9 8h6l-1 6h-4zM12 14v8" />
                    </svg>
                    Linki Business
                  </a>
                  <h6>CONFIGURACIÓN</h6>
                  <a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                    Personalizar Landing
                  </a>
                  <a>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
                    </svg>
                    Ajustes de Negocio
                  </a>
                </aside>
                <main>
                  <div className={styles.dh}>
                    <div>
                      <h4>Valentina Studio</h4>
                      <p>
                        Panel de Administración · Plan Equipo: 2–5 personas <span className={styles.ok}>Activo</span>
                      </p>
                    </div>
                    <div className={styles.dhR}>
                      <span className={styles.vlink}>Ver link público ↗</span>
                      <span className={styles.gear}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
                        </svg>
                      </span>
                      <span className={styles.dashAv}>VS</span>
                    </div>
                  </div>

                  <div className={styles.onb}>
                    <div className={styles.onbH}>
                      <div>
                        <b>Primeros Pasos para lanzar tu Negocio</b>
                        <small>Completa estos 5 pasos esenciales para dejar tu AgendaLink lista al 100%.</small>
                      </div>
                      <div className={styles.onbP}>
                        60% completado{" "}
                        <span>
                          <i />
                        </span>
                      </div>
                    </div>
                    <div className={styles.osteps}>
                      <div className={`${styles.os} ${styles.osDone}`}>
                        <small>PASO 1</small>
                        <span className={styles.ck} />
                        <b>Personalizar Landing Page</b>
                        <em>Imágenes, historia y contacto.</em>
                      </div>
                      <div className={`${styles.os} ${styles.osDone}`}>
                        <small>PASO 2</small>
                        <span className={styles.ck} />
                        <b>Catálogo de Servicios</b>
                        <em>Agrega tus servicios y precios.</em>
                      </div>
                      <div className={`${styles.os} ${styles.osDone}`}>
                        <small>PASO 3</small>
                        <span className={styles.ck} />
                        <b>Vincular WhatsApp</b>
                        <em>Recibe avisos de reservas al instante.</em>
                      </div>
                      <div className={styles.os}>
                        <small>PASO 4</small>
                        <span className={styles.ck} />
                        <b>Instalar App en el Celular</b>
                        <em>Descargar a pantalla de inicio</em>
                      </div>
                      <div className={styles.os}>
                        <small>PASO 5</small>
                        <span className={styles.ck} />
                        <b>Compartir con Clientes</b>
                        <em>Publica en Instagram y WhatsApp.</em>
                      </div>
                    </div>
                  </div>

                  <div className={styles.per}>PERIODO DE TIEMPO</div>
                  <div className={styles.selPeriod}>
                    Esta semana <span>⌄</span>
                  </div>

                  <div className={styles.kp}>
                    <div className={`${styles.k} ${styles.kBlk}`}>
                      <small>Total de reservas</small>
                      <b>48</b>
                      <em>Ver detalles</em>
                    </div>
                    <div className={styles.k}>
                      <small>Factor de ocupación</small>
                      <b>82%</b>
                      <em>
                        <i>↑12%</i> vs periodo anterior
                      </em>
                    </div>
                    <div className={styles.k}>
                      <small>Nuevos clientes</small>
                      <b>9</b>
                      <em>
                        <i>↑28%</i> vs periodo anterior
                      </em>
                    </div>
                    <div className={styles.k}>
                      <small>Ventas facturadas</small>
                      <b>$1.284.000</b>
                      <em>
                        <i>↑18%</i> vs periodo anterior
                      </em>
                    </div>
                  </div>

                  <div className={styles.today}>
                    <div className={styles.todayH}>
                      Ver detalle de reservas de hoy (3)<span>▾</span>
                    </div>
                    <div className={styles.tr}>
                      <span className={styles.h}>11:30</span>
                      <span className={styles.n}>
                        Camila Rojas<small>Corte + brushing · Pía</small>
                      </span>
                      <span className={styles.st}>Pagada</span>
                    </div>
                    <div className={styles.tr}>
                      <span className={styles.h}>12:00</span>
                      <span className={styles.n}>
                        Diego Fuentes<small>Barba · Tomás</small>
                      </span>
                      <span className={`${styles.st} ${styles.stB}`}>Confirmada</span>
                    </div>
                    <div className={styles.tr}>
                      <span className={styles.h}>13:00</span>
                      <span className={styles.n}>
                        Sofía Muñoz<small>Manicure · Fran</small>
                      </span>
                      <span className={`${styles.st} ${styles.stP}`}>Recordada</span>
                    </div>
                  </div>

                  <div className={styles.cards3}>
                    <div className={styles.c3}>
                      <div className={styles.c3H}>
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                          </svg>
                        </span>
                        <b>Pagos en línea</b>
                      </div>
                      <p>Estado de tus transacciones y métodos de pago en el periodo.</p>
                      <div className={styles.mbBars}>
                        <i style={{ height: "45%" }} />
                        <i style={{ height: "70%" }} />
                        <i style={{ height: "52%" }} />
                        <i style={{ height: "88%" }} />
                        <i style={{ height: "64%" }} />
                        <i style={{ height: "100%" }} />
                        <i style={{ height: "78%" }} />
                      </div>
                    </div>

                    <div className={styles.c3}>
                      <div className={styles.c3H}>
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12A9 9 0 1112 3v9z" />
                            <path d="M12 3a9 9 0 019 9h-9z" />
                          </svg>
                        </span>
                        <b>Factor de ocupación</b>
                      </div>
                      <p>Uso de capacidad operativa (profesionales) esta semana.</p>
                      <div className={styles.dnChart}>
                        <svg viewBox="0 0 42 42">
                          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#eef1f6" strokeWidth="6" />
                          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#2563eb" strokeWidth="6" strokeDasharray="82 18" strokeDashoffset="25" />
                        </svg>
                        <div className={styles.lgList}>
                          <span>
                            <i className={styles.lgDot} style={{ background: "#2563eb" }} /> Ocupado 82%
                          </span>
                          <span>
                            <i className={styles.lgDot} style={{ background: "#e2e8f0" }} /> Libre 18%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.c3}>
                      <div className={styles.c3H}>
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <circle cx="12" cy="12" r="4" />
                          </svg>
                        </span>
                        <b>Origen de las reservas</b>
                      </div>
                      <p>Desde dónde llegan tus clientes.</p>
                      <div className={styles.dnChart}>
                        <svg viewBox="0 0 42 42">
                          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#eef1f6" strokeWidth="6" />
                          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#2563eb" strokeWidth="6" strokeDasharray="55 45" strokeDashoffset="25" />
                          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#22d3ee" strokeWidth="6" strokeDasharray="30 70" strokeDashoffset="-30" />
                          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#7c3aed" strokeWidth="6" strokeDasharray="15 85" strokeDashoffset="-60" />
                        </svg>
                        <div className={styles.lgList}>
                          <span>
                            <i className={styles.lgDot} style={{ background: "#2563eb" }} /> Reservas en línea
                          </span>
                          <span>
                            <i className={styles.lgDot} style={{ background: "#22d3ee" }} /> Instagram
                          </span>
                          <span>
                            <i className={styles.lgDot} style={{ background: "#7c3aed" }} /> Manual
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRECIOS ===== */}
      <section className={`${styles.section} ${styles.pricing}`} id="precios">
        <div className={`${styles.wrap} ${styles.center} ${styles.rv}`}>
          <span className={styles.eyebrow}>Precios</span>
          <h2 className={styles.h2}>
            Menos que lo que pierdes
            <br />
            con un cliente que no llega.
          </h2>
          <p className={styles.lead}>
            Todos los planes incluyen agenda, landing, pagos, recordatorios y los asistentes Linki IA.
          </p>
          <div className={styles.toggle}>
            <button
              type="button"
              className={billingPeriod === "monthly" ? styles.toggleOn : ""}
              onClick={() => setBillingPeriod("monthly")}
            >
              Mensual
            </button>
            <button
              type="button"
              className={billingPeriod === "yearly" ? styles.toggleOn : ""}
              onClick={() => setBillingPeriod("yearly")}
            >
              Anual <span className={styles.save}>-20%</span>
            </button>
          </div>
        </div>

        <div className={`${styles.wrap} ${styles.plans}`}>
          {/* Individual */}
          <div className={`${styles.plan} ${styles.rv}`}>
            <h3>Individual</h3>
            <p className={styles.who}>Para profesionales independientes</p>
            <div className={styles.price}>
              {billingPeriod === "monthly" ? "$9.900" : "$7.920"}
              <small> /mes</small>
            </div>
            <p className={styles.priceNote}>
              {billingPeriod === "yearly" ? "$95.040 facturado anual" : ""}
            </p>
            <ul>
              <li>1 profesional</li>
              <li>Link y landing personalizada</li>
              <li>Reservas ilimitadas</li>
              <li>Recordatorios por WhatsApp</li>
              <li>Pagos con tarjeta y Apple Pay</li>
              <li>QR y material impreso</li>
            </ul>
            <button className={`${styles.btn} ${styles.btnLight}`} onClick={() => openRegister("individual")}>
              Empezar
            </button>
          </div>

          {/* Equipo */}
          <div className={`${styles.plan} ${styles.planPop} ${styles.rv}`}>
            <span className={styles.badge}>⚡ Más elegido</span>
            <h3>Equipo</h3>
            <p className={styles.who}>Para equipos de 2 a 5 personas</p>
            <div className={styles.price}>
              {billingPeriod === "monthly" ? "$19.990" : "$15.992"}
              <small> /mes</small>
            </div>
            <p className={styles.priceNote}>
              {billingPeriod === "yearly" ? "$191.904 facturado anual" : ""}
            </p>
            <ul>
              <li>Hasta 5 profesionales</li>
              <li>Todo lo del plan Individual</li>
              <li>Calendario por profesional</li>
              <li>Ventas y caja del equipo</li>
              <li>Gift cards y fidelización</li>
              <li>Linki Secretary, Marketing y Business</li>
            </ul>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openRegister("equipo")}>
              Crear mi link
            </button>
          </div>

          {/* Business */}
          <div className={`${styles.plan} ${styles.rv}`}>
            <h3>Business</h3>
            <p className={styles.who}>Para negocios de 6 o más personas</p>
            <div className={styles.price}>
              {billingPeriod === "monthly" ? "$39.990" : "$31.992"}
              <small> /mes</small>
            </div>
            <p className={styles.priceNote}>
              {billingPeriod === "yearly" ? "$383.904 facturado anual" : ""}
            </p>
            <ul>
              <li>6 o más profesionales</li>
              <li>Todo lo del plan Equipo</li>
              <li>Reportes avanzados</li>
              <li>Base de clientes completa</li>
              <li>Campañas de reactivación</li>
              <li>Soporte prioritario</li>
            </ul>
            <button className={`${styles.btn} ${styles.btnLight}`} onClick={() => openRegister("business")}>
              Empezar
            </button>
          </div>
        </div>
        <p className={styles.plansFoot}>Precios en pesos chilenos, IVA incluido. Cancela cuando quieras.</p>
      </section>

      {/* ===== FAQ ===== */}
      <section className={styles.section} id="faq">
        <div className={`${styles.wrap} ${styles.center} ${styles.rv}`}>
          <span className={styles.eyebrow}>Preguntas frecuentes</span>
          <h2 className={styles.h2}>Resolvamos tus dudas.</h2>
        </div>
        <div className={`${styles.wrap} ${styles.faq}`}>
          {faqs.map((item, idx) => (
            <div key={idx} className={`${styles.q} ${openFaq === idx ? styles.qOpen : ""} ${styles.rv}`}>
              <button
                type="button"
                onClick={() => setOpenFaq((prev) => (prev === idx ? null : idx))}
              >
                {item.q}
                <span>+</span>
              </button>
              <div className={styles.a}>
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <div className={styles.final}>
        <div className={styles.wrap}>
          <div className={`${styles.finalBox} ${styles.rv}`}>
            <h2>
              Tu próxima reserva puede llegar <span className={styles.gradText}>mientras lees esto.</span>
            </h2>
            <p className={styles.lead}>Elige el nombre de tu link y empieza a recibir reservas hoy.</p>
            <form
              className={styles.linkDemo}
              onSubmit={(e) => {
                e.preventDefault();
                openRegister(undefined, finalSlug);
              }}
            >
              <span className={styles.base}>agendalink.cl/</span>
              <input
                name="slug"
                placeholder="tunegocio"
                autoComplete="off"
                aria-label="Nombre de tu link"
                value={finalSlug}
                onChange={(e) => setFinalSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
              <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">
                Crear mi link
              </button>
            </form>
            <small>Listo en 5 pasos · Sin contratos · Cancela cuando quieras</small>
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.foot}>
            <div>
              <Link href="/" className={styles.logoLink}>
                <img src="/logo-horizontal-blanco.png" alt="AgendaLink" className={styles.logoImg} />
              </Link>
              <p>Un link. Todo resuelto. Agenda, pagos, clientes e IA para negocios de servicios en Chile.</p>
            </div>
            <div>
              <h6>Producto</h6>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#linki">Linki IA</a>
              <a href="#precios">Precios</a>
            </div>
            <div>
              <h6>Cuenta</h6>
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  setLoginModalOpen(true);
                }}
              >
                Iniciar sesión
              </a>
              <a
                href="#registro"
                onClick={(e) => {
                  e.preventDefault();
                  openRegister();
                }}
              >
                Registrar negocio
              </a>
            </div>
            <div>
              <h6>Ayuda</h6>
              <a href="#faq">Preguntas frecuentes</a>
              <a href="https://wa.me/56985967325" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </div>
            <div>
              <h6>Legal</h6>
              <Link href="/terminos">Términos del Servicio</Link>
              <Link href="/privacidad">Política de Privacidad</Link>
              <Link href="/legal">Resguardo Legal e IA</Link>
            </div>
          </div>
          <div className={styles.footB}>
            <span>© {new Date().getFullYear()} AgendaLink. Todos los derechos reservados.</span>
            <span>
              Un producto de{" "}
              <a href="https://ganimides.cl" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>
                Ganímedes
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* ===== MODAL DE REGISTRO / ONBOARDING ===== */}
      {registerModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setRegisterModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setRegisterModalOpen(false)}>
              ✕
            </button>

            {regStep === 1 && (
              <>
                <h3 className={styles.modalTitle}>Crea tu AgendaLink</h3>
                <p className={styles.modalSubtitle}>Empieza gratis. Tu link quedará listo en segundos.</p>

                {regError && <div className={styles.modalError}>{regError}</div>}

                <form onSubmit={handleRegisterSubmit}>
                  <div className={styles.formGroup}>
                    <label>Nombre de tu Negocio</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Ej. Valentina Studio"
                      value={regFormData.name}
                      onChange={(e) => setRegFormData({ ...regFormData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tu Nombre</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Ej. Valentina Morales"
                      value={regFormData.ownerName}
                      onChange={(e) => setRegFormData({ ...regFormData, ownerName: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Correo Electrónico</label>
                    <input
                      type="email"
                      className={styles.formInput}
                      placeholder="Ej. contacto@valentina.cl"
                      value={regFormData.email}
                      onChange={(e) => setRegFormData({ ...regFormData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Contraseña para tu cuenta</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      placeholder="Mínimo 8 caracteres"
                      value={regFormData.password}
                      onChange={(e) => setRegFormData({ ...regFormData, password: e.target.value })}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                    />
                    <div style={{ marginTop: "6px", fontSize: "12px", lineHeight: "1.4" }}>
                      {!regFormData.password ? (
                        <span style={{ color: "var(--muted, #94a3b8)" }}>
                          Mínimo 8 caracteres (puedes combinar letras, números y símbolos)
                        </span>
                      ) : regFormData.password.length < 8 ? (
                        <span style={{ color: "#f59e0b", fontWeight: "600" }}>
                          ⚠️ Debe tener al menos 8 caracteres (llevas {regFormData.password.length} de 8)
                        </span>
                      ) : (
                        <span style={{ color: "#22c55e", fontWeight: "600" }}>
                          ✓ Contraseña válida ({regFormData.password.length} caracteres)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Rubro</label>
                    <select
                      className={styles.formSelect}
                      value={regFormData.category}
                      onChange={(e) => setRegFormData({ ...regFormData, category: e.target.value })}
                    >
                      <option value="Peluquería">Peluquería & Barbería</option>
                      <option value="Salud">Salud & Bienestar</option>
                      <option value="Fitness">Fitness & Deporte</option>
                      <option value="Profesionales">Servicios Profesionales</option>
                      <option value="Otros">Otros servicios</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Equipo / Plan</label>
                    <select
                      className={styles.formSelect}
                      value={regFormData.teamSize}
                      onChange={(e) => setRegFormData({ ...regFormData, teamSize: e.target.value })}
                    >
                      <option value="1 persona">Solo yo (Plan Individual)</option>
                      <option value="2-5 personas">2 a 5 personas (Plan Equipo)</option>
                      <option value="6+ personas">6 o más personas (Plan Business)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>País</label>
                    <select
                      className={styles.formSelect}
                      value={regFormData.country}
                      onChange={(e) => setRegFormData({ ...regFormData, country: e.target.value })}
                    >
                      <option value="Chile">Chile</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    style={{ width: "100%", marginTop: "16px" }}
                    disabled={
                      regLoading ||
                      !regFormData.name ||
                      !regFormData.ownerName ||
                      !regFormData.email ||
                      regFormData.password.length < 8
                    }
                  >
                    {regLoading ? "Creando tu link..." : "Crear mi link gratis"}
                  </button>

                  <p style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center", marginTop: "14px", lineHeight: "1.4" }}>
                    Al registrarte, aceptas los{" "}
                    <Link href="/terminos" target="_blank" style={{ textDecoration: "underline", color: "inherit", fontWeight: "600" }}>
                      Términos
                    </Link>
                    , la{" "}
                    <Link href="/privacidad" target="_blank" style={{ textDecoration: "underline", color: "inherit", fontWeight: "600" }}>
                      Privacidad
                    </Link>{" "}
                    y el{" "}
                    <Link href="/legal" target="_blank" style={{ textDecoration: "underline", color: "inherit", fontWeight: "600" }}>
                      Resguardo de IA
                    </Link>
                    .
                  </p>
                </form>
              </>
            )}

            {regStep === 3 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "38px", marginBottom: "12px" }}>🎉</div>
                <h3 className={styles.modalTitle}>¡Tu AgendaLink está lista!</h3>
                <p className={styles.modalSubtitle}>Ya puedes compartir este link con tus clientes para agendar citas.</p>

                <div className={styles.linkBox}>
                  <span className={styles.linkText}>
                    {typeof window !== "undefined" ? window.location.origin : "https://agendalink.cl"}/{createdSlug}
                  </span>
                  <button onClick={copyCreatedLink} className={styles.copyBtn}>
                    {copied ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>

                <div style={{ margin: "20px 0" }}>
                  <p style={{ fontSize: "12px", fontWeight: "700", color: "var(--muted)", marginBottom: "10px" }}>
                    CÓDIGO QR OFICIAL
                  </p>
                  <QrDownloader slug={createdSlug} businessName={regFormData.name} />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                  <Link
                    href={`/${createdSlug}`}
                    className={`${styles.btn} ${styles.btnLight}`}
                    style={{ flex: 1, textDecoration: "none" }}
                  >
                    Ver link público
                  </Link>
                  <Link
                    href={`/admin/${createdSlug}`}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    style={{ flex: 1, textDecoration: "none" }}
                  >
                    Ir al Panel →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL DE INICIO DE SESIÓN ===== */}
      {loginModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setLoginModalOpen(false);
          }}
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalCloseBtn}
              onClick={() => {
                setLoginModalOpen(false);
              }}
            >
              ✕
            </button>

            <h3 className={styles.modalTitle}>Iniciar Sesión</h3>
            <p className={styles.modalSubtitle}>Accede al panel de control de tu negocio en AgendaLink</p>

            {loginError && <div className={styles.modalError}>{loginError}</div>}

            <Link
              href="/login"
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ width: "100%", justifyContent: "center", marginBottom: "16px", textDecoration: "none", display: "inline-flex" }}
            >
              Iniciar sesión con Email y Contraseña →
            </Link>

            <div className={styles.divider}>o ir directo con el link de tu negocio</div>

            <form onSubmit={handleLoginSubmit}>
              <div className={styles.formGroup}>
                <label>Link de tu negocio</label>
                <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid var(--line)", borderRadius: "12px", padding: "0 14px", height: "46px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--muted)" }}>agendalink.cl/</span>
                  <input
                    type="text"
                    placeholder="tunegocio"
                    style={{ border: "none", background: "none", outline: "none", padding: "8px 4px", fontSize: "14px", fontWeight: "700", flex: 1, color: "var(--text)" }}
                    value={loginSlug}
                    onChange={(e) => setLoginSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ width: "100%", marginTop: "16px" }}
                disabled={loginLoading || !loginSlug}
              >
                {loginLoading ? "Verificando..." : "Ingresar a mi Panel"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
