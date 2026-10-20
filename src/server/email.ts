import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface SendEmailPayload {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  simulated?: boolean;
}

export function getResendApiKey(): string | undefined {
  try {
    const { env } = getCloudflareContext();
    const workerSecret = (env as { RESEND_API_KEY?: string }).RESEND_API_KEY;
    return workerSecret || process.env.RESEND_API_KEY;
  } catch {
    return process.env.RESEND_API_KEY;
  }
}

export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const apiKey = getResendApiKey();
  const from = payload.from || "AgendaLink <notificaciones@agendalink.cl>";

  if (!apiKey) {
    console.info("[email:simulated] No RESEND_API_KEY configured. Email payload:", {
      to: payload.to,
      from,
      subject: payload.subject,
    });
    return { ok: true, simulated: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: payload.replyTo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[email:error] Resend API error:", response.status, errorText);
      return { ok: false, error: errorText };
    }

    const data = (await response.json()) as { id: string };
    return { ok: true, id: data.id };
  } catch (error) {
    console.error("[email:exception] Failed to send email via Resend:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export interface BookingEmailData {
  appointmentId: string;
  clientName: string;
  clientWhatsApp: string;
  clientEmail: string;
  date: string;
  time: string;
  service: {
    name: string;
    duration: number;
    price: number;
  };
  professional: {
    name: string;
  };
  business: {
    id: string;
    slug: string;
    name: string;
    currency: string;
    timezone: string;
    email?: string;
  };
}

function formatPrice(amount: number, currency: string): string {
  if (currency.toUpperCase() === "CLP") {
    return `$${Math.round(amount).toLocaleString("es-CL")}`;
  }
  return `$${amount.toFixed(2)} ${currency}`;
}

export function renderClientBookingHtml(data: BookingEmailData): string {
  const formattedPrice = formatPrice(data.service.price, data.business.currency);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Reserva</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 24px; }
    .card { background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin-bottom: 24px; }
    .card-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .label { color: #94a3b8; font-weight: 500; }
    .value { color: #f8fafc; font-weight: 600; text-align: right; }
    .highlight { color: #38bdf8; font-weight: 700; }
    .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }
    .footer a { color: #38bdf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Tu reserva está confirmada!</h1>
      <p>Gracias por confiar en <strong>${data.business.name}</strong></p>
    </div>
    <div class="content">
      <p style="margin-top: 0; font-size: 15px; color: #cbd5e1;">Hola <strong>${data.clientName}</strong>, aquí tienes el resumen de tu cita:</p>
      
      <div class="card">
        <div class="card-row">
          <span class="label">📅 Fecha</span>
          <span class="value">${data.date}</span>
        </div>
        <div class="card-row">
          <span class="label">⏰ Hora</span>
          <span class="value highlight">${data.time}</span>
        </div>
        <div class="card-row">
          <span class="label">✂️ Servicio</span>
          <span class="value">${data.service.name} (${data.service.duration} min)</span>
        </div>
        <div class="card-row">
          <span class="label">👤 Profesional</span>
          <span class="value">${data.professional.name}</span>
        </div>
        <div class="card-row">
          <span class="label">🏢 Local / Negocio</span>
          <span class="value">${data.business.name}</span>
        </div>
        <div class="card-row">
          <span class="label">💰 Total</span>
          <span class="value highlight">${formattedPrice}</span>
        </div>
      </div>

      <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 0;">
        Si necesitas reprogramar o cancelar tu cita, por favor ponte en contacto directo con ${data.business.name}.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Reserva gestionada a través de <strong>AgendaLink</strong></p>
      <p style="margin: 0;"><a href="https://agendalink.cl">agendalink.cl</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function renderBusinessNotificationHtml(data: BookingEmailData): string {
  const formattedPrice = formatPrice(data.service.price, data.business.currency);
  const cleanPhone = data.clientWhatsApp.replace(/[^0-9+]/g, "");
  const waUrl = `https://wa.me/${cleanPhone.replace("+", "")}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reserva Recibida</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669, #047857); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 24px; }
    .card { background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin-bottom: 24px; }
    .card-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .label { color: #94a3b8; font-weight: 500; }
    .value { color: #f8fafc; font-weight: 600; text-align: right; }
    .highlight { color: #34d399; font-weight: 700; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; }
    .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }
    .footer a { color: #38bdf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Nueva Cita Registrada!</h1>
      <p>${data.business.name}</p>
    </div>
    <div class="content">
      <p style="margin-top: 0; font-size: 15px; color: #cbd5e1;">Un cliente acaba de agendar una nueva cita:</p>
      
      <div class="card">
        <div class="card-row">
          <span class="label">👤 Cliente</span>
          <span class="value">${data.clientName}</span>
        </div>
        <div class="card-row">
          <span class="label">📱 WhatsApp</span>
          <span class="value"><a href="${waUrl}" style="color: #34d399; text-decoration: none;">${data.clientWhatsApp}</a></span>
        </div>
        <div class="card-row">
          <span class="label">✉️ Email Cliente</span>
          <span class="value">${data.clientEmail || "No especificado"}</span>
        </div>
        <div class="card-row">
          <span class="label">📅 Fecha</span>
          <span class="value">${data.date}</span>
        </div>
        <div class="card-row">
          <span class="label">⏰ Hora</span>
          <span class="value highlight">${data.time}</span>
        </div>
        <div class="card-row">
          <span class="label">✂️ Servicio</span>
          <span class="value">${data.service.name} (${data.service.duration} min)</span>
        </div>
        <div class="card-row">
          <span class="label">💼 Profesional</span>
          <span class="value">${data.professional.name}</span>
        </div>
        <div class="card-row">
          <span class="label">💵 Valor</span>
          <span class="value highlight">${formattedPrice}</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://agendalink.cl/admin/${data.business.slug}" class="btn">Ver en Panel Administrativo</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Notificación automática de <strong>AgendaLink</strong></p>
      <p style="margin: 0;"><a href="https://agendalink.cl">agendalink.cl</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendBookingNotifications(data: BookingEmailData): Promise<void> {
  const promises: Promise<SendEmailResult>[] = [];

  // 1. Email al cliente (si indicó correo)
  if (data.clientEmail) {
    promises.push(
      sendEmail({
        to: data.clientEmail,
        from: "AgendaLink <notificaciones@agendalink.cl>",
        subject: `Confirmación de cita: ${data.service.name} en ${data.business.name}`,
        html: renderClientBookingHtml(data),
      }),
    );
  }

  // 2. Email al negocio / admin
  const businessDest = data.business.email || "metincacontacto@gmail.com";
  promises.push(
    sendEmail({
      to: businessDest,
      from: "AgendaLink <pagos@agendalink.cl>",
      subject: `Nueva cita: ${data.clientName} - ${data.service.name} (${data.time})`,
      html: renderBusinessNotificationHtml(data),
    }),
  );

  const results = await Promise.allSettled(promises);
  for (const res of results) {
    if (res.status === "rejected") {
      console.error("[email:notification-failure]", res.reason);
    }
  }
}
