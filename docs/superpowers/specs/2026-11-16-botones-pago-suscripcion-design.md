# Especificación de Diseño: Botones de Pago Directo de Suscripción en AgendaLink

- **Fecha:** 2026-11-16
- **Estado:** Aprobado
- **Alcance:** Landing page (`https://agendalink.cl/`), componentes de checkout y endpoints de suscripción en Mercado Pago.

---

## 1. Contexto y Objetivos

Actualmente, en la sección de precios de `https://agendalink.cl/`, los tres planes (Individual, Básico y Premium) solo cuentan con el botón `"Prueba Gratis"` que conduce al registro con 14 días de prueba sin cobro. No existe un mecanismo directo para que un usuario contrate y pague de inmediato su plan mensual o anual.

### Metas
1. Permitir que usuarios nuevos y existentes puedan pagar directamente su suscripción a AgendaLink desde la tabla de precios.
2. Soportar tanto suscripción mensual recurrente (vía Mercado Pago Preapproval) como pago anual por adelantado con descuento (vía Mercado Pago Checkout Pro).
3. Asegurar que todo pago quede inequívocamente vinculado al identificador del negocio (`business.id`), evitando cobros huérfanos.
4. Mantener la opción de "Prueba gratis 14 días" como alternativa secundaria para quienes deseen probar la plataforma antes de pagar.

---

## 2. Experiencia de Usuario (UI/UX)

### 2.1 Tarjetas de Precios (`src/app/page.tsx` y `src/app/page.module.css`)
En la sección `#precios`, cada una de las 3 tarjetas de plan contendrá:
1. **Botón Principal ("Pagar Plan" / "Contratar"):**
   - Etiqueta dinámica según el selector de período (`billingPeriod`):
     - **Mensual:**
       - Individual: `"Pagar $9.990 CLP/mes"`
       - Básico: `"Pagar $28.990 CLP/mes"`
       - Premium: `"Pagar $48.990 CLP/mes"`
     - **Anual:**
       - Individual: `"Pagar $99.900 CLP/año"`
       - Básico: `"Pagar $289.900 CLP/año"`
       - Premium: `"Pagar $489.900 CLP/año"`
   - Estilo visual de botón primario (`styles.btnPrimary` / `styles.btnPurple`), con indicación clara de que dirige al pago directo.
2. **Botón Secundario ("Prueba gratis 14 días"):**
   - Botón con estilo outline/ghost o enlace secundario visible, que preserva el flujo actual de registro gratuito sin tarjeta.

### 2.2 Modal de Pago Directo (`src/components/SubscriptionCheckoutModal.tsx`)
Al presionar el botón principal de pago en cualquier plan, se abrirá un modal dedicado que detalla el plan elegido, el monto exacto y dos pestañas:

- **Pestaña 1: "Soy nuevo" (por defecto)**
  - Campos:
    - Nombre del negocio.
    - Link del negocio (`slug`) con generación automática a partir del nombre y verificación en tiempo real de disponibilidad.
    - Nombre del titular.
    - Correo electrónico.
    - Contraseña (mínimo 8 caracteres).
    - Casilla de verificación de Términos del Servicio y Política de Privacidad.
    - Verificación anti-bot (Cloudflare Turnstile).
  - Acción: Botón `"Continuar al Pago Seguro con Mercado Pago →"`.
  - Comportamiento: Envía a `/api/onboarding` para crear el negocio y el usuario administrador en la base de datos de manera atómica, y con el ID del negocio obtenido solicita la URL de pago y redirige inmediatamente al usuario a Mercado Pago.

- **Pestaña 2: "Ya tengo cuenta"**
  - Campos:
    - Link del negocio (`slug`) o correo electrónico registrado.
  - Acción: Botón `"Pagar suscripción de mi negocio →"`.
  - Comportamiento: Valida la existencia del negocio y genera la preferencia de pago vinculada a su cuenta, redirigiendo de inmediato al checkout.

---

## 3. Arquitectura y Backend

### 3.1 Endpoint de Checkout de Suscripciones (`src/app/api/subscriptions/checkout/route.ts`)
Se adapta y complementa el endpoint para recibir:
- `slug` (string)
- `plan` (`INDIVIDUAL` | `EQUIPO` | `NEGOCIO`)
- `billingPeriod` (`monthly` | `yearly`)

Lógica de procesamiento:
1. **Validación:** Comprueba existencia del negocio por su `slug`.
2. **Si `billingPeriod === "monthly"`:**
   - Emplea la API de Preapproval de Mercado Pago (`https://api.mercadopago.com/preapproval`) con el `preapproval_plan_id` o payload de recurrencia mensual.
   - Monto: $9.990, $28.990 o $48.990 CLP según el plan.
   - `external_reference`: `business.id`.
   - `back_url`: `https://agendalink.cl/admin/${business.slug}?subscription=success`.
3. **Si `billingPeriod === "yearly"`:**
   - Emplea la API de Preferencias de Mercado Pago (`https://api.mercadopago.com/checkout/preferences`).
   - Monto: $99.900, $289.900 o $489.900 CLP (equivalente a 10 meses, con 2 meses gratis incluidos).
   - Item: `"Agenda Link - Plan ${planName} (1 Año de Servicio)"`.
   - `external_reference`: `annual_${business.id}`.
   - `back_urls`: `https://agendalink.cl/admin/${business.slug}?subscription=annual_success`.

### 3.2 Webhook de Mercado Pago (`src/app/api/webhooks/mercadopago/route.ts`)
- **Eventos de suscripción mensual (`preapproval` o `subscription_authorized_payment`):**
  - Valida el estado `authorized` o `approved`.
  - Actualiza el negocio: `subscriptionStatus: "ACTIVE"`, `currentPeriodEnd = +30 días`.
- **Eventos de pago único anual (`payment` con `external_reference` tipo `annual_${business.id}`):**
  - Valida el estado `approved`.
  - Extrae `businessId`.
  - Actualiza el negocio: `subscriptionStatus: "ACTIVE"`, `subscriptionPlan: planKey`, `currentPeriodEnd = +365 días`.

---

## 4. Manejo de Errores y Casos Límite

1. **Credenciales no configuradas:**
   - Si falta `MERCADOPAGO_ACCESS_TOKEN`, la API responde con un mensaje claro y amigable al usuario.
2. **Rechazo de tarjeta en Mercado Pago:**
   - El usuario retorna a la plataforma o puede reintentar en el checkout de Mercado Pago con otro medio de pago; el negocio ya se encuentra registrado y seguro en la base de datos.
3. **Links de negocio duplicados:**
   - El modal valida el slug en tiempo real antes de permitir el envío del formulario.
4. **Respaldo de sesión:**
   - Tras completar el pago, el usuario accede a `/admin/${slug}` donde su sesión permanece activa o puede ingresar con la contraseña definida.

---

## 5. Plan de Verificación

1. **Pruebas Unitarias y Contratos:**
   - Verificar la configuración de planes y cálculo de precios mensuales y anuales en `subscription-policy.ts`.
   - Verificar la creación de preferencias y llamadas en `subscriptions/checkout/route.ts`.
2. **Pruebas de Interfaz:**
   - Conmutar entre selector "Mensual" y "Anual" en la landing y verificar que los botones de pago actualicen correctamente su texto y precio.
   - Abrir el modal desde cada una de las 3 tarjetas y verificar que preseleccione el plan correcto.
3. **Validación de Compilación y Calidad:**
   - Ejecución de `npm test`.
   - Verificación de tipos con `npx tsc --noEmit`.
   - Verificación de linter con `npm run lint`.
