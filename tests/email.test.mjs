import test from "node:test";
import assert from "node:assert/strict";
import {
  renderClientBookingHtml,
  renderBusinessNotificationHtml,
  sendEmail,
} from "../src/server/email.ts";

const mockBookingData = {
  appointmentId: "appt-1234",
  clientName: "María González",
  clientWhatsApp: "+56 9 8765 4321",
  clientEmail: "maria.gonzalez@ejemplo.com",
  date: "2026-10-25",
  time: "15:30",
  service: {
    name: "Corte de Cabello",
    duration: 45,
    price: 18000,
  },
  professional: {
    name: "Carlos Barbero",
  },
  business: {
    id: "biz-1",
    slug: "barberia-elite",
    name: "Barbería Elite",
    currency: "CLP",
    timezone: "America/Santiago",
    email: "contacto@barberiaelite.cl",
  },
};

test("renderClientBookingHtml includes all appointment details and styling", () => {
  const html = renderClientBookingHtml(mockBookingData);

  assert.match(html, /María González/);
  assert.match(html, /Barbería Elite/);
  assert.match(html, /Corte de Cabello/);
  assert.match(html, /45 min/);
  assert.match(html, /Carlos Barbero/);
  assert.match(html, /2026-10-25/);
  assert.match(html, /15:30/);
  assert.match(html, /\$18\.000/);
  assert.match(html, /Confirmación de Reserva/);
});

test("renderBusinessNotificationHtml includes client contact and booking details", () => {
  const html = renderBusinessNotificationHtml(mockBookingData);

  assert.match(html, /María González/);
  assert.match(html, /\+56 9 8765 4321/);
  assert.match(html, /maria\.gonzalez@ejemplo\.com/);
  assert.match(html, /Corte de Cabello/);
  assert.match(html, /Carlos Barbero/);
  assert.match(html, /barberia-elite/);
  assert.match(html, /wa\.me\/56987654321/);
});

test("sendEmail returns simulated: true without failing when no apiKey is active", async () => {
  const originalKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  try {
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test email",
      html: "<p>Hello</p>",
    });

    assert.equal(result.ok, true);
    assert.equal(result.simulated, true);
  } finally {
    if (originalKey) {
      process.env.RESEND_API_KEY = originalKey;
    }
  }
});
