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
            Fecha de vigencia: <strong>{LEGAL.fechaVigencia}</strong> · Operado por <strong>{LEGAL.razonSocial}</strong> (RUT {LEGAL.rut}, {LEGAL.domicilio}, Chile)
          </p>

          <div style={{ lineHeight: "1.75", fontSize: "15px", color: "#334155" }}>
            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                1. Aceptación de los Términos
              </h2>
              <p>
                Al registrarse o utilizar la plataforma <strong>AgendaLink</strong> (en adelante, &quot;la Plataforma&quot; o &quot;el Servicio&quot;), desarrollada y operada por <strong>{LEGAL.razonSocial}</strong>, usted (en adelante, &quot;el Negocio&quot;, &quot;el Usuario&quot; o &quot;el Cliente&quot;) manifiesta su consentimiento expreso y vinculante con los presentes Términos y Condiciones, así como con nuestra <Link href="/privacidad" style={{ color: "var(--blue)", fontWeight: "600" }}>Política de Privacidad</Link> y el <Link href="/legal" style={{ color: "var(--blue)", fontWeight: "600" }}>Resguardo Legal e IA</Link>. La aceptación se formaliza de manera activa e inequívoca mediante la marcación de la casilla de verificación correspondiente en el formulario de registro, registrándose la fecha, hora y versión de los términos aceptados.
              </p>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                2. Naturaleza del Servicio y Rol de Intermediación Tecnológica
              </h2>
              <p>
                AgendaLink es una plataforma de software como servicio (SaaS) que provee herramientas tecnológicas de agendamiento online, gestión de horarios, recordatorios por WhatsApp en 1 clic que el negocio envía desde su panel mediante enlaces directos (wa.me), pasarela de cobro directo con Mercado Pago y módulos de asistencia inteligente.
              </p>
              <div style={{ background: "#f1f5f9", padding: "16px 20px", borderRadius: "12px", margin: "14px 0", borderLeft: "4px solid var(--blue)" }}>
                <strong>Deslinde Fundamental:</strong> AgendaLink y {LEGAL.razonSocial} <u>NO</u> son prestadores de los servicios finales ofrecidos por los negocios (como peluquería, salud, estética, consultoría, etc.) ni forman parte de la relación sustantiva o comercial celebrada entre el Negocio y sus clientes finales. Toda reserva, prestación de servicios, cobro o cancelación es de exclusiva responsabilidad entre el Negocio y su clientela.
              </div>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                3. Roles en el Tratamiento de Datos Personales (Ley Nº 21.719 y Ley Nº 19.628)
              </h2>
              <p>
                En cumplimiento de la legislación chilena sobre protección de datos personales:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>El Negocio es el Responsable del Tratamiento (Data Controller):</strong> Determina los fines y medios del tratamiento de los datos de sus clientes y colaboradores, asegurando contar con la debida base de licitud o consentimiento.</li>
                <li><strong>AgendaLink es el Encargado del Tratamiento (Data Processor):</strong> {LEGAL.razonSocial} trata los datos personales de los clientes del Negocio única y exclusivamente por cuenta e instrucción de este último, con el solo objeto de prestar las funcionalidades de agendamiento y gestión técnica de la plataforma.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                4. Suscripciones, Precios, Facturación, Renovación y Cancelación (Ley Nº 21.398)
              </h2>
              <p>
                El acceso a la Plataforma se estructura bajo las siguientes condiciones comerciales y de servicio:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                <div>
                  <strong>a) Planes y Precios:</strong> Los valores vigentes son:
                  <ul style={{ paddingLeft: "20px", marginTop: "4px" }}>
                    <li><strong>Plan Individual:</strong> $10.000 + IVA al mes (o $100.000 + IVA al año, ahorrando 2 meses). Incluye Linki Secretary.</li>
                    <li><strong>Plan Básico:</strong> $29.000 + IVA al mes (o $290.000 + IVA al año, ahorrando 2 meses). Incluye Linki Secretary y Marketing.</li>
                    <li><strong>Plan Premium:</strong> $49.000 + IVA al mes (o $490.000 + IVA al año, ahorrando 2 meses). Incluye suite completa de Linki IA.</li>
                  </ul>
                  Todos los precios se expresan en Pesos Chilenos (CLP) más el 19% de IVA (Impuesto al Valor Agregado), el cual se detallará en la respectiva boleta o factura electrónica.
                </div>
                <div>
                  <strong>b) Prueba Gratuita de 14 Días y Estado al Día 15:</strong> Todo nuevo negocio dispone de 14 días corridos de prueba gratuita sin requerir tarjeta de crédito para registrarse. Al llegar el <strong>día 15</strong>, si el Negocio no ha suscrito un plan de pago, el acceso administrativo y la posibilidad de que los clientes agenden citas quedarán temporalmente en pausa hasta que se seleccione y abone un plan.
                </div>
                <div>
                  <strong>c) Modalidad de Cobro y Renovación Automática:</strong> El servicio se cobra por adelantado de manera recurrente (mensual o anual). La suscripción se renueva automáticamente por períodos iguales a menos que el Negocio cancele el servicio con anterioridad a la fecha de facturación.
                </div>
                <div>
                  <strong>d) Reembolso del Plan Anual:</strong> En caso de contratar un plan anual, el Negocio podrá solicitar la devolución proporcional de los meses no transcurridos si formula su solicitud dentro de los primeros <strong>10 días corridos</strong> contados desde el cobro. Transcurrido dicho plazo, el plan se mantendrá habilitado hasta el fin del período anual sin reembolso de mensualidades ya transcurridas.
                </div>
                <div>
                  <strong>e) Suspensión por Falta de Pago:</strong> En caso de rechazo del cargo recurrente, se otorgará un período de gracia de <strong>5 días corridos</strong> con avisos vía correo electrónico. Si la deuda no es regularizada en dicho lapso, el servicio se suspenderá temporalmente. Tras 30 días corridos de mora continuada, la cuenta podrá ser dada de baja definitivamente.
                </div>
                <div>
                  <strong>f) Cancelación Simple y sin Barreras (Ley Nº 21.398 Pro-Consumidor):</strong> Conforme a las normas de simetría contractual, el Negocio puede poner término a su suscripción en cualquier momento, de forma tan simple como fue su contratación: directamente con <strong>1 clic desde su panel de control</strong> o mediante un correo electrónico a <a href={`mailto:${LEGAL.email}`} style={{ color: "var(--blue)", fontWeight: "600" }}>{LEGAL.email}</a>, sin multas, penalizaciones ni exigencia de permanencia mínima.
                </div>
                <div>
                  <strong>g) Destino y Exportación de Datos al Cancelar:</strong> Tras la cancelación, el Negocio dispone de un plazo de <strong>30 días corridos</strong> para solicitar la exportación de su historial de reservas y cartera de clientes en formatos estándar (CSV/Excel). Expirado este plazo, los datos personales y operativos serán eliminados permanentemente de los servidores activos, resguardándose únicamente aquellos respaldos estrictamente indispensables para cumplir con obligaciones tributarias o legales chilenas.
                </div>
                <div>
                  <strong>h) Modificación de Términos y Precios:</strong> Cualquier ajuste sustancial a estos Términos o a los precios será comunicado por escrito o mediante aviso visible en la Plataforma con al menos <strong>15 días corridos de anticipación</strong>. Si el Negocio no está de acuerdo con los cambios informados, podrá cancelar su suscripción sin cargo alguno antes de la entrada en vigencia de las nuevas tarifas o condiciones.
                </div>
                <div>
                  <strong>i) Derecho de Retracto (Art. 3º bis Ley Nº 19.496):</strong> Atendido que el servicio corresponde a una plataforma digital SaaS de acceso y ejecución inmediata, y que todo Negocio cuenta con un período de prueba gratuito de 14 días (sin ingreso de tarjeta bancaria) para verificar de forma previa y completa su funcionalidad, las partes acuerdan expresamente la exclusión del derecho de retracto unilateral respecto de mensualidades ya devengadas o en curso, manteniéndose plenamente vigente el derecho a cancelación con 1 clic para evitar renovaciones futuras y la garantía de reembolso proporcional de 10 días para contrataciones anuales estipulada en la letra d).
                </div>
                <div>
                  <strong>j) Asistentes Linki IA incluidos:</strong> Los módulos de inteligencia artificial (Linki Secretary, Marketing y Business IA) vienen incluidos en tu suscripción según el plan contratado, sin costos ocultos ni recargos adicionales.
                </div>
              </div>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                5. Descargo y Deslinde por Módulos de Inteligencia Artificial (Linki IA)
              </h2>
              <p>
                La Plataforma integra herramientas de apoyo basadas en inteligencia artificial generativa:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Carácter Referencial:</strong> Las sugerencias y textos emitidos por los agentes de IA son herramientas de asistencia estadística y no constituyen asesoría legal, médica, tributaria ni financiera vinculante.</li>
                <li><strong>Supervisión Humana Obligatoria:</strong> El Negocio es el único responsable de revisar, aprobar y emitir cualquier mensaje generado antes de enviarlo a sus clientes finales.</li>
                <li><strong>Responsabilidad Acotada:</strong> La responsabilidad de {LEGAL.razonSocial} frente a eventuales inexactitudes de los módulos de inteligencia artificial queda regida íntegramente por la cláusula de limitación de responsabilidad de la sección 9.</li>
                <li><strong>Disponibilidad Nativa:</strong> Los módulos Linki IA están integrados de forma nativa en la plataforma y disponibles según el nivel de plan contratado.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                6. Citas, Reservas, Inasistencias y Cancelaciones
              </h2>
              <p>
                AgendaLink provee la infraestructura de software para la coordinación de horarios y la generación de enlaces de recordatorios que el negocio envía directamente desde su panel a sus clientes. El Negocio reconoce y acepta que:
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>AgendaLink no asegura ni garantiza la asistencia presencial efectiva de los clientes a sus citas.</li>
                <li>Las políticas sobre abonos, reembolsos y plazos de anulación o reprogramación son fijadas libremente por cada Negocio y deben ser informadas a sus clientes finales antes del pago.</li>
                <li><strong>Reembolsos y Devoluciones de Clientes Finales:</strong> Toda solicitud de devolución, cancelación o compensación económica debe ser resuelta y ejecutada directamente por el Negocio a través de su propia cuenta de Mercado Pago o presencialmente. AgendaLink no intermedia los fondos de los servicios prestados por los Negocios ni retiene recaudaciones de clientes finales, por lo que no efectúa reembolsos directos a clientes finales.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                7. Procesamiento de Pagos y Flujo de Dinero
              </h2>
              <p>
                AgendaLink ofrece integración con Mercado Pago (Redcompra, tarjetas de débito y crédito) o pago directo en el local.
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><strong>Cobro Directo del Negocio:</strong> Cada Negocio conecta su propia cuenta de Mercado Pago o percibe directamente los pagos presenciales en su establecimiento. Los pagos efectuados por los clientes finales por servicios reservados se acreditan de manera directa e íntegra en la cuenta del Negocio.</li>
                <li><strong>No Recaudación de Terceros:</strong> AgendaLink no intermedia los fondos de los servicios prestados por los Negocios, no administra cuentas de depósito de terceros por concepto de reservas ni retiene las recaudaciones comerciales de los clientes finales. AgendaLink únicamente percibe los cobros por suscripción al software SaaS.</li>
                <li><strong>Seguridad de Datos de Pago:</strong> AgendaLink nunca almacena números de tarjetas de crédito o débito ni claves bancarias, delegando el cifrado en procesadores certificados PCI-DSS.</li>
              </ul>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                8. Veracidad de Testimonios y Reseñas de Clientes
              </h2>
              <p>
                Cuando el Negocio incluya opiniones, valoraciones o testimonios de clientes en su página pública de reservas en AgendaLink, declara y garantiza que corresponden a experiencias y citas reales celebradas en su negocio. Queda estrictamente prohibida la incorporación de reseñas ficticias, inventadas o manipuladas. El Negocio asume la plena y exclusiva responsabilidad ante cualquier requerimiento bajo la Ley Nº 19.496 sobre información engañosa al consumidor.
              </p>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                9. Régimen y Limitación de Responsabilidad (Art. 1558 del Código Civil)
              </h2>
              <p>
                AgendaLink provee una plataforma tecnológica en modalidad SaaS. Salvo en los casos de dolo o culpa grave legalmente calificados, y sin perjuicio de los derechos irrenunciables de la Ley Nº 19.496 y de la Ley Nº 20.416, las partes acuerdan el siguiente régimen de responsabilidad:
              </p>
              <div style={{ background: "#f8fafc", color: "#0f172a", padding: "18px 22px", borderRadius: "14px", margin: "14px 0", border: "1px solid #cbd5e1", borderLeft: "5px solid var(--blue)", fontSize: "14.5px", fontWeight: "500" }}>
                <strong>La responsabilidad total acumulada de {LEGAL.razonSocial} frente al Negocio por cualquier daño directo derivado del uso o indisponibilidad de la Plataforma se limitará exclusivamente al monto total efectivamente pagado por el Negocio por concepto de suscripción durante los doce (12) meses anteriores al hecho generador del reclamo.</strong>
              </div>
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                En ningún caso {LEGAL.razonSocial} será responsable por lucro cesante, pérdida de ingresos o clientela, daño moral ni perjuicios indirectos o imprevistos derivados de la relación contractual, sin perjuicio de los derechos irrenunciables de la Ley Nº 19.496 y de la Ley Nº 20.416.
              </p>
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                10. Propiedad Intelectual y Jurisdicción
              </h2>
              <p>
                Todo el software, marcas, algoritmos, logotipos e interfaces de AgendaLink son propiedad exclusiva de <strong>{LEGAL.razonSocial}</strong>. Estos Términos y Condiciones se rigen e interpretan conforme a las leyes de la <strong>República de Chile</strong>. Para todos los efectos legales, las partes fijan su domicilio en la comuna de <strong>{LEGAL.tribunales}</strong> y se someten a la competencia de sus tribunales ordinarios de justicia, sin perjuicio de los derechos irrenunciables que asistan a los consumidores ante los juzgados de policía local correspondientes a su domicilio conforme a la Ley Nº 19.496.
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
