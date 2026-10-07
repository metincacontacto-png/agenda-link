import test from "node:test";
import assert from "node:assert/strict";
import {
  isSystemHost,
  readPlatformRoutingSettings,
  resolvePlatformRoutingAction,
} from "../src/features/platform/routing.ts";

test("platform routing recognizes system hosts and leaves their paths on the main app", () => {
  assert.equal(isSystemHost("AGENDA-LINK.PAGES.DEV"), true);
  assert.equal(isSystemHost("tenant.workers.dev"), true);
  assert.equal(isSystemHost("example.com"), false);

  assert.deepEqual(
    resolvePlatformRoutingAction("/", "agendalink.cl", { maintenanceMode: null, slug: "mapped-business" }),
    { type: "next" },
  );
});

test("platform routing prioritizes maintenance and only rewrites custom-domain paths", () => {
  assert.deepEqual(
    resolvePlatformRoutingAction("/services", "client.example", { maintenanceMode: "true", slug: "mapped-business" }),
    { type: "maintenance" },
  );
  assert.deepEqual(
    resolvePlatformRoutingAction("/admin/mapped-business", "client.example", { maintenanceMode: null, slug: "mapped-business" }),
    { type: "next" },
  );
  assert.deepEqual(
    resolvePlatformRoutingAction("/services", "client.example", { maintenanceMode: null, slug: "mapped-business" }),
    { type: "rewrite", slug: "mapped-business" },
  );
  assert.deepEqual(
    resolvePlatformRoutingAction("/services", "unmapped.example", { maintenanceMode: null, slug: null }),
    { type: "next" },
  );
});

test("platform settings use one parameterized D1 query and return safe defaults", async () => {
  const calls = [];
  const database = {
    prepare(query) {
      calls.push({ query });
      return {
        bind(...values) {
          calls[0].values = values;
          return { first: async () => ({ maintenanceMode: "false", slug: "mapped-business" }) };
        },
      };
    },
  };

  const settings = await readPlatformRoutingSettings(database, "client.example");
  assert.deepEqual(settings, { maintenanceMode: "false", slug: "mapped-business" });
  assert.deepEqual(calls[0].values, ["maintenanceMode", "client.example"]);
  assert.match(calls[0].query, /FROM "SystemSetting"/);
  assert.match(calls[0].query, /FROM "Business"/);

  const emptyDatabase = { prepare: () => ({ bind: () => ({ first: async () => null }) }) };
  assert.deepEqual(await readPlatformRoutingSettings(emptyDatabase, null), {
    maintenanceMode: null,
    slug: null,
  });
});
