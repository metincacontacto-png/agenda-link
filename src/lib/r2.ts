import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Sube una imagen en formato base64 a Cloudflare R2 y devuelve su URL de proxy local.
 * Si no es base64, la retorna sin cambios.
 */
export async function uploadBase64ToR2(
  base64Str: string | null | undefined,
  prefix: string
): Promise<string | null | undefined> {
  if (!base64Str || !base64Str.startsWith("data:image/")) {
    return base64Str;
  }

  try {
    const { env } = getCloudflareContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bucket = (env as any).BUCKET;
    if (!bucket) {
      console.warn("R2 bucket binding 'BUCKET' no encontrado, usando Base64 original.");
      return base64Str;
    }

    // Extraer extensión de archivo e información de datos
    const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Formato Base64 inválido");
    }

    const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');
    
    // Nombre de archivo único
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

    await bucket.put(filename, buffer, {
      httpMetadata: {
        contentType: `image/${extension === "jpg" ? "jpeg" : extension}`
      }
    });

    return `/api/media/${filename}`;
  } catch (error) {
    console.error("Error al subir imagen a R2:", error);
    return base64Str;
  }
}

/**
 * Elimina un archivo de Cloudflare R2 dada su URL de proxy local.
 */
export async function deleteFromR2(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith("/api/media/")) {
    return;
  }

  try {
    const { env } = getCloudflareContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bucket = (env as any).BUCKET;
    if (!bucket) return;

    const key = url.replace("/api/media/", "");
    await bucket.delete(key);
  } catch (error) {
    console.error("Error al eliminar imagen de R2:", error);
  }
}
