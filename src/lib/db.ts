import { PrismaClient as WASMPrismaClient } from "@prisma/client/wasm";
import { PrismaClient as NativePrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

// Cachear el cliente a nivel de petición en Next.js
const getDb = cache(() => {
  try {
    const { env } = getCloudflareContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d1 = (env as any).DB; // "DB" es el binding de wrangler.toml
    if (d1) {
      const adapter = new PrismaD1(d1);
      return new WASMPrismaClient({ adapter });
    }
    console.warn("No se encontró el binding D1 'DB' en el entorno. Usando SQLite local.");
  } catch (e) {
    console.warn("getCloudflareContext falló. Usando SQLite local. (Detalle: " + (e as Error).message + ")");
  }
  
  // Fallback a SQLite local
  return new NativePrismaClient();
});

// Proxy dinámico para mantener compatibilidad 100% transparente con "import { prisma } from '@/lib/db'"
export const prisma = new Proxy({} as NativePrismaClient, {
  get(target, prop, receiver) {
    const db = getDb();
    return Reflect.get(db, prop, receiver);
  }
});

