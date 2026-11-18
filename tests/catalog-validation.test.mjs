import test from "node:test";
import assert from "node:assert/strict";
import { parseCreateServiceInput, parseUpdateServiceInput } from "../src/features/catalog/validation.ts";

test("parseCreateServiceInput validates service payload correctly", () => {
  const valid = parseCreateServiceInput({
    name: "Corte y Peinado",
    price: 15000,
    duration: 45,
    imageUrl: "/api/media/service_123.jpg",
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value.name, "Corte y Peinado");
    assert.equal(valid.value.price, 15000);
    assert.equal(valid.value.duration, 45);
    assert.equal(valid.value.imageUrl, "/api/media/service_123.jpg");
  }

  const invalidPrice = parseCreateServiceInput({
    name: "Test",
    price: -100,
    duration: 30,
  });
  assert.equal(invalidPrice.ok, false);

  const invalidDuration = parseCreateServiceInput({
    name: "Test",
    price: 1000,
    duration: 3,
  });
  assert.equal(invalidDuration.ok, false);
});

test("parseUpdateServiceInput requires valid id and service fields", () => {
  const missingId = parseUpdateServiceInput({
    name: "Esmaltado",
    price: 20000,
    duration: 60,
  });
  assert.equal(missingId.ok, false);

  const valid = parseUpdateServiceInput({
    id: "srv-12345",
    name: "Esmaltado Permanente",
    price: 21990,
    duration: 60,
    imageUrl: "data:image/png;base64,iVBORw0KGgo...",
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value.id, "srv-12345");
    assert.equal(valid.value.name, "Esmaltado Permanente");
    assert.equal(valid.value.price, 21990);
    assert.equal(valid.value.duration, 60);
    assert.equal(valid.value.imageUrl, "data:image/png;base64,iVBORw0KGgo...");
  }
});
