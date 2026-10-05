import { getCloudflareContext } from "@opennextjs/cloudflare";

const SESSION_COOKIE = "agenda_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const PBKDF2_ITERATIONS = 600_000;
const encoder = new TextEncoder();
const DUMMY_PASSWORD_HASH =
  "pbkdf2-sha256$600000$MDEyMzQ1Njc4OWFiY2RlZg$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export interface SessionClaims {
  sub: string;
  iat: number;
  exp: number;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getSessionSigningSecret(): string | undefined {
  try {
    const { env } = getCloudflareContext();
    const workerSecret = (env as { SESSION_SIGNING_SECRET?: string }).SESSION_SIGNING_SECRET;
    return workerSecret || process.env.SESSION_SIGNING_SECRET;
  } catch {
    return process.env.SESSION_SIGNING_SECRET;
  }
}

export function hasSessionSigningSecret(): boolean {
  const secret = getSessionSigningSecret();
  return Boolean(secret && secret.length >= 32);
}

async function importSigningKey(): Promise<CryptoKey> {
  const secret = getSessionSigningSecret();
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SIGNING_SECRET is not configured or is too short");
  }

  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer as ArrayBuffer;
}

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function createSessionToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims: SessionClaims = {
    sub: userId,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const payload = encodeBase64Url(encoder.encode(JSON.stringify(claims)));
  const key = await importSigningKey();
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payload)),
  );
  return `${payload}.${encodeBase64Url(signature)}`;
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  if (token.length > 2048) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const signatureBytes = decodeBase64Url(signature);
  const payloadBytes = decodeBase64Url(payload);
  if (!signatureBytes || !payloadBytes) return null;

  const key = await importSigningKey();
  const validSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    asBufferSource(signatureBytes),
    encoder.encode(payload),
  );
  if (!validSignature) return null;

  try {
    const claims = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<SessionClaims>;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof claims.sub !== "string" ||
      !claims.sub ||
      typeof claims.iat !== "number" ||
      typeof claims.exp !== "number" ||
      claims.iat > now + 60 ||
      claims.exp <= now ||
      claims.exp - claims.iat > SESSION_TTL_SECONDS
    ) {
      return null;
    }
    return claims as SessionClaims;
  } catch {
    return null;
  }
}

export function getSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) return value.join("=") || null;
  }
  return null;
}

export function sessionCookie(token: string, maxAge = SESSION_TTL_SECONDS): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: asBufferSource(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      key,
      256,
    ),
  );
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${encodeBase64Url(salt)}$${encodeBase64Url(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string | null): Promise<boolean> {
  const encoded = storedHash ?? DUMMY_PASSWORD_HASH;
  const [algorithm, iterationsString, saltString, expectedString] = encoded.split("$");
  const iterations = Number(iterationsString);
  const salt = decodeBase64Url(saltString ?? "");
  const expected = decodeBase64Url(expectedString ?? "");

  if (
    algorithm !== "pbkdf2-sha256" ||
    iterations !== PBKDF2_ITERATIONS ||
    !salt ||
    salt.length !== 16 ||
    !expected ||
    expected.length !== 32
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const actual = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: asBufferSource(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      key,
      256,
    ),
  );
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected[index] ^ actual[index];
  }
  return storedHash !== null && difference === 0;
}

export function validEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validPassword(password: string): boolean {
  return password.length >= 12 && password.length <= 128;
}

export function genericAuthError(status = 401): Response {
  return Response.json({ error: "Email o contraseña incorrectos" }, { status });
}
