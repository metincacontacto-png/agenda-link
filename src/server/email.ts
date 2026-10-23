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

function formatChileanLongDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12));
      const formatted = d.toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
  } catch {
    // fallback to original date string
  }
  return dateStr;
}

export function renderClientBookingHtml(data: BookingEmailData): string {
  const formattedPrice = formatPrice(data.service.price, data.business.currency);
  const formattedDate = formatChileanLongDate(data.date);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Reserva</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;margin:0 auto;background-color:#1e293b;border-radius:18px;border:1px solid #334155;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.45);">
    <!-- Brand Header with Official Logo -->
    <tr>
      <td style="background-color:#0a0f1d;padding:24px 24px 18px 24px;text-align:center;border-bottom:1px solid #1e293b;">
        <a href="https://agendalink.cl" target="_blank" style="text-decoration:none;display:inline-block;">
          <img src="https://agendalink.cl/logo-horizontal-blanco.png" alt="AgendaLink" width="165" height="auto" style="display:block;max-width:180px;height:auto;margin:0 auto;border:0;outline:none;" />
        </a>
      </td>
    </tr>
    <!-- Hero Confirmation Banner -->
    <tr>
      <td style="background:linear-gradient(135deg, #0066FF 0%, #004ecc 100%);padding:34px 28px;text-align:center;color:#ffffff;">
        <div style="display:inline-block;background:rgba(255,255,255,0.2);width:44px;height:44px;line-height:44px;border-radius:50%;margin-bottom:12px;font-size:22px;font-weight:bold;">
          ✓
        </div>
        <h1 style="margin:0 0 8px 0;font-size:23px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">
          ¡Tu reserva está confirmada!
        </h1>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.92);line-height:1.4;">
          Te esperamos en <strong>${data.business.name}</strong>
        </p>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding:30px 28px 24px 28px;">
        <p style="margin:0 0 20px 0;font-size:15px;color:#cbd5e1;line-height:1.5;">
          Hola <strong style="color:#ffffff;">${data.clientName}</strong>, tu cita ha sido reservada exitosamente. Aquí tienes tu comprobante oficial:
        </p>

        <!-- Bulletproof Table for Email Clients -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;border-radius:14px;border:1px solid #334155;overflow:hidden;margin-bottom:24px;">
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;width:38%;">
              📅 Fecha
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#ffffff;font-size:14px;font-weight:700;">
              ${formattedDate}
              <span style="font-size:11px;color:#64748b;display:block;margin-top:2px;font-weight:normal;">(${data.date})</span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;">
              ⏰ Hora
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#38bdf8;font-size:16px;font-weight:800;">
              <span style="background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);padding:3px 10px;border-radius:6px;display:inline-block;">
                ${data.time} hrs
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;">
              ✂️ Servicio
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#ffffff;font-size:14px;font-weight:600;">
              ${data.service.name} <span style="color:#94a3b8;font-weight:normal;">(${data.service.duration} min)</span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;">
              👤 Profesional
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#ffffff;font-size:14px;font-weight:600;">
              ${data.professional.name}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;">
              🏢 Establecimiento
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#ffffff;font-size:14px;font-weight:600;">
              ${data.business.name}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;color:#94a3b8;font-size:13.5px;font-weight:500;">
              💳 Total a Pagar
            </td>
            <td align="right" style="padding:14px 18px;color:#22c55e;font-size:16px;font-weight:800;">
              ${formattedPrice}
            </td>
          </tr>
        </table>

        <!-- Direct Link Button -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;">
          <tr>
            <td align="center">
              <a href="https://agendalink.cl/${data.business.slug}" target="_blank" style="display:inline-block;background-color:#0066FF;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:10px;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(0,102,255,0.35);">
                Ver Información del Negocio
              </a>
            </td>
          </tr>
        </table>

        <div style="background-color:rgba(148,163,184,0.06);border-left:3px solid #38bdf8;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:10px;">
          <p style="margin:0;font-size:12.5px;color:#94a3b8;line-height:1.5;">
            💡 <strong>Aviso:</strong> Si necesitas reprogramar o cancelar tu hora, comunícate directamente con ${data.business.name}.
          </p>
        </div>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color:#0a0f1d;padding:22px 28px;text-align:center;border-top:1px solid #334155;color:#64748b;font-size:12px;line-height:1.6;">
        <p style="margin:0 0 6px 0;color:#94a3b8;font-weight:600;">
          Reserva gestionada por <strong>AgendaLink</strong>
        </p>
        <p style="margin:0;">
          <a href="https://agendalink.cl" style="color:#38bdf8;text-decoration:none;">agendalink.cl</a> · La plataforma de agendamiento para Chile
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderBusinessNotificationHtml(data: BookingEmailData): string {
  const formattedPrice = formatPrice(data.service.price, data.business.currency);
  const formattedDate = formatChileanLongDate(data.date);
  const cleanPhone = data.clientWhatsApp.replace(/[^0-9+]/g, "");
  const waUrl = `https://wa.me/${cleanPhone.replace("+", "")}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reserva Recibida</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;margin:0 auto;background-color:#1e293b;border-radius:18px;border:1px solid #334155;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.45);">
    <!-- Brand Header with Official Logo -->
    <tr>
      <td style="background-color:#0a0f1d;padding:24px 24px 18px 24px;text-align:center;border-bottom:1px solid #1e293b;">
        <a href="https://agendalink.cl" target="_blank" style="text-decoration:none;display:inline-block;">
          <img src="https://agendalink.cl/logo-horizontal-blanco.png" alt="AgendaLink" width="165" height="auto" style="display:block;max-width:180px;height:auto;margin:0 auto;border:0;outline:none;" />
        </a>
      </td>
    </tr>
    <!-- Hero Notification Banner -->
    <tr>
      <td style="background:linear-gradient(135deg, #059669 0%, #047857 100%);padding:34px 28px;text-align:center;color:#ffffff;">
        <div style="display:inline-block;background:rgba(255,255,255,0.2);width:44px;height:44px;line-height:44px;border-radius:50%;margin-bottom:12px;font-size:22px;font-weight:bold;">
          🔔
        </div>
        <h1 style="margin:0 0 8px 0;font-size:23px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">
          ¡Nueva Cita Registrada!
        </h1>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.92);line-height:1.4;">
          ${data.business.name}
        </p>
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding:30px 28px 24px 28px;">
        <p style="margin:0 0 20px 0;font-size:15px;color:#cbd5e1;line-height:1.5;">
          Un cliente acaba de reservar una nueva cita a través de tu enlace:
        </p>

        <!-- Bulletproof Table for Email Clients -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;border-radius:14px;border:1px solid #334155;overflow:hidden;margin-bottom:24px;">
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;width:38%;">
              👤 Cliente
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#ffffff;font-size:14px;font-weight:700;">
              ${data.clientName}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;">
              📱 WhatsApp
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;font-size:14px;font-weight:700;">
              <a href="${waUrl}" target="_blank" style="color:#22c55e;text-decoration:none;">
                ${data.clientWhatsApp}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;">
              ✉️ Email
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#ffffff;font-size:14px;font-weight:600;">
              ${data.clientEmail || "No especificado"}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;">
              📅 Fecha
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#ffffff;font-size:14px;font-weight:700;">
              ${formattedDate}
              <span style="font-size:11px;color:#64748b;display:block;margin-top:2px;font-weight:normal;">(${data.date})</span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;">
              ⏰ Hora
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#34d399;font-size:16px;font-weight:800;">
              <span style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.3);padding:3px 10px;border-radius:6px;display:inline-block;">
                ${data.time} hrs
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;">
              ✂️ Servicio
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#ffffff;font-size:14px;font-weight:600;">
              ${data.service.name} <span style="color:#94a3b8;font-weight:normal;">(${data.service.duration} min)</span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13.5px;font-weight:500;">
              💼 Profesional
            </td>
            <td align="right" style="padding:14px 18px;border-bottom:1px solid #1e293b;color:#ffffff;font-size:14px;font-weight:600;">
              ${data.professional.name}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;color:#94a3b8;font-size:13.5px;font-weight:500;">
              💵 Valor
            </td>
            <td align="right" style="padding:14px 18px;color:#22c55e;font-size:16px;font-weight:800;">
              ${formattedPrice}
            </td>
          </tr>
        </table>

        <!-- Actions -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
          <tr>
            <td align="center" style="padding-bottom:12px;">
              <a href="${waUrl}" target="_blank" style="display:inline-block;background-color:#22c55e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;margin-right:8px;">
                💬 Contactar por WhatsApp
              </a>
              <a href="https://agendalink.cl/admin/${data.business.slug}" target="_blank" style="display:inline-block;background-color:#0066FF;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;">
                Ver en Panel Admin
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color:#0a0f1d;padding:22px 28px;text-align:center;border-top:1px solid #334155;color:#64748b;font-size:12px;line-height:1.6;">
        <p style="margin:0 0 6px 0;color:#94a3b8;font-weight:600;">
          Notificación automática de <strong>AgendaLink</strong>
        </p>
        <p style="margin:0;">
          <a href="https://agendalink.cl" style="color:#38bdf8;text-decoration:none;">agendalink.cl</a> · Portal del Negocio: <a href="https://agendalink.cl/${data.business.slug}" style="color:#38bdf8;text-decoration:none;">agendalink.cl/${data.business.slug}</a>
        </p>
      </td>
    </tr>
  </table>
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
