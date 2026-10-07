export interface OnboardingInput {
  name: string;
  ownerName: string;
  email: string;
  category: string;
  teamSize: string;
  country: "Chile" | "México";
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  password: string | null;
}

export type OnboardingInputResult =
  | { ok: true; value: OnboardingInput }
  | { ok: false; error: string };

function trimmedString(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length > 0 && result.length <= maximum ? result : null;
}

function parseInteger(value: unknown, fallback: number, min: number, max: number): number | null {
  if (value === undefined || value === null || value === "") return fallback;
  const result = typeof value === "number" ? value : Number(value);
  return Number.isInteger(result) && result >= min && result <= max ? result : null;
}

function parsePrice(value: unknown, fallback: number): number | null {
  if (value === undefined || value === null || value === "") return fallback;
  const result = typeof value === "number" ? value : Number(value);
  return Number.isFinite(result) && result >= 0 && result <= 10_000_000 ? result : null;
}

export function parseOnboardingInput(body: unknown): OnboardingInputResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Solicitud inválida" };
  }
  const data = body as Record<string, unknown>;
  const name = trimmedString(data.name, 100);
  const ownerName = trimmedString(data.ownerName, 100);
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const category = trimmedString(data.category, 60);
  const teamSize = trimmedString(data.teamSize, 40);
  const country = data.country;
  const serviceName = typeof data.serviceName === "string" ? data.serviceName.trim() : "";

  if (!name || !ownerName || !category || !teamSize || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, error: "Revisa el nombre, el contacto y los datos del negocio" };
  }
  if (!new Set(["Chile", "México"]).has(String(country))) {
    return { ok: false, error: "País no soportado" };
  }
  if (!new Set(["1 persona", "2-5 personas", "6+ personas"]).has(teamSize)) {
    return { ok: false, error: "Tamaño de equipo inválido" };
  }
  if (serviceName.length > 100) return { ok: false, error: "Nombre de servicio inválido" };

  let defaultName = "Servicio General";
  let defaultDuration = 30;
  let defaultPrice = 15_000;
  if (category === "Peluquería") {
    defaultName = "Corte de Cabello Caballero";
    defaultPrice = 12_000;
  } else if (category === "Salud") {
    defaultName = "Consulta General";
    defaultPrice = 25_000;
  } else if (category === "Fitness") {
    defaultName = "Evaluación o Clase Personalizada";
    defaultDuration = 60;
  } else if (category === "Profesionales") {
    defaultName = "Asesoría o Consultoría Inicial";
    defaultDuration = 45;
    defaultPrice = 30_000;
  }

  const serviceDuration = parseInteger(data.serviceDuration, defaultDuration, 5, 480);
  const servicePrice = parsePrice(data.servicePrice, defaultPrice);
  if (serviceDuration === null || servicePrice === null) {
    return { ok: false, error: "Precio o duración del servicio inválidos" };
  }
  const password = typeof data.password === "string" && data.password.length > 0 ? data.password : null;
  if (password !== null && (password.length < 12 || password.length > 128)) {
    return { ok: false, error: "La contraseña debe tener entre 12 y 128 caracteres" };
  }

  return {
    ok: true,
    value: {
      name,
      ownerName,
      email,
      category,
      teamSize,
      country: country as "Chile" | "México",
      serviceName: serviceName || defaultName,
      serviceDuration,
      servicePrice,
      password,
    },
  };
}
