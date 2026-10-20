import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/db";

function getMercadoPagoAccessToken(): string | undefined {
  try {
    const { env } = getCloudflareContext();
    const workerSecret = (env as { MERCADOPAGO_ACCESS_TOKEN?: string }).MERCADOPAGO_ACCESS_TOKEN;
    return workerSecret || process.env.MERCADOPAGO_ACCESS_TOKEN;
  } catch {
    return process.env.MERCADOPAGO_ACCESS_TOKEN;
  }
}

export async function POST(request: Request) {
  try {
    const accessToken = getMercadoPagoAccessToken();
    if (!accessToken) {
      console.warn("Webhook Mercado Pago recibido pero MERCADOPAGO_ACCESS_TOKEN no está definido.");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // El payment ID puede venir en el body (data.id o id) o en la query string
    const paymentId =
      body?.data?.id ||
      body?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id");

    const topic = body?.type || body?.topic || url.searchParams.get("topic") || url.searchParams.get("type");

    if (!paymentId || (topic && topic !== "payment")) {
      // Ignoramos notificaciones que no sean de pagos (ej: merchant_order) respondiendo 200 para que MP no reintente
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    // Consultamos el estado real del pago a la API oficial de Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!mpRes.ok) {
      console.error(`Error al consultar pago ${paymentId} en Mercado Pago:`, await mpRes.text());
      return NextResponse.json({ error: "No se pudo verificar el pago" }, { status: 200 });
    }

    const paymentData = await mpRes.json();
    const { status, external_reference, transaction_amount, payment_method_id } = paymentData;

    // external_reference contiene el appointment.id que asignamos al crear la preferencia
    if (!external_reference) {
      return NextResponse.json({ received: true, no_reference: true }, { status: 200 });
    }

    if (status === "approved") {
      await prisma.appointment.update({
        where: { id: external_reference },
        data: {
          paymentStatus: "PAID",
          paymentMethod: `Mercado Pago (${payment_method_id || "Online"})`,
          paymentAmount: transaction_amount,
          status: "CONFIRMED",
        },
      });

      console.log(`[Mercado Pago Webhook] Cita ${external_reference} marcada como PAGADA con éxito.`);
    } else if (status === "rejected" || status === "cancelled") {
      await prisma.appointment.update({
        where: { id: external_reference },
        data: {
          paymentStatus: "REJECTED",
        },
      });
    }

    return NextResponse.json({ success: true, status }, { status: 200 });
  } catch (error) {
    console.error("Error en webhook de Mercado Pago:", error);
    // Respondemos 200 para evitar bloqueos de reintentos infinitos
    return NextResponse.json({ received: true, error: "internal_error" }, { status: 200 });
  }
}

// Mercado Pago también puede enviar validación GET al registrar el webhook
export async function GET() {
  return NextResponse.json({ status: "ok", service: "AgendaLink Mercado Pago Webhook" });
}
