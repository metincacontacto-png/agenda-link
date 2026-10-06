import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/server/rate-limit";
import {
  createSessionToken,
  genericAuthError,
  hasSessionSigningSecret,
  normalizeEmail,
  sessionCookie,
  validEmail,
  verifyPassword,
} from "@/server/auth";
import { logServerError } from "@/server/observability";

export async function POST(request: Request) {
  const rateLimitResponse = await enforceRateLimit(request, "AUTH_RATE_LIMITER", "login");
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return genericAuthError();
  }

  if (typeof body !== "object" || body === null) return genericAuthError();
  const input = body as { email?: unknown; password?: unknown };
  if (
    typeof input.email !== "string" ||
    typeof input.password !== "string" ||
    !validEmail(normalizeEmail(input.email)) ||
    input.password.length > 128
  ) {
    return genericAuthError();
  }

  if (!hasSessionSigningSecret()) {
    return NextResponse.json({ error: "El servicio de autenticación no está configurado" }, { status: 503 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(input.email) },
      select: { id: true, passwordHash: true },
    });
    const validPassword = await verifyPassword(input.password, user?.passwordHash ?? null);
    if (!user || !validPassword) return genericAuthError();

    const token = await createSessionToken(user.id);
    return NextResponse.json(
      { success: true },
      { headers: { "Set-Cookie": sessionCookie(token) } },
    );
  } catch (error) {
    logServerError(request, "auth.login.failed", error);
    return NextResponse.json({ error: "No se pudo completar el inicio de sesión" }, { status: 500 });
  }
}
