import type { D1DatabaseBinding, D1PreparedStatement } from "@/lib/cloudflare";

export interface DefaultTeamStatements {
  professionalId: string;
  statements: D1PreparedStatement[];
}

export function prepareDefaultTeam(
  database: D1DatabaseBinding,
  businessId: string,
  ownerName: string,
): DefaultTeamStatements {
  const professionalId = crypto.randomUUID();
  const avatar = ownerName.substring(0, 2).toUpperCase();
  const scheduleRows = Array.from({ length: 7 }, (_, dayOfWeek) => [
    crypto.randomUUID(), professionalId, dayOfWeek, 540, 1080,
  ]).flat();
  const insertSchedule = `INSERT INTO "ProfessionalSchedule" ("id","professionalId","dayOfWeek","startMinute","endMinute") VALUES ${Array.from({ length: 7 }, () => "(?,?,?,?,?)").join(",")}`;

  return {
    professionalId,
    statements: [
      database.prepare(`
        INSERT INTO "Professional" ("id","businessId","name","avatar","createdAt")
        VALUES (?,?,?,?,CURRENT_TIMESTAMP)
      `).bind(professionalId, businessId, ownerName, avatar),
      database.prepare(insertSchedule).bind(...scheduleRows),
    ],
  };
}
