# Remove Restaurant Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely remove all restaurant-specific database models, APIs, and frontend features from Agenda Link, focusing the application exclusively on standard service and professional bookings.

**Architecture:** Update the Prisma schema to drop the `Table` and `MenuItem` models. Clean up the database client relations. Clean up the onboarding, appointments, availability, and admin APIs to remove table assignments and restaurant-specific checks. Refactor the landing page onboarding wizard, the public booking client layout, and the admin dashboard panels to remove mesas, menu carta tabs, guest counts, and dining validations.

**Tech Stack:** Next.js (App Router), Prisma Client (SQLite), Vanilla CSS Modules, React 19.

---

### Task 1: Update Database Schema

**Files:**
- Modify: [schema.prisma](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/prisma/schema.prisma)

- [ ] **Step 1: Modify `prisma/schema.prisma` to remove `Table` and `MenuItem` models**

  Delete `Table` and `MenuItem` models, and remove their relations from `Business` and `Appointment`.
  
  Replace lines 11-107 in `prisma/schema.prisma` with:
  ```prisma
  model Business {
    id            String         @id @default(uuid())
    name          String
    slug          String         @unique
    ownerName     String
    email         String         @default("")
    category      String
    teamSize      String
    country       String
    currency      String
    logoUrl                 String?
    landingTitle            String?
    landingSubtitle         String?
    landingAbout            String?
    landingCoverUrl         String?
    landingSecondaryCoverUrl String?
    landingPhone            String?
    landingAddress          String?
    landingHours            String?
    landingFeaturesJson     String?
    landingTestimonialsJson String?
    plan                    String         @default("INDIVIDUAL")
    billingBypass           Boolean        @default(false)
    customDomain            String?        @unique
    createdAt     DateTime       @default(now())
    updatedAt     DateTime       @updatedAt
    services      Service[]
    professionals Professional[]
    appointments  Appointment[]
  }

  model Service {
    id           String        @id @default(uuid())
    businessId   String
    business     Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
    name         String
    duration     Int           // en minutos
    price        Float
    imageUrl     String?
    createdAt    DateTime      @default(now())
    appointments Appointment[]
  }

  model Professional {
    id           String        @id @default(uuid())
    businessId   String
    business     Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
    name         String
    avatar       String?
    createdAt    DateTime      @default(now())
    appointments Appointment[]
  }

  model Appointment {
    id             String       @id @default(uuid())
    businessId     String
    business       Business     @relation(fields: [businessId], references: [id], onDelete: Cascade)
    serviceId      String
    service        Service      @relation(fields: [serviceId], references: [id])
    professionalId String
    professional   Professional @relation(fields: [professionalId], references: [id])
    clientName     String
    clientWhatsApp String
    dateTime       DateTime     // Fecha y hora reservada
    status         String       @default("CONFIRMED")
    paymentStatus  String       @default("PENDING")
    paymentMethod  String?
    paymentAmount  Float?
    createdAt      DateTime     @default(now())
  }
  ```

- [ ] **Step 2: Run Prisma DB Push to update the database schema and regenerate client**

  Run: `npx prisma db push`
  Expected: Drops the `Table` and `MenuItem` tables and regenerates the Prisma Client.

---

### Task 2: Remove Tables & Menu Item API Routes

**Files:**
- Delete: `src/app/api/tables/route.ts`
- Delete: `src/app/api/menu/route.ts`

- [ ] **Step 1: Delete tables and menu api endpoints**

  Delete `src/app/api/tables/route.ts` and `src/app/api/menu/route.ts` entirely.
  Expected: Files are deleted.

---

### Task 3: Refactor Onboarding API Route

**Files:**
- Modify: [route.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/onboarding/route.ts)

- [ ] **Step 1: Remove restaurant onboarding logic and schema seeding**

  Modify `src/app/api/onboarding/route.ts` to:
  1. Remove destructuring of `tablesCount`, `tableCapacity`, `menuItemName`, `menuItemPrice`, `menuItemCategory`, `menuItemDescription`.
  2. Remove restaurant validation blocks and table/menu creation.
  3. Clean up the `prisma.business.create` call include statement.

  Replace the handler in `src/app/api/onboarding/route.ts` with:
  ```typescript
  import { NextResponse } from "next/server";
  import { prisma } from "@/lib/db";

  const RESERVED_SLUGS = ["admin", "api", "public", "auth", "static", "login", "register", "success"];

  export async function POST(request: Request) {
    try {
      const body = await request.json();
      const {
        name,
        ownerName,
        email,
        category,
        teamSize,
        country,
        serviceName,
        serviceDuration,
        servicePrice,
      } = body;

      // Verificar presencia de campos requeridos (permitiendo precios en 0)
      if (
        !name ||
        !ownerName ||
        !email ||
        !category ||
        !teamSize ||
        !country ||
        !serviceName ||
        serviceDuration === undefined ||
        servicePrice === undefined ||
        servicePrice === ""
      ) {
        return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
      }

      // Validar precio y duración
      const parsedPrice = parseFloat(servicePrice);
      const parsedDuration = parseInt(serviceDuration, 10);
      if (isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedDuration) || parsedDuration <= 0) {
        return NextResponse.json({ error: "Precio o duración inválidos" }, { status: 400 });
      }

      // Generar slug único del negocio (removiendo acentos en español)
      let slug = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remueve tildes de forma segura
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remueve caracteres especiales
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Evitar slug vacío
      if (!slug) {
        slug = "negocio";
      }

      // Evitar slugs reservados
      if (RESERVED_SLUGS.includes(slug)) {
        slug = `${slug}-negocio`;
      }

      // Loop de unicidad para evitar colisiones
      let finalSlug = slug;
      let collision = true;
      let attempts = 0;
      while (collision && attempts < 100) {
        const existing = await prisma.business.findUnique({ where: { slug: finalSlug } });
        if (existing) {
          finalSlug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
          attempts++;
        } else {
          collision = false;
        }
      }

      // Determinar la moneda por país
      const currency = country === "Chile" ? "CLP" : country === "México" ? "MXN" : "USD";

      // Crear negocio, servicio por defecto y profesional por defecto (el dueño)
      const business = await prisma.business.create({
        data: {
          name,
          slug: finalSlug,
          ownerName,
          email: email.trim().toLowerCase(),
          category,
          teamSize,
          country,
          currency,
          services: {
            create: {
              name: serviceName,
              duration: parsedDuration,
              price: parsedPrice,
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
    } catch (error) {
      console.error("Error en onboarding:", error);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
  }
  ```

---

### Task 4: Refactor Appointments API Route

**Files:**
- Modify: [route.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/appointments/route.ts)

- [ ] **Step 1: Remove restaurant table assignments and capacity validation**

  Replace the file contents of `src/app/api/appointments/route.ts` with:
  ```typescript
  import { NextResponse } from "next/server";
  import { prisma } from "@/lib/db";

  export async function POST(request: Request) {
    try {
      const body = await request.json();
      const {
        slug,
        serviceId,
        professionalId,
        clientName,
        clientWhatsApp,
        date,
        time,
        paymentStatus,
        paymentMethod,
        paymentAmount,
      } = body;

      if (!slug || !serviceId || !professionalId || !clientName || !clientWhatsApp || !date || !time) {
        return NextResponse.json({ error: "Datos de reserva incompletos" }, { status: 400 });
      }

      const business = await prisma.business.findUnique({ where: { slug } });
      if (!business) {
        return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
      }

      const dateTime = new Date(`${date}T${time}:00`);

      // Crear la cita
      const appointment = await prisma.appointment.create({
        data: {
          businessId: business.id,
          serviceId,
          professionalId,
          clientName,
          clientWhatsApp,
          dateTime,
          status: "CONFIRMED",
          paymentStatus: paymentStatus || "PENDING",
          paymentMethod: paymentMethod || null,
          paymentAmount: paymentAmount ? parseFloat(paymentAmount) : null,
        },
        include: {
          service: true,
          professional: true,
          business: true,
        },
      });

      return NextResponse.json({ success: true, appointment });
    } catch (error) {
      console.error("Error al crear cita:", error);
      return NextResponse.json({ error: "Error al registrar la cita" }, { status: 500 });
    }
  }
  ```

---

### Task 5: Refactor Availability and Admin API Routes

**Files:**
- Modify: [route.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/availability/route.ts)
- Modify: [route.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/admin/route.ts)

- [ ] **Step 1: Simplify availability slot calculation**

  Replace the GET handler in `src/app/api/availability/route.ts` with:
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
        include: {
          professionals: true,
          services: true,
        },
      });

      if (!business) {
        return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
      }

      const slots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
      ];

      // Obtener citas ya agendadas para esa fecha
      const startDate = new Date(`${dateStr}T00:00:00`);
      const endDate = new Date(`${dateStr}T23:59:59`);

      const appointments = await prisma.appointment.findMany({
        where: {
          businessId: business.id,
          status: "CONFIRMED",
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

      const availableSlots = slots.filter((slot) => !bookedTimes.includes(slot));

      return NextResponse.json({
        business,
        availableSlots,
        professionals: business.professionals,
      });
    } catch (error) {
      console.error("Error al calcular disponibilidad:", error);
      return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
    }
  }
  ```

- [ ] **Step 2: Clean up the admin data loader query**

  In `src/app/api/admin/route.ts`:
  1. Remove `table: true` from the `appointments` include.
  2. Remove `tables: true` and `menuItems: true` from the `business` include.

  Replace lines 14-30 with:
  ```typescript
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
          professionals: true,
        },
      });
  ```

---

### Task 6: Refactor Landing / Onboarding Wizard Page

**Files:**
- Modify: [page.tsx](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/page.tsx)

- [ ] **Step 1: Remove restaurant variables and input fields from onboarding form**

  Modify `src/app/page.tsx`:
  1. In `formData` state, remove `tablesCount`, `tableCapacity`, `menuItemName`, `menuItemPrice`, `menuItemDescription`, `menuItemCategory`.
  2. In `handleChange`, remove `if (name === "category")` check branches related to "Restaurante".
  3. In `handleSegmentClick`, remove category checking for "Restaurante" and corresponding fields setup.
  4. In Gastronomía dropdown columns (lines 310-338), remove the "Gastronomía" column from landing page.
  5. In Step 1 category dropdown options, remove `<option value="Restaurante">Restaurante</option>`.
  6. In Step 2 form, remove the `formData.category === "Restaurante"` conditional branches entirely. Keep only the service settings block.
  7. In `diffBannerLink`, replace `/restaurant_qr.png` with `/qr_mockup.png` and update the alt tag/labels.
  8. Remove any other references like "✓ Carta digital ilimitada (Restaurantes)" from the premium plans features checklist.

---

### Task 7: Refactor Booking Client Page

**Files:**
- Modify: [page.tsx](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/%5Bslug%5D/page.tsx)

- [ ] **Step 1: Remove restaurant views, guest selectors, and menu card tabs**

  Modify `src/app/[slug]/page.tsx`:
  1. Remove `interface MenuItem` and `menuItems?: MenuItem[]` in the interface `Business` definition.
  2. Remove states `activeTab` and `peopleCount`.
  3. Update `useEffect` that loads data: remove `peopleCount` from dependency list, and fetch path query parameter `&people=${peopleCount}`.
  4. In `handleBookClick`, simplify to just call `setShowPayment(true)`.
  5. In `handleOtpSuccess`, remove `isRestaurant` check and its properties (`peopleCount`, `tableId`) from payload.
  6. In fallbacks: remove `isRestaurant` checks and default fallback text for restaurants.
  7. In features fallback, remove the `isRestaurant` features list.
  8. In landing view, remove split CTA buttons. Render only "⚡ Reservar Cita Online".
  9. In booking view, remove category checking for "Restaurante" select list for guest count, rendering of digital menu tab panel, and default professional auto-selection.
  10. Simplify footerBar booking button labels and disable status.

---

### Task 8: Refactor Admin Dashboard Page

**Files:**
- Modify: [page.tsx](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/admin/%5Bslug%5D/page.tsx)

- [ ] **Step 1: Remove mesas and digital menu tabs, views, and action handlers**

  Modify `src/app/admin/[slug]/page.tsx`:
  1. Remove `interface Table` and `interface MenuItem`.
  2. Remove `tables` and `menuItems` from `Business` interface.
  3. Remove `"mesas" | "carta"` from `activeTab` state type definition.
  4. Remove state variables: `tableNumber`, `tableCapacity`, `isSubmittingTable`, `menuName`, `menuPrice`, `menuDesc`, `menuCategory`, `isSubmittingMenu`, `selectedDate`, `selectedTime`.
  5. Remove functions: `handleAddTable`, `handleDeleteTable`, `handleAddMenuItem`, `handleDeleteMenuItem`, `getReservationForTable`.
  6. Remove the `useEffect` that redirects Restaurante category to `mesas` tab.
  7. In operation calculation: remove `tablesCount` and simplify `totalWeeklySlots` calculation to always be `70 * professionalsCount`.
  8. In JSX:
     - Remove the conditional sidebar nav buttons for "Distribución de Mesas" and "Carta Digital".
     - Remove the views panels for `{activeTab === "mesas"}` and `{activeTab === "carta"}` entirely.
     - In `{activeTab === "reservas"}` list of appointments, simplify details view to remove mesa numbers, comensales, and restaurant badges.

---

### Task 9: Verification

- [ ] **Step 1: Build the application and verify no linting errors were introduced**

  Run: `npm run build`
  Expected: Successfully completes the production compilation.
