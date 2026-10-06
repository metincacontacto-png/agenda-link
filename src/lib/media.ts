export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export class MediaValidationError extends Error {
  readonly status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "MediaValidationError";
    this.status = status;
  }
}

export interface ParsedImage {
  bytes: Uint8Array;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
}

function detectedImageType(bytes: Uint8Array): ParsedImage["contentType"] | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function parseImageDataUrl(value: string): ParsedImage {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new MediaValidationError("Solo se admiten imágenes PNG, JPEG o WebP en Base64.");

  const encoded = match[2];
  const maximumEncodedLength = Math.ceil(MAX_MEDIA_BYTES / 3) * 4;
  if (encoded.length > maximumEncodedLength) {
    throw new MediaValidationError("La imagen supera el límite de 5 MB.", 413);
  }
  if (encoded.length % 4 !== 0) {
    throw new MediaValidationError("El contenido Base64 está mal formado.");
  }

  let bytes: Uint8Array;
  try {
    const binary = atob(encoded);
    if (binary.length > MAX_MEDIA_BYTES) {
      throw new MediaValidationError("La imagen supera el límite de 5 MB.", 413);
    }
    bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch (error) {
    if (error instanceof MediaValidationError) throw error;
    throw new MediaValidationError("El contenido Base64 está mal formado.");
  }

  const actualType = detectedImageType(bytes);
  if (!actualType || actualType !== match[1]) {
    throw new MediaValidationError("El contenido de la imagen no coincide con su MIME declarado.");
  }

  const extension: ParsedImage["extension"] = actualType === "image/jpeg"
    ? "jpg"
    : actualType === "image/png"
      ? "png"
      : "webp";
  return { bytes, contentType: actualType, extension };
}

export function createMediaKey(prefix: string, extension: ParsedImage["extension"]): string {
  if (!/^[a-z0-9_-]{1,128}$/i.test(prefix)) {
    throw new MediaValidationError("El prefijo del archivo no es válido.");
  }
  return `img_${prefix}_${crypto.randomUUID()}.${extension}`;
}

export function isSafeMediaKey(key: string): boolean {
  const generated = /^img_[a-z0-9_-]{1,128}_[0-9a-f-]{36}\.(?:jpg|png|webp)$/i;
  const legacy = /^(?:logo|cover|seccover|service)_[a-z0-9-]{1,80}_\d{10,13}_[a-z0-9]{6}\.(?:jpg|jpeg|png|webp)$/i;
  return generated.test(key) || legacy.test(key);
}

export function mediaContentType(key: string): ParsedImage["contentType"] | null {
  if (!isSafeMediaKey(key)) return null;
  const extension = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return null;
}
