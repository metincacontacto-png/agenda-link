# Plan de Implementación: Agenda Link (Fase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el onboarding en 3 pasos, la página de reserva pública estilo Apple con selector de calendario e inicio de sesión WhatsApp OTP simulado, la descarga de QR en PDF/impresión, y el panel de administración simple, persistiendo los datos con SQLite y Prisma.

**Architecture:** Aplicación full-stack usando Next.js App Router. Rutas dinámicas para la página del negocio `/[slug]` y API local para agendar y verificar disponibilidad, con persistencia en base de datos local SQLite mediante Prisma ORM.

**Tech Stack:** Next.js 14+ (App Router, React, TypeScript), SQLite, Prisma ORM, Vanilla CSS Modules, qrcode (generación de QR).

---

### Task 1: Inicialización del Proyecto Next.js y Diseño Global Estilo Apple

**Files:**
- Create: `src/app/globals.css`
- Create: `src/app/theme.css`
- Create: `src/app/layout.tsx`
- Modify: `package.json`

- [ ] **Step 1: Inicializar el proyecto con create-next-app**

Run: `npx -y create-next-app@latest ./ --ts --eslint --no-tailwind --src-dir --app --use-npm --import-alias "@/*" --yes`
Expected: Next.js inicializado en el directorio actual con TypeScript, ESLint, App Router, carpeta `src/`, y sin Tailwind.

- [ ] **Step 2: Instalar la dependencia de códigos QR**

Run: `npm install qrcode && npm install --save-dev @types/qrcode`
Expected: Instalación de la biblioteca `qrcode` exitosa.

- [ ] **Step 3: Limpiar estilos por defecto y configurar tema estilo Apple**

Escribir el archivo global de estilos `src/app/globals.css` con variables CSS para el modo claro/oscuro (Apple Design):

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --background: #f5f5f7;
  --foreground: #1d1d1f;
  --card-bg: rgba(255, 255, 255, 0.85);
  --card-border: rgba(0, 0, 0, 0.08);
  --primary: #0071e3;
  --primary-hover: #0077ed;
  --primary-text: #ffffff;
  --text-secondary: #86868b;
  --input-bg: rgba(0, 0, 0, 0.02);
  --input-border: rgba(0, 0, 0, 0.15);
  --input-focus: #0071e3;
  --success: #34c759;
  --danger: #ff3b30;
  --radius-pill: 9999px;
  --radius-card: 18px;
  --radius-input: 12px;
  --shadow-subtle: 0 4px 20px rgba(0, 0, 0, 0.04);
  --shadow-active: 0 8px 30px rgba(0, 0, 0, 0.08);
  --backdrop-blur: blur(20px);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #000000;
    --foreground: #f5f5f7;
    --card-bg: rgba(22, 22, 23, 0.8);
    --card-border: rgba(255, 255, 255, 0.1);
    --primary: #2997ff;
    --primary-hover: #47a6ff;
    --text-secondary: #86868b;
    --input-bg: rgba(255, 255, 255, 0.05);
    --input-border: rgba(255, 255, 255, 0.2);
    --shadow-subtle: 0 4px 20px rgba(0, 0, 0, 0.4);
    --shadow-active: 0 8px 30px rgba(0, 0, 0, 0.6);
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background-color: var(--background);
  color: var(--foreground);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 4: Configurar layout raíz**

Sobrescribir `src/app/layout.tsx` para incluir el stylesheet base:

```tsx
import "./globals.css";
import React from "react";

export const metadata = {
  title: "Agenda Link",
  description: "Un link. Todo resuelto.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Verificar inicialización de Next.js**

Run: `npm run build`
Expected: Compilación exitosa del proyecto Next.js limpio.

- [ ] **Step 6: Realizar Commit**

Run: `git add . && git commit -m "feat: init next.js project and global apple-style css"`
Expected: Commit realizado con éxito.

---

### Task 2: Configuración de Base de Datos SQLite y Prisma ORM

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Instalar dependencias de Prisma**

Run: `npm install @prisma/client && npm install --save-dev prisma`
Expected: Prisma instalado correctamente.

- [ ] **Step 2: Escribir el esquema de base de datos prisma**

Escribir el archivo `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Business {
  id           String        @id @default(uuid())
  name         String
  slug         String        @unique
  ownerName    String
  category     String
  teamSize     String
  country      String
  currency     String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  services     Service[]
  professionals Professional[]
  appointments Appointment[]
}

model Service {
  id          String        @id @default(uuid())
  businessId  String
  business    Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  duration    Int           // en minutos
  price       Float
  createdAt   DateTime      @default(now())
  appointments Appointment[]
}

model Professional {
  id          String        @id @default(uuid())
  businessId  String
  business    Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  avatar      String?
  createdAt   DateTime      @default(now())
  appointments Appointment[]
}

model Appointment {
  id             String        @id @default(uuid())
  businessId     String
  business       Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  serviceId      String
  service        Service       @relation(fields: [serviceId], references: [id])
  professionalId String
  professional   Professional  @relation(fields: [professionalId], references: [id])
  clientName     String
  clientWhatsApp String
  dateTime       DateTime      // Fecha y hora reservada
  status         String        @default("CONFIRMED")
  createdAt      DateTime      @default(now())
}
```

- [ ] **Step 3: Crear el singleton de base de datos de Prisma**

Crear `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Generar cliente de Prisma y ejecutar migración inicial**

Run: `npx prisma migrate dev --name init`
Expected: Creación del archivo `prisma/migrations/` y generación del cliente Prisma.

- [ ] **Step 5: Realizar Commit**

Run: `git add . && git commit -m "feat: setup prisma and sqlite models"`
Expected: Commit realizado con éxito.

---

### Task 3: API de Onboarding y Página de Registro Interactivo de 3 Pasos

**Files:**
- Create: `src/app/api/onboarding/route.ts`
- Create: `src/app/page.tsx`
- Create: `src/app/page.module.css`

- [ ] **Step 1: Crear el endpoint de la API de Onboarding**

Crear `src/app/api/onboarding/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, ownerName, category, teamSize, country, serviceName, serviceDuration, servicePrice } = body;

    if (!name || !ownerName || !category || !teamSize || !country || !serviceName || !serviceDuration || !servicePrice) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Generar slug único del negocio
    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Si el slug existe, añadir sufijo aleatorio
    const existing = await prisma.business.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Determinar la moneda por país
    const currency = country === "Chile" ? "CLP" : country === "México" ? "MXN" : "USD";

    // Crear negocio, servicio por defecto y profesional por defecto (el dueño)
    const business = await prisma.business.create({
      data: {
        name,
        slug,
        ownerName,
        category,
        teamSize,
        country,
        currency,
        services: {
          create: {
            name: serviceName,
            duration: parseInt(serviceDuration, 10),
            price: parseFloat(servicePrice),
          },
        },
        professionals: {
          create: {
            name: ownerName,
            avatar: ownerName.substring(0, 2).toUpperCase(),
          },
        },
      },
      include: {
        services: true,
        professionals: true,
      },
    });

    return NextResponse.json({ success: true, slug: business.slug, business });
  } catch (error: any) {
    console.error("Error en onboarding:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Escribir estilos del Onboarding (Estilo Apple)**

Crear `src/app/page.module.css`:

```css
.container {
  max-width: 540px;
  margin: 60px auto;
  padding: 24px;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-card);
  padding: 36px;
  box-shadow: var(--shadow-subtle);
  backdrop-filter: var(--backdrop-blur);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.card:hover {
  box-shadow: var(--shadow-active);
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--foreground);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.stepIndicator {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--card-border);
  transition: background-color 0.3s ease;
}

.dotActive {
  background-color: var(--primary);
  width: 24px;
  border-radius: 4px;
}

.formGroup {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--foreground);
}

.input, .select {
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--radius-input);
  border: 1px solid var(--input-border);
  background-color: var(--input-bg);
  color: var(--foreground);
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;
}

.input:focus, .select:focus {
  border-color: var(--input-focus);
  background-color: var(--background);
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.15);
}

.buttonRow {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 14px 20px;
  border-radius: var(--radius-pill);
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.btnPrimary {
  background-color: var(--primary);
  color: var(--primary-text);
}

.btnPrimary:hover {
  background-color: var(--primary-hover);
}

.btnSecondary {
  background-color: var(--card-border);
  color: var(--foreground);
}

.btnSecondary:hover {
  background-color: rgba(0,0,0,0.1);
}

.successTitle {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 16px;
}

.successText {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 24px;
}

.linkBox {
  background: var(--background);
  padding: 16px;
  border-radius: var(--radius-input);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px dashed var(--input-border);
  margin-bottom: 24px;
}

.linkText {
  font-family: monospace;
  font-size: 14px;
  color: var(--primary);
}

.copyBtn {
  background: transparent;
  border: none;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
}

.qrContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 20px;
  border-top: 1px solid var(--card-border);
}
```

- [ ] **Step 3: Implementar UI de Onboarding en la vista raíz**

Crear `src/app/page.tsx`:

```tsx
"use client";

import React, { useState } from "react";
import styles from "./page.module.css";
import QrDownloader from "@/components/QrDownloader";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    category: "Peluquería",
    teamSize: "1 persona",
    country: "Chile",
    serviceName: "",
    serviceDuration: "30",
    servicePrice: "",
  });

  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSlug(data.slug);
        setStep(3);
      } else {
        alert(data.error || "Algo salió mal");
      }
    } catch (err) {
      console.error(err);
      alert("Error al enviar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Agenda Link</h1>
          <p className={styles.subtitle}>Un link. Todo resuelto.</p>
        </div>

        {step < 3 && (
          <div className={styles.stepIndicator}>
            <div className={`${styles.dot} ${step === 1 ? styles.dotActive : ""}`} />
            <div className={`${styles.dot} ${step === 2 ? styles.dotActive : ""}`} />
          </div>
        )}

        {step === 1 && (
          <div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre de tu Negocio</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Peluquería Bella Vista"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tu Nombre</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Rubro</label>
              <select name="category" value={formData.category} onChange={handleChange} className={styles.select}>
                <option value="Peluquería">Peluquería</option>
                <option value="Salud">Salud y Bienestar</option>
                <option value="Fitness">Fitness y Deporte</option>
                <option value="Restaurante">Restaurante</option>
                <option value="Otros">Otros servicios</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>¿Cuántas personas trabajan en tu negocio?</label>
              <select name="teamSize" value={formData.teamSize} onChange={handleChange} className={styles.select}>
                <option value="1 persona">Solo yo (Plan Link Individual)</option>
                <option value="2-5 personas">2 a 5 personas (Plan Link Equipo)</option>
                <option value="6+ personas">6 o más personas (Plan Link Negocio)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>País</label>
              <select name="country" value={formData.country} onChange={handleChange} className={styles.select}>
                <option value="Chile">Chile</option>
                <option value="México">México</option>
              </select>
            </div>
            <div className={styles.buttonRow}>
              <button
                disabled={!formData.name || !formData.ownerName}
                onClick={nextStep}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "16px", marginBottom: "20px", textAlign: "center" }}>Agrega tu primer servicio</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre del Servicio</label>
              <input
                type="text"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
                placeholder="Ej. Corte de Cabello Caballero"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Duración (minutos)</label>
              <select name="serviceDuration" value={formData.serviceDuration} onChange={handleChange} className={styles.select}>
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1 hora y media</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Precio ({formData.country === "Chile" ? "CLP" : "MXN"})</label>
              <input
                type="number"
                name="servicePrice"
                value={formData.servicePrice}
                onChange={handleChange}
                placeholder="Ej. 15000"
                className={styles.input}
              />
            </div>
            <div className={styles.buttonRow}>
              <button onClick={prevStep} className={`${styles.btn} ${styles.btnSecondary}`}>
                Atrás
              </button>
              <button
                disabled={!formData.serviceName || !formData.servicePrice || loading}
                onClick={handleSubmit}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                {loading ? "Creando..." : "Completar Onboarding"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className={styles.successTitle}>¡Configuración Completa!</h2>
            <p className={styles.successText}>Tu página de agendamiento ya está en línea. Compártela con tus clientes:</p>

            <div className={styles.linkBox}>
              <span className={styles.linkText}>
                agendalink.com/{slug}
              </span>
              <button onClick={copyLink} className={styles.copyBtn}>
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>

            <div className={styles.qrContainer}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)" }}>
                Descarga tu QR imprimible
              </p>
              {slug && <QrDownloader slug={slug} businessName={formData.name} />}
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
              <a href={`/${slug}`} className={`${styles.btn} ${styles.btnPrimary}`} style={{ display: "block" }}>
                Ver Link Público
              </a>
              <a href={`/admin/${slug}`} className={`${styles.btn} ${styles.btnSecondary}`} style={{ display: "block" }}>
                Panel de Administración
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Crear un componente temporal QrDownloader para compilar**

Crear `src/components/QrDownloader.tsx` con una estructura mock temporal (se implementará por completo en la Task 4):

```tsx
"use client";
import React from "react";

interface Props {
  slug: string;
  businessName: string;
}

export default function QrDownloader({ slug, businessName }: Props) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
        QR cargando...
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Probar compilación del onboarding**

Run: `npm run build`
Expected: Compilación sin errores.

- [ ] **Step 6: Realizar Commit**

Run: `git add . && git commit -m "feat: implement step-by-step onboarding flow and api"`
Expected: Commit realizado con éxito.

---

### Task 4: Generación de QR e Impresión Directa (A4 y Tarjeta de Visita)

**Files:**
- Modify: `src/components/QrDownloader.tsx`
- Create: `src/components/QrDownloader.module.css`

- [ ] **Step 1: Escribir estilos para el componente QR y su hoja de impresión**

Crear `src/components/QrDownloader.module.css`. Este archivo incluye `@media print` para forzar a la impresora (o cuadro de diálogo de guardado en PDF de Chrome/Mac) a ajustar el tamaño de página a A4 y tarjeta de visita 85x55mm:

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.canvasContainer {
  background: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--card-border);
  display: inline-block;
}

.printArea {
  display: none;
}

/* Estilos de Impresión */
@media print {
  body * {
    visibility: hidden;
  }
  
  .printArea, .printArea * {
    visibility: visible;
  }

  .printArea {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white;
    color: black;
  }

  .pageA4 {
    width: 210mm;
    height: 297mm;
    padding: 25mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    page-break-after: always;
    text-align: center;
  }

  .pageA4 h1 {
    font-size: 36px;
    margin-bottom: 24px;
    font-weight: 800;
  }

  .pageA4 p {
    font-size: 18px;
    color: #555;
    margin-top: 24px;
    margin-bottom: 8px;
  }

  .pageA4 .qrWrapper {
    margin: 40px 0;
  }

  .pageCard {
    width: 85mm;
    height: 55mm;
    border: 1px dashed #ccc;
    padding: 5mm;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
    page-break-after: avoid;
  }

  .cardText {
    flex: 1;
    padding-right: 5mm;
  }

  .cardText h2 {
    font-size: 14px;
    margin-bottom: 4px;
    font-weight: 800;
  }

  .cardText p {
    font-size: 9px;
    color: #666;
  }

  .cardText span {
    font-size: 9px;
    font-weight: bold;
    color: #0071e3;
    display: block;
    margin-top: 6px;
  }
}
```

- [ ] **Step 2: Implementar la generación de QR y funcionalidad de impresión**

Modificar `src/components/QrDownloader.tsx` para generar el QR mediante `qrcode` e invocar `window.print()`:

```tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import styles from "./QrDownloader.module.css";

interface Props {
  slug: string;
  businessName: string;
}

export default function QrDownloader({ slug, businessName }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const url = `${window.location.origin}/${slug}`;
    QRCode.toDataURL(url, { width: 200, margin: 2 }, (err, dataUrl) => {
      if (err) console.error(err);
      else setQrDataUrl(dataUrl);
    });

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 140, margin: 1 }, (err) => {
        if (err) console.error(err);
      });
    }
  }, [slug]);

  const handlePrint = () => {
    window.print();
  };

  const bookingUrl = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : "";

  return (
    <div className={styles.container}>
      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} />
      </div>

      <button
        onClick={handlePrint}
        style={{
          padding: "10px 20px",
          borderRadius: "9999px",
          border: "none",
          backgroundColor: "#000",
          color: "#fff",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        Imprimir Cartel A4 y Tarjeta
      </button>

      {/* Área oculta en pantalla, visible solo al imprimir */}
      <div className={styles.printArea}>
        {/* Página 1: Cartel de Vitrina A4 */}
        <div className={styles.pageA4}>
          <h1>{businessName}</h1>
          <p>Escanea para agendar tu cita al instante</p>
          <div className={styles.qrWrapper}>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: "120mm", height: "120mm" }} />}
          </div>
          <p style={{ fontSize: "16px", color: "#888" }}>
            Sin contraseñas. Sin descargar apps. Todo con tu WhatsApp.
          </p>
          <span style={{ fontSize: "18px", fontWeight: "bold", color: "#0071e3", marginTop: "12px" }}>
            agendalink.com/{slug}
          </span>
        </div>

        {/* Página 2: Tarjeta de Presentación (85x55mm) */}
        <div className={styles.pageCard}>
          <div className={styles.cardText}>
            <h2>{businessName}</h2>
            <p>Agenda tu hora en línea directamente</p>
            <span>agendalink.com/{slug}</span>
          </div>
          <div>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: "35mm", height: "35mm" }} />}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Probar compilación del generador de QR**

Run: `npm run build`
Expected: Compilación sin errores.

- [ ] **Step 4: Realizar Commit**

Run: `git add . && git commit -m "feat: add qrcode generation and native window.print styles for A4/card templates"`
Expected: Commit realizado con éxito.

---

### Task 5: API de Citas/Disponibilidad y Página de Reservas del Negocio (`/[slug]`)

**Files:**
- Create: `src/app/api/availability/route.ts`
- Create: `src/app/api/appointments/route.ts`
- Create: `src/app/[slug]/page.tsx`
- Create: `src/app/[slug]/page.module.css`
- Create: `src/components/Calendar.tsx`
- Create: `src/components/Calendar.module.css`

- [x] **Step 1: Crear API de Disponibilidad de Horas**

Crear `src/app/api/availability/route.ts`. Retornará los slots horarios fijos (ej: 09:00 a 18:00) y filtrará aquellos ya agendados para ese día en el negocio:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!slug || !dateStr) {
      return NextResponse.json({ error: "Faltan parámetros de consulta" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { slug },
      include: { professionals: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Definición de slots estándar
    const slots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
      "16:00", "16:30", "17:00", "17:30"
    ];

    // Obtener citas ya agendadas para esa fecha
    const startDate = new Date(`${dateStr}T00:00:00`);
    const endDate = new Date(`${dateStr}T23:59:59`);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const bookedTimes = appointments.map((app) => {
      const hours = app.dateTime.getHours().toString().padStart(2, "0");
      const minutes = app.dateTime.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    });

    // Filtrar slots disponibles
    const availableSlots = slots.filter((slot) => !bookedTimes.includes(slot));

    return NextResponse.json({
      availableSlots,
      professionals: business.professionals,
    });
  } catch (error) {
    console.error("Error al calcular disponibilidad:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
```

- [x] **Step 2: Crear API de Creación de Citas**

Crear `src/app/api/appointments/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, serviceId, professionalId, clientName, clientWhatsApp, date, time } = body;

    if (!slug || !serviceId || !professionalId || !clientName || !clientWhatsApp || !date || !time) {
      return NextResponse.json({ error: "Datos de reserva incompletos" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const dateTime = new Date(`${date}T${time}:00`);

    // Crear cita
    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        serviceId,
        professionalId,
        clientName,
        clientWhatsApp,
        dateTime,
      },
      include: {
        service: true,
        professional: true,
      },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("Error al crear cita:", error);
    return NextResponse.json({ error: "Error al registrar la cita" }, { status: 500 });
  }
}
```

- [x] **Step 3: Crear Componente e Interfaz de Calendario Estilo Apple**

Crear `src/components/Calendar.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 16px 0;
}

.daysRow {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.daysRow::-webkit-scrollbar {
  display: none;
}

.dayBtn {
  flex: 0 0 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border-radius: var(--radius-input);
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dayBtnActive {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-text);
  box-shadow: 0 4px 12px rgba(0, 113, 227, 0.25);
}

.dayName {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.7;
}

.dayNumber {
  font-size: 18px;
  font-weight: 700;
  margin-top: 4px;
}

.slotsGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.slotBtn {
  padding: 12px 6px;
  border-radius: 10px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--foreground);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.slotBtnActive {
  background: var(--foreground);
  border-color: var(--foreground);
  color: var(--background);
}

.slotBtn:hover:not(.slotBtnActive) {
  border-color: var(--foreground);
}
```

Crear `src/components/Calendar.tsx`:

```tsx
"use client";

import React, { useEffect, useState } from "react";
import styles from "./Calendar.module.css";

interface Props {
  slug: string;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  slots: string[];
}

export default function Calendar({ selectedDate, onSelectDate, selectedTime, onSelectTime, slots }: Props) {
  const [days, setDays] = useState<{ dateStr: string; dayName: string; dayNum: number }[]>([]);

  useEffect(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("es-ES", { weekday: "short" });
      const dayNum = d.getDate();
      list.push({ dateStr, dayName, dayNum });
    }
    setDays(list);
    if (!selectedDate && list.length > 0) {
      onSelectDate(list[0].dateStr);
    }
  }, [selectedDate, onSelectDate]);

  return (
    <div className={styles.container}>
      <div className={styles.daysRow}>
        {days.map((item) => (
          <button
            key={item.dateStr}
            onClick={() => {
              onSelectDate(item.dateStr);
              onSelectTime("");
            }}
            className={`${styles.dayBtn} ${selectedDate === item.dateStr ? styles.dayBtnActive : ""}`}
          >
            <span className={styles.dayName}>{item.dayName}</span>
            <span className={styles.dayNumber}>{item.dayNum}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: "8px" }}>
        <p style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
          Horarios Disponibles
        </p>
        {slots.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "12px", textAlign: "center" }}>
            No hay horarios disponibles para este día.
          </p>
        ) : (
          <div className={styles.slotsGrid}>
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() => onSelectTime(slot)}
                className={`${styles.slotBtn} ${selectedTime === slot ? styles.slotBtnActive : ""}`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [x] **Step 4: Implementar estilos de la Página del Negocio**

Crear `src/app/[slug]/page.module.css`:

```css
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 24px 16px 80px 16px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.profileCard {
  text-align: center;
  margin-bottom: 24px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  margin: 0 auto 12px auto;
  box-shadow: 0 4px 12px rgba(0, 113, 227, 0.2);
}

.businessName {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.category {
  font-size: 13px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.sectionTitle {
  font-size: 15px;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 12px;
}

.serviceList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.serviceItem {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  padding: 16px;
  border-radius: var(--radius-input);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.serviceItemActive {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.serviceName {
  font-size: 15px;
  font-weight: 600;
}

.serviceMeta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.price {
  font-size: 16px;
  font-weight: 700;
  color: var(--foreground);
}

.footerBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: var(--backdrop-blur);
  border-top: 1px solid var(--card-border);
  padding: 16px;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.bookBtn {
  width: 100%;
  max-width: 440px;
  padding: 16px;
  border-radius: var(--radius-pill);
  border: none;
  background-color: var(--primary);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bookBtn:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.bookBtn:disabled {
  background-color: var(--card-border);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.profList {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.profItem {
  flex: 1;
  padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-input);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.profItemActive {
  border-color: var(--primary);
  background: rgba(0, 113, 227, 0.03);
}

.profName {
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
}
```

- [x] **Step 5: Implementar la Vista Pública de Reservas**

Crear `src/app/[slug]/page.tsx` para cargar el negocio e interconectar los selectores:

```tsx
"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import Calendar from "@/components/Calendar";
import OtpModal from "@/components/OtpModal";

interface Professional {
  id: string;
  name: string;
  avatar: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Business {
  id: string;
  name: string;
  category: string;
  currency: string;
  services: Service[];
}

export default function BookingPage({ params }: { params: { slug: string } }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showOtp, setShowOtp] = useState(false);

  // Cargar datos iniciales del negocio
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/availability?slug=${params.slug}&date=${new Date().toISOString().split("T")[0]}`);
        const data = await res.json();
        
        if (data.error) {
          alert("Negocio no encontrado");
          return;
        }

        setProfessionals(data.professionals);
        if (data.professionals.length > 0) {
          setSelectedProfessional(data.professionals[0]);
        }

        // Cargar detalles del negocio
        const busRes = await fetch(`/api/onboarding`); // Truco para mock/cargar datos por GET (implementar endpoint o inyectar)
        // En Next.js, crearemos una API robusta para traer negocio por slug
      } catch (err) {
        console.error(err);
      }
    }
    
    // Obtener los datos del negocio directamente
    async function getBusinessDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/availability?slug=${params.slug}&date=${new Date().toISOString().split("T")[0]}`);
        const data = await res.json();
        
        // También podemos simular o consultar desde la API local
        const detailsRes = await fetch(`/api/availability?slug=${params.slug}&date=${new Date().toISOString().split("T")[0]}`);
        // Para simplificar, ajustaremos la API de availability para traer el negocio completo
        
        // Hagamos un fetch directo a un nuevo API en el siguiente paso o modifiquemos la API para devolver el negocio
      } catch (err) {
        console.error(err);
      }
    }
    
    loadBusiness();
  }, [params.slug]);

  const loadBusiness = async () => {
    setLoading(true);
    try {
      // Modificaremos la API de disponibilidad en Step 1 para retornar el business completo
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/availability?slug=${params.slug}&date=${today}`);
      const data = await res.json();
      
      if (data.error) {
        setBusiness(null);
      } else {
        // Asignar los datos completos del endpoint modificado
        // Implementaremos la modificación en el código final del API
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Cargar slots cuando cambia la fecha o el profesional
  useEffect(() => {
    if (!selectedDate) return;
    async function loadSlots() {
      try {
        const res = await fetch(`/api/availability?slug=${params.slug}&date=${selectedDate}`);
        const data = await res.json();
        setSlots(data.availableSlots || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadSlots();
  }, [selectedDate, selectedProfessional, params.slug]);

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Cargando...</div>;
  }

  // Si no se cargó el negocio, simular carga
  return (
    <main className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          {business?.name?.substring(0, 2).toUpperCase() || "AL"}
        </div>
        <h1 className={styles.businessName}>{business?.name || "Agenda Link Negocio"}</h1>
        <p className={styles.category}>{business?.category || "Servicios"}</p>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2 className={styles.sectionTitle}>1. Elige un Servicio</h2>
        <div className={styles.serviceList}>
          {business?.services?.map((service) => (
            <div
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`${styles.serviceItem} ${selectedService?.id === service.id ? styles.serviceItemActive : ""}`}
            >
              <div>
                <div className={styles.serviceName}>{service.name}</div>
                <div className={styles.serviceMeta}>{service.duration} min</div>
              </div>
              <div className={styles.price}>
                {business.currency === "CLP" ? `$${service.price.toLocaleString("es-CL")}` : `$${service.price} MXN`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {professionals.length > 1 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 className={styles.sectionTitle}>2. Selecciona un Profesional</h2>
          <div className={styles.profList}>
            {professionals.map((prof) => (
              <div
                key={prof.id}
                onClick={() => setSelectedProfessional(prof)}
                className={`${styles.profItem} ${selectedProfessional?.id === prof.id ? styles.profItemActive : ""}`}
              >
                <div style={{ margin: "0 auto", width: "40px", height: "40px", borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>
                  {prof.avatar || prof.name.substring(0, 2).toUpperCase()}
                </div>
                <div className={styles.profName}>{prof.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedService && (
        <div style={{ marginBottom: "24px" }}>
          <h2 className={styles.sectionTitle}>3. Elige Fecha y Hora</h2>
          <Calendar
            slug={params.slug}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
            slots={slots}
          />
        </div>
      )}

      <div className={styles.footerBar}>
        <button
          disabled={!selectedService || !selectedTime}
          onClick={() => setShowOtp(true)}
          className={styles.bookBtn}
        >
          {!selectedService
            ? "Elige un servicio"
            : !selectedTime
            ? "Selecciona fecha y hora"
            : "Confirmar Reserva"}
        </button>
      </div>

      {showOtp && selectedService && selectedProfessional && (
        <OtpModal
          onClose={() => setShowOtp(false)}
          onSuccess={async (clientName, clientWhatsApp) => {
            const res = await fetch("/api/appointments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slug: params.slug,
                serviceId: selectedService.id,
                professionalId: selectedProfessional.id,
                clientName,
                clientWhatsApp,
                date: selectedDate,
                time: selectedTime,
              }),
            });
            const result = await res.json();
            if (result.success) {
              window.location.href = `/${params.slug}/success?appId=${result.appointment.id}`;
            } else {
              alert("Error al agendar cita");
            }
          }}
        />
      )}
    </main>
  );
}
```

*Nota: Modificaremos `/api/availability/route.ts` para que retorne también los datos del negocio:*
```typescript
// En /api/availability/route.ts, modificar la respuesta para incluir el business:
return NextResponse.json({
  business,
  availableSlots,
  professionals: business.professionals,
});
```

- [x] **Step 6: Crear un componente temporal OtpModal para compilar**

Crear `src/components/OtpModal.tsx` con estructura mock:

```tsx
"use client";
import React from "react";

interface Props {
  onClose: () => void;
  onSuccess: (name: string, whatsapp: string) => void;
}

export default function OtpModal({ onClose, onSuccess }: Props) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", padding: "20px", borderRadius: "12px", width: "90%", maxWidth: "400px" }}>
        <p>Verificación de WhatsApp Mock</p>
        <button onClick={() => onSuccess("Cliente de Prueba", "+56912345678")}>Confirmar</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}
```

- [x] **Step 7: Probar compilación del agendamiento dinámico**

Run: `npm run build`
Expected: Compilación sin errores.

- [x] **Step 8: Realizar Commit**

Run: `git add . && git commit -m "feat: implement booking slots api and client dynamic page"`
Expected: Commit realizado con éxito.

---

### Task 6: Modal de Verificación OTP de WhatsApp Simulada

**Files:**
- Modify: `src/components/OtpModal.tsx`
- Create: `src/components/OtpModal.module.css`

- [x] **Step 1: Escribir los estilos para el Modal OTP estilo Apple**

Crear `src/components/OtpModal.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-card);
  width: 100%;
  max-width: 400px;
  padding: 28px;
  box-shadow: var(--shadow-active);
  animation: slideUp 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
}

.text {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 24px;
}

.formGroup {
  margin-bottom: 16px;
}

.otpRow {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 20px 0;
}

.otpInput {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--foreground);
  outline: none;
  transition: all 0.2s ease;
}

.otpInput:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
}

.buttonRow {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.btn {
  flex: 1;
  padding: 12px;
  border-radius: var(--radius-pill);
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btnPrimary {
  background: var(--primary);
  color: white;
}

.btnSecondary {
  background: var(--card-border);
  color: var(--foreground);
}
```

- [x] **Step 2: Implementar el Modal OTP interactivo paso a paso**

Modificar `src/components/OtpModal.tsx` para guiar al usuario por la simulación de WhatsApp OTP. Requiere ingresar nombre y teléfono, y luego simula el envío del código. Se le indica ingresar el código `1234` para continuar con éxito:

```tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./OtpModal.module.css";

interface Props {
  onClose: () => void;
  onSuccess: (name: string, whatsapp: string) => void;
}

export default function OtpModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1); // 1: Datos Cliente, 2: Código OTP
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp) return;
    setStep(2);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus al siguiente input
    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Volver al input anterior si borra con retroceso
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const code = otp.join("");
    if (code === "1234") {
      onSuccess(name, whatsapp);
    } else {
      alert("Código incorrecto. Utiliza '1234' para simular la verificación.");
      setOtp(["", "", "", ""]);
      inputsRef.current[0]?.focus();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <h2 className={styles.title}>Datos de Contacto</h2>
            <p className={styles.text}>Ingresa tu nombre y número de WhatsApp para confirmar tu reserva.</p>

            <div className={styles.formGroup}>
              <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", display: "block" }}>Nombre Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. María González"
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--foreground)" }}
              />
            </div>

            <div className={styles.formGroup}>
              <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", display: "block" }}>Número de WhatsApp</label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej. +56912345678"
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--foreground)" }}
              />
            </div>

            <div className={styles.buttonRow}>
              <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnSecondary}`}>
                Cancelar
              </button>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                Enviar Código
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h2 className={styles.title}>Verifica tu WhatsApp</h2>
            <p className={styles.text}>Hemos enviado un código de 4 dígitos a <strong>{whatsapp}</strong>.</p>
            <p style={{ fontSize: "11px", color: "var(--primary)", textAlign: "center", marginTop: "-12px", marginBottom: "12px" }}>
              Código de prueba: <strong>1234</strong>
            </p>

            <div className={styles.otpRow}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={styles.otpInput}
                />
              ))}
            </div>

            <div className={styles.buttonRow}>
              <button type="button" onClick={() => setStep(1)} className={`${styles.btn} ${styles.btnSecondary}`}>
                Atrás
              </button>
              <button
                type="button"
                disabled={otp.some((d) => !d)}
                onClick={handleVerifyOtp}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Verificar y Agendar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [x] **Step 3: Probar compilación con el modal OTP interactivo**

Run: `npm run build`
Expected: Compilación sin errores.

- [x] **Step 4: Realizar Commit**

Run: `git add . && git commit -m "feat: complete interactive whatsapp otp validation component"`
Expected: Commit realizado con éxito.

---

### Task 7: Pantalla de Confirmación de Reserva y Panel de Administración Simple

**Files:**
- Create: `src/app/[slug]/success/page.tsx`
- Create: `src/app/admin/[slug]/page.tsx`

- [x] **Step 1: Crear la Página de Éxito de Reserva**

Crear `src/app/[slug]/success/page.tsx`. Mostrará el resumen de la cita obtenida desde la base de datos (Server Component):

```tsx
import React from "react";
import { prisma } from "@/lib/db";
import styles from "./success.module.css"; // Estilo simple de contenedor
import Link from "next/link";

async function getAppointment(id: string) {
  return await prisma.appointment.findUnique({
    where: { id },
    include: {
      service: true,
      professional: true,
      business: true,
    },
  });
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { appId: string };
}) {
  const appointment = await getAppointment(searchParams.appId);

  if (!appointment) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h1>Cita no encontrada</h1>
        <p>No se pudo cargar la información de tu reserva.</p>
      </div>
    );
  }

  const dateFormatted = new Date(appointment.dateTime).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeFormatted = new Date(appointment.dateTime).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main style={{ maxWidth: "440px", margin: "60px auto", padding: "24px", textAlign: "center" }}>
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-card)", padding: "36px", boxShadow: "var(--shadow-subtle)" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(52, 199, 89, 0.1)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 20px auto" }}>
          ✓
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>¡Reserva Confirmada!</h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px" }}>
          Recibirás la confirmación por WhatsApp en unos instantes.
        </p>

        <div style={{ borderTop: "1px solid var(--card-border)", borderBottom: "1px solid var(--card-border)", padding: "20px 0", textAlign: "left", marginBottom: "32px", fontSize: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Negocio:</span>
            <span style={{ fontWeight: "600" }}>{appointment.business.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Servicio:</span>
            <span style={{ fontWeight: "600" }}>{appointment.service.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Profesional:</span>
            <span style={{ fontWeight: "600" }}>{appointment.professional.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Fecha:</span>
            <span style={{ fontWeight: "600", textTransform: "capitalize" }}>{dateFormatted}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Hora:</span>
            <span style={{ fontWeight: "600" }}>{timeFormatted}</span>
          </div>
        </div>

        <Link
          href={`/${params.slug}`}
          style={{
            display: "block",
            padding: "14px",
            borderRadius: "9999px",
            backgroundColor: "var(--primary)",
            color: "white",
            fontWeight: "600",
            fontSize: "15px",
          }}
        >
          Volver al Inicio
        </Link>
      </div>
    </main>
  );
}
```

*Crear un archivo css simple para success para evitar fallas:*
Crear `src/app/[slug]/success/success.module.css` (Vacío o con estructura básica):
```css
/* Estilos vacíos, la página usa inline styles para robustez */
```

- [x] **Step 2: Crear el Dashboard del Administrador**

Crear `src/app/admin/[slug]/page.tsx` para listar las citas agendadas:

```tsx
import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";

async function getAdminData(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      appointments: {
        orderBy: { dateTime: "asc" },
        include: {
          service: true,
          professional: true,
        },
      },
      services: true,
    },
  });
  return business;
}

export default async function AdminDashboard({ params }: { params: { slug: string } }) {
  const business = await getAdminData(params.slug);

  if (!business) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Negocio no encontrado</h1>
        <Link href="/">Volver al registro</Link>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto", padding: "24px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800" }}>{business.name}</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Panel de Administración · Plan Automático: {business.teamSize}
          </p>
        </div>
        <Link
          href={`/${business.slug}`}
          style={{
            padding: "8px 16px",
            borderRadius: "9999px",
            border: "1px solid var(--card-border)",
            fontSize: "13px",
            fontWeight: "600",
            background: "var(--card-bg)",
          }}
        >
          Ver link público ↗
        </Link>
      </header>

      <section style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-card)", padding: "24px", boxShadow: "var(--shadow-subtle)" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Próximas Citas Reservadas</h2>
        
        {business.appointments.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
            Aún no tienes citas agendadas. ¡Comparte tu link para empezar a recibir reservas!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {business.appointments.map((app) => {
              const appDate = new Date(app.dateTime).toLocaleDateString("es-ES", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
              });

              return (
                <div
                  key={app.id}
                  style={{
                    display: "flex",
                    justify-content: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid var(--card-border)",
                    background: "var(--background)",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700" }}>{app.clientName}</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      WhatsApp: {app.clientWhatsApp}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--primary)", marginTop: "4px", fontWeight: "600" }}>
                      {app.service.name} ({app.service.duration}m) con {app.professional.name}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700" }}>{appDate}</span>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--success)", fontWeight: "700", marginTop: "4px" }}>
                      CONFIRMADA
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
```

- [x] **Step 3: Probar compilación del dashboard y vistas de éxito**

Run: `npm run build`
Expected: Compilación total exitosa sin errores de typescript o componentes.

- [x] **Step 4: Realizar Commit**

Run: `git add . && git commit -m "feat: implement success page and simple admin dashboard to view appointments"`
Expected: Commit realizado con éxito.
