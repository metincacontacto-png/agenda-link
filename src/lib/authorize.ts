import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getSessionCookie,
  hasSessionSigningSecret,
  verifySessionToken,
} from "@/lib/auth";

export type UserIdentity = {
  id: string;
  name: string;
  email: string;
  globalRole: string;
};

export type AuthorizationResult =
  | { ok: true; user: UserIdentity }
  | { ok: false; response: NextResponse };

export async function requireSession(request: Request): Promise<AuthorizationResult> {
  const token = getSessionCookie(request);
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (!hasSessionSigningSecret()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "El servicio de autenticación no está configurado" },
        { status: 503 },
      ),
    };
  }

  const claims = await verifySessionToken(token);
  if (!claims) {
    return { ok: false, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, name: true, email: true, globalRole: true },
  });
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  return { ok: true, user };
}

export async function requireBusinessAccess(
  request: Request,
  businessId: string,
): Promise<AuthorizationResult> {
  const session = await requireSession(request);
  if (!session.ok) return session;
  return requireBusinessMembership(session.user, businessId);
}

export async function requireBusinessMembership(
  user: UserIdentity,
  businessId: string,
): Promise<AuthorizationResult> {
  if (user.globalRole === "SUPER_ADMIN") return { ok: true, user };

  const membership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId: user.id,
      },
    },
    select: { businessId: true },
  });
  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado para este negocio" }, { status: 403 }),
    };
  }

  return { ok: true, user };
}

export async function requireSuperAdmin(request: Request): Promise<AuthorizationResult> {
  const session = await requireSession(request);
  if (!session.ok) return session;
  if (session.user.globalRole !== "SUPER_ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return session;
}
