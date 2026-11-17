export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED";

export interface PlanConfig {
  id: "INDIVIDUAL" | "EQUIPO" | "NEGOCIO";
  name: string;
  price: number;
  priceFormatted: string;
  annualPrice: number;
  annualPriceFormatted: string;
  description: string;
  maxProfessionals: number;
  envPlanKey: string;
}

export const SUBSCRIPTION_PLANS: Record<"INDIVIDUAL" | "EQUIPO" | "NEGOCIO", PlanConfig> = {
  INDIVIDUAL: {
    id: "INDIVIDUAL",
    name: "Individual",
    price: 9990,
    priceFormatted: "$9.990 CLP/mes",
    annualPrice: 99900,
    annualPriceFormatted: "$99.900 CLP/año",
    description: "Para profesionales independientes.",
    maxProfessionals: 1,
    envPlanKey: "MERCADOPAGO_PLAN_ID_INDIVIDUAL",
  },
  EQUIPO: {
    id: "EQUIPO",
    name: "Básico",
    price: 28990,
    priceFormatted: "$28.990 CLP/mes",
    annualPrice: 289900,
    annualPriceFormatted: "$289.900 CLP/año",
    description: "Para salones o centros de hasta 2 profesionales.",
    maxProfessionals: 2,
    envPlanKey: "MERCADOPAGO_PLAN_ID_EQUIPO",
  },
  NEGOCIO: {
    id: "NEGOCIO",
    name: "Premium",
    price: 48990,
    priceFormatted: "$48.990 CLP/mes",
    annualPrice: 489900,
    annualPriceFormatted: "$489.900 CLP/año",
    description: "Para centros grandes de hasta 5 profesionales.",
    maxProfessionals: 5,
    envPlanKey: "MERCADOPAGO_PLAN_ID_NEGOCIO",
  },
};

export function getPlanMaxProfessionals(planId?: string | null): number {
  if (!planId) return 1;
  return SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]?.maxProfessionals ?? 1;
}

export function getPlanPricing(planId: "INDIVIDUAL" | "EQUIPO" | "NEGOCIO", period: "monthly" | "yearly" = "monthly") {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) throw new Error(`Unknown plan ${planId}`);
  if (period === "yearly") {
    return {
      amount: plan.annualPrice,
      formatted: plan.annualPriceFormatted,
    };
  }
  return {
    amount: plan.price,
    formatted: plan.priceFormatted,
  };
}

export function isSubscriptionActive(business: {
  billingBypass?: boolean;
  subscriptionStatus?: string | null;
  trialEndsAt?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
}): boolean {
  if (business.billingBypass) return true;

  const status = business.subscriptionStatus || "TRIALING";

  if (status === "ACTIVE") {
    if (business.currentPeriodEnd) {
      // Allow up to a 3-day grace period for subscription renewals
      const periodEndMs = new Date(business.currentPeriodEnd).getTime();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      return periodEndMs + threeDaysMs > Date.now();
    }
    return true;
  }

  if (status === "TRIALING") {
    if (!business.trialEndsAt) return true;
    return new Date(business.trialEndsAt).getTime() > Date.now();
  }

  return false;
}

export function getTrialDaysRemaining(trialEndsAt?: Date | string | null): number {
  if (!trialEndsAt) return 0;
  const target = new Date(trialEndsAt).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
