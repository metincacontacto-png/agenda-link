import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getSessionCookie,
  hasSessionSigningSecret,
  sessionCookie,
  verifySessionToken,
} from "@/lib/auth";
import { logServerError } from "@/lib/observability";

export async function GET(request: Request) {
  const token = getSessionCookie(request);
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasSessionSigningSecret()) {
    return NextResponse.json({ error: "El servicio de autenticación no está configurado" }, { status: 503 });
  }

  try {
    const claims = await verifySessionToken(token);
    if (!claims) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
        memberships: {
          select: {
            role: true,
            business: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401, headers: { "Set-Cookie": sessionCookie("", 0) } },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    logServerError(request, "auth.session.failed", error);
    return NextResponse.json({ error: "No se pudo validar la sesión" }, { status: 500 });
  }
}
