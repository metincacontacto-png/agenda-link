import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  createSessionToken,
  genericAuthError,
  hasSessionSigningSecret,
  hashPassword,
  normalizeEmail,
  sessionCookie,
  validEmail,
  validPassword,
  verifyPassword,
} from "@/lib/auth";

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function POST(request: Request) {
  const rateLimitResponse = await enforceRateLimit(request, "AUTH_RATE_LIMITER", "register");
  if (rateLimitResponse) return rateLimitResponse;

  if (!hasSessionSigningSecret()) {
    return NextResponse.json({ error: "El servicio de autenticación no está configurado" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const input = body as { name?: unknown; email?: unknown; password?: unknown };
  if (
    typeof input.name !== "string" ||
    typeof input.email !== "string" ||
    typeof input.password !== "string" ||
    input.name.trim().length < 1 ||
    input.name.trim().length > 100 ||
    !validEmail(normalizeEmail(input.email)) ||
    !validPassword(input.password)
  ) {
    return NextResponse.json({ error: "Revisa el nombre, el email y la contraseña" }, { status: 400 });
  }

  const email = normalizeEmail(input.email);
  const name = input.name.trim();

  try {
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      await verifyPassword(input.password, null);
      return genericAuthError(400);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(input.password),
      },
      select: { id: true },
    });
    const token = await createSessionToken(user.id);
    return NextResponse.json(
      { success: true },
      { status: 201, headers: { "Set-Cookie": sessionCookie(token) } },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) return genericAuthError(400);
    console.error("Error al registrar usuario");
    return NextResponse.json({ error: "No se pudo completar el registro" }, { status: 500 });
  }
}
