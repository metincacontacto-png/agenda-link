import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
}

interface D1Binding {
  prepare(query: string): D1Statement;
}

interface RoutingSettings {
  maintenanceMode: string | null;
  slug: string | null;
}

const SYSTEM_HOSTS = [
  "localhost",
  "127.0.0.1",
  "agenda-link.pages.dev",
  "agenda-link.metincacontacto.workers.dev",
  "agendalink.cl",
  "www.agendalink.cl",
];

function logProxyError(request: NextRequest, event: string, error: unknown) {
  const url = new URL(request.url);
  const errorName = error instanceof Error && /^[A-Za-z0-9_]{1,64}$/.test(error.name)
    ? error.name
    : "Error";
  console.error(JSON.stringify({
    level: "error",
    event,
    requestId: request.headers.get("cf-ray") ?? crypto.randomUUID(),
    method: request.method,
    route: url.pathname,
    error: { name: errorName },
  }));
}

function isSystemHost(host: string): boolean {
  return SYSTEM_HOSTS.some((systemHost) => host === systemHost) ||
    host.endsWith(".pages.dev") ||
    host.endsWith(".workers.dev");
}

async function readRoutingSettings(domain: string | null): Promise<RoutingSettings> {
  const { env } = getCloudflareContext();
  const database = (env as unknown as { DB?: D1Binding }).DB;
  if (!database) throw new Error("D1 binding DB is unavailable in Proxy");

  // One D1 subrequest returns both settings needed by this navigation. This
  // replaces self-fetches to /api/maintenance-check and /api/domain-lookup.
  const settings = await database.prepare(`
    SELECT
      (SELECT "value" FROM "SystemSetting" WHERE "key" = ?) AS maintenanceMode,
      (SELECT "slug" FROM "Business" WHERE "customDomain" = ? LIMIT 1) AS slug
  `).bind("maintenanceMode", domain).first<RoutingSettings>();
  return settings ?? {
    maintenanceMode: null,
    slug: null,
  };
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const hostname = new URL(request.url).hostname.toLowerCase();

  if (pathname.includes(".") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (
    pathname === "/maintenance" ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/api/super-admin") ||
    pathname.startsWith("/api/maintenance-check")
  ) {
    return NextResponse.next();
  }

  const systemHost = isSystemHost(hostname);
  try {
    const settings = await readRoutingSettings(systemHost || pathname.startsWith("/admin") ? null : hostname);
    if (settings.maintenanceMode === "true") {
      url.pathname = "/maintenance";
      return NextResponse.rewrite(url);
    }

    if (pathname.startsWith("/admin") || systemHost) return NextResponse.next();

    if (settings.slug) {
      url.pathname = `/${settings.slug}${pathname}`;
      return NextResponse.rewrite(url);
    }
  } catch (error) {
    logProxyError(request, "proxy.routing_lookup.failed", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
