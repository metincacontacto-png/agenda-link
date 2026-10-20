import test from "node:test";
import assert from "node:assert/strict";
import { parseOnboardingInput } from "../src/features/businesses/validation.ts";

test("rejects onboarding when terms are explicitly rejected", () => {
  const result = parseOnboardingInput({
    name: "Studio Test",
    ownerName: "Owner Test",
    email: "owner@test.cl",
    password: "Password123!",
    category: "Peluquería",
    teamSize: "1 persona",
    country: "Chile",
    termsAccepted: false,
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /Términos/i);
});

test("accepts onboarding when terms are actively accepted and records version", () => {
  const timestamp = "2026-10-20T12:00:00.000Z";
  const result = parseOnboardingInput({
    name: "Studio Test",
    slug: "studio-test",
    ownerName: "Owner Test",
    email: "owner@test.cl",
    password: "Password123!",
    category: "Peluquería",
    teamSize: "1 persona",
    country: "Chile",
    termsAccepted: true,
    termsAcceptedAt: timestamp,
    termsVersion: "2026-10-20",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.termsAccepted, true);
  assert.equal(result.value.termsAcceptedAt, timestamp);
  assert.equal(result.value.termsVersion, "2026-10-20");
});
