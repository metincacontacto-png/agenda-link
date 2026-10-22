import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

export function generateValentinaSQL() {
  const userId = crypto.randomUUID();
  const businessId = "valentina-business-001";
  const professionalId = crypto.randomUUID();
  const service1Id = crypto.randomUUID();
  const service2Id = crypto.randomUUID();
  const service3Id = crypto.randomUUID();
  const service4Id = crypto.randomUUID();

  // Password hash genérico para demo
  const passwordHash = "$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890";

  const sqlStatements = [
    // 1. Limpiar si existía
    `DELETE FROM "Business" WHERE "slug" = 'valentina';`,
    `DELETE FROM "User" WHERE "email" = 'contacto@valentina.cl';`,

    // 2. Crear usuario dueña
    `INSERT INTO "User" ("id", "name", "email", "passwordHash", "globalRole", "createdAt", "updatedAt")
     VALUES ('${userId}', 'Valentina Morales', 'contacto@valentina.cl', '${passwordHash}', 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,

    // 3. Crear negocio Valentina Studio
    `INSERT INTO "Business" (
       "id", "name", "slug", "ownerName", "email", "category", "teamSize", "country",
       "currency", "timezone", "plan", "logoUrl", "landingCoverUrl", "landingTitle", "landingSubtitle", "landingAbout",
       "landingPhone", "landingAddress", "landingHours", "billingBypass", "createdAt", "updatedAt"
     ) VALUES (
       '${businessId}', 'Valentina Studio', 'valentina', 'Valentina Morales', 'contacto@valentina.cl',
       'Belleza y Estética', '1 persona', 'CL', 'CLP', 'America/Santiago', 'INDIVIDUAL',
       '/demo/valentina-logo.jpg', '/demo/valentina-banner.jpg',
       'Valentina Studio — Manicura y Estética',
       'Especialistas en manicura rusa, nail art y lifting de pestañas en Providencia.',
       'En Valentina Studio nos dedicamos al cuidado estético personalizado con productos de la más alta calidad y un ambiente diseñado para tu comodidad y desconexión.',
       '+56 9 8765 4321', 'Providencia, Santiago', 'Lunes a Sábado de 10:00 a 19:30 hrs',
       1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
     );`,

    // 4. Crear membresía
    `INSERT INTO "BusinessMember" ("businessId", "userId", "role", "createdAt")
     VALUES ('${businessId}', '${userId}', 'OWNER', CURRENT_TIMESTAMP);`,

    // 5. Crear servicios
    `INSERT INTO "Service" ("id", "businessId", "name", "duration", "price", "imageUrl", "createdAt")
     VALUES ('${service1Id}', '${businessId}', 'Manicura Rusa Combinada', 60, 18000, '/demo/service-manicura.jpg', CURRENT_TIMESTAMP);`,
    `INSERT INTO "Service" ("id", "businessId", "name", "duration", "price", "imageUrl", "createdAt")
     VALUES ('${service2Id}', '${businessId}', 'Esmaltado Permanente + Nivelación', 75, 24000, '/demo/service-esmaltado.jpg', CURRENT_TIMESTAMP);`,
    `INSERT INTO "Service" ("id", "businessId", "name", "duration", "price", "imageUrl", "createdAt")
     VALUES ('${service3Id}', '${businessId}', 'Lifting de Pestañas + Tinte', 60, 22000, '/demo/service-lifting.jpg', CURRENT_TIMESTAMP);`,
    `INSERT INTO "Service" ("id", "businessId", "name", "duration", "price", "imageUrl", "createdAt")
     VALUES ('${service4Id}', '${businessId}', 'Perfilado de Cejas con Henna', 45, 15000, '/demo/service-manicura.jpg', CURRENT_TIMESTAMP);`,

    // 6. Crear profesional
    `INSERT INTO "Professional" ("id", "businessId", "name", "avatar", "createdAt")
     VALUES ('${professionalId}', '${businessId}', 'Valentina Morales', 'VM', CURRENT_TIMESTAMP);`,
  ];

  // Horarios de Lunes (1) a Sábado (6) de 10:00 (600 min) a 19:30 (1170 min)
  for (let day = 1; day <= 6; day++) {
    const bSchedId = crypto.randomUUID();
    const pSchedId = crypto.randomUUID();
    sqlStatements.push(
      `INSERT INTO "BusinessSchedule" ("id", "businessId", "dayOfWeek", "startMinute", "endMinute")
       VALUES ('${bSchedId}', '${businessId}', ${day}, 600, 1170);`,
      `INSERT INTO "ProfessionalSchedule" ("id", "professionalId", "dayOfWeek", "startMinute", "endMinute")
       VALUES ('${pSchedId}', '${professionalId}', ${day}, 600, 1170);`
    );
  }

  return sqlStatements.join("\n");
}

if (process.argv[1]?.endsWith("seed-valentina.mjs")) {
  const sql = generateValentinaSQL();
  console.log("Generado SQL para Valentina Studio...");
  console.log(sql);
}
