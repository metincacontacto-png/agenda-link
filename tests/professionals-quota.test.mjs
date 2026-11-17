import { test } from "node:test";
import assert from "node:assert/strict";
import { getPlanMaxProfessionals, SUBSCRIPTION_PLANS } from "../src/features/businesses/subscription-policy.ts";

test("quota logic prevents exceeding plan capacity", () => {
  assert.equal(1 >= getPlanMaxProfessionals("INDIVIDUAL"), true); // Individual at 1 cannot add
  assert.equal(1 >= getPlanMaxProfessionals("EQUIPO"), false);    // Equipo at 1 can add 1 more
  assert.equal(2 >= getPlanMaxProfessionals("EQUIPO"), true);     // Equipo at 2 cannot add
  assert.equal(4 >= getPlanMaxProfessionals("NEGOCIO"), false);   // Negocio at 4 can add 1 more
  assert.equal(5 >= getPlanMaxProfessionals("NEGOCIO"), true);    // Negocio at 5 cannot add
});

test("getPlanMaxProfessionals fallback returns 1 for invalid plan", () => {
  assert.equal(getPlanMaxProfessionals(undefined), 1);
  assert.equal(getPlanMaxProfessionals("UNKNOWN"), 1);
});
