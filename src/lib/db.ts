import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

// Cachear el cliente a nivel de petición en Next.js
const getDb = cache(() => {
  try {
    const { env } = getCloudflareContext();
    const { DB } = env as unknown as {
      DB?: ConstructorParameters<typeof PrismaD1>[0];
    };
    const d1 = DB; // "DB" es el binding de wrangler.toml
    if (d1) {
      const adapter = new PrismaD1(d1);
      return new PrismaClient({ adapter });
    }
    console.warn("No se encontró el binding D1 'DB' en el entorno. Usando SQLite local.");
  } catch (e) {
    console.warn("getCloudflareContext falló. Usando SQLite local. (Detalle: " + (e as Error).message + ")");
  }
  
  try {
    return new PrismaClient();
  } catch (err) {
    console.error("Error al cargar PrismaClient nativo local:", err);
    throw new Error("No se pudo inicializar la base de datos.");
  }
});

// Proxy dinámico para mantener compatibilidad 100% transparente con "import { prisma } from '@/lib/db'"
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const db = getDb();
    return Reflect.get(db, prop, receiver);
  }
});
