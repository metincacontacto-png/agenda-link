# Control y Gestión de Cupos de Profesionales por Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el control estricto de cupos de profesionales por plan dentro del sistema (Individual: 1, Básico: 2, Premium: 5), junto con el endpoint de creación/eliminación `/api/professionals` y la interfaz interactiva de gestión de equipo en el panel de administración.

**Architecture:** Se actualizan los límites máximos en `subscription-policy.ts` (1, 2 y 5); se crea el endpoint `/api/professionals` que valida sesión, membresía y cupo del plan del negocio antes de insertar registros en `Professional` y `ProfessionalSchedule`, y previene la eliminación del último profesional; se renueva `TeamTab.tsx` para permitir agregar/eliminar profesionales e invocar el modal de facturación cuando se alcanza el límite.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma, SQLite / Cloudflare D1, Node.js test runner.

---

### Task 1: Ajuste de Cupos en Subscription Policy y Tests Unitarios

**Files:**
- Modify: `src/features/businesses/subscription-policy.ts`
- Modify: `tests/subscription-policy.test.mjs`

- [ ] **Step 1: Write test asserting maxProfessionals for each plan**

In `tests/subscription-policy.test.mjs`, add tests for max professionals:
```javascript
test("SUBSCRIPTION_PLANS defines exact maxProfessionals: 1, 2, and 5", () => {
  assert.equal(SUBSCRIPTION_PLANS.INDIVIDUAL.maxProfessionals, 1);
  assert.equal(SUBSCRIPTION_PLANS.EQUIPO.maxProfessionals, 2);
  assert.equal(SUBSCRIPTION_PLANS.NEGOCIO.maxProfessionals, 5);
});

test("getPlanMaxProfessionals returns correct limit", () => {
  assert.equal(getPlanMaxProfessionals("INDIVIDUAL"), 1);
  assert.equal(getPlanMaxProfessionals("EQUIPO"), 2);
  assert.equal(getPlanMaxProfessionals("NEGOCIO"), 5);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/subscription-policy.test.mjs`
Expected: FAIL (EQUIPO is currently 5, NEGOCIO is currently 999, getPlanMaxProfessionals not exported)

- [ ] **Step 3: Update `src/features/businesses/subscription-policy.ts`**

Update `SUBSCRIPTION_PLANS`:
- `EQUIPO`: `maxProfessionals: 2` (was 5)
- `NEGOCIO`: `maxProfessionals: 5` (was 999)

Export function:
```typescript
export function getPlanMaxProfessionals(planId: "INDIVIDUAL" | "EQUIPO" | "NEGOCIO"): number {
  return SUBSCRIPTION_PLANS[planId]?.maxProfessionals ?? 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/subscription-policy.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add tests/subscription-policy.test.mjs src/features/businesses/subscription-policy.ts
git commit -m "feat(billing): set max professionals to 1, 2, and 5 by plan tier"
```

---

### Task 2: Endpoint `/api/professionals` con Validación de Cupos y Eliminación

**Files:**
- Create: `src/app/api/professionals/route.ts`
- Create: `tests/professionals-quota.test.mjs`

- [ ] **Step 1: Write test for quota enforcement logic**

Create `tests/professionals-quota.test.mjs` testing quota calculation and validation:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { getPlanMaxProfessionals } from "../src/features/businesses/subscription-policy.ts";

test("quota logic prevents exceeding plan capacity", () => {
  assert.equal(1 >= getPlanMaxProfessionals("INDIVIDUAL"), true); // Individual at 1 cannot add
  assert.equal(1 >= getPlanMaxProfessionals("EQUIPO"), false);    // Equipo at 1 can add 1 more
  assert.equal(2 >= getPlanMaxProfessionals("EQUIPO"), true);     // Equipo at 2 cannot add
  assert.equal(4 >= getPlanMaxProfessionals("NEGOCIO"), false);   // Negocio at 4 can add 1 more
  assert.equal(5 >= getPlanMaxProfessionals("NEGOCIO"), true);    // Negocio at 5 cannot add
});
```

- [ ] **Step 2: Implement `src/app/api/professionals/route.ts`**

Implement `POST` and `DELETE`:
- `POST`:
  1. Authenticates session (`requireSession`) and verifies membership (`requireBusinessMembership`).
  2. Parses `{ slug, name }`. Trims and validates name (1-80 chars).
  3. Checks business plan: `const planKey = (business.subscriptionPlan || business.plan || "INDIVIDUAL") as "INDIVIDUAL" | "EQUIPO" | "NEGOCIO"`.
  4. Counts current professionals: `const currentCount = await prisma.professional.count({ where: { businessId: business.id } })`.
  5. If `currentCount >= getPlanMaxProfessionals(planKey)`:
     - Returns HTTP 403: `{ error: \`Has alcanzado el límite de \${maxAllowed} profesional(es) de tu plan \${planConfig.name}. Actualiza tu plan para sumar más profesionales.\`, maxAllowed, currentCount }`.
  6. Creates `Professional`:
     - `avatar`: `name.substring(0, 2).toUpperCase()`.
     - Insert `Professional`.
     - Insert default `ProfessionalSchedule` for Monday to Friday (09:00 to 18:00, 540 to 1080) and Saturday/Sunday disabled.
  7. Returns `{ success: true, professional }`.
- `DELETE`:
  1. Authenticates session and checks membership.
  2. Extracts `id` and `slug` from query params.
  3. Validates business has > 1 professional (`count > 1`). If `count <= 1`: returns HTTP 400: `"No puedes eliminar el único profesional del negocio. Debe existir al menos un profesional para recibir reservas."`.
  4. Deletes related schedules (`ProfessionalSchedule`), breaks (`ProfessionalBreak`), and deletes the `Professional`.
  5. Returns `{ success: true }`.

- [ ] **Step 3: Run tests and typecheck**

Run: `node --experimental-strip-types --test tests/professionals-quota.test.mjs`
Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

Run:
```bash
git add src/app/api/professionals/route.ts tests/professionals-quota.test.mjs
git commit -m "feat(api): add /api/professionals with plan quota enforcement and delete protection"
```

---

### Task 3: Pestaña Interactiva de Gestión de Equipo en el Panel (`TeamTab.tsx`)

**Files:**
- Modify: `src/app/admin/[slug]/tabs/TeamTab.tsx`
- Modify: `src/app/admin/[slug]/page.tsx`
- Modify: `src/app/admin/[slug]/admin.module.css`

- [ ] **Step 1: Enhance `TeamTabProps` and add interactive management**

In `src/app/admin/[slug]/tabs/TeamTab.tsx`:
1. Receive props:
   ```typescript
   interface TeamTabProps {
     slug: string;
     professionals: ProfessionalDTO[];
     subscriptionPlan?: string | null;
     onTeamChanged: () => Promise<void>;
     onOpenBilling: () => void;
   }
   ```
2. Compute quota:
   - `planKey = (subscriptionPlan || "INDIVIDUAL") as "INDIVIDUAL" | "EQUIPO" | "NEGOCIO"`
   - `maxAllowed = getPlanMaxProfessionals(planKey)`
   - `currentCount = professionals.length`
   - `isLimitReached = currentCount >= maxAllowed`
3. Quota summary header badge:
   - Display: `${currentCount} de ${maxAllowed} profesionales utilizados (${planName})`
4. Form "Agregar Profesional":
   - When `!isLimitReached`: Name input + button `"+ Agregar Profesional"`.
   - On submit: `POST /api/professionals` with `{ slug, name }`. On success, reload team via `onTeamChanged()`.
   - When `isLimitReached`:
     - Show banner with plan upgrade prompt:
       - If Individual: "Llegaste al límite de 1 profesional de tu Plan Individual. Pasa a Plan Básico para tener hasta 2 profesionales." + Button `Mejorar a Plan Básico` (calls `onOpenBilling()`).
       - If Básico: "Llegaste al límite de 2 profesionales de tu Plan Básico. Pasa a Plan Premium para tener hasta 5 profesionales." + Button `Mejorar a Plan Premium` (calls `onOpenBilling()`).
       - If Premium: "Llegaste al cupo máximo de 5 profesionales de tu Plan Premium."
5. Professional Cards:
   - Show avatar, name, and delete button ("Eliminar" or trash icon).
   - If `professionals.length === 1`, delete button is disabled with tooltip "El negocio debe tener al menos un profesional".
   - When clicked, prompt `confirm("¿Seguro que deseas eliminar a este profesional?")` and send `DELETE /api/professionals?id=${id}&slug=${slug}`.

- [ ] **Step 2: Connect props in `src/app/admin/[slug]/page.tsx`**

In `src/app/admin/[slug]/page.tsx`:
Pass props to `TeamTab`:
```tsx
{activeTab === "team" && (
  <TeamTab
    slug={slug}
    professionals={business.professionals}
    subscriptionPlan={business.subscriptionPlan || business.plan}
    onTeamChanged={loadAdminData}
    onOpenBilling={() => setBillingModalOpen(true)}
  />
)}
```

- [ ] **Step 3: Add CSS in `src/app/admin/[slug]/admin.module.css`**

Add styles for:
- `.teamQuotaBadge`
- `.teamAddForm`
- `.teamUpgradeBanner`
- `.teamCardDeleteBtn`

- [ ] **Step 4: Run typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: 0 errors.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/app/admin/[slug]/tabs/TeamTab.tsx src/app/admin/[slug]/page.tsx src/app/admin/[slug]/admin.module.css
git commit -m "feat(admin): add interactive team management with quota indicators and upgrade prompt"
```

---

### Task 4: Verificación Integral y Despliegue a Producción

- [ ] **Step 1: Run complete test suite**
Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run Next.js build**
Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Run Cloudflare build**
Run: `npm run build:cloudflare`
Expected: PASS

- [ ] **Step 4: Deploy to Cloudflare production**
Run: `npm run deploy`
Expected: Deployed to `agendalink.cl`.

- [ ] **Step 5: Push git commits to origin/main**
Run: `git push origin main`
Expected: Clean sync with GitHub.
