import test from "node:test";
import assert from "node:assert/strict";
import {
  createMediaKey,
  isSafeMediaKey,
  MediaValidationError,
  parseImageDataUrl,
} from "../src/features/media/validation.ts";

const onePixelPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/f9sAAAAASUVORK5CYII=";

test("accepts supported image signatures and produces a safe R2 key", () => {
  const image = parseImageDataUrl(`data:image/png;base64,${onePixelPng}`);
  assert.equal(image.contentType, "image/png");
  assert.equal(image.extension, "png");
  assert.equal(isSafeMediaKey(createMediaKey("service_test-business", image.extension)), true);
});

test("rejects MIME spoofing, unsafe formats, malformed base64, and oversized files", () => {
  assert.throws(
    () => parseImageDataUrl(`data:image/jpeg;base64,${onePixelPng}`),
    (error) => error instanceof MediaValidationError && error.status === 400,
  );
  assert.throws(() => parseImageDataUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="), MediaValidationError);
  assert.throws(() => parseImageDataUrl("data:image/png;base64,not base64"), MediaValidationError);

  const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
  oversized.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.throws(
    () => parseImageDataUrl(`data:image/png;base64,${oversized.toString("base64")}`),
    (error) => error instanceof MediaValidationError && error.status === 413,
  );
});

test("rejects traversal keys while retaining the old safe image-key layout", () => {
  assert.equal(isSafeMediaKey("../secret.png"), false);
  assert.equal(isSafeMediaKey("img_service_demo_123e4567-e89b-12d3-a456-426614174000.webp"), true);
  assert.equal(isSafeMediaKey("service_demo-business_1720000000000_abcdef.png"), true);
});
