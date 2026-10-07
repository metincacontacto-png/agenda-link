import { getPublicMedia } from "@/features/media/storage";
import { MediaValidationError } from "@/features/media/validation";
import { logServerError } from "@/server/observability";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    const file = await getPublicMedia(key);
    if (!file) {
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    file.object.writeHttpMetadata(headers);
    headers.set("etag", file.object.httpEtag);
    headers.set("content-type", file.contentType);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(file.object.body, {
      headers,
    });
  } catch (error) {
    logServerError(_request, "media.read.failed", error);
    return new Response("Internal Server Error", {
      status: error instanceof MediaValidationError ? error.status : 500,
    });
  }
}
