import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1BindValue = string | number | boolean | null | ArrayBuffer | ArrayBufferView;

export interface D1PreparedStatement {
  bind(...values: D1BindValue[]): D1PreparedStatement;
}

export interface D1DatabaseBinding {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export function getD1Database(): D1DatabaseBinding {
  const { env } = getCloudflareContext();
  const database = (env as unknown as { DB?: D1DatabaseBinding }).DB;
  if (!database) throw new Error("Cloudflare D1 binding DB is not configured");
  return database;
}
