import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type CloudflareCachedFetchInit = RequestInit & {
  cf: {
    cacheEverything: boolean;
    cacheTtlByStatus: Record<string, number>;
  };
};

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

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const hostname = request.headers.get("host") || "";

  // 1. Excluir recursos estáticos y assets de inmediato
  if (pathname.includes(".") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // 2. Excluir rutas del mantenimiento para permitir la edición al Super Admin
  if (
    pathname === "/maintenance" ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/api/super-admin") ||
    pathname.startsWith("/api/maintenance-check")
  ) {
    return NextResponse.next();
  }

  // 3. Verificar si el modo mantenimiento global está activo
  try {
    const checkUrl = new URL("/api/maintenance-check", request.url);
    const mRes = await fetch(checkUrl, {
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: { "200-299": 5, "300-599": 0 },
      },
    } as CloudflareCachedFetchInit);
    if (mRes.ok) {
      const mData = await mRes.json();
      if (mData.maintenanceMode) {
        url.pathname = "/maintenance";
        return NextResponse.rewrite(url);
      }
    }
  } catch (error) {
    logProxyError(request, "proxy.maintenance_check.failed", error);
  }

  // 4. Continuar con el enrutamiento normal si no está en mantenimiento
  // Excluir APIs y administración del enrutamiento por dominio personalizado
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin")
  ) {
    return NextResponse.next();
  }

  // 2. Definir los hosts del sistema principal
  const systemHosts = [
    "localhost",
    "127.0.0.1",
    "agenda-link.pages.dev",
    "agendalink.cl",
    "www.agendalink.cl",
  ];

  // Remover puertos si los hay (ej: localhost:3000 -> localhost)
  const cleanHost = hostname.split(":")[0];

  // Si es un host del sistema, procesar normalmente (no reescribir)
  if (systemHosts.some(host => cleanHost === host || cleanHost.endsWith(".pages.dev"))) {
    return NextResponse.next();
  }

  // 3. Resolver dominio personalizado llamando al endpoint interno
  try {
    const lookupUrl = new URL(`/api/domain-lookup?domain=${cleanHost}`, request.url);
    const res = await fetch(lookupUrl, {
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: { "200-299": 60, "300-599": 0 },
      },
    } as CloudflareCachedFetchInit);
    
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.slug) {
        // Reescribir internamente la ruta agregando el slug del negocio
        // Ej: mibelleza.cl/success -> agendalink.cl/peluqueria-bella/success
        url.pathname = `/${data.slug}${pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  } catch (error) {
    logProxyError(request, "proxy.domain_lookup.failed", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
