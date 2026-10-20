import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import styles from "../page.module.css";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Resguardo Legal e IA",
  description: "Descargo de Responsabilidad y Cláusulas de Inteligencia Artificial de AgendaLink.",
  alternates: {
    canonical: "/legal",
  },
};

export default function LegalPage() {
  return (
    <div className={styles.landingPage} style={{ minHeight: "100vh", background: "#f8fafc", color: "var(--text)" }}>
      {/* Header */}
      <nav className={styles.nav} style={{ position: "sticky", background: "rgba(10, 15, 29, 0.95)", backdropFilter: "blur(12px)" }}>
        <div className={styles.wrap} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" className={styles.logoLink}>
            <img src="/logo-horizontal-blanco.png" alt="AgendaLink" className={styles.logoImg} />
          </Link>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Link href="/" className={styles.btnGhost} style={{ color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
              ← Volver al Inicio
            </Link>
            <Link href="/registro" className={`${styles.btn} ${styles.btnPrimary}`} style={{ fontSize: "13px", padding: "8px 16px" }}>
              Crear mi link
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: "860px", margin: "40px auto 80px", padding: "0 24px" }}>
        <div style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "40px 48px", boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "12px", fontWeight: "800", color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Protección Legal & Exención de Responsabilidad
          </span>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#0f172a", marginTop: "8px", marginBottom: "12px", letterSpacing: "-0.02em" }}>
            Descargo de Responsabilidad y Cláusulas de IA
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "32px" }}>
            Fecha de vigencia: <strong>{LEGAL.fechaVigencia}</strong> · Documento de protección legal complementario para usuarios, negocios y terceros · <strong>{LEGAL.razonSocial}</strong> (RUT {LEGAL.rut}, {LEGAL.domicilio}, Chile)
          </p>

          <div style={{ lineHeight: "1.75", fontSize: "15px", color: "#334155" }}>
            <section style={{ marginBottom: "28px" }}>
              <div style={{ background: "#f8fafc", color: "#0f172a", padding: "20px 24px", borderRadius: "16px", border: "1px solid #cbd5e1", borderLeft: "5px solid var(--blue)", fontSize: "14.5px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "8px", color: "#0f172a" }}>
                  ⚖️ Limitación Legal de Responsabilidad (Estatuto Pyme)
                </h3>
                <p>
                  AgendaLink es una plataforma SaaS de software. Conforme al Estatuto Pyme (Ley Nº 20.416) y la legislación chilena aplicable: <strong>La responsabilidad total de LINKI GROUP SpA se limita al monto pagado por el Negocio en los últimos 12 meses, salvo dolo o culpa grave.</strong>
                </p>
              </div>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                1. Deslinde Específico por Uso de Inteligencia Artificial (Linki IA)
              </h2>
              <p>
                Los agentes de inteligencia artificial (<em>Linki Secretary</em>, <em>Linki Marketing</em>, <em>Linki Business</em> y derivados) son herramientas de apoyo basadas en modelos probabilísticos de lenguaje:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><strong>Sin Garantía de Exactitud:</strong> La inteligencia artificial puede cometer errores, generar respuestas inexactas o interpretaciones imprecisas (&quot;alucinaciones&quot;). AgendaLink no garantiza que los textos generados sean 100% correctos ni infalibles.</li>
                <li><strong>No Constituye Asesoramiento Profesional:</strong> Ninguna respuesta de Linki IA debe considerarse asesoría médica, jurídica, legal, contable ni financiera.</li>
                <li><strong>Supervisión Humana Obligatoria:</strong> El negocio o usuario titular asume plena responsabilidad por el contenido de los mensajes, promociones, respuestas y decisiones comerciales que adopte a partir de los datos de la IA, debiendo siempre verificar su exactitud.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                2. Exención de Responsabilidad por la Prestación de Servicios y Flujo de Pagos
              </h2>
              <p>
                AgendaLink no es propietaria, no supervisa, no controla ni garantiza los servicios que ofrecen los negocios o profesionales independientes en la plataforma.
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <li>Cualquier reclamo sobre calidad, retrasos, insatisfacción, daños a la persona o incumplimiento de servicios es de exclusiva competencia entre el cliente y el profesional o negocio contratado.</li>
                <li><strong>Flujo de Pagos Directo:</strong> Los pagos que los clientes finales efectúan por servicios reservados se canalizan de manera directa a la cuenta de Mercado Pago del propio Negocio o se perciben presencialmente en el local. AgendaLink no intermedia la recaudación de fondos de terceros ni retiene pagos por servicios prestados por los Negocios; únicamente percibe los cobros por suscripción al software SaaS.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                3. Disponibilidad del Servicio y Terceros Proveedores
              </h2>
              <p>
                La plataforma utiliza tecnologías web estándar y enlaces directos a WhatsApp, dependiendo además de servicios de infraestructura provistos por terceros (proveedores de nube, pasarelas de pago y operadores de telecomunicaciones). AgendaLink no es responsable por caídas temporales de red, indisponibilidad de proveedores externos o interrupciones ajenas a su control directo.
              </p>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                4. Enlaces y Documentos Relacionados
              </h2>
              <p>
                Para conocer el detalle completo de nuestros términos operativos y de tratamiento de datos, revisa:
              </p>
              <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
                <Link href="/terminos" className={`${styles.btn} ${styles.btnLight}`} style={{ textDecoration: "none", fontSize: "14px" }}>
                  📄 Términos y Condiciones
                </Link>
                <Link href="/privacidad" className={`${styles.btn} ${styles.btnLight}`} style={{ textDecoration: "none", fontSize: "14px" }}>
                  🔒 Política de Privacidad
                </Link>
              </div>
            </section>

            <section style={{ marginTop: "36px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                Para comunicaciones legales o notificaciones formales: <strong>{LEGAL.razonSocial}</strong> · <a href={`mailto:${LEGAL.email}`} style={{ color: "var(--blue)", fontWeight: "600" }}>{LEGAL.email}</a> · {LEGAL.domicilio}, Chile.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className={styles.wrap} style={{ textAlign: "center", fontSize: "13px" }}>
          <span>© {new Date().getFullYear()} AgendaLink. Todos los derechos reservados · Un producto de <strong>{LEGAL.marcaMatriz}</strong></span>
        </div>
      </footer>
    </div>
  );
}
