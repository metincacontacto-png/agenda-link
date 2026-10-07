import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isSystemHost,
  readPlatformRoutingSettings,
  resolvePlatformRoutingAction,
  type PlatformRoutingDatabase,
} from "@/features/platform/routing";

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

async function loadPlatformSettings(domain: string | null) {
  const { env } = getCloudflareContext();
  const database = (env as unknown as { DB?: PlatformRoutingDatabase }).DB;
  if (!database) throw new Error("D1 binding DB is unavailable in Proxy");
  return readPlatformRoutingSettings(database, domain);
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
    const settings = await loadPlatformSettings(systemHost || pathname.startsWith("/admin") ? null : hostname);
    const action = resolvePlatformRoutingAction(pathname, hostname, settings);
    if (action.type === "maintenance") {
      url.pathname = "/maintenance";
      return NextResponse.rewrite(url);
    }
    if (action.type === "rewrite") {
      url.pathname = `/${action.slug}${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
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
