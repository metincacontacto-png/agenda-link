export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED";

export interface PlanConfig {
  id: "INDIVIDUAL" | "EQUIPO" | "NEGOCIO";
  name: string;
  price: number;
  priceFormatted: string;
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
    description: "Para profesionales independientes.",
    maxProfessionals: 1,
    envPlanKey: "MERCADOPAGO_PLAN_ID_INDIVIDUAL",
  },
  EQUIPO: {
    id: "EQUIPO",
    name: "Básico",
    price: 28990,
    priceFormatted: "$28.990 CLP/mes",
    description: "Para salones o centros de 2 a 5 profesionales.",
    maxProfessionals: 5,
    envPlanKey: "MERCADOPAGO_PLAN_ID_EQUIPO",
  },
  NEGOCIO: {
    id: "NEGOCIO",
    name: "Premium",
    price: 48990,
    priceFormatted: "$48.990 CLP/mes",
    description: "Para centros grandes con profesionales ilimitados.",
    maxProfessionals: 999,
    envPlanKey: "MERCADOPAGO_PLAN_ID_NEGOCIO",
  },
};

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
