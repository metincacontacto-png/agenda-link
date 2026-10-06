import test from "node:test";
import assert from "node:assert/strict";
import { logServerError } from "../src/lib/observability.ts";

test("structured server logs correlate by route and request ID without query, message, or PII", () => {
  const originalError = console.error;
  let output = "";
  console.error = (line) => { output = line; };
  try {
    logServerError(
      new Request("https://example.invalid/api/auth/login?password=secret-value&email=person@example.com", {
        headers: { "cf-ray": "ray-test-123" },
      }),
      "auth.login.failed",
      new Error("password=secret-value phone=+56912345678"),
      { businessId: "business-safe-id" },
    );
  } finally {
    console.error = originalError;
  }

  const record = JSON.parse(output);
  assert.equal(record.level, "error");
  assert.equal(record.event, "auth.login.failed");
  assert.equal(record.requestId, "ray-test-123");
  assert.equal(record.route, "/api/auth/login");
  assert.equal(record.businessId, "business-safe-id");
  assert.deepEqual(record.error, { name: "Error" });
  assert.equal(output.includes("secret-value"), false);
  assert.equal(output.includes("person@example.com"), false);
  assert.equal(output.includes("+56912345678"), false);
});
