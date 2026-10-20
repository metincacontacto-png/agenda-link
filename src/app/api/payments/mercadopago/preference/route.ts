import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createBooking } from "@/features/booking/create-booking";
import { parseCreateBookingInput } from "@/features/booking/validation";
import { prismaBookingRepository } from "@/lib/prisma-booking-repository";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = parseCreateBookingInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (parsed.value.slug === "valentina") {
      return NextResponse.json(
        { error: "Los pagos online están deshabilitados en el negocio de demostración." },
        { status: 400 }
      );
    }

    // Verificar si el negocio tiene configurado su propio token de Mercado Pago
    const businessAccount = await prisma.business.findUnique({
      where: { slug: parsed.value.slug },
      select: { id: true, mercadoPagoAccessToken: true },
    });

    if (!businessAccount) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const accessToken = businessAccount.mercadoPagoAccessToken;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Este negocio no tiene activados los pagos online con Mercado Pago. Por favor elige pagar en el local." },
        { status: 400 }
      );
    }

    // 1. Usar el servicio oficial de agendamiento (valida disponibilidad atómica y zona horaria)
    const bookingResult = await createBooking(parsed.value, { repository: prismaBookingRepository });
    if (!bookingResult.ok) {
      return NextResponse.json({ error: bookingResult.error }, { status: bookingResult.status });
    }

    const { appointment } = bookingResult;
    const { business, service, professional } = appointment;

    // 3. URLs de retorno para el cliente
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://agendalink.cl";

    const slug = business.slug;
    const clientName = parsed.value.clientName;
    const clientWhatsApp = parsed.value.clientWhatsApp;
    const clientEmail = parsed.value.clientEmail;

    const successUrl = `${origin}/${slug}/success?appId=${appointment.id}&payment_status=approved`;
    const failureUrl = `${origin}/${slug}?payment_status=failure&appId=${appointment.id}`;
    const pendingUrl = `${origin}/${slug}/success?appId=${appointment.id}&payment_status=pending`;
    const notificationUrl = `${origin}/api/webhooks/mercadopago?bizId=${encodeURIComponent(business.id)}`;

    // 4. Crear la preferencia en la API de Mercado Pago
    const mpPayload = {
      items: [
        {
          id: parsed.value.serviceId,
          title: `${service.name} — ${business.name}`,
          description: `Atención con ${professional.name}`,
          quantity: 1,
          currency_id: business.currency || "CLP",
          unit_price: Math.round(service.price),
        },
      ],
      payer: {
        name: clientName,
        email: clientEmail && clientEmail.includes("@") ? clientEmail : "cliente@agendalink.cl",
        phone: {
          number: clientWhatsApp.replace(/\D/g, ""),
        },
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: "approved",
      external_reference: appointment.id,
      statement_descriptor: "AGENDALINK",
      notification_url: notificationUrl,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mpPayload),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Error al crear preferencia en Mercado Pago:", errorText);
      return NextResponse.json(
        { error: "Error al comunicarse con Mercado Pago", details: errorText },
        { status: 502 }
      );
    }

    const mpData = await mpResponse.json();

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      initPoint: mpData.init_point,
      sandboxInitPoint: mpData.sandbox_init_point,
    });
  } catch (error: unknown) {
    console.error("Error interno en preferencia Mercado Pago:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el pago", details: (error as Error)?.message || String(error) },
      { status: 500 }
    );
  }
}
