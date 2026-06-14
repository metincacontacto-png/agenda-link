# Design Specification: Simulated Google Login and Auto-Seeding

Add a simulated Google Login button and flow in the "Iniciar Sesión" (Sign In) modal, allowing users to select a Google account and log in or auto-create a mock business in the database (e.g. `me-tinca`) if it doesn't already exist.

## 1. Goal & Requirements
- **Goal:** Provide a simulated Google Login button and flow within the login modal of the home page (`src/app/page.tsx`).
- **Mock Account Chooser:** Show a Google Account Chooser screen with mock profiles (`contacto@metinca.cl` and `demo@agendalink.cl`).
- **Database Auto-Seeding:** If the chosen business (e.g., `me-tinca` for `contacto@metinca.cl`) does not exist in the database, automatically seed/create it via a new API endpoint `/api/auth/google-seed` with realistic mock data (Services, Professionals, Hours, and Testimonials).
- **Direct Redirect:** Redirect to `/admin/[slug]` upon successful selection or creation.

## 2. API Design
Create a new API route `/api/auth/google-seed` (`src/app/api/auth/google-seed/route.ts`):
- **Method:** `POST`
- **Request Body:** `{ slug: string, name: string, category: string }`
- **Behavior:**
  - Check if the business with `slug` exists.
  - If not, create a `Business` record with realistic fallback values.
  - Seed 2-3 `Service` records and 2 `Professional` records.
  - Return `{ success: true, slug }`.

## 3. UI Flow (React Page Components)
In `src/app/page.tsx`:
- Add a new state `googleMode` ("chooser" | "none") inside the login modal context.
- Render the main sign-in form. If `googleMode === "chooser"`, render the simulated Google Sign-In interface:
  - Header: Google Logo, "Elige una cuenta para continuar en AgendaLink".
  - Account List:
    - Account 1: "Metinca Contacto (contacto@metinca.cl)" -> maps to `me-tinca` slug.
    - Account 2: "Invitado Demo (demo@agendalink.cl)" -> maps to `invitado-demo` slug.
  - Clicking an account calls `/api/auth/google-seed` (with appropriate slug) to ensure the business exists, then redirects to `/admin/[slug]`.
  - Add loading state with "Conectando con Google..." and "Iniciando espacio de trabajo...".

## 4. Verification Plan
- **Manual Verification:** Open the login modal on the home page, click "Continuar con Google", choose "Metinca Contacto", and confirm it redirects to `/admin/me-tinca` with all mock data populated.
- **TypeScript & Build:** Run `npm run build` to verify compilation.
