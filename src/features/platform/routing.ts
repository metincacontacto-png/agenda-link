export interface PlatformRoutingSettings {
  maintenanceMode: string | null;
  slug: string | null;
}

export interface PlatformRoutingStatement {
  bind(...values: Array<string | null>): {
    first<T>(): Promise<T | null>;
  };
}

export interface PlatformRoutingDatabase {
  prepare(query: string): PlatformRoutingStatement;
}

const SYSTEM_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "agenda-link.pages.dev",
  "agenda-link.metincacontacto.workers.dev",
  "agendalink.cl",
  "www.agendalink.cl",
]);

export function isSystemHost(host: string): boolean {
  const normalizedHost = host.toLowerCase();
  return SYSTEM_HOSTS.has(normalizedHost) ||
    normalizedHost.endsWith(".pages.dev") ||
    normalizedHost.endsWith(".workers.dev");
}

export async function readPlatformRoutingSettings(
  database: PlatformRoutingDatabase,
  domain: string | null,
): Promise<PlatformRoutingSettings> {
  const settings = await database.prepare(`
    SELECT
      (SELECT "value" FROM "SystemSetting" WHERE "key" = ?) AS maintenanceMode,
      (SELECT "slug" FROM "Business" WHERE "customDomain" = ? LIMIT 1) AS slug
  `).bind("maintenanceMode", domain).first<PlatformRoutingSettings>();

  return settings ?? { maintenanceMode: null, slug: null };
}

export type PlatformRoutingAction =
  | { type: "maintenance" }
  | { type: "rewrite"; slug: string }
  | { type: "next" };

export function resolvePlatformRoutingAction(
  pathname: string,
  hostname: string,
  settings: PlatformRoutingSettings,
): PlatformRoutingAction {
  if (settings.maintenanceMode === "true") return { type: "maintenance" };
  if (pathname.startsWith("/admin") || isSystemHost(hostname)) return { type: "next" };
  if (settings.slug) return { type: "rewrite", slug: settings.slug };
  return { type: "next" };
}
