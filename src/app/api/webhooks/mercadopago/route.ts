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
    const platformAccessToken = getMercadoPagoAccessToken();

    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // El payment o subscription ID puede venir en el body (data.id o id) o en la query string
    const resourceId =
      body?.data?.id ||
      body?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id");

    const topic = (body?.type || body?.topic || url.searchParams.get("topic") || url.searchParams.get("type") || "")
      .toString()
      .toLowerCase();

    if (!resourceId) {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    // 1. Manejo de Suscripciones (Preapproval)
    if (topic === "preapproval" || topic === "subscription_preapproval") {
      if (!platformAccessToken) {
        console.warn("Webhook de suscripción recibido pero MERCADOPAGO_ACCESS_TOKEN no está definido.");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: { Authorization: `Bearer ${platformAccessToken}` },
      });

      if (!mpRes.ok) {
        console.error(`Error al consultar preapproval ${resourceId}:`, await mpRes.text());
        return NextResponse.json({ received: true, error: "fetch_preapproval_failed" }, { status: 200 });
      }

      const subData = (await mpRes.json()) as {
        id?: string;
        status?: string;
        external_reference?: string;
        next_payment_date?: string;
      };

      const businessId = subData.external_reference;
      if (!businessId) {
        return NextResponse.json({ received: true, no_reference: true }, { status: 200 });
      }

      const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
      if (!business) {
        return NextResponse.json({ received: true, business_not_found: true }, { status: 200 });
      }

      if (subData.status === "authorized") {
        const nextPayment = subData.next_payment_date
          ? new Date(subData.next_payment_date)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await prisma.business.update({
          where: { id: businessId },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionId: subData.id || resourceId,
            currentPeriodEnd: nextPayment,
          },
        });
        console.log(`[Mercado Pago Webhook] Negocio ${businessId} suscripción marcada como ACTIVE.`);
      } else if (subData.status === "cancelled") {
        await prisma.business.update({
          where: { id: businessId },
          data: {
            subscriptionStatus: "CANCELLED",
          },
        });
      } else if (subData.status === "paused") {
        await prisma.business.update({
          where: { id: businessId },
          data: {
            subscriptionStatus: "PAST_DUE",
          },
        });
      }

      return NextResponse.json({ success: true, type: "subscription", status: subData.status }, { status: 200 });
    }

    // 2. Manejo de Pagos Recurrentes de Suscripción (Subscription Authorized Payment)
    if (topic === "subscription_authorized_payment") {
      if (!platformAccessToken) {
        console.warn("Webhook de pago de suscripción recibido pero MERCADOPAGO_ACCESS_TOKEN no está definido.");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const mpRes = await fetch(`https://api.mercadopago.com/authorized_payments/${resourceId}`, {
        headers: { Authorization: `Bearer ${platformAccessToken}` },
      });

      if (!mpRes.ok) {
        console.error(`Error al consultar authorized_payment ${resourceId}:`, await mpRes.text());
        return NextResponse.json({ received: true, error: "fetch_authorized_payment_failed" }, { status: 200 });
      }

      const paymentData = (await mpRes.json()) as {
        status?: string;
        external_reference?: string;
      };

      const businessId = paymentData.external_reference;
      if (businessId) {
        if (paymentData.status === "approved") {
          await prisma.business.update({
            where: { id: businessId },
            data: {
              subscriptionStatus: "ACTIVE",
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        } else if (paymentData.status === "rejected") {
          await prisma.business.update({
            where: { id: businessId },
            data: {
              subscriptionStatus: "PAST_DUE",
            },
          });
        }
      }

      return NextResponse.json({ success: true, type: "authorized_payment", status: paymentData.status }, { status: 200 });
    }

    // 3. Manejo de Pagos de Citas (One-off Appointment Payments con cobro directo al negocio)
    if (topic === "payment" || !topic) {
      const bizId = url.searchParams.get("bizId");
      let paymentAccessToken = platformAccessToken;

      if (bizId) {
        const business = await prisma.business.findUnique({
          where: { id: bizId },
          select: { mercadoPagoAccessToken: true },
        });
        if (business?.mercadoPagoAccessToken) {
          paymentAccessToken = business.mercadoPagoAccessToken;
        }
      }

      if (!paymentAccessToken) {
        console.warn(`Webhook de pago ${resourceId} recibido pero no hay Access Token disponible.`);
        return NextResponse.json({ received: true, ignored: true }, { status: 200 });
      }

      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: {
          Authorization: `Bearer ${paymentAccessToken}`,
        },
      });

      if (!mpRes.ok) {
        console.error(`Error al consultar pago ${resourceId} en Mercado Pago:`, await mpRes.text());
        return NextResponse.json({ error: "No se pudo verificar el pago" }, { status: 200 });
      }

      const paymentData = await mpRes.json();
      const { status, external_reference, transaction_amount, payment_method_id } = paymentData;

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
    }

    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  } catch (error) {
    console.error("Error en webhook de Mercado Pago:", error);
    return NextResponse.json({ received: true, error: "internal_error" }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "AgendaLink Mercado Pago Webhook" });
}
