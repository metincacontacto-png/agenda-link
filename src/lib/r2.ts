import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface R2ObjectBody {
  body: ReadableStream | null;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
}

export interface R2BucketBinding {
  put(key: string, value: Uint8Array, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}

export function getR2Bucket(): R2BucketBinding | undefined {
  try {
    const { env } = getCloudflareContext();
    return (env as unknown as { BUCKET?: R2BucketBinding }).BUCKET;
  } catch {
    return undefined;
  }
}
