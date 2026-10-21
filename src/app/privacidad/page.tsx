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
            En conformidad con la <strong>Ley Nº 19.628</strong> y los estándares de la <strong>Ley Nº 21.719 sobre Protección de Datos Personales</strong> (Chile) · Fecha de vigencia: <strong>{LEGAL.fechaVigencia}</strong> · Operado por <strong>{LEGAL.razonSocial}</strong> (RUT {LEGAL.rut}, {LEGAL.domicilio}, Chile)
          </p>

          <div style={{ lineHeight: "1.75", fontSize: "15px", color: "#334155" }}>
            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                1. Roles en el Tratamiento de Datos (Responsable y Encargado)
              </h2>
              <p>
                Para los fines previstos en la legislación sobre protección de datos personales:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>El Negocio es el Responsable del Tratamiento:</strong> El establecimiento o profesional que contrata AgendaLink decide los fines del contacto con sus clientes y recaba su información para la coordinación de citas.</li>
                <li><strong>AgendaLink es el Encargado del Tratamiento:</strong> {LEGAL.razonSocial} trata los datos personales de los clientes finales por cuenta y encargo del Negocio, limitándose estrictamente a proveer la infraestructura tecnológica de agendamiento, notificaciones y reportes.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                2. Información que Recopilamos y Prohibición de Datos de Salud
              </h2>
              <p>
                AgendaLink recopila la información estrictamente necesaria para la prestación del servicio de agendamiento y gestión técnica:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Datos del Negocio:</strong> Nombre del titular, razón social, correo de contacto, teléfono/WhatsApp, rubro, servicios y horarios.</li>
                <li><strong>Datos de Clientes Finales (al reservar):</strong> Nombre completo, número de WhatsApp/teléfono, correo electrónico y notas operativas sobre la cita.</li>
                <li><strong>Datos Técnicos:</strong> Registros de acceso seguros, dirección IP anónima y cookies técnicas indispensables para la sesión.</li>
              </ul>
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "16px 20px", borderRadius: "12px", margin: "14px 0", borderLeft: "4px solid #ef4444", fontSize: "14px" }}>
                <strong>Prohibición Estricta sobre Datos Sensibles de Salud:</strong> AgendaLink no es un software de ficha médica ni custodia datos clínicos bajo la Ley Nº 20.584. Se prohíbe expresamente a usuarios, negocios (incluyendo psicología, kinesiología o nutrición) y clientes incluir antecedentes médicos, diagnósticos, síntomas clínicos o tratamientos farmacológicos en los campos de notas de reserva o texto libre. La plataforma debe ser utilizada únicamente para la coordinación de fecha, hora y datos de contacto de la atención.
              </div>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                3. Finalidad del Tratamiento
              </h2>
              <p>
                Los datos personales son tratados exclusivamente para:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Registrar y validar solicitudes de citas entre clientes finales y los negocios adheridos.</li>
                <li>Facilitar el envío de recordatorios que el negocio envía desde su panel por WhatsApp o correo electrónico.</li>
                <li>Proveer métricas operativas al Negocio en su panel de administración.</li>
                <li>Garantizar la estabilidad, autenticación y prevención de accesos no autorizados en la plataforma.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                4. Proveedores Tecnológicos y Transferencias Internacionales de Datos
              </h2>
              <p>
                AgendaLink no comercializa, no arrienda ni vende bases de datos personales bajo ningún concepto. Para prestar el servicio SaaS, AgendaLink se apoya en los siguientes subencargados tecnológicos, algunos de los cuales operan servidores fuera de Chile bajo estándares internacionales de seguridad:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><strong>Cloudflare, Inc. (EE.UU. / Infraestructura Global):</strong> Provee la red de distribución de contenido (CDN), servidores Edge Workers, base de datos distribuida y cortafuegos de seguridad web con cifrado TLS 1.3 en tránsito y cifrado en reposo.</li>
                <li><strong>Mercado Pago Chile / MercadoLibre (Chile / Región):</strong> Pasarela de pago cuando el cliente opta por pagar online su reserva. Recibe nombre, correo y monto exclusivamente para procesar la transacción bancaria.</li>
                <li><strong>Google Cloud / Google Gemini API:</strong> Módulos de inteligencia artificial (Linki IA) para redacción y análisis, operados bajo acuerdos de confidencialidad corporativa y sin utilizar datos personales para el reentrenamiento de modelos públicos.</li>
                <li><strong>Resend, Inc. (EE.UU.):</strong> Proveedor de infraestructura para la entrega automatizada de correos electrónicos transaccionales (comprobantes de reserva y avisos del sistema).</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                5. Medidas de Seguridad de la Información
              </h2>
              <p>
                Adoptamos medidas técnicas y organizativas para proteger la confidencialidad e integridad de la información:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Cifrado de todas las comunicaciones mediante protocolo HTTPS / TLS 1.3.</li>
                <li>Hashing criptográfico irreversible para contraseñas de cuentas mediante PBKDF2 con sal individual y 100.000 iteraciones.</li>
                <li>Aislamiento lógico de datos entre negocios (arquitectura multi-tenant segura) y control de acceso basado en roles (RBAC).</li>
                <li>Políticas de minimización de datos en logs de servidores y monitoreo preventivo contra ataques de denegación de servicio (DDoS).</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                6. Plazos de Conservación y Eliminación de Datos
              </h2>
              <p>
                Los datos personales se conservan durante el tiempo necesario para la prestación del servicio:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Cuentas Activas:</strong> La información de reservas y clientes permanece accesible en el panel del Negocio mientras su cuenta esté operativa.</li>
                <li><strong>Cancelación de Cuenta:</strong> Tras darse de baja una cuenta, el Negocio dispone de un plazo de <strong>30 días corridos</strong> para solicitar la exportación de sus datos. Cumplido dicho plazo, los datos personales son eliminados de forma permanente e irrecuperable de los sistemas activos, resguardándose exclusivamente la documentación contable exigida por el Servicio de Impuestos Internos (SII) de Chile durante los plazos legales aplicables.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                7. Derechos del Titular y Plazo de Respuesta (ARCO)
              </h2>
              <p>
                Conforme a la Ley Nº 19.628 y la Ley Nº 21.719, tanto los titulares de negocios como los clientes finales tienen derecho a solicitar el acceso, rectificación, cancelación, oposición, bloqueo y portabilidad de sus datos personales.
              </p>
              <p style={{ marginTop: "8px" }}>
                Para ejercer cualquiera de estos derechos, el titular puede enviar una comunicación escrita a <a href={`mailto:${LEGAL.email}`} style={{ color: "var(--blue)", fontWeight: "600" }}>{LEGAL.email}</a> acreditando debidamente su identidad. {LEGAL.razonSocial} responderá a toda solicitud formal en un plazo máximo de <strong>15 días hábiles</strong>.
              </p>
            </section>

            <section style={{ marginTop: "36px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                Para conocer el marco contractual y operativo complementario, revisa nuestros <Link href="/terminos" style={{ color: "var(--blue)", fontWeight: "600" }}>Términos y Condiciones</Link> y el <Link href="/legal" style={{ color: "var(--blue)", fontWeight: "600" }}>Resguardo Legal e IA</Link>.
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
