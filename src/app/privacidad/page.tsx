import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import styles from "../page.module.css";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de Privacidad y Protección de Datos de la plataforma AgendaLink.",
  alternates: {
    canonical: "/privacidad",
  },
};

export default function PrivacidadPage() {
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
          <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Privacidad y Protección de Datos
          </span>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#0f172a", marginTop: "8px", marginBottom: "12px", letterSpacing: "-0.02em" }}>
            Política de Privacidad
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "32px" }}>
            En conformidad con la <strong>Ley Nº 19.628 sobre Protección de la Vida Privada</strong> (Chile) · Operado por <strong>{LEGAL.razonSocial}</strong> (RUT {LEGAL.rut}, {LEGAL.domicilio}, Chile)
          </p>

          <div style={{ lineHeight: "1.75", fontSize: "15px", color: "#334155" }}>
            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                1. Información que Recopilamos
              </h2>
              <p>
                AgendaLink recopila la información estrictamente necesaria para la prestación del servicio de agendamiento y gestión de negocios:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Datos de Negocios y Profesionales:</strong> Nombre, correo electrónico, número de teléfono/WhatsApp, rubro, servicios ofrecidos y horarios configurados.</li>
                <li><strong>Datos de Clientes Finales (al agendar):</strong> Nombre, número de WhatsApp/teléfono, correo electrónico y notas específicas del servicio solicitado.</li>
                <li><strong>Datos Técnicos:</strong> Registros de acceso, dirección IP anónima y cookies técnicas necesarias para el funcionamiento de la sesión.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                2. Finalidad del Tratamiento de Datos
              </h2>
              <p>
                Los datos recopilados son utilizados exclusivamente con las siguientes finalidades:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Gestionar y registrar solicitudes de citas entre los clientes y los negocios.</li>
                <li>Enviar recordatorios que el negocio envía desde su panel por WhatsApp o Email.</li>
                <li>Proveer métricas y analíticas agregadas en el Panel de Administración del negocio.</li>
                <li>Garantizar la seguridad y prevención de fraudes en la plataforma.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                3. No Comercialización de Datos Personales
              </h2>
              <div style={{ background: "#ecfdf5", color: "#065f46", padding: "16px 20px", borderRadius: "12px", margin: "14px 0", borderLeft: "4px solid #10b981", fontSize: "14px" }}>
                <strong>Compromiso de Privacidad:</strong> AgendaLink y {LEGAL.razonSocial} <u>NUNCA</u> venden, arriendan, transfieren ni comercializan bases de datos personales o contactos de clientes a terceros, agencias de publicidad o entidades externas.
              </div>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                4. Uso de Inteligencia Artificial y Confidencialidad
              </h2>
              <p>
                Los datos procesados por los módulos de Inteligencia Artificial (Linki IA) son tratados bajo estrictos protocolos de confidencialidad y aislamiento. No se emplean los datos personales de los clientes para entrenar modelos públicos de terceros ni se comparten fuera del entorno seguro de la plataforma.
              </p>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                5. Derechos del Titular (Acceso, Rectificación y Supresión)
              </h2>
              <p>
                En todo momento, tanto los administradores de negocios como los clientes finales pueden solicitar el acceso, rectificación, eliminación o portabilidad de sus datos personales enviando un correo a <a href={`mailto:${LEGAL.email}`} style={{ color: "var(--blue)", fontWeight: "600" }}>{LEGAL.email}</a>.
              </p>
            </section>

            <section style={{ marginTop: "36px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                Para más detalles legales, consulta también nuestros <Link href="/terminos" style={{ color: "var(--blue)", fontWeight: "600" }}>Términos y Condiciones</Link> y el <Link href="/legal" style={{ color: "var(--blue)", fontWeight: "600" }}>Descargo de Responsabilidad</Link>.
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
