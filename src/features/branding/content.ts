export interface LandingFeature {
  title: string;
  desc: string;
}

export interface LandingTestimonial {
  author: string;
  rating: number;
  text: string;
}

const DEFAULT_FEATURES: LandingFeature[] = [
  { title: "Elige tu servicio", desc: "Consulta las opciones y sus duraciones." },
  { title: "Selecciona un horario", desc: "Revisa la disponibilidad antes de reservar." },
  { title: "Reserva en línea", desc: "Envía tus datos de contacto al negocio." },
];

function parseArray(value: string | null): unknown[] | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseLandingFeatures(value: string | null): LandingFeature[] {
  const parsed = parseArray(value);
  const features = parsed?.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    if (typeof record.title !== "string" || typeof record.desc !== "string") return [];
    return [{ title: record.title, desc: record.desc }];
  });
  return features?.length ? features : DEFAULT_FEATURES;
}

export function parseLandingTestimonials(value: string | null): LandingTestimonial[] {
  const parsed = parseArray(value);
  const testimonials = parsed?.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    const author = typeof record.author === "string" ? record.author : record.name;
    const rating = typeof record.rating === "number" ? record.rating : record.stars;
    if (typeof author !== "string" || typeof record.text !== "string") return [];
    return [{
      author,
      rating: typeof rating === "number" && rating >= 1 && rating <= 5 ? Math.floor(rating) : 5,
      text: record.text,
    }];
  });
  return testimonials ?? [];
}
