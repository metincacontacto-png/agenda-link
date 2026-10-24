# Schedule Management Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow business owners to block and unblock punctual hours directly with 1 click on the weekly agenda calendar, block date ranges (weeks, months, holidays) with start/end dates, and manage habitual weekly business hours.

**Architecture:** Next.js App Router API routes (`/api/schedule-blocks` and `/api/business-schedule`) backed by Prisma D1 database (`ScheduleBlock` and `BusinessSchedule`). On the client side, optimistic 1-click toggle buttons in `AgendaTab.tsx` and range/weekly controls in `ScheduleTab.tsx`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma ORM, Cloudflare OpenNext.

---

### Task 1: Backend Support for Range & Slot Blocking in `/api/schedule-blocks`

**Files:**
- Modify: `src/app/api/schedule-blocks/route.ts`
- Modify: `tests/schedule.test.mjs`

- [ ] **Step 1: Write tests in `tests/schedule.test.mjs` for date ranges and slot blocks**
  Test that `localDayUtcRange` spanning multiple dates produces the correct UTC `startsAt` and `endsAt`.

- [ ] **Step 2: Run test to verify behavior**
  Run: `node --test tests/schedule.test.mjs`

- [ ] **Step 3: Update `POST /api/schedule-blocks/route.ts`**
  Add handling for:
  - `mode: "range"` with `startDate` and `endDate`
  - `mode: "slot"` with `date` and `time` (60 min default or specific end)
  - `mode: "day"` with `date` (full day)
  - `mode: "custom_hours"` with `date`, `startTime`, `endTime`

- [ ] **Step 4: Update `GET /api/schedule-blocks/route.ts`**
  Support optional `startDate` and `endDate` query params to fetch blocks intersecting a specific week or month.

- [ ] **Step 5: Run tests to verify they pass**
  Run: `node --test tests/schedule.test.mjs`

- [ ] **Step 6: Commit**
  ```bash
  git add src/app/api/schedule-blocks/route.ts tests/schedule.test.mjs
  git commit -m "feat(api): support range and slot blocking in schedule-blocks"
  ```

---

### Task 2: Backend API for Weekly Habitual Schedule (`/api/business-schedule`)

**Files:**
- Create: `src/app/api/business-schedule/route.ts`

- [ ] **Step 1: Create `src/app/api/business-schedule/route.ts`**
  - `GET`: Returns the active days and `startMinute` / `endMinute` for the business from `BusinessSchedule`.
  - `PUT`: Upserts the schedule for days 0-6 in a transaction, deleting inactive days and creating/updating active ones.

- [ ] **Step 2: Verify type check**
  Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**
  ```bash
  git add src/app/api/business-schedule/route.ts
  git commit -m "feat(api): add business-schedule route for habitual weekly hours"
  ```

---

### Task 3: 1-Click Interactive Blocking in Weekly Agenda (`AgendaTab.tsx`)

**Files:**
- Modify: `src/app/admin/[slug]/tabs/AgendaTab.tsx`
- Modify: `src/app/admin/[slug]/page.tsx`

- [ ] **Step 1: Load and pass `scheduleBlocks` into `AgendaTab.tsx`**
  Update `page.tsx` to load schedule blocks and provide a callback `onToggleSlotBlock(date: string, hour: string)` with optimistic UI update.

- [ ] **Step 2: Update `AgendaTab.tsx` cell rendering**
  - Check if the slot intersects a `ScheduleBlock`.
  - If blocked: render red badge `🔴 Ocupado (Bloqueado)` with button `[ Desbloquear ]`.
  - If free and no appointment: render subtle `+ Bloquear` button.
  - When clicked: call `onToggleSlotBlock` to immediately toggle the state.

- [ ] **Step 3: Verify with type check**
  Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/admin/[slug]/tabs/AgendaTab.tsx src/app/admin/[slug]/page.tsx
  git commit -m "feat(ui): add 1-click slot blocking in weekly agenda calendar"
  ```

---

### Task 4: Range Selector (Week/Month) and Habitual Hours in `ScheduleTab.tsx`

**Files:**
- Modify: `src/app/admin/[slug]/tabs/ScheduleTab.tsx`

- [ ] **Step 1: Add Range Selector to `ScheduleTab.tsx`**
  - Add 3 mode tabs:
    1. `🏖️ Rango Extendido (Semana, Mes o Vacaciones)`
    2. `📅 Día Completo`
    3. `⏰ Rango de Horas`
  - In `Rango Extendido`: `Fecha Desde` y `Fecha Hasta`.
  - Display grouped range cards in the active blocks list (e.g. `Del 01/11/2026 al 15/11/2026 (15 días)`).

- [ ] **Step 2: Add Habitual Weekly Schedule editor**
  - Fetch `/api/business-schedule?slug=...`
  - Render Monday through Sunday with checkboxes, opening time, and closing time.
  - Save button with success toast.

- [ ] **Step 3: Verify with type check**
  Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/admin/[slug]/tabs/ScheduleTab.tsx
  git commit -m "feat(ui): add range selector and habitual weekly schedule to ScheduleTab"
  ```

---

### Task 5: Verification, Cloudflare Build & Deployment

**Files:**
- All touched files

- [ ] **Step 1: Run all unit tests**
  Run: `node --test tests/schedule.test.mjs`

- [ ] **Step 2: Run full TypeScript check**
  Run: `npx tsc --noEmit`

- [ ] **Step 3: Build Cloudflare OpenNext bundle**
  Run: `npm run build:cloudflare`

- [ ] **Step 4: Push to main and Deploy**
  Run: `git push origin main`
  Run: `npx opennextjs-cloudflare deploy`
