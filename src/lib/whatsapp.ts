/**
 * Utilidades para generación de enlaces y recordatorios de WhatsApp
 */

export function formatChileanWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Si tiene 9 dígitos y empieza con 9 (ej. 987654321) -> añadir código de país 56
  if (digits.length === 9 && digits.startsWith("9")) {
    return `56${digits}`;
  }
  // Si ya tiene código de país 569 y 11 dígitos
  if (digits.length === 11 && digits.startsWith("569")) {
    return digits;
  }
  // Si empieza con 56 y tiene al menos 10 dígitos
  if (digits.startsWith("56") && digits.length >= 10) {
    return digits;
  }
  return digits;
}

export interface WhatsAppReminderParams {
  clientName: string;
  clientWhatsApp: string;
  serviceName: string;
  professionalName: string;
  dateTime: string | Date;
  businessName?: string;
  timezone?: string;
  price?: number;
  currency?: string;
}

export function buildWhatsAppReminderUrl({
  clientName,
  clientWhatsApp,
  serviceName,
  professionalName,
  dateTime,
  businessName,
  timezone = "America/Santiago",
  price,
  currency = "CLP",
}: WhatsAppReminderParams): string {
  const phone = formatChileanWhatsApp(clientWhatsApp);
  const dateObj = new Date(dateTime);

  const formattedDate = dateObj.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  });

  const formattedTime = dateObj.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });

  const business = businessName ? ` de *${businessName}*` : "";

  const lines = [
    `¡Hola ${clientName}! 👋`,
    "",
    `Te escribimos${business} para recordarte tu próxima cita:`,
    "",
    `📅 *Fecha:* ${formattedDate}`,
    `⏰ *Hora:* ${formattedTime} hrs`,
    `✂️ *Servicio:* ${serviceName}`,
    `👤 *Profesional:* ${professionalName}`,
  ];

  if (price && price > 0) {
    const formattedPrice =
      currency.toUpperCase() === "CLP"
        ? `$${Math.round(price).toLocaleString("es-CL")}`
        : `$${price} ${currency}`;
    lines.push(`💰 *Total:* ${formattedPrice}`);
  }

  lines.push("");
  lines.push("Por favor confírmanos si podrás asistir respondiendo a este mensaje. ¡Te esperamos! ✨");

  const message = lines.join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildDirectWhatsAppUrl(phone: string, text: string): string {
  const normalizedPhone = formatChileanWhatsApp(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}
