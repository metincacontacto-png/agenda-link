import type { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { jsonError } from "@/server/errors";

interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export type RateLimitName =
  | "AUTH_RATE_LIMITER"
  | "ONBOARDING_RATE_LIMITER"
  | "BOOKING_RATE_LIMITER"
  | "SUPER_ADMIN_RATE_LIMITER";

export async function enforceRateLimit(
  request: Request,
  bindingName: RateLimitName,
  scope: string,
): Promise<NextResponse | null> {
  let binding: RateLimitBinding | undefined;
  try {
    const { env } = getCloudflareContext();
    binding = (env as unknown as Record<RateLimitName, RateLimitBinding | undefined>)[bindingName];
  } catch {
    binding = undefined;
  }

  if (!binding) {
    if (process.env.NODE_ENV === "development") return null;
    return jsonError("El control de tráfico no está configurado", 503);
  }

  const clientIp = request.headers.get("cf-connecting-ip") ?? "unknown";
  try {
    const result = await binding.limit({ key: `${clientIp}:${scope}` });
    if (!result.success) {
      return jsonError("Demasiadas solicitudes. Inténtalo más tarde.", 429);
    }
    return null;
  } catch {
    console.error("Rate limit binding failed");
    return jsonError("El control de tráfico no está disponible", 503);
  }
}
