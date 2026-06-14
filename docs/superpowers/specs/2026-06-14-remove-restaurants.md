# Design Specification: Remove Restaurant Features

Completely remove all restaurant-specific database models, APIs, and frontend features from Agenda Link, focusing the application exclusively on standard service and professional bookings.

## 1. Goal & Requirements
- **Goal:** Simplify the application by removing the "Restaurante" category, table management, digital menu items, and dining reservation slot logic.
- **Scope of Deletion:**
  - Database schema models: `Table` and `MenuItem`.
  - Frontend onboarding screens, pages, and fields for restaurants.
  - Public booking client views for guest counts, menu tabs, and split buttons.
  - Admin dashboard tabs for "Mesas" and "Carta/Menú".
  - Backend validation and slot calculations for dining reservations.

## 2. Database Schema Changes
In `prisma/schema.prisma`:
- Remove the `Table` model.
- Remove the `MenuItem` model.
- Update `Business`: remove `tables` and `menuItems` relations.
- Update `Appointment`: remove `tableId` and `table` relations.

## 3. API Changes
- **Onboarding (`src/app/api/onboarding/route.ts`):** Remove checks for "Restaurante" category, and skip table / menu item database seeding.
- **Appointments (`src/app/api/appointments/route.ts`):** Remove people count verification, dining booking parameters, and table assignment.
- **Availability (`src/app/api/availability/route.ts`):** Simplify time slot generation by deleting restaurant table-capacity constraints.

## 4. Frontend Changes
- **Onboarding (`src/app/page.tsx`):** Remove the "Restaurante" category selection and any input steps associated with configuring tables or menu items.
- **Public Client Booking (`src/app/[slug]/page.tsx`):** Remove tabs ("Reserva Mesa", "Carta Digital"), guest selector dropdown, split buttons, and rendering of menu items.
- **Admin Dashboard (`src/app/admin/[slug]/page.tsx`):** Delete "Mesas" and "Carta/Menú" tabs from the sidebar and remove their respective panel interfaces, forms, and tables.

## 5. Verification Plan
- **Database migration:** Run `npx prisma db push` to drop `Table` and `MenuItem` tables and update client.
- **Build & Compilation:** Run `npm run build` to verify there are no broken imports or unresolved references.
- **Manual Verification:** Open the home page and confirm "Restaurante" is gone from the category selector. Ensure booking works normally for other segments.
