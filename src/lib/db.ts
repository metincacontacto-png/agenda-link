import { PrismaClient } from "@prisma/client/wasm";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

// Cachear el cliente a nivel de petición en Next.js
const getDb = cache(() => {
  try {
    const { env } = getCloudflareContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d1 = (env as any).DB; // "DB" es el binding de wrangler.toml
    if (!d1) {
      throw new Error("No se encontró el binding D1 'DB' en el entorno de Cloudflare.");
    }
    const adapter = new PrismaD1(d1);
    return new PrismaClient({ adapter });
  } catch (e) {
    console.error("Error inicializando Prisma con D1:", e);
    throw e;
  }
});

// Proxy dinámico para mantener compatibilidad 100% transparente con "import { prisma } from '@/lib/db'"
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const db = getDb();
    return Reflect.get(db, prop, receiver);
  }
});

