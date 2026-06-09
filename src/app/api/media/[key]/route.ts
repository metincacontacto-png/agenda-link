import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (!key) {
      return new Response("Missing key", { status: 400 });
    }

    const { env } = getCloudflareContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bucket = (env as any).BUCKET;
    if (!bucket) {
      return new Response("R2 Bucket not bound", { status: 500 });
    }

    const object = await bucket.get(key);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error("Error al obtener recurso de R2:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
