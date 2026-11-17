import { test } from "node:test";
import assert from "node:assert/strict";
import { SUBSCRIPTION_PLANS, getPlanPricing } from "../src/features/businesses/subscription-policy.ts";

test("SUBSCRIPTION_PLANS has monthly and yearly prices for each tier", () => {
  assert.equal(SUBSCRIPTION_PLANS.INDIVIDUAL.price, 9990);
  assert.equal(SUBSCRIPTION_PLANS.INDIVIDUAL.annualPrice, 99900);
  assert.equal(SUBSCRIPTION_PLANS.EQUIPO.price, 28990);
  assert.equal(SUBSCRIPTION_PLANS.EQUIPO.annualPrice, 289900);
  assert.equal(SUBSCRIPTION_PLANS.NEGOCIO.price, 48990);
  assert.equal(SUBSCRIPTION_PLANS.NEGOCIO.annualPrice, 489900);
});

test("getPlanPricing formats prices correctly", () => {
  const indMonthly = getPlanPricing("INDIVIDUAL", "monthly");
  assert.equal(indMonthly.amount, 9990);
  assert.equal(indMonthly.formatted, "$9.990 CLP/mes");

  const indYearly = getPlanPricing("INDIVIDUAL", "yearly");
  assert.equal(indYearly.amount, 99900);
  assert.equal(indYearly.formatted, "$99.900 CLP/año");
});
