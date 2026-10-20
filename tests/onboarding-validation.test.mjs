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

test("rejects all reserved slugs: panel, login, registro, admin, api, terminos, privacidad, legal", () => {
  const reserved = ["panel", "login", "registro", "admin", "api", "terminos", "privacidad", "legal"];
  for (const slug of reserved) {
    const result = parseOnboardingInput({
      name: "Mi Negocio",
      slug,
      ownerName: "Owner Test",
      email: "owner@test.cl",
      password: "Password123!",
      category: "Peluquería",
      teamSize: "1 persona",
      country: "Chile",
      termsAccepted: true,
    });
    assert.equal(result.ok, false, `Slug '${slug}' should be rejected as reserved`);
    if (!result.ok) {
      assert.equal(result.error, "Ese link no está disponible. Prueba con otro.");
    }
  }
});

test("rejects onboarding when honeypot field is filled by a bot", () => {
  const result = parseOnboardingInput({
    name: "Bot Studio",
    ownerName: "Bot Spammer",
    email: "bot@spam.com",
    password: "Password123!",
    category: "Peluquería",
    teamSize: "1 persona",
    country: "Chile",
    termsAccepted: true,
    website_hp: "https://spam-link.com",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, "Solicitud no válida");
  }
});

test("rejects onboarding when form was submitted impossibly fast (< 1.2s)", () => {
  const result = parseOnboardingInput({
    name: "Fast Bot",
    ownerName: "Speedy Spammer",
    email: "speedy@spam.com",
    password: "Password123!",
    category: "Peluquería",
    teamSize: "1 persona",
    country: "Chile",
    termsAccepted: true,
    formStartedAt: Date.now() - 300, // 300ms ago
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /rápido/i);
  }
});

