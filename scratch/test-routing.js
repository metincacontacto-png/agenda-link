import Database from "better-sqlite3";
import path from "path";

async function main() {
  console.log("=== INICIANDO PRUEBA DE RUTEO DE DOMINIO Y BYPASS CON SEEDING ===");

  const dbPath = path.resolve(__dirname, "../prisma/dev.db");
  console.log(`Conectando a base de datos SQLite en: ${dbPath}`);
  
  let db;
  try {
    db = new Database(dbPath, { fileMustExist: true });
    console.log("✅ Conexión exitosa a dev.db");
  } catch (err) {
    console.error("❌ Error al abrir la base de datos:", err.message);
    return;
  }

  const testSlug = "estilo-test-temp";
  const testDomain = "test-estilo-local.cl";

  try {
    // 1. Crear un negocio de prueba temporal
    console.log("\n🌱 Insertando negocio temporal...");
    const insertStmt = db.prepare(`
      INSERT INTO Business (id, name, slug, ownerName, category, teamSize, country, currency, plan, billingBypass, customDomain, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    insertStmt.run(
      "test-uuid-12345",
      "Estilo Test Temp",
      testSlug,
      "Giovanni Test",
      "Belleza",
      "1-5",
      "Chile",
      "CLP",
      "INDIVIDUAL",
      0,
      null
    );
    console.log("✅ Negocio temporal insertado con éxito.");

    // 2. Verificar datos iniciales
    const business = db.prepare("SELECT * FROM Business WHERE slug = ?").get(testSlug);
    console.log(`\n💼 Negocio inicial: ${business.name} (slug: "${business.slug}")`);
    console.log(`Plan: ${business.plan}, BillingBypass: ${business.billingBypass}, CustomDomain: ${business.customDomain || "Ninguno"}`);

    // 3. Probar actualización simulando Super Admin
    console.log("\n🔄 Simulando actualización desde Super Admin...");
    
    const updateStmt = db.prepare(`
      UPDATE Business 
      SET plan = ?, billingBypass = ?, customDomain = ?
      WHERE slug = ?
    `);
    
    updateStmt.run("EQUIPO", 1, testDomain, testSlug);
    
    const updated = db.prepare("SELECT * FROM Business WHERE slug = ?").get(testSlug);
    console.log("✅ Negocio actualizado con éxito:");
    console.log(`Plan nuevo: ${updated.plan}, BillingBypass: ${updated.billingBypass === 1 ? "true" : "false"}, CustomDomain: ${updated.customDomain}`);

    // 4. Probar resolución del dominio (Domain Lookup)
    console.log(`\n🔍 Buscando negocio por dominio "${testDomain}"...`);
    const resolved = db.prepare("SELECT slug FROM Business WHERE customDomain = ?").get(testDomain);

    if (resolved && resolved.slug === testSlug) {
      console.log(`✅ ¡Dominio resuelto correctamente! Se mapea al slug: "${resolved.slug}"`);
    } else {
      console.log("❌ Error al resolver el dominio.");
    }

  } catch (error) {
    console.error("❌ Ocurrió un error durante la prueba:", error);
  } finally {
    // 5. Limpiar datos temporales
    console.log("\n🧹 Limpiando negocio temporal de la base de datos...");
    try {
      db.prepare("DELETE FROM Business WHERE slug = ?").run(testSlug);
      console.log("✅ Base de datos limpia.");
    } catch (cleanErr) {
      console.error("❌ Error al limpiar datos:", cleanErr.message);
    }

    if (db) {
      db.close();
      console.log("Conexión de base de datos cerrada.");
    }
    console.log("\n=== PRUEBA FINALIZADA CON ÉXITO ===");
  }
}

main();
