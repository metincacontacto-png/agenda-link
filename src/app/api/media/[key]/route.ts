import { getR2Bucket } from "@/lib/r2";
import { isSafeMediaKey, mediaContentType, MediaValidationError } from "@/lib/media";
import { logServerError } from "@/lib/observability";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    if (!isSafeMediaKey(key)) {
      return new Response("Not Found", { status: 404 });
    }

    const bucket = getR2Bucket();
    if (!bucket) {
      return new Response("Not Found", { status: 404 });
    }

    const object = await bucket.get(key);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("content-type", mediaContentType(key) ?? "application/octet-stream");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    logServerError(_request, "media.read.failed", error);
    return new Response("Internal Server Error", {
      status: error instanceof MediaValidationError ? error.status : 500,
    });
  }
}
