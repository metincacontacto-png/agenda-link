export interface CreateServiceInput {
  name: string;
  price: number;
  duration: number;
  imageUrl?: string | null;
}

export type CreateServiceResult =
  | { ok: true; value: CreateServiceInput }
  | { ok: false; error: string };

export function parseCreateServiceInput(input: unknown): CreateServiceResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Datos de servicio inválidos" };
  }
  const record = input as Record<string, unknown>;
  if (typeof record.name !== "string" || record.name.trim().length < 1 || record.name.trim().length > 100) {
    return { ok: false, error: "Nombre de servicio inválido" };
  }
  const price = typeof record.price === "number" ? record.price : Number(record.price);
  const duration = typeof record.duration === "number" ? record.duration : Number(record.duration);
  if (!Number.isFinite(price) || price < 0 || price > 10_000_000) {
    return { ok: false, error: "Precio de servicio inválido" };
  }
  if (!Number.isInteger(duration) || duration < 5 || duration > 480) {
    return { ok: false, error: "Duración de servicio inválida" };
  }
  if (record.imageUrl !== undefined && record.imageUrl !== null && typeof record.imageUrl !== "string") {
    return { ok: false, error: "Imagen de servicio inválida" };
  }
  return {
    ok: true,
    value: {
      name: record.name.trim(),
      price,
      duration,
      imageUrl: record.imageUrl as string | null | undefined,
    },
  };
}
