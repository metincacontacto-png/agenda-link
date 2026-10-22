import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/db";
import { requireBusinessMembership, requireSession } from "@/server/authorize";
import { SUBSCRIPTION_PLANS, type PlanConfig } from "@/features/businesses/subscription-policy";

function getCloudflareSecrets() {
  try {
    const { env } = getCloudflareContext();
    const cfEnv = env as Record<string, string | undefined>;
    return {
      accessToken: cfEnv.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN,
      planIdIndividual: cfEnv.MERCADOPAGO_PLAN_ID_INDIVIDUAL || process.env.MERCADOPAGO_PLAN_ID_INDIVIDUAL,
      planIdEquipo: cfEnv.MERCADOPAGO_PLAN_ID_EQUIPO || process.env.MERCADOPAGO_PLAN_ID_EQUIPO,
      planIdNegocio: cfEnv.MERCADOPAGO_PLAN_ID_NEGOCIO || process.env.MERCADOPAGO_PLAN_ID_NEGOCIO,
    };
  } catch {
    return {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      planIdIndividual: process.env.MERCADOPAGO_PLAN_ID_INDIVIDUAL,
      planIdEquipo: process.env.MERCADOPAGO_PLAN_ID_EQUIPO,
      planIdNegocio: process.env.MERCADOPAGO_PLAN_ID_NEGOCIO,
    };
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    if (!session.ok) return session.response;

    const body: unknown = await request.json().catch(() => ({}));
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }

    const { slug, plan } = body as { slug?: string; plan?: string };
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Falta el identificador del negocio" }, { status: 400 });
    }

    const planKey = plan as keyof typeof SUBSCRIPTION_PLANS;
    const planConfig: PlanConfig | undefined = SUBSCRIPTION_PLANS[planKey];
    if (!planConfig) {
      return NextResponse.json({ error: "Plan de suscripción no válido" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { slug: slug.trim() },
      select: { id: true, name: true, slug: true, email: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    const secrets = getCloudflareSecrets();
    if (!secrets.accessToken) {
      return NextResponse.json(
        { error: "Mercado Pago no está configurado (falta MERCADOPAGO_ACCESS_TOKEN)" },
        { status: 500 }
      );
    }

    let preapprovalPlanId: string | undefined;
    if (planKey === "INDIVIDUAL") preapprovalPlanId = secrets.planIdIndividual;
    else if (planKey === "EQUIPO") preapprovalPlanId = secrets.planIdEquipo;
    else if (planKey === "NEGOCIO") preapprovalPlanId = secrets.planIdNegocio;

    if (!preapprovalPlanId) {
      return NextResponse.json(
        { error: `El ID de plan en Mercado Pago no está configurado (${planConfig.envPlanKey})` },
        { status: 500 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://agendalink.cl";

    const payerEmail = session.user.email || business.email;

    const fallbackHostedUrl = `https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=${preapprovalPlanId}`;
    let initPoint = fallbackHostedUrl;
    let subscriptionId: string | undefined;

    try {
      const mpPayload = {
        payer_email: payerEmail,
        back_url: `${origin}/admin/${business.slug}?subscription=success`,
        reason: `Agenda Link - Plan ${planConfig.name}`,
        external_reference: business.id,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: planConfig.price,
          currency_id: "CLP",
        },
      };

      const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secrets.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mpPayload),
      });

      if (mpRes.ok) {
        const mpData = (await mpRes.json()) as { id?: string; init_point?: string };
        if (mpData.init_point) {
          initPoint = mpData.init_point;
          subscriptionId = mpData.id;
        }
      } else {
        const errText = await mpRes.text();
        console.warn("[MercadoPago Subscription Checkout] Dynamic preapproval failed, falling back to hosted plan URL:", errText);
      }
    } catch (err) {
      console.warn("[MercadoPago Subscription Checkout] Error calling preapproval API, falling back to hosted plan URL:", err);
    }

    // Save selected target plan on business
    await prisma.business.update({
      where: { id: business.id },
      data: {
        subscriptionPlan: planKey,
      },
    });

    return NextResponse.json({
      success: true,
      initPoint,
      subscriptionId,
    });
  } catch (error) {
    console.error("[Subscription Checkout Error]", error);
    return NextResponse.json({ error: "Error en el servidor al procesar la suscripción" }, { status: 500 });
  }
}
