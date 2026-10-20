import test from "node:test";
import assert from "node:assert/strict";
import {
  isSubscriptionActive,
  getTrialDaysRemaining,
  SUBSCRIPTION_PLANS,
} from "../src/features/businesses/subscription-policy.ts";

test("subscription policy: plan configurations match business requirements", () => {
  assert.equal(SUBSCRIPTION_PLANS.INDIVIDUAL.price, 10000);
  assert.equal(SUBSCRIPTION_PLANS.INDIVIDUAL.envPlanKey, "MERCADOPAGO_PLAN_ID_INDIVIDUAL");
  assert.equal(SUBSCRIPTION_PLANS.INDIVIDUAL.maxProfessionals, 1);

  assert.equal(SUBSCRIPTION_PLANS.EQUIPO.price, 29000);
  assert.equal(SUBSCRIPTION_PLANS.EQUIPO.envPlanKey, "MERCADOPAGO_PLAN_ID_EQUIPO");
  assert.equal(SUBSCRIPTION_PLANS.EQUIPO.maxProfessionals, 5);

  assert.equal(SUBSCRIPTION_PLANS.NEGOCIO.price, 49000);
  assert.equal(SUBSCRIPTION_PLANS.NEGOCIO.envPlanKey, "MERCADOPAGO_PLAN_ID_NEGOCIO");
  assert.ok(SUBSCRIPTION_PLANS.NEGOCIO.maxProfessionals > 5);
});

test("subscription policy: billingBypass grants unconditional access", () => {
  const expiredDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  assert.equal(
    isSubscriptionActive({
      billingBypass: true,
      subscriptionStatus: "CANCELLED",
      trialEndsAt: expiredDate,
      currentPeriodEnd: expiredDate,
    }),
    true
  );
});

test("subscription policy: trialing status active during trial and inactive after expiration", () => {
  const futureTrial = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const pastTrial = new Date(Date.now() - 1000);

  assert.equal(
    isSubscriptionActive({
      billingBypass: false,
      subscriptionStatus: "TRIALING",
      trialEndsAt: futureTrial,
    }),
    true
  );

  assert.equal(
    isSubscriptionActive({
      billingBypass: false,
      subscriptionStatus: "TRIALING",
      trialEndsAt: pastTrial,
    }),
    false
  );
});

test("subscription policy: active subscription respects current period and 3-day grace period", () => {
  const futurePeriod = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const gracePeriod = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago (within 3 days)
  const expiredPastGrace = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

  assert.equal(
    isSubscriptionActive({
      billingBypass: false,
      subscriptionStatus: "ACTIVE",
      currentPeriodEnd: futurePeriod,
    }),
    true
  );

  assert.equal(
    isSubscriptionActive({
      billingBypass: false,
      subscriptionStatus: "ACTIVE",
      currentPeriodEnd: gracePeriod,
    }),
    true
  );

  assert.equal(
    isSubscriptionActive({
      billingBypass: false,
      subscriptionStatus: "ACTIVE",
      currentPeriodEnd: expiredPastGrace,
    }),
    false
  );
});

test("subscription policy: past_due and cancelled subscriptions return false", () => {
  assert.equal(
    isSubscriptionActive({
      billingBypass: false,
      subscriptionStatus: "PAST_DUE",
    }),
    false
  );

  assert.equal(
    isSubscriptionActive({
      billingBypass: false,
      subscriptionStatus: "CANCELLED",
    }),
    false
  );
});

test("subscription policy: getTrialDaysRemaining correctly computes days", () => {
  assert.equal(getTrialDaysRemaining(null), 0);
  assert.equal(getTrialDaysRemaining(undefined), 0);

  const pastDate = new Date(Date.now() - 5000);
  assert.equal(getTrialDaysRemaining(pastDate), 0);

  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  assert.equal(getTrialDaysRemaining(in14Days), 14);

  const in1Day = new Date(Date.now() + 18 * 60 * 60 * 1000); // 18 hours = ceil to 1 day
  assert.equal(getTrialDaysRemaining(in1Day), 1);
});
