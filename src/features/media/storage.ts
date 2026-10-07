import { getR2Bucket, type R2ObjectBody } from "@/lib/r2";
import {
  createMediaKey,
  isSafeMediaKey,
  MediaValidationError,
  mediaContentType,
  parseImageDataUrl,
  type ParsedImage,
} from "@/features/media/validation";

function getConfiguredBucket() {
  const bucket = getR2Bucket();
  if (!bucket && process.env.NODE_ENV !== "development") {
    throw new MediaValidationError("El bucket R2 es obligatorio y no está configurado.", 503);
  }
  return bucket;
}

/** Validates a media URL and stores verified Base64 images in R2. */
export async function uploadBase64ToR2(
  imageUrl: string | null | undefined,
  prefix: string,
): Promise<string | null | undefined> {
  if (!imageUrl) return imageUrl;

  if (imageUrl.startsWith("/api/media/")) {
    const existingKey = imageUrl.slice("/api/media/".length);
    if (!isSafeMediaKey(existingKey)) throw new MediaValidationError("La ruta de imagen no es válida.");
    return imageUrl;
  }

  if (!imageUrl.startsWith("data:")) {
    if (imageUrl.startsWith("/")) {
      if (imageUrl.startsWith("//")) throw new MediaValidationError("La ruta de imagen no es válida.");
      return imageUrl;
    }
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== "https:") throw new MediaValidationError("Las imágenes externas deben usar HTTPS.");
      return imageUrl;
    } catch (error) {
      if (error instanceof MediaValidationError) throw error;
      throw new MediaValidationError("La URL de imagen no es válida.");
    }
  }

  const image = parseImageDataUrl(imageUrl);
  const bucket = getConfiguredBucket();
  if (!bucket) return imageUrl;

  const key = createMediaKey(prefix, image.extension);
  await bucket.put(key, image.bytes, { httpMetadata: { contentType: image.contentType } });
  return `/api/media/${key}`;
}

/** Deletes only validated application-owned media keys. */
export async function deleteFromR2(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith("/api/media/")) return;
  const key = url.slice("/api/media/".length);
  if (!isSafeMediaKey(key)) throw new MediaValidationError("La ruta de imagen no es válida.");
  const bucket = getConfiguredBucket();
  if (!bucket) return;
  await bucket.delete(key);
}

export interface PublicMediaFile {
  object: R2ObjectBody;
  contentType: ParsedImage["contentType"];
}

/** Resolves a safe public media key to a stored object and trusted content type. */
export async function getPublicMedia(key: string): Promise<PublicMediaFile | null> {
  if (!isSafeMediaKey(key)) return null;
  const bucket = getConfiguredBucket();
  if (!bucket) return null;
  const object = await bucket.get(key);
  if (!object) return null;
  const contentType = mediaContentType(key);
  if (!contentType) return null;
  return { object, contentType };
}
