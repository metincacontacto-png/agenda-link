import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/db";
import { requireBusinessMembership, requireSession, type UserIdentity } from "@/server/authorize";
import { getSessionCookie } from "@/server/auth";
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
    const body: unknown = await request.json().catch(() => ({}));
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }

    const { slug, plan, billingPeriod: rawBillingPeriod } = body as {
      slug?: string;
      plan?: string;
      billingPeriod?: string;
    };
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

    // Check if a session exists. If it exists, verify session and business membership.
    // If no session cookie exists, allow proceeding with the found business.
    const sessionCookie = getSessionCookie(request);
    let sessionUser: UserIdentity | undefined;

    if (sessionCookie) {
      const session = await requireSession(request);
      if (!session.ok) return session.response;

      const auth = await requireBusinessMembership(session.user, business.id);
      if (!auth.ok) return auth.response;

      sessionUser = session.user;
    }

    const secrets = getCloudflareSecrets();
    if (!secrets.accessToken) {
      return NextResponse.json(
        { error: "Mercado Pago no está configurado (falta MERCADOPAGO_ACCESS_TOKEN)" },
        { status: 500 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://agendalink.cl";

    const payerEmail = sessionUser?.email || business.email || "contacto@agendalink.cl";
    const billingPeriod: "monthly" | "yearly" = rawBillingPeriod === "yearly" ? "yearly" : "monthly";

    if (billingPeriod === "yearly") {
      const mpPayload = {
        items: [
          {
            id: `${planConfig.id}_YEARLY`,
            title: `Agenda Link - Plan ${planConfig.name} (1 Año de Servicio)`,
            description: `Suscripción anual con 2 meses gratis incluidos`,
            quantity: 1,
            currency_id: "CLP",
            unit_price: planConfig.annualPrice,
          },
        ],
        payer: {
          email: payerEmail,
        },
        back_urls: {
          success: `${origin}/admin/${business.slug}?subscription=annual_success`,
          failure: `${origin}/admin/${business.slug}?subscription=failure`,
          pending: `${origin}/admin/${business.slug}?subscription=pending`,
        },
        auto_return: "approved",
        external_reference: `annual_${business.id}`,
        notification_url: `${origin}/api/webhooks/mercadopago`,
      };

      const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secrets.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mpPayload),
      });

      if (!mpRes.ok) {
        const errText = await mpRes.text();
        console.warn("[MercadoPago Annual Checkout] Preference creation failed:", errText);
        return NextResponse.json(
          { error: "Error al generar la preferencia de Mercado Pago" },
          { status: 502 }
        );
      }

      const mpData = (await mpRes.json()) as { id?: string; init_point?: string; sandbox_init_point?: string };
      const initPoint = mpData.init_point || mpData.sandbox_init_point || "";

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
        preferenceId: mpData.id,
        billingPeriod: "yearly",
      });
    }

    // Monthly flow via Preapproval API
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
      billingPeriod: "monthly",
    });
  } catch (error) {
    console.error("[Subscription Checkout Error]", error);
    return NextResponse.json({ error: "Error en el servidor al procesar la suscripción" }, { status: 500 });
  }
}
