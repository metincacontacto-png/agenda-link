# Especificación de Diseño: Control y Gestión de Cupos de Profesionales por Plan (1, 2 y 5)

- **Fecha:** 2026-11-17
- **Estado:** Aprobado
- **Alcance:** Políticas de suscripción, endpoint de gestión de profesionales (`/api/professionals`) y pestaña de equipo en el panel administrativo (`TeamTab.tsx`).

---

## 1. Contexto y Objetivos

En la propuesta comercial de AgendaLink (visible en la sección de precios de la landing page), cada plan otorga un cupo definido de profesionales:
- **Plan Individual ($9.990 CLP/mes):** 1 profesional.
- **Plan Básico ($28.990 CLP/mes):** Hasta 2 profesionales.
- **Plan Premium ($48.990 CLP/mes):** Hasta 5 profesionales.

### Deficiencias identificadas:
1. En `src/features/businesses/subscription-policy.ts`, el plan `EQUIPO` tenía configurado `maxProfessionals: 5` (en lugar de 2), y `NEGOCIO` tenía `maxProfessionals: 999` (en lugar de 5).
2. No existía un endpoint `/api/professionals` en la aplicación; la administración no contaba con API para crear o remover profesionales.
3. La pestaña de Equipo (`src/app/admin/[slug]/tabs/TeamTab.tsx`) era puramente estática y de solo lectura. No existía interfaz para agregar integrantes, eliminar profesionales ni visualizar el cupo disponible o actualizar el plan.

### Metas:
1. Ajustar los cupos máximos en `subscription-policy.ts` a **1 (Individual)**, **2 (Básico)** y **5 (Premium)**.
2. Implementar el endpoint `src/app/api/professionals/route.ts` con validación estricta de cupos según el plan del negocio.
3. Dotar a `TeamTab.tsx` de una interfaz interactiva y accesible para agregar y eliminar profesionales, visualizando el límite del plan y ofreciendo un botón para subir de plan cuando se alcanza el tope.
4. Asegurar que ningún negocio pueda quedar con 0 profesionales (mínimo 1 para operar reservas).

---

## 2. Arquitectura y Backend

### 2.1 Políticas de Suscripción (`src/features/businesses/subscription-policy.ts`)
Se actualizan las constantes de `SUBSCRIPTION_PLANS`:
- `INDIVIDUAL`: `maxProfessionals = 1`
- `EQUIPO`: `maxProfessionals = 2`
- `NEGOCIO`: `maxProfessionals = 5`

Se exporta la función auxiliar:
```typescript
export function getPlanMaxProfessionals(planId: "INDIVIDUAL" | "EQUIPO" | "NEGOCIO"): number {
  return SUBSCRIPTION_PLANS[planId]?.maxProfessionals ?? 1;
}
```

### 2.2 Endpoint de Gestión de Profesionales (`src/app/api/professionals/route.ts`)

#### POST /api/professionals
- **Autenticación:** Requiere sesión activa (`requireSession`) y membresía en el negocio (`requireBusinessMembership`).
- **Entrada:** `{ slug: string, name: string }`.
- **Lógica:**
  1. Localiza el negocio por `slug`.
  2. Obtiene el plan vigente: `const planKey = (business.subscriptionPlan || business.plan || "INDIVIDUAL") as "INDIVIDUAL" | "EQUIPO" | "NEGOCIO"`.
  3. Consulta `const currentCount = await prisma.professional.count({ where: { businessId: business.id } })`.
  4. Obtiene `const maxAllowed = getPlanMaxProfessionals(planKey)`.
  5. Si `currentCount >= maxAllowed`:
     - Retorna HTTP 403 con mensaje claro: `"Has alcanzado el límite de ${maxAllowed} profesional(es) de tu plan. Actualiza tu plan para sumar más profesionales."`.
  6. Si está dentro del cupo:
     - Genera `avatar` a partir de las iniciales del nombre (máx. 2 caracteres).
     - Crea el registro `Professional` en Prisma.
     - Crea los 7 días de horario laboral por defecto (Lunes a Viernes 09:00 a 18:00, Sáb/Dom inactivos) en `ProfessionalSchedule`.
     - Retorna `{ success: true, professional }`.

#### DELETE /api/professionals?id={id}&slug={slug}
- **Autenticación:** Requiere sesión activa y membresía en el negocio.
- **Lógica:**
  1. Verifica que el profesional pertenezca al negocio indicado.
  2. Comprueba que el negocio tenga más de 1 profesional:
     - Si `count <= 1`: Retorna HTTP 400 con error `"No puedes eliminar el único profesional del negocio. Debe existir al menos un profesional para recibir reservas."`.
  3. Elimina en cascada horarios laborales (`ProfessionalSchedule`) y bloqueos (`ProfessionalBreak`) y finalmente el registro `Professional`.
  4. Retorna `{ success: true }`.

---

## 3. Experiencia de Usuario en el Panel (`src/app/admin/[slug]/tabs/TeamTab.tsx`)

1. **Barra de Indicación de Cupo:**
   - Badge visual en el encabezado:
     - Ej. `👤 1 de 1 profesional · Plan Individual`
     - Ej. `👥 1 de 2 profesionales · Plan Básico`
     - Ej. `👥 3 de 5 profesionales · Plan Premium`
2. **Formulario de Agregar Profesional:**
   - Si `currentCount < maxAllowed`:
     - Campo de texto: "Nombre del profesional" (ej. "Valentina Silva").
     - Botón primario: "+ Agregar al equipo".
   - Si `currentCount >= maxAllowed`:
     - El formulario se oculta o se bloquea, mostrando un banner destacado:
       - Si está en Individual: *"Llegaste al límite de 1 profesional de tu Plan Individual. Pasa a Plan Básico para tener hasta 2 profesionales."* con botón **"Mejorar Plan"** (abre el modal de facturación).
       - Si está en Básico: *"Llegaste al límite de 2 profesionales de tu Plan Básico. Pasa a Plan Premium para tener hasta 5 profesionales."* con botón **"Mejorar Plan"**.
       - Si está en Premium: *"Llegaste al cupo máximo de 5 profesionales de tu Plan Premium."*.
3. **Lista de Tarjetas de Profesionales:**
   - Muestra avatar con iniciales, nombre y botón de eliminar (ícono papelera o texto "Eliminar").
   - Confirmación previa antes de eliminar.
   - Deshabilitado o con tooltip de aviso si solo queda 1 profesional en el negocio.

---

## 4. Plan de Pruebas y Verificación

1. **Pruebas Unitarias (`tests/subscription-policy.test.mjs`):**
   - Verificar que `SUBSCRIPTION_PLANS.EQUIPO.maxProfessionals === 2`.
   - Verificar que `SUBSCRIPTION_PLANS.NEGOCIO.maxProfessionals === 5`.
   - Verificar que `SUBSCRIPTION_PLANS.INDIVIDUAL.maxProfessionals === 1`.
2. **Pruebas de Integración de API (`tests/professionals-quota.test.mjs`):**
   - Validar rechazo con HTTP 403 al intentar registrar un 2° profesional en Plan Individual.
   - Validar rechazo al intentar registrar un 3° profesional en Plan Básico.
   - Validar rechazo al intentar registrar un 6° profesional en Plan Premium.
   - Validar rechazo al intentar eliminar el último profesional.
3. **Compilación y Despliegue:**
   - `npm test`
   - `npm run build`
   - `npm run build:cloudflare`
   - `npm run deploy`
