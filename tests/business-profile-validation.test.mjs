import test from "node:test";
import assert from "node:assert/strict";
import { parseBusinessProfileInput } from "../src/features/branding/validation.ts";
import { toPublicBusinessDTO } from "../src/features/booking/public-business-dto.ts";

test("parseBusinessProfileInput accepts maxServicesPerBooking integers from 1 to 5 as numbers and strings", () => {
  for (let i = 1; i <= 5; i++) {
    // Number input
    const resNum = parseBusinessProfileInput({ maxServicesPerBooking: i });
    assert.equal(resNum.ok, true);
    if (resNum.ok) {
      assert.equal(resNum.value.maxServicesPerBooking, i);
    }

    // String input
    const resStr = parseBusinessProfileInput({ maxServicesPerBooking: String(i) });
    assert.equal(resStr.ok, true);
    if (resStr.ok) {
      assert.equal(resStr.value.maxServicesPerBooking, i);
    }
  }
});

test("parseBusinessProfileInput rejects invalid maxServicesPerBooking values", () => {
  const invalidCases = [
    // Out of range integers
    0,
    -1,
    6,
    10,
    "0",
    "-1",
    "6",
    "10",
    // Floats
    2.5,
    1.1,
    "2.5",
    "1.99",
    // Booleans
    true,
    false,
    // Arrays & Objects
    [2],
    [],
    {},
    { value: 3 },
    null,
    // Strings
    "",
    "   ",
    "abc",
    "NaN",
  ];

  for (const invalidValue of invalidCases) {
    const res = parseBusinessProfileInput({ maxServicesPerBooking: invalidValue });
    assert.equal(
      res.ok,
      false,
      `Expected maxServicesPerBooking=${JSON.stringify(invalidValue)} to be rejected`
    );
    if (!res.ok) {
      assert.equal(
        res.error,
        "El límite de servicios debe ser un número entero entre 1 y 5",
        `Expected error message for maxServicesPerBooking=${JSON.stringify(invalidValue)}`
      );
    }
  }
});

test("toPublicBusinessDTO defaults maxServicesPerBooking to 1 when undefined or null", () => {
  const base = {
    id: "biz-1",
    name: "Barbería Demo",
    slug: "barberia-demo",
    category: "Barbería",
    currency: "CLP",
    timezone: "America/Santiago",
    logoUrl: null,
    landingTitle: null,
    landingSubtitle: null,
    landingAbout: null,
    landingCoverUrl: null,
    landingSecondaryCoverUrl: null,
    landingMobileCoverUrl: null,
    landingPhone: null,
    landingAddress: null,
    landingHours: null,
    landingFeaturesJson: null,
    landingTestimonialsJson: null,
    cancellationPolicy: null,
    minNoticeHours: 2,
    services: [],
    professionals: [],
  };

  const dtoUndefined = toPublicBusinessDTO({ ...base, maxServicesPerBooking: undefined });
  assert.equal(dtoUndefined.maxServicesPerBooking, 1);

  const dtoNull = toPublicBusinessDTO({ ...base, maxServicesPerBooking: null });
  assert.equal(dtoNull.maxServicesPerBooking, 1);

  const dtoCustom = toPublicBusinessDTO({ ...base, maxServicesPerBooking: 3 });
  assert.equal(dtoCustom.maxServicesPerBooking, 3);
});

test("toPublicBusinessDTO converts acceptsOnlinePayments based on mercadoPagoAccessToken and strips token", () => {
  const base = {
    id: "biz-1",
    name: "Barbería Demo",
    slug: "barberia-demo",
    category: "Barbería",
    currency: "CLP",
    timezone: "America/Santiago",
    logoUrl: null,
    landingTitle: null,
    landingSubtitle: null,
    landingAbout: null,
    landingCoverUrl: null,
    landingSecondaryCoverUrl: null,
    landingMobileCoverUrl: null,
    landingPhone: null,
    landingAddress: null,
    landingHours: null,
    landingFeaturesJson: null,
    landingTestimonialsJson: null,
    services: [],
    professionals: [],
  };

  // With token
  const dtoWithToken = toPublicBusinessDTO({
    ...base,
    mercadoPagoAccessToken: "APP_USR-test-token-12345",
  });
  assert.equal(dtoWithToken.acceptsOnlinePayments, true);
  assert.equal("mercadoPagoAccessToken" in dtoWithToken, false);

  // Without token (null)
  const dtoWithoutToken = toPublicBusinessDTO({
    ...base,
    mercadoPagoAccessToken: null,
  });
  assert.equal(dtoWithoutToken.acceptsOnlinePayments, false);
  assert.equal("mercadoPagoAccessToken" in dtoWithoutToken, false);

  // Without token (undefined)
  const dtoTokenUndefined = toPublicBusinessDTO({
    ...base,
    mercadoPagoAccessToken: undefined,
  });
  assert.equal(dtoTokenUndefined.acceptsOnlinePayments, false);
  assert.equal("mercadoPagoAccessToken" in dtoTokenUndefined, false);

  // Explicit acceptsOnlinePayments overrides or takes precedence
  const dtoExplicitTrue = toPublicBusinessDTO({
    ...base,
    mercadoPagoAccessToken: null,
    acceptsOnlinePayments: true,
  });
  assert.equal(dtoExplicitTrue.acceptsOnlinePayments, true);
});
