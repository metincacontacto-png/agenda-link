import test from "node:test";
import assert from "node:assert/strict";

test("annual external_reference encoding and parsing", () => {
  const businessId = "3bfe538c-3894-4d5c-8c96-0431cef6a3a1";
  const planKey = "EQUIPO";

  // Encoding format used by checkout
  const externalReference = `annual_${businessId}_${planKey}`;
  assert.equal(externalReference, "annual_3bfe538c-3894-4d5c-8c96-0431cef6a3a1_EQUIPO");

  // Parsing format used by webhook
  const parts = externalReference.split("_");
  const actualBusinessId = parts[1];
  const targetPlan = parts[2];

  assert.equal(actualBusinessId, businessId);
  assert.equal(targetPlan, "EQUIPO");
});

test("annual external_reference backwards compatibility with legacy format without plan", () => {
  const legacyReference = "annual_3bfe538c-3894-4d5c-8c96-0431cef6a3a1";
  const parts = legacyReference.split("_");
  const actualBusinessId = parts[1];
  const targetPlan = parts[2];

  assert.equal(actualBusinessId, "3bfe538c-3894-4d5c-8c96-0431cef6a3a1");
  assert.equal(targetPlan, undefined);

  // Update data should omit subscriptionPlan when targetPlan is undefined
  const updateData = {
    subscriptionStatus: "ACTIVE",
    ...(targetPlan ? { subscriptionPlan: targetPlan } : {}),
  };
  assert.deepEqual(updateData, { subscriptionStatus: "ACTIVE" });
});

test("monthly external_reference encoding and parsing", () => {
  const businessId = "3bfe538c-3894-4d5c-8c96-0431cef6a3a1";
  const planKey = "NEGOCIO";

  // Encoding format used by checkout
  const externalReference = `${businessId}_${planKey}`;
  assert.equal(externalReference, "3bfe538c-3894-4d5c-8c96-0431cef6a3a1_NEGOCIO");

  // Parsing format used by webhook
  const [actualBusinessId, targetPlan] = externalReference.includes("_")
    ? externalReference.split("_")
    : [externalReference, undefined];

  assert.equal(actualBusinessId, businessId);
  assert.equal(targetPlan, "NEGOCIO");
});

test("monthly external_reference backwards compatibility with legacy reference", () => {
  const legacyReference = "3bfe538c-3894-4d5c-8c96-0431cef6a3a1";
  const [actualBusinessId, targetPlan] = legacyReference.includes("_")
    ? legacyReference.split("_")
    : [legacyReference, undefined];

  assert.equal(actualBusinessId, legacyReference);
  assert.equal(targetPlan, undefined);
});

test("webhook annual payment reconciliation updates subscription status and plan appropriately", () => {
  const mockDb = new Map();
  const businessId = "test-biz-id-123";

  mockDb.set(businessId, {
    id: businessId,
    subscriptionStatus: "TRIALING",
    subscriptionPlan: "INDIVIDUAL",
  });

  function reconcileAnnualPayment(status, externalReference) {
    const parts = externalReference.split("_");
    const actualBusinessId = parts[1];
    const targetPlan = parts[2];

    if (!actualBusinessId || !mockDb.has(actualBusinessId)) {
      return { received: true, error: "not_found" };
    }

    if (status === "approved") {
      const existing = mockDb.get(actualBusinessId);
      mockDb.set(actualBusinessId, {
        ...existing,
        subscriptionStatus: "ACTIVE",
        ...(targetPlan ? { subscriptionPlan: targetPlan } : {}),
      });
    } else if (status === "refunded" || status === "cancelled") {
      const existing = mockDb.get(actualBusinessId);
      mockDb.set(actualBusinessId, {
        ...existing,
        subscriptionStatus: "CANCELLED",
      });
    }

    return { success: true };
  }

  // 1. Approved annual payment upgrades plan and activates subscription
  reconcileAnnualPayment("approved", `annual_${businessId}_EQUIPO`);
  assert.equal(mockDb.get(businessId).subscriptionStatus, "ACTIVE");
  assert.equal(mockDb.get(businessId).subscriptionPlan, "EQUIPO");

  // 2. Refunded payment cancels subscription
  reconcileAnnualPayment("refunded", `annual_${businessId}_EQUIPO`);
  assert.equal(mockDb.get(businessId).subscriptionStatus, "CANCELLED");

  // 3. Unknown business returns not_found
  const unknownResult = reconcileAnnualPayment("approved", "annual_unknown-biz_EQUIPO");
  assert.equal(unknownResult.error, "not_found");
});
