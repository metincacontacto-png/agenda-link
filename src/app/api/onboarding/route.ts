import { NextResponse } from "next/server";
import { createBusinessForOwner } from "@/features/businesses/onboarding";
import { parseOnboardingInput } from "@/features/businesses/validation";
import { enforceRateLimit } from "@/server/rate-limit";
import { createSessionToken, getSessionCookie, hasSessionSigningSecret, hashPassword, sessionCookie } from "@/server/auth";
import { requireSession } from "@/server/authorize";
import { logServerError } from "@/server/observability";

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function POST(request: Request) {
  const rateLimitResponse = await enforceRateLimit(request, "ONBOARDING_RATE_LIMITER", "onboarding");
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const parsed = parseOnboardingInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const rawBody = body as Record<string, unknown>;
  const turnstileToken = typeof rawBody.turnstileToken === "string" ? rawBody.turnstileToken : undefined;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret && turnstileToken && turnstileToken !== "fallback-math-verified") {
    try {
      const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || undefined;
      const verifyFormData = new FormData();
      verifyFormData.append("secret", turnstileSecret);
      verifyFormData.append("response", turnstileToken);
      if (clientIp) verifyFormData.append("remoteip", clientIp);

      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: verifyFormData,
      });
      const verifyData = (await verifyRes.json()) as { success: boolean };
      if (!verifyData.success) {
        return NextResponse.json({ error: "Verificación de seguridad fallida. Por favor intenta de nuevo." }, { status: 400 });
      }
    } catch (err) {
      logServerError(request, "onboarding.turnstile.error", err);
    }
  }

  const sessionToken = getSessionCookie(request);
  let owner: { userId: string } | { name: string; email: string; passwordHash: string };
  let newUser = false;
  if (sessionToken) {
    const session = await requireSession(request);
    if (!session.ok) return session.response;
    owner = { userId: session.user.id };
  } else {
    if (!parsed.value.password) {
      return NextResponse.json({ error: "Crea una contraseña para administrar tu negocio" }, { status: 400 });
    }
    if (!hasSessionSigningSecret()) {
      return NextResponse.json({ error: "El servicio de autenticación no está configurado" }, { status: 503 });
    }
    owner = {
      name: parsed.value.ownerName,
      email: parsed.value.email,
      passwordHash: await hashPassword(parsed.value.password),
    };
    newUser = true;
  }

  try {
    const created = await createBusinessForOwner(parsed.value, owner);

    const headers = new Headers();
    if (newUser) headers.set("Set-Cookie", sessionCookie(await createSessionToken(created.ownerUserId)));
    return NextResponse.json(
      { success: true, slug: created.business.slug, business: created.business },
      { status: 201, headers },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Ese link no está disponible. Prueba con otro.") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "No se pudo completar el registro" }, { status: 400 });
    }
    logServerError(request, "onboarding.create.failed", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
