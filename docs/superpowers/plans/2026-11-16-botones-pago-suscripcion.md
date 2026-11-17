# Botones de Pago de Suscripción en AgendaLink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar botones de pago directo para los planes de AgendaLink en la sección de precios de https://agendalink.cl/, con soporte para suscripciones mensuales y pago anual único con descuento mediante Mercado Pago.

**Architecture:** Se extienden las políticas de suscripción (`subscription-policy.ts`) para incluir precios anuales; se actualiza el endpoint `/api/subscriptions/checkout` para crear suscripciones recurrentes (mensual) o preferencias de pago único (anual) en Mercado Pago; se añade el webhook para conciliar pagos anuales; y se crea un modal de checkout interactivo (`SubscriptionCheckoutModal`) accesible directamente desde las tarjetas de precios en la landing page.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Mercado Pago REST API / Checkout Pro, Prisma, SQLite/Cloudflare D1, Node.js test runner.

---

### Task 1: Soporte de Precios Mensuales y Anuales en Subscription Policy

**Files:**
- Modify: `src/features/businesses/subscription-policy.ts`
- Test: `tests/subscription-policy.test.mjs`

- [ ] **Step 1: Write test for plan pricing (monthly and yearly)**

Create `tests/subscription-policy.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { SUBSCRIPTION_PLANS, getPlanPricing } from "../src/features/businesses/subscription-policy.ts";

test("SUBSCRIPTION_PLANS has monthly and yearly prices for each tier", () => {
  assert.equal(SUBSCRIPTION_PLANS.INDIVIDUAL.price, 9990);
  assert.equal(SUBSCRIPTION_PLANS.INDIVIDUAL.annualPrice, 99900);
  assert.equal(SUBSCRIPTION_PLANS.EQUIPO.price, 28990);
  assert.equal(SUBSCRIPTION_PLANS.EQUIPO.annualPrice, 289900);
  assert.equal(SUBSCRIPTION_PLANS.NEGOCIO.price, 48990);
  assert.equal(SUBSCRIPTION_PLANS.NEGOCIO.annualPrice, 489900);
});

test("getPlanPricing formats prices correctly", () => {
  const indMonthly = getPlanPricing("INDIVIDUAL", "monthly");
  assert.equal(indMonthly.amount, 9990);
  assert.equal(indMonthly.formatted, "$9.990 CLP/mes");

  const indYearly = getPlanPricing("INDIVIDUAL", "yearly");
  assert.equal(indYearly.amount, 99900);
  assert.equal(indYearly.formatted, "$99.900 CLP/año");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/subscription-policy.test.mjs`
Expected: FAIL with "getPlanPricing is not a function"

- [ ] **Step 3: Update `src/features/businesses/subscription-policy.ts`**

Update interface and data in `src/features/businesses/subscription-policy.ts`:
```typescript
export interface PlanConfig {
  id: "INDIVIDUAL" | "EQUIPO" | "NEGOCIO";
  name: string;
  price: number;
  priceFormatted: string;
  annualPrice: number;
  annualPriceFormatted: string;
  description: string;
  maxProfessionals: number;
  envPlanKey: string;
}

export const SUBSCRIPTION_PLANS: Record<"INDIVIDUAL" | "EQUIPO" | "NEGOCIO", PlanConfig> = {
  INDIVIDUAL: {
    id: "INDIVIDUAL",
    name: "Individual",
    price: 9990,
    priceFormatted: "$9.990 CLP/mes",
    annualPrice: 99900,
    annualPriceFormatted: "$99.900 CLP/año",
    description: "Para profesionales independientes.",
    maxProfessionals: 1,
    envPlanKey: "MERCADOPAGO_PLAN_ID_INDIVIDUAL",
  },
  EQUIPO: {
    id: "EQUIPO",
    name: "Básico",
    price: 28990,
    priceFormatted: "$28.990 CLP/mes",
    annualPrice: 289900,
    annualPriceFormatted: "$289.900 CLP/año",
    description: "Para salones o centros de 2 a 5 profesionales.",
    maxProfessionals: 5,
    envPlanKey: "MERCADOPAGO_PLAN_ID_EQUIPO",
  },
  NEGOCIO: {
    id: "NEGOCIO",
    name: "Premium",
    price: 48990,
    priceFormatted: "$48.990 CLP/mes",
    annualPrice: 489900,
    annualPriceFormatted: "$489.900 CLP/año",
    description: "Para centros grandes con profesionales ilimitados.",
    maxProfessionals: 999,
    envPlanKey: "MERCADOPAGO_PLAN_ID_NEGOCIO",
  },
};

export function getPlanPricing(planId: "INDIVIDUAL" | "EQUIPO" | "NEGOCIO", period: "monthly" | "yearly" = "monthly") {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) throw new Error(`Unknown plan ${planId}`);
  if (period === "yearly") {
    return {
      amount: plan.annualPrice,
      formatted: plan.annualPriceFormatted,
    };
  }
  return {
    amount: plan.price,
    formatted: plan.priceFormatted,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/subscription-policy.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add tests/subscription-policy.test.mjs src/features/businesses/subscription-policy.ts
git commit -m "feat(billing): add annual pricing and helper to subscription policy"
```

---

### Task 2: Endpoint de Checkout para Cobro Mensual y Anual en Mercado Pago

**Files:**
- Modify: `src/app/api/subscriptions/checkout/route.ts`
- Modify: `src/app/api/webhooks/mercadopago/route.ts`

- [ ] **Step 1: Support `billingPeriod` in `src/app/api/subscriptions/checkout/route.ts`**

Update `POST` handler to:
1. Accept `{ slug, plan, billingPeriod }`.
2. Allow either active session owner or verified slug lookup.
3. If `billingPeriod === "yearly"`:
   - Create Checkout Pro preference with item:
     - `title`: `Agenda Link - Plan ${planConfig.name} (1 Año)`
     - `unit_price`: `planConfig.annualPrice`
     - `quantity`: 1
     - `currency_id`: "CLP"
     - `external_reference`: `annual_${business.id}`
     - `back_urls`: `{ success: ${origin}/admin/${business.slug}?subscription=annual_success, failure: ${origin}/admin/${business.slug}?subscription=failure }`
     - `auto_return`: "approved"
   - Call `https://api.mercadopago.com/checkout/preferences`.
   - Update `business.subscriptionPlan = planKey`.
   - Return `{ success: true, initPoint: mpData.init_point, preferenceId: mpData.id }`.
4. If `billingPeriod === "monthly"`:
   - Use current Preapproval API flow.

- [ ] **Step 2: Update Webhook handler for `annual_` payments in `src/app/api/webhooks/mercadopago/route.ts`**

In `topic === "payment" || !topic`:
Check if `external_reference?.startsWith("annual_")`:
```typescript
if (external_reference?.startsWith("annual_")) {
  const actualBusinessId = external_reference.replace("annual_", "");
  if (status === "approved") {
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await prisma.business.update({
      where: { id: actualBusinessId },
      data: {
        subscriptionStatus: "ACTIVE",
        currentPeriodEnd: oneYearFromNow,
      },
    });
    console.log(`[Mercado Pago Webhook] Negocio ${actualBusinessId} pago anual acreditado.`);
  }
  return NextResponse.json({ success: true, type: "annual_payment", status }, { status: 200 });
}
```

- [ ] **Step 3: Run existing unit test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

Run:
```bash
git add src/app/api/subscriptions/checkout/route.ts src/app/api/webhooks/mercadopago/route.ts
git commit -m "feat(billing): support annual checkout preference and webhook reconciliation"
```

---

### Task 3: Componente `SubscriptionCheckoutModal`

**Files:**
- Create: `src/components/SubscriptionCheckoutModal.tsx`
- Create: `src/components/SubscriptionCheckoutModal.module.css`

- [ ] **Step 1: Implement `SubscriptionCheckoutModal.module.css`**

Create responsive styles with tabs, plan summary pill, form inputs, button states, and accessible close button.

- [ ] **Step 2: Implement `SubscriptionCheckoutModal.tsx`**

Features:
1. Header displaying: "Contratar Plan [Nombre]" with price badge according to `billingPeriod` ("$9.990 CLP/mes" o "$99.900 CLP/año").
2. Tab switcher: "Soy nuevo" vs "Ya tengo cuenta".
3. "Soy nuevo" tab:
   - Name of business, auto-generated slug with validation, owner name, email, password, terms checkbox, Turnstile captcha.
   - On submit: calls `/api/onboarding`. Upon success, immediately calls `/api/subscriptions/checkout` with `slug`, `plan`, `billingPeriod`, then redirects to `initPoint`.
4. "Ya tengo cuenta" tab:
   - Slug / email input with validation.
   - On submit: calls `/api/subscriptions/checkout` with `slug`, `plan`, `billingPeriod`, then redirects to `initPoint`.
5. Loading states ("Generando pago seguro...", "Redirigiendo a Mercado Pago..."), error banners, and keyboard accessibility (ESC to close).

- [ ] **Step 3: Commit**

Run:
```bash
git add src/components/SubscriptionCheckoutModal.tsx src/components/SubscriptionCheckoutModal.module.css
git commit -m "feat(ui): add SubscriptionCheckoutModal component for direct plan purchase"
```

---

### Task 4: Integración en Landing Page (`src/app/page.tsx` y `page.module.css`)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css`

- [ ] **Step 1: Update `#precios` section in `src/app/page.tsx`**

1. Import `SubscriptionCheckoutModal`.
2. Add state:
   ```typescript
   const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
   const [checkoutPlan, setCheckoutPlan] = useState<"INDIVIDUAL" | "EQUIPO" | "NEGOCIO">("INDIVIDUAL");
   ```
3. In each plan card (Individual, Básico, Premium):
   - Replace single "Prueba Gratis" button with action group:
     - Primary Button:
       - Individual: `"Pagar " + (billingPeriod === "monthly" ? "$9.990 CLP/mes" : "$99.900 CLP/año")`
       - Básico: `"Pagar " + (billingPeriod === "monthly" ? "$28.990 CLP/mes" : "$289.900 CLP/año")`
       - Premium: `"Pagar " + (billingPeriod === "monthly" ? "$48.990 CLP/mes" : "$489.900 CLP/año")`
       - `onClick`: opens `SubscriptionCheckoutModal` with selected plan and current `billingPeriod`.
     - Secondary Button:
       - `"Probar 14 días gratis"` -> opens existing `openRegister(plan)`.

- [ ] **Step 2: Add styles in `src/app/page.module.css`**

Add styles for plan button group (`.planActions`, `.btnPayPlan`, `.btnTrialSecondary`).

- [ ] **Step 3: Verify TypeScript and Lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: 0 errors.

- [ ] **Step 4: Commit**

Run:
```bash
git add src/app/page.tsx src/app/page.module.css
git commit -m "feat(pricing): add direct payment buttons and checkout modal to landing page"
```

---

### Task 5: Verificación Integral y Despliegue a Producción

**Files:**
- Test all checks and build scripts.

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Run Cloudflare build validation**

Run: `npm run build:cloudflare`
Expected: OpenNext worker build succeeds.

- [ ] **Step 4: Deploy to production**

Run: `npm run deploy`
Expected: OpenNext deploys worker to Cloudflare production.
