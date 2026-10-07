import test from "node:test";
import assert from "node:assert/strict";
import { parseLandingFeatures, parseLandingTestimonials } from "../src/features/branding/content.ts";

test("landing content parser falls back for missing or malformed values", () => {
  assert.equal(parseLandingFeatures(null).length, 3);
  assert.equal(parseLandingFeatures("not-json").length, 3);
  assert.equal(parseLandingTestimonials("{}").length, 0);
});

test("landing content parser keeps valid feature fields and filters malformed entries", () => {
  assert.deepEqual(parseLandingFeatures(JSON.stringify([
    { title: "Atención", desc: "Cercana" },
    { title: "Inválida" },
  ])), [{ title: "Atención", desc: "Cercana" }]);
});

test("landing testimonials accept both public and admin editor field names", () => {
  assert.deepEqual(parseLandingTestimonials(JSON.stringify([
    { author: "Camila", rating: 4, text: "Muy bien" },
    { name: "Diego", stars: 3, text: "Fácil" },
  ])), [
    { author: "Camila", rating: 4, text: "Muy bien" },
    { author: "Diego", rating: 3, text: "Fácil" },
  ]);
});
