function safeErrorDetails(error: unknown): { name: string; code?: string } {
  if (!(error instanceof Error)) return { name: "UnknownError" };
  const name = /^[A-Za-z0-9_]{1,64}$/.test(error.name) ? error.name : "Error";
  const code = typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
  return {
    name,
    ...(typeof code === "string" && /^[A-Za-z0-9_]{1,32}$/.test(code) ? { code } : {}),
  };
}

export function logServerError(
  request: Request,
  event: string,
  error: unknown,
  context: { businessId?: string } = {},
): void {
  const url = new URL(request.url);
  const requestId = request.headers.get("cf-ray") ?? crypto.randomUUID();
  const safeEvent = /^[a-z0-9_.-]{1,80}$/i.test(event) ? event : "server.error";

  console.error(JSON.stringify({
    level: "error",
    timestamp: new Date().toISOString(),
    event: safeEvent,
    requestId,
    method: request.method,
    route: url.pathname,
    ...(context.businessId && /^[a-z0-9_-]{1,100}$/i.test(context.businessId)
      ? { businessId: context.businessId }
      : {}),
    error: safeErrorDetails(error),
  }));
}
