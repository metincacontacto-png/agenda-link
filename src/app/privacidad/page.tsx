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
            En conformidad con la <strong>Ley Nº 19.628</strong> y los estándares de la <strong>Ley Nº 21.719 sobre Protección de Datos Personales</strong> (Chile) · Fecha de vigencia: <strong>{LEGAL.fechaVigencia}</strong> · Operado por <strong>{LEGAL.razonSocial}</strong> (RUT {LEGAL.rut}, {LEGAL.domicilio}, {LEGAL.ciudad}, {LEGAL.pais})
          </p>

          <div style={{ lineHeight: "1.75", fontSize: "15px", color: "#334155" }}>
            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                1. Roles en el Tratamiento de Datos (Responsable y Encargado)
              </h2>
              <p>
                Para los efectos de la Ley Nº 19.628 y la Ley Nº 21.719 sobre Protección de Datos Personales, los roles en la plataforma se definen de la siguiente manera:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>El Negocio es el Responsable del Tratamiento (Data Controller):</strong> El establecimiento comercial, empresa o profesional independiente que contrata AgendaLink es el Responsable respecto de los datos personales de sus propios clientes finales y personal dependiente, fijando los fines del agendamiento y recabando el consentimiento o base de licitud pertinente.</li>
                <li><strong>AgendaLink es el Encargado del Tratamiento (Data Processor):</strong> {LEGAL.razonSocial} actúa como mero Encargado respecto de los datos personales de los clientes finales que reservan citas, tratándolos única y exclusivamente por cuenta, orden e instrucción del Negocio para habilitar la infraestructura técnica de reservas y el envío de recordatorios.</li>
                <li><strong>AgendaLink como Responsable de Datos de Clientes Directos:</strong> {LEGAL.razonSocial} es Responsable del Tratamiento únicamente respecto de los datos de contacto, facturación y autenticación de los titulares o administradores que contratan la suscripción SaaS.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                2. Información que Recopilamos y Prohibición de Datos de Salud
              </h2>
              <p>
                AgendaLink recopila la información estrictamente necesaria y proporcional para la prestación del servicio:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Datos del Negocio:</strong> Nombre del titular, razón social, RUT, correo electrónico de administración, número de teléfono/WhatsApp, categoría comercial, catálogo de servicios, precios y horarios de atención.</li>
                <li><strong>Datos de Clientes Finales (al agendar):</strong> Nombre de contacto, número de teléfono/WhatsApp, correo electrónico (opcional) y notas operativas asociadas a la cita.</li>
                <li><strong>Datos Técnicos y de Seguridad:</strong> Registros de acceso cifrados, marcas temporales, dirección IP anonimizada y cookies técnicas de sesión estrictamente necesarias.</li>
              </ul>
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "16px 20px", borderRadius: "12px", margin: "14px 0", borderLeft: "4px solid #ef4444", fontSize: "14px" }}>
                <strong>Prohibición Estricta sobre Datos Sensibles de Salud:</strong> AgendaLink no es un software de ficha clínica electrónica ni un repositorio de datos médicos bajo la Ley Nº 20.584. Se prohíbe expresamente a usuarios, negocios (incluyendo áreas de psicología, kinesiología, medicina o nutrición) y clientes finales incluir antecedentes médicos, diagnósticos, síntomas clínicos o tratamientos farmacológicos en los campos de notas de reserva o texto libre. La plataforma debe ser utilizada únicamente para la coordinación administrativa de fecha, hora y datos de contacto para la cita.
              </div>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                3. Bases de Licitud del Tratamiento (Art. 13 Ley Nº 21.719)
              </h2>
              <p>
                Todo tratamiento de datos personales en la Plataforma se sustenta en una base jurídica válida conforme a la Ley Nº 21.719:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Ejecución Contractual y Medidas Precontractuales:</strong> Tratamiento indispensable para coordinar la solicitud de cita formulada por el cliente final ante el Negocio, y para ejecutar el contrato de suscripción SaaS con el titular de la cuenta.</li>
                <li><strong>Cumplimiento de Obligaciones Legales y Tributarias:</strong> Tratamiento y resguardo de datos de facturación para la emisión de documentos tributarios electrónicos ante el Servicio de Impuestos Internos (SII).</li>
                <li><strong>Interés Legítimo Prevaleciente:</strong> Monitoreo de seguridad informática, prevención de ataques de denegación de servicio (DDoS), mitigación de fraude y preservación de la estabilidad operativa de la infraestructura multi-tenant.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                4. Proveedores Tecnológicos (Subencargados) y Transferencias Internacionales
              </h2>
              <p>
                AgendaLink no comercializa, no arrienda ni cede bases de datos personales bajo ningún concepto. Para proveer el servicio SaaS, {LEGAL.razonSocial} contrata la infraestructura de los siguientes subencargados tecnológicos de primer nivel, algunos de los cuales procesan datos fuera de Chile bajo estrictas cláusulas contractuales tipo y estándares internacionales de seguridad:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><strong>Cloudflare, Inc. (EE.UU. / Infraestructura Global):</strong> Provee la red de distribución de contenido (CDN), servidores Edge Workers, almacenamiento de objetos R2, base de datos relacional distribuida D1 y cortafuegos de aplicaciones web (WAF) con cifrado TLS 1.3 en tránsito y cifrado AES-256 en reposo.</li>
                <li><strong>Mercado Pago Chile / MercadoLibre (Chile / Región):</strong> Pasarela de pago cuando el cliente o el negocio optan por cobros online o suscripciones periódicas. Recibe los datos transaccionales bajo certificación bancaria PCI-DSS Nivel 1.</li>
                <li><strong>Google LLC / Google Cloud Vertex AI & Gemini API (EE.UU.):</strong> Provee la infraestructura de inteligencia artificial para las consultas asistidas de los módulos Linki IA (redacción de respuestas y análisis comercial). Este procesamiento opera bajo acuerdos de confidencialidad y protección de datos empresariales (Enterprise Data Protection), garantizando expresamente que los datos procesados <u>no</u> se utilizan para reentrenar ni perfeccionar modelos públicos de IA.</li>
                <li><strong>Meta Platforms, Inc. / WhatsApp (EE.UU. / Irlanda):</strong> Provee la interfaz de enlace directo mediante protocolo <code>wa.me</code> para que el Negocio emita recordatorios y avisos en 1 clic de forma manual desde su propio dispositivo, sin intermediación de bots automatizados no autorizados.</li>
                <li><strong>Resend, Inc. (EE.UU.):</strong> Infraestructura para el despacho automatizado de correos electrónicos transaccionales del sistema (notificaciones de citas y restablecimiento de accesos).</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                5. Medidas de Seguridad de la Información
              </h2>
              <p>
                Adoptamos rigurosas medidas técnicas y organizativas para salvaguardar la integridad y confidencialidad de la información:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Cifrado obligatorio de todas las conexiones mediante protocolo seguro HTTPS con TLS 1.3.</li>
                <li>Cifrado criptográfico irreversible para credenciales mediante PBKDF2-SHA256 con sal individual aleatoria y 100.000 iteraciones por clave.</li>
                <li>Aislamiento lógico estricto entre negocios (arquitectura multi-tenant protegida por identificador de negocio) y control de acceso basado en roles (RBAC).</li>
                <li>Políticas de minimización de datos en registros de servidores y protección perimetral activa contra ciberataques y scraping malicioso.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                6. Plazos de Conservación y Eliminación de Datos
              </h2>
              <p>
                Los datos personales se conservan durante el tiempo estrictamente necesario para cumplir las finalidades descritas:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Cuentas Activas:</strong> La información operativa de reservas y clientes permanece accesible en el panel de control del Negocio mientras la cuenta mantenga su suscripción vigente.</li>
                <li><strong>Cancelación y Cierre de Cuenta:</strong> Tras la cancelación o baja definitiva de una cuenta, el Negocio cuenta con un plazo de <strong>30 días corridos</strong> para solicitar la exportación de sus datos. Expirado dicho plazo, los datos personales de reservas y clientes son destruidos y eliminados permanentemente de los servidores activos de producción.</li>
                <li><strong>Resguardo Tributario Legal:</strong> Exclusivamente los antecedentes contables y registros de facturación de suscripciones requeridos por el Servicio de Impuestos Internos (SII) de Chile serán resguardados durante el plazo legal de prescripción de <strong>6 años</strong> establecido en el Artículo 17 del Código Tributario chileno.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                7. Derechos del Titular y Procedimiento de Ejercicio (ARCO+P)
              </h2>
              <p>
                Conforme a la Ley Nº 19.628 y la Ley Nº 21.719, tanto los titulares de negocios como los clientes finales tienen derecho a exigir el acceso, rectificación, cancelación, oposición, bloqueo y portabilidad de sus datos personales.
              </p>
              <p style={{ marginTop: "8px" }}>
                Para ejercer cualquiera de estos derechos, el titular debe remitir una comunicación escrita a <a href={`mailto:${LEGAL.email}`} style={{ color: "var(--blue)", fontWeight: "600" }}>{LEGAL.email}</a> acreditando debidamente su identidad. {LEGAL.razonSocial} responderá a toda solicitud formal dentro del plazo legal máximo de <strong>15 días hábiles</strong>.
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
