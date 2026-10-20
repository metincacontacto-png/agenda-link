import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import styles from "../page.module.css";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos del Servicio",
  description: "Términos y Condiciones del Servicio de la plataforma AgendaLink.",
  alternates: {
    canonical: "/terminos",
  },
};

export default function TerminosPage() {
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
            Marco Legal y Contractual
          </span>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#0f172a", marginTop: "8px", marginBottom: "12px", letterSpacing: "-0.02em" }}>
            Términos y Condiciones del Servicio
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "32px" }}>
            Última actualización: <strong>Octubre 2026</strong> · Operado por <strong>{LEGAL.razonSocial}</strong> (RUT {LEGAL.rut}, {LEGAL.domicilio}, Chile)
          </p>

          <div style={{ lineHeight: "1.75", fontSize: "15px", color: "#334155" }}>
            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                1. Aceptación de los Términos
              </h2>
              <p>
                Al acceder, registrarse o utilizar la plataforma <strong>AgendaLink</strong> (en adelante, &quot;la Plataforma&quot; o &quot;el Servicio&quot;), desarrollada y operada por <strong>{LEGAL.razonSocial}</strong>, usted (en adelante, &quot;el Usuario&quot;, &quot;el Negocio&quot; o &quot;el Cliente&quot;) acepta expresamente y de manera vinculante los presentes Términos y Condiciones, así como nuestra <Link href="/privacidad" style={{ color: "var(--blue)", fontWeight: "600" }}>Política de Privacidad</Link> y el <Link href="/legal" style={{ color: "var(--blue)", fontWeight: "600" }}>Descargo de Responsabilidad por Uso de IA</Link>.
              </p>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                2. Naturaleza del Servicio y Rol de Intermediación Tecnológica
              </h2>
              <p>
                AgendaLink es una plataforma de software como servicio (SaaS) que provee herramientas tecnológicas de agendamiento online, gestión de horarios, recordatorios automatizados, pasarelas de pago y módulos de asistencia mediante inteligencia artificial.
              </p>
              <div style={{ background: "#f1f5f9", padding: "16px 20px", borderRadius: "12px", margin: "14px 0", borderLeft: "4px solid var(--blue)" }}>
                <strong>Deslinde Fundamental:</strong> AgendaLink y {LEGAL.razonSocial} <u>NO</u> son prestadores de servicios finales (como peluquería, salud, estética, consultoría, etc.) ni son parte de la relación comercial o contractual celebrada entre el Negocio y sus clientes finales. Toda reserva, servicio prestado, cobro o cancelación es de exclusiva responsabilidad entre las partes involucradas.
              </div>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                3. Descargo y Deslinde de Responsabilidad por Inteligencia Artificial (Linki IA)
              </h2>
              <p>
                La Plataforma integra herramientas de Inteligencia Artificial (incluyendo <em>Linki Secretary</em>, <em>Linki Marketing</em> y <em>Linki Business</em>) para asistir en la redacción, análisis y atención automatizada.
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Carácter Referencial:</strong> Las sugerencias, mensajes, cálculos y análisis emitidos por las herramientas de IA son meramente referenciales y no constituyen asesoría legal, médica, contable, tributaria ni comercial infalible.</li>
                <li><strong>Supervisión Humana Requerida:</strong> El Usuario es el único responsable de revisar, aprobar y supervisar cualquier comunicación automatizada enviada a través de sus canales (como WhatsApp).</li>
                <li><strong>Exención de Indemnizaciones:</strong> AgendaLink y {LEGAL.razonSocial} quedan totalmente exentas de responsabilidad frente a cualquier error, alucinación de IA, respuesta inexacta, pérdida de clientes o perjuicio directo o indirecto derivado del uso de dichas herramientas.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                4. Citas, Reservas, Inasistencias (No-Shows) y Cancelaciones
              </h2>
              <p>
                AgendaLink facilita la infraestructura para que los clientes finales puedan solicitar citas online. Sin embargo:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>AgendaLink no garantiza la asistencia efectiva de los clientes ni asume responsabilidad por citas no cumplidas o cancelaciones de última hora.</li>
                <li>Las políticas de cancelación y reembolso son fijadas de forma independiente por cada negocio.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                5. Procesamiento de Pagos y Seguridad Financiera
              </h2>
              <p>
                Los pagos online se procesan de forma cifrada mediante integraciones con pasarelas de pago de terceros certificadas (como Transbank Webpay Plus, Mercado Pago, Apple Pay, etc.).
              </p>
              <p style={{ marginTop: "8px" }}>
                AgendaLink <strong>nunca almacena números de tarjeta ni claves bancarias</strong>. Cualquier controversia, contracargo o rechazo financiero deberá resolverse directamente con el procesador de pago o la institución bancaria correspondiente.
              </p>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                6. Limitación Global de Responsabilidad
              </h2>
              <p>
                En la máxima medida permitida por las leyes aplicables de la República de Chile y normativas internacionales:
              </p>
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "16px 20px", borderRadius: "12px", margin: "14px 0", borderLeft: "4px solid #ef4444", fontSize: "14px" }}>
                AgendaLink, {LEGAL.razonSocial}, sus directores, socios, desarrolladores y empleados no serán responsables bajo ninguna circunstancia por daños directos, indirectos, incidentales, lucro cesante, pérdidas comerciales, interrupciones de servicio de proveedores externos (como WhatsApp, Meta, Cloudflare o pasarelas de pago) o reclamaciones de terceros.
              </div>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                7. Propiedad Intelectual y Jurisdicción
              </h2>
              <p>
                Todo el software, marcas, interfaces, logotipos y algoritmos de AgendaLink son propiedad exclusiva de <strong>{LEGAL.razonSocial}</strong>. Estos términos se rigen por las leyes de la <strong>República de Chile</strong>. Cualquier controversia se someterá a la jurisdicción de los tribunales ordinarios de justicia de Santiago de Chile.
              </p>
            </section>

            <section style={{ marginTop: "36px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                Si tienes preguntas sobre estos términos, contáctanos a <a href={`mailto:${LEGAL.email}`} style={{ color: "var(--blue)", fontWeight: "600" }}>{LEGAL.email}</a> o a través de nuestros canales oficiales de soporte.
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
