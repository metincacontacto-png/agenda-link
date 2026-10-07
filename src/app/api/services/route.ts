import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCatalogService, deleteCatalogService } from "@/features/catalog/services";
import { parseCreateServiceInput } from "@/features/catalog/validation";
import { requireBusinessMembership, requireSession } from "@/server/authorize";
import { MediaValidationError } from "@/features/media/validation";
import { logServerError } from "@/server/observability";

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("slug" in body) || typeof body.slug !== "string") {
    return NextResponse.json({ error: "Falta el slug del negocio" }, { status: 400 });
  }
  const parsed = parseCreateServiceInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  let businessId: string | undefined;
  try {
    const business = await prisma.business.findUnique({
      where: { slug: body.slug },
      select: { id: true, slug: true },
    });
    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    businessId = business.id;

    const authorization = await requireBusinessMembership(session.user, business.id);
    if (!authorization.ok) return authorization.response;

    const service = await createCatalogService(business.id, business.slug, parsed.value);
    return NextResponse.json({ success: true, service });
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logServerError(request, "services.create.failed", error, { businessId });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) return session.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 100) {
    return NextResponse.json({ error: "Falta un id de servicio válido" }, { status: 400 });
  }

  let businessId: string | undefined;
  try {
    const service = await prisma.service.findUnique({ where: { id }, select: { businessId: true } });
    if (!service) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    businessId = service.businessId;

    const authorization = await requireBusinessMembership(session.user, service.businessId);
    if (!authorization.ok) return authorization.response;

    const deleted = await deleteCatalogService(id);
    if (!deleted) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logServerError(request, "services.delete.failed", error, { businessId });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
