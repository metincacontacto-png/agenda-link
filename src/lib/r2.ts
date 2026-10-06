import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createMediaKey, isSafeMediaKey, MediaValidationError, parseImageDataUrl } from "@/features/media/validation";

interface R2ObjectBody {
  body: ReadableStream | null;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
}

interface R2BucketBinding {
  put(key: string, value: Uint8Array, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}

export function getR2Bucket(): R2BucketBinding | undefined {
  let bucket: R2BucketBinding | undefined;
  try {
    const { env } = getCloudflareContext();
    bucket = (env as unknown as { BUCKET?: R2BucketBinding }).BUCKET;
  } catch {
    bucket = undefined;
  }

  if (!bucket && process.env.NODE_ENV !== "development") {
    throw new MediaValidationError("El bucket R2 es obligatorio y no está configurado.", 503);
  }
  return bucket;
}

/** Stores verified images in R2. Base64 fallback is only available in development. */
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
  const bucket = getR2Bucket();
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
  const bucket = getR2Bucket();
  if (!bucket) return;
  await bucket.delete(key);
}
