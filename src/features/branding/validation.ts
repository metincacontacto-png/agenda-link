export interface UpdateBusinessProfileInput {
  name?: string;
  category?: string;
  teamSize?: string;
  currency?: string;
  logoUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  landingAbout?: string | null;
  landingCoverUrl?: string | null;
  landingSecondaryCoverUrl?: string | null;
  landingPhone?: string | null;
  landingAddress?: string | null;
  landingHours?: string | null;
  landingFeaturesJson?: string | null;
  landingTestimonialsJson?: string | null;
  plan?: "INDIVIDUAL" | "EQUIPO" | "NEGOCIO";
}

export type BusinessProfileInputResult =
  | { ok: true; value: UpdateBusinessProfileInput }
  | { ok: false; error: string };

const OPTIONAL_TEXT_LIMITS = {
  logoUrl: 8 * 1024 * 1024,
  landingTitle: 200,
  landingSubtitle: 500,
  landingAbout: 5000,
  landingCoverUrl: 8 * 1024 * 1024,
  landingSecondaryCoverUrl: 8 * 1024 * 1024,
  landingPhone: 50,
  landingAddress: 300,
  landingHours: 300,
  landingFeaturesJson: 10_000,
  landingTestimonialsJson: 10_000,
} as const;

export function parseBusinessProfileInput(input: unknown): BusinessProfileInputResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Datos del negocio inválidos" };
  }
  const record = input as Record<string, unknown>;
  const result: UpdateBusinessProfileInput = {};

  if (record.name !== undefined) {
    if (typeof record.name !== "string" || record.name.trim().length < 1 || record.name.trim().length > 100) {
      return { ok: false, error: "Nombre del negocio inválido" };
    }
    result.name = record.name.trim();
  }
  if (record.category !== undefined) {
    if (typeof record.category !== "string" || record.category.trim().length < 1 || record.category.length > 60) {
      return { ok: false, error: "Categoría inválida" };
    }
    result.category = record.category.trim();
  }
  if (record.teamSize !== undefined) {
    if (typeof record.teamSize !== "string" || record.teamSize.trim().length < 1 || record.teamSize.length > 40) {
      return { ok: false, error: "Tamaño de equipo inválido" };
    }
    result.teamSize = record.teamSize.trim();
  }
  if (record.currency !== undefined) {
    if (typeof record.currency !== "string" || !["CLP", "MXN", "USD"].includes(record.currency)) {
      return { ok: false, error: "Moneda inválida" };
    }
    result.currency = record.currency;
  }

  for (const [field, maximumLength] of Object.entries(OPTIONAL_TEXT_LIMITS) as Array<[
    keyof typeof OPTIONAL_TEXT_LIMITS,
    number,
  ]>) {
    const value = record[field];
    if (value === undefined) continue;
    if (value !== null && (typeof value !== "string" || value.length > maximumLength)) {
      return { ok: false, error: `El campo ${field} no es válido` };
    }
    result[field] = value as string | null;
  }

  if (record.plan !== undefined) {
    if (typeof record.plan !== "string" || !["INDIVIDUAL", "EQUIPO", "NEGOCIO"].includes(record.plan)) {
      return { ok: false, error: "Plan inválido" };
    }
    result.plan = record.plan as UpdateBusinessProfileInput["plan"];
  }
  if (Object.keys(result).length === 0) {
    return { ok: false, error: "No hay cambios de negocio para guardar" };
  }
  return { ok: true, value: result };
}
