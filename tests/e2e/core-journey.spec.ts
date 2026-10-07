import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const password = "E2E-TestPassword123!";
const runId = randomUUID().slice(0, 8);
const ownerEmail = `e2e-owner-${runId}@example.invalid`;
const otherOwnerEmail = `e2e-other-${runId}@example.invalid`;
const ownerName = `E2E Owner ${runId}`;
const businessName = `E2E Clinic ${runId}`;
const otherBusinessName = `E2E Other ${runId}`;
const createdSlugs: string[] = [];

function executeLocalSql(sql: string) {
  execFileSync("npx", ["wrangler", "d1", "execute", "agenda-link-db", "--local", "--command", sql], {
    stdio: "ignore",
  });
}

test.afterAll(() => {
  executeLocalSql(`
    DELETE FROM "Business" WHERE "slug" IN (${createdSlugs.map((slug) => `'${slug}'`).join(",") || "''"});
    DELETE FROM "User" WHERE "email" IN ('${ownerEmail}','${otherOwnerEmail}');
    INSERT OR REPLACE INTO "SystemSetting" ("key","value") VALUES ('maintenanceMode','false');
  `);
});

test("onboards an owner, protects their panel, completes a public booking, and rejects another business", async ({ page, request }) => {
  await page.goto("/");
  await page.locator('#registro input[name="name"]').fill(businessName);
  await page.locator('#registro input[name="ownerName"]').fill(ownerName);
  await page.locator('#registro input[name="email"]').fill(ownerEmail);
  await page.locator('#registro input[name="password"]').fill(password);
  await page.locator("#registro").getByRole("button", { name: "Crear mi link" }).click();

  await expect(page.getByText("¡Tu AgendaLink está lista!")).toBeVisible();
  const adminHref = await page.getByRole("link", { name: "Panel de Control" }).getAttribute("href");
  expect(adminHref).toBeTruthy();
  const slug = adminHref!.replace(/^\/admin\//, "");
  createdSlugs.push(slug);

  await page.getByRole("link", { name: "Panel de Control" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/${slug}$`));
  await expect(page.getByRole("heading", { name: businessName })).toBeVisible();

  await page.context().clearCookies();
  await page.goto(`/admin/${slug}`);
  await expect(page.getByRole("heading", { name: "Acceso restringido" })).toBeVisible();

  await page.goto(`/login?next=${encodeURIComponent(`/admin/${slug}`)}`);
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/${slug}$`));
  await expect(page.getByRole("heading", { name: businessName })).toBeVisible();

  await page.getByRole("button", { name: "Ventas y Caja" }).click();
  await expect(page.getByRole("heading", { name: "Estado de pago en reservas" })).toBeVisible();
  await expect(page.getByPlaceholder("4242 4242 4242 4242")).toHaveCount(0);
  await page.getByRole("button", { name: "Base de Clientes" }).click();
  await expect(page.getByRole("heading", { name: "Clientes con reservas cargadas" })).toBeVisible();

  await page.getByRole("button", { name: "Ajustes de Negocio" }).click();
  const addedServiceName = `Servicio E2E ${runId}`;
  await page.getByPlaceholder("Ej. Corte Masculino + Lavado").fill(addedServiceName);
  await page.getByPlaceholder("Ej. 15000").fill("12000");
  await page.getByRole("button", { name: "Crear Servicio" }).click();
  await expect(page.getByText(addedServiceName)).toBeVisible();

  await page.getByRole("button", { name: "Equipo", exact: true }).click();
  await expect(page.getByText(ownerName)).toBeVisible();
  await page.getByRole("button", { name: "Personalizar Landing", exact: true }).click();
  const landingTitle = `Agenda E2E ${runId}`;
  await page.getByPlaceholder("Ej. Corte y Estilo Exclusivo").fill(landingTitle);
  const saveDialog = page.waitForEvent("dialog");
  await page.getByRole("button", { name: "Guardar Cambios" }).click();
  await (await saveDialog).accept();

  await page.goto(`/${slug}`);
  await expect(page.getByRole("heading", { name: landingTitle })).toBeVisible();
  await page.getByRole("button", { name: "Reservar Cita Online" }).click();
  await page.getByRole("button", { name: /Corte de Cabello Caballero/ }).click();
  await page.locator('[class*="daysRow"] button').nth(1).click();
  const firstAvailableTime = page.getByRole("button", { name: "09:00", exact: true });
  await expect(firstAvailableTime).toBeVisible();
  await firstAvailableTime.click();
  await page.getByRole("button", { name: "Confirmar Reserva" }).click();
  await page.getByLabel("Nombre Completo").fill("E2E Client");
  await page.getByLabel("Número de WhatsApp").fill("+56912345678");
  await page.getByRole("button", { name: "Confirmar Reserva", exact: true }).last().click();
  await expect(page).toHaveURL(new RegExp(`/${slug}/success\\?appId=`));
  await expect(page.getByText(/Pendiente ·/)).toBeVisible();

  const otherBusinessResponse = await request.post("/api/onboarding", {
    data: {
      name: otherBusinessName,
      ownerName: `Other Owner ${runId}`,
      email: otherOwnerEmail,
      password,
      category: "Peluquería",
      teamSize: "1 persona",
      country: "Chile",
    },
  });
  expect(otherBusinessResponse.status()).toBe(201);
  const otherBusiness = await otherBusinessResponse.json();
  createdSlugs.push(otherBusiness.business.slug);

  await page.goto(`/admin/${otherBusiness.business.slug}`);
  await expect(page.getByRole("heading", { name: "Acceso restringido" })).toBeVisible();

  executeLocalSql("INSERT OR REPLACE INTO \"SystemSetting\" (\"key\",\"value\") VALUES ('maintenanceMode','true');");
  try {
    await page.goto(`/${slug}`);
    await expect(page.getByRole("heading", { name: "Plataforma en Mantenimiento" })).toBeVisible();
  } finally {
    executeLocalSql("INSERT OR REPLACE INTO \"SystemSetting\" (\"key\",\"value\") VALUES ('maintenanceMode','false');");
  }
});
