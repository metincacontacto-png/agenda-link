import { prisma } from "@/lib/db";
import { getD1Database, type D1PreparedStatement } from "@/lib/cloudflare";
import { prepareDefaultTeam } from "@/features/team/default-team";
import type { OnboardingInput } from "@/features/businesses/validation";

const RESERVED_SLUGS = new Set(["admin", "api", "public", "auth", "static", "login", "register", "success"]);

export type BusinessOwner =
  | { userId: string }
  | { name: string; email: string; passwordHash: string };

export function businessSlugBase(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const safeSlug = slug || "negocio";
  return RESERVED_SLUGS.has(safeSlug) ? `${safeSlug}-negocio` : safeSlug;
}

async function uniqueBusinessSlug(name: string): Promise<string> {
  const base = businessSlugBase(name);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${crypto.randomUUID().slice(0, 6)}`;
    const existing = await prisma.business.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  throw new Error("Could not allocate a unique business slug");
}

export async function createBusinessForOwner(input: OnboardingInput, owner: BusinessOwner) {
  const slug = await uniqueBusinessSlug(input.name);
  const database = getD1Database();
  const businessId = crypto.randomUUID();
  const serviceId = crypto.randomUUID();
  const defaultTeam = prepareDefaultTeam(database, businessId, input.ownerName);
  const ownerUserId = "userId" in owner ? owner.userId : crypto.randomUUID();
  const currency = input.country === "Chile" ? "CLP" : "MXN";
  const timezone = input.country === "Chile" ? "America/Santiago" : "America/Mexico_City";
  const plan = input.teamSize === "1 persona"
    ? "INDIVIDUAL"
    : input.teamSize === "2-5 personas"
      ? "EQUIPO"
      : "NEGOCIO";
  const businessScheduleRows = Array.from({ length: 7 }, (_, dayOfWeek) => [
    crypto.randomUUID(), businessId, dayOfWeek, 540, 1080,
  ]).flat();
  const insertBusinessSchedules = `INSERT INTO "BusinessSchedule" ("id","businessId","dayOfWeek","startMinute","endMinute") VALUES ${Array.from({ length: 7 }, () => "(?,?,?,?,?)").join(",")}`;

  const statements: D1PreparedStatement[] = [];
  if (!("userId" in owner)) {
    statements.push(database.prepare(`
      INSERT INTO "User" ("id","name","email","passwordHash","globalRole","createdAt","updatedAt")
      VALUES (?,?,?,?, 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(ownerUserId, owner.name, owner.email, owner.passwordHash));
  }
  statements.push(
    database.prepare(`
      INSERT INTO "Business" (
        "id","name","slug","ownerName","email","category","teamSize","country",
        "currency","timezone","plan","landingTitle","landingSubtitle","createdAt","updatedAt"
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `).bind(
      businessId,
      input.name,
      slug,
      input.ownerName,
      input.email,
      input.category,
      input.teamSize,
      input.country,
      currency,
      timezone,
      plan,
      input.name,
      "Agenda tu cita en segundos.",
    ),
    database.prepare(`
      INSERT INTO "Service" ("id","businessId","name","duration","price","createdAt")
      VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)
    `).bind(serviceId, businessId, input.serviceName, input.serviceDuration, input.servicePrice),
    database.prepare(insertBusinessSchedules).bind(...businessScheduleRows),
    ...defaultTeam.statements,
    database.prepare(`
      INSERT INTO "BusinessMember" ("businessId","userId","role","createdAt")
      VALUES (?,?, 'OWNER', CURRENT_TIMESTAMP)
    `).bind(businessId, ownerUserId),
  );

  // D1 batch runs sequentially in one transaction and rolls all writes back on failure.
  await database.batch(statements);

  return {
    business: { id: businessId, name: input.name, slug },
    ownerUserId,
  };
}
