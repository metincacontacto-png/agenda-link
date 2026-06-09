# Plan de Implementación: Rebranding de AgendaLink, Pagos e Integración de Asistentes Linki IA

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar visualmente AgendaLink con la nueva identidad de marca, añadir un simulador de pagos minimalista estilo Apple Pay, e implementar un Centro de Control Linki IA interactivo para el panel de administración, persistiendo el estado de pago en Cloudflare D1.

**Architecture:** Modificación del modelo `Appointment` en SQLite/D1, actualización de estilos de cristal (*glassmorphism*) en CSS Modules con los degradados de marca, creación del modal interactivo de tarjeta de crédito/Apple Pay, y rediseño del panel `/admin/[slug]` mediante un layout de macOS con tabs de estado de IA.

**Tech Stack:** Next.js 16 (App Router), Prisma 7, Cloudflare D1 (nativa SQLite), Vanilla CSS Modules.

---

### Task 1: Modificación de Base de Datos y Regeneración del Cliente

**Files:**
- Modify: `prisma/schema.prisma`
- Test: Ejecución de `npx prisma generate` y aplicación de migraciones a D1

- [ ] **Step 1: Modificar el esquema Prisma**

Escribir el bloque de actualización en `prisma/schema.prisma` para agregar campos de pago al modelo `Appointment`:

```prisma
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
  dateTime       DateTime
  status         String       @default("CONFIRMED")
  paymentStatus  String       @default("PENDING") // PENDING o PAID
  paymentMethod  String?      // Credit Card, Apple Pay, etc.
  paymentAmount  Float?
  createdAt      DateTime     @default(now())
}
```

- [ ] **Step 2: Regenerar el cliente Prisma**

Run: `npx prisma generate`
Expected: Compilación del cliente Prisma correcta y guardada en `./src/generated/client` sin warnings ni errores de tipos.

- [ ] **Step 3: Generar el script SQL de migración para Cloudflare D1**

Run: `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/init.sql`
Expected: Creación/sobrescritura exitosa de `prisma/migrations/init.sql` conteniendo las sentencias SQL de inicialización con los nuevos campos de `paymentStatus`, `paymentMethod` y `paymentAmount`.

- [ ] **Step 4: Aplicar migración en la base de datos D1 local**

Run: `npx wrangler d1 execute agenda-link-db --local --file=prisma/migrations/init.sql`
Expected: Salida exitosa indicando "Executed queries successfully on local database" y la base SQLite D1 local actualizada.

- [ ] **Step 5: Aplicar migración en la base de datos D1 remota**

Run: `npx wrangler d1 execute agenda-link-db --remote --file=prisma/migrations/init.sql`
Expected: Mensaje de confirmación del D1 remoto indicando la actualización de tablas e inserción de queries.

- [ ] **Step 6: Realizar Commit**

Run: `git add prisma/schema.prisma prisma/migrations/init.sql && git commit -m "chore: add payment fields to appointment model and update d1 schemas"`
Expected: Commit exitoso.

---

### Task 2: Actualización Visual y Sistema de Diseño (Rebranding Estilo Apple)

**Files:**
- Modify: `src/app/theme.css`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Modificar las variables de diseño y colores de marca**

Reescribir `src/app/theme.css` (o agregar a `src/app/globals.css` si no se usa) para configurar los tonos celestes, azules y morados con variables de degradado y glassmorphism:

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --background: #f5f5f7;
  --foreground: #1d1d1f;
  --card-bg: rgba(255, 255, 255, 0.75);
  --card-border: rgba(255, 255, 255, 0.25);
  --primary: #0071e3;
  --primary-hover: #0077ed;
  --primary-text: #ffffff;
  --text-secondary: #86868b;
  --input-bg: rgba(0, 0, 0, 0.02);
  --input-border: rgba(0, 0, 0, 0.12);
  --input-focus: #0071e3;
  --success: #34c759;
  --danger: #ff3b30;
  --radius-pill: 9999px;
  --radius-card: 20px;
  --radius-input: 12px;
  --shadow-subtle: 0 8px 32px 0 rgba(31, 38, 135, 0.04);
  --shadow-active: 0 8px 32px 0 rgba(31, 38, 135, 0.08);
  --backdrop-blur: blur(20px);
  --brand-gradient: linear-gradient(135deg, #00c6ff 0%, #0072ff 50%, #7000ff 100%);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #000000;
    --foreground: #f5f5f7;
    --card-bg: rgba(22, 22, 23, 0.7);
    --card-border: rgba(255, 255, 255, 0.1);
    --primary: #2997ff;
    --primary-hover: #47a6ff;
    --input-bg: rgba(255, 255, 255, 0.04);
    --input-border: rgba(255, 255, 255, 0.15);
    --shadow-subtle: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    --shadow-active: 0 12px 40px 0 rgba(0, 0, 0, 0.5);
  }
}
```

- [ ] **Step 2: Aplicar fondo degradado fluido en los estilos globales**

Actualizar `src/app/globals.css` para utilizar la imagen de fondo `public/hero-bg.png` de manera fluida en el layout y configurar el diseño de cristal:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background-image: url('/hero-bg.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
  color: var(--foreground);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}

/* Glassmorphism utility card */
.glassCard {
  background: var(--card-bg);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-subtle);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.glassCard:hover {
  box-shadow: var(--shadow-active);
  border-color: rgba(255, 255, 255, 0.35);
}
```

- [ ] **Step 3: Cambiar logo en la cabecera del Onboarding**

Modificar la sección del logo en `src/app/page.tsx` para usar la imagen `/logo.png`:

```tsx
// Reemplazar líneas en el header de src/app/page.tsx:
        <div className={styles.header}>
          <img src="/logo.png" alt="AgendaLink" style={{ height: "40px", marginBottom: "16px" }} />
          <p className={styles.subtitle}>Un link. Todo resuelto.</p>
        </div>
```

- [ ] **Step 4: Compilar y Commit**

Run: `npm run build`
Expected: Compilación exitosa del proyecto con los nuevos estilos.
Run: `git add src/app/theme.css src/app/globals.css src/app/page.tsx && git commit -m "style: configure brand gradient background and add custom logo header"`
Expected: Commit exitoso.

---

### Task 3: Implementar Pasarela de Pago Simulado

**Files:**
- Create: `src/components/PaymentModal.tsx`
- Create: `src/components/PaymentModal.module.css`
- Modify: `src/app/[slug]/page.tsx`
- Modify: `src/app/api/appointments/route.ts`
- Modify: `src/app/[slug]/success/page.tsx`

- [ ] **Step 1: Crear estilos del Modal de Pago**

Crear el archivo `src/components/PaymentModal.module.css` con diseño glassmorphism minimalista estilo Apple Pay:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
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
  max-width: 420px;
  padding: 24px;
  box-shadow: var(--shadow-active);
  animation: slideUp 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@keyframes slideUp {
  from { transform: translateY(15px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.title {
  font-size: 18px;
  font-weight: 700;
}

.amount {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary);
}

.methodSelector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.methodBtn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.methodBtnActive {
  border-color: var(--foreground);
  background: var(--foreground);
  color: var(--background);
}

.formGroup {
  margin-bottom: 16px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  display: block;
}

.input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--foreground);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: var(--primary);
}

.row {
  display: flex;
  gap: 12px;
}

.btnPay {
  width: 100%;
  padding: 14px;
  border-radius: var(--radius-pill);
  border: none;
  background-color: var(--primary);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btnPay:hover {
  background-color: var(--primary-hover);
}

.successCheck {
  text-align: center;
  padding: 16px 0;
}

.checkmark {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(52, 199, 89, 0.1);
  color: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 12px auto;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

- [ ] **Step 2: Crear el Componente de Pago Simulado**

Crear `src/components/PaymentModal.tsx` implementando los estados de carga del pago, selección de método y autoformato de inputs de tarjeta:

```tsx
"use client";

import React, { useState } from "react";
import styles from "./PaymentModal.module.css";

interface Props {
  amount: number;
  formattedAmount: string;
  onClose: () => void;
  onSuccess: (method: string) => void;
}

export default function PaymentModal({ amount, formattedAmount, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<"card" | "apple">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) return;
    let formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) return;
    if (val.length > 2) {
      val = val.substring(0, 2) + "/" + val.substring(2);
    }
    setExpiry(val);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 3) return;
    setCvv(val);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPaid(true);
      setTimeout(() => {
        onSuccess(method === "apple" ? "Apple Pay" : "Visa Sim");
      }, 1200);
    }, 1800);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>Simulación de Pago</span>
          <span className={styles.amount}>{formattedAmount}</span>
        </div>

        {paid ? (
          <div className={styles.successCheck}>
            <div className={styles.checkmark}>✓</div>
            <p style={{ fontWeight: 600, color: "var(--success)" }}>Pago Aprobado</p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Redirigiendo a verificación...</p>
          </div>
        ) : (
          <form onSubmit={handlePay}>
            <div className={styles.methodSelector}>
              <button
                type="button"
                className={`${styles.methodBtn} ${method === "card" ? styles.methodBtnActive : ""}`}
                onClick={() => setMethod("card")}
              >
                💳 Tarjeta
              </button>
              <button
                type="button"
                className={`${styles.methodBtn} ${method === "apple" ? styles.methodBtnActive : ""}`}
                onClick={() => setMethod("apple")}
              >
                 Pay
              </button>
            </div>

            {method === "card" ? (
              <div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre en la Tarjeta</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    className={styles.input}
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Número de Tarjeta</label>
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    className={styles.input}
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                  />
                </div>
                <div className={styles.row}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Expiración</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/AA"
                      className={styles.input}
                      value={expiry}
                      onChange={handleExpiryChange}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>CVC</label>
                    <input
                      type="password"
                      required
                      placeholder="000"
                      className={styles.input}
                      value={cvv}
                      onChange={handleCvvChange}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0", border: "1px dashed var(--input-border)", borderRadius: "8px", marginBottom: "20px" }}>
                <span style={{ fontSize: "28px" }}></span>
                <p style={{ fontWeight: 600, fontSize: "14px", marginTop: "8px" }}>Pagar con Apple Pay Simulado</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Se utilizará tu cuenta de prueba de AgendaLink.</p>
              </div>
            )}

            <button type="submit" disabled={loading} className={styles.btnPay}>
              {loading ? "Procesando pago..." : `Pagar ${formattedAmount}`}
            </button>
            <button type="button" disabled={loading} onClick={onClose} className={styles.input} style={{ marginTop: "10px", width: "100%", cursor: "pointer", background: "transparent", border: "none", color: "var(--text-secondary)" }}>
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Modificar la página pública de reservas para integrar el flujo de pago**

Actualizar `src/app/[slug]/page.tsx` para incorporar el estado del modal de pago, modificar el botón para que diga "Proceder al Pago" y conectarlo con `PaymentModal`:

```tsx
// Modificaciones clave en src/app/[slug]/page.tsx
// Modificar importaciones superiores:
import Calendar from "@/components/Calendar";
import OtpModal from "@/components/OtpModal";
import PaymentModal from "@/components/PaymentModal";

// Agregar estados a la función BookingPage:
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);

// Modificar handleBookClick para abrir el modal de pago en lugar del OTP directamente:
  const handleBookClick = () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return;
    setShowPayment(true);
  };

// Crear handlePaymentSuccess para pasar al OTP tras el pago:
  const handlePaymentSuccess = (method: string) => {
    setShowPayment(false);
    setPaymentMethod(method);
    if (selectedService) {
      setPaidAmount(selectedService.price);
    }
    setShowOtp(true);
  };

// Modificar handleOtpSuccess para enviar los datos de pago al backend:
  const handleOtpSuccess = async (clientName: string, clientWhatsApp: string) => {
    if (!selectedService || !selectedProfessional) return;
    setShowOtp(false);
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          serviceId: selectedService.id,
          professionalId: selectedProfessional.id,
          clientName,
          clientWhatsApp,
          date: selectedDate,
          time: selectedTime,
          paymentStatus: "PAID",
          paymentMethod: paymentMethod,
          paymentAmount: paidAmount,
        }),
      });

      const result = await res.json();
      if (result.success && result.appointment) {
        window.location.href = `/${slug}/success?appId=${result.appointment.id}`;
      } else {
        alert(result.error || "Error al agendar la cita. Por favor intenta de nuevo.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al agendar cita.");
    } finally {
      setSubmitting(false);
    }
  };

// En el return de la página de reservas (al final de page.tsx), renderizar el modal de pago:
      {showPayment && selectedService && (
        <PaymentModal
          amount={selectedService.price}
          formattedAmount={formatPrice(selectedService.price, business.currency)}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
```

- [ ] **Step 4: Modificar el API POST de citas para persistir el estado de pago**

Actualizar `src/app/api/appointments/route.ts` para capturar `paymentStatus`, `paymentMethod` y `paymentAmount` e insertarlos en el cliente Prisma:

```typescript
// En src/app/api/appointments/route.ts modificar el POST handler:
    const body = await request.json();
    const { slug, serviceId, professionalId, clientName, clientWhatsApp, date, time, paymentStatus, paymentMethod, paymentAmount } = body;

    if (!slug || !serviceId || !professionalId || !clientName || !clientWhatsApp || !date || !time) {
      return NextResponse.json({ error: "Datos de reserva incompletos" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const dateTime = new Date(`${date}T${time}:00`);

    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        serviceId,
        professionalId,
        clientName,
        clientWhatsApp,
        dateTime,
        paymentStatus: paymentStatus || "PENDING",
        paymentMethod: paymentMethod || null,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : null,
      },
      include: {
        service: true,
        professional: true,
      },
    });
```

- [ ] **Step 5: Mostrar estado de pago exitoso en la pantalla de éxito**

Modificar `src/app/[slug]/success/page.tsx` para leer los datos de pago de la cita cargada y renderizar un badge de éxito premium:

```tsx
// Modificar el bloque de renderizado en src/app/[slug]/success/page.tsx:
// En la tabla de datos, agregar una línea indicando el estado del pago:
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Profesional:</span>
            <span style={{ fontWeight: "600" }}>{appointment.professional.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Pago:</span>
            <span style={{ fontWeight: "700", color: "var(--success)" }}>
              ✓ PAGADO con {appointment.paymentMethod || "Tarjeta"}
            </span>
          </div>
```

- [ ] **Step 6: Compilar y Commit**

Run: `npm run build`
Expected: Compilación total del bundle de Next.js exitosa.
Run: `git add src/components/PaymentModal.tsx src/components/PaymentModal.module.css src/app/[slug]/page.tsx src/app/api/appointments/route.ts src/app/[slug]/success/page.tsx && git commit -m "feat: integrate interactive mock payment gateway with Apple Pay and card support"`
Expected: Commit exitoso.

---

### Task 4: Centro de Control de IA Linki (Panel del Administrador)

**Files:**
- Modify: `src/app/admin/[slug]/page.tsx`
- Create: `src/app/admin/[slug]/admin.module.css`

- [ ] **Step 1: Crear estilos del Panel de Administración estilo macOS**

Crear el archivo `src/app/admin/[slug]/admin.module.css` con la barra lateral translúcida y panel de pestañas de Apple:

```css
.adminContainer {
  display: flex;
  min-height: 100vh;
  background-image: url('/hero-bg.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: var(--foreground);
}

.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.brandLogo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 12px;
}

.navSectionTitle {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
  padding-left: 8px;
}

.navList {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.navItem {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--foreground);
}

.navItemActive {
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.contentArea {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.glassCard {
  background: var(--card-bg);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-card);
  padding: 24px;
  box-shadow: var(--shadow-subtle);
}

/* WhatsApp Sim Styles */
.chatWindow {
  border: 1px solid var(--card-border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 400px;
  background: #f0f2f5;
}

.chatHeader {
  background: #008069;
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chatAvatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #00c6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.chatBody {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.msgIn, .msgOut {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13.5px;
  line-height: 1.4;
  box-shadow: 0 1px 1px rgba(0,0,0,0.06);
}

.msgIn {
  background: white;
  align-self: flex-start;
  border-top-left-radius: 0;
}

.msgOut {
  background: #d9fdd3;
  align-self: flex-end;
  border-top-right-radius: 0;
}

/* Report Styles */
.reportTitle {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.reportParagraph {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
  color: var(--foreground);
}

.badgePaid {
  background: rgba(52, 199, 89, 0.12);
  color: #248a3d;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  display: inline-block;
}
```

- [ ] **Step 2: Crear el Dashboard Rediseñado con Centro de Control Linki IA**

Modificar `src/app/admin/[slug]/page.tsx` convirtiéndolo en un Client Component interactivo para soportar la barra lateral de macOS, el visor de reservas y el chat dinámico animado de Linki Secretary:

```tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

interface Appointment {
  id: string;
  clientName: string;
  clientWhatsApp: string;
  dateTime: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentAmount: number | null;
  service: { name: string; duration: number };
  professional: { name: string };
}

interface Business {
  name: string;
  slug: string;
  teamSize: string;
  appointments: Appointment[];
}

export default function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reservas" | "secretary" | "marketing" | "business">("reservas");

  // Chat animado de Linki Secretary
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "bot"; text: string; time: string }[]>([
    { sender: "user", text: "Hola, me gustaría agendar una cita para mañana por la tarde.", time: "14:02" }
  ]);
  const [secretaryTyping, setSecretaryTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const res = await fetch(`/api/availability?slug=${slug}&date=${new Date().toISOString().split("T")[0]}`);
        if (!res.ok) return;
        const data = await res.json();
        setBusiness(data.business);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [slug]);

  // Simulación de escritura progresiva de Linki Secretary
  useEffect(() => {
    if (activeTab !== "secretary") return;
    
    const messagesScript = [
      { sender: "bot", text: "¡Hola! Con gusto. Para mañana tengo horas disponibles a las 15:30 y 16:30. ¿Te sirve alguna?", delay: 2000 },
      { sender: "user", text: "La de las 15:30 me acomoda. ¿Cuál es el valor?", delay: 5000 },
      { sender: "bot", text: "Perfecto. El servicio es 'Corte de Cabello' con Juan Pérez y tiene un valor de $15.000 CLP. Para confirmar la reserva, debes ingresar al siguiente link de pago simulado: agendalink.com/democut/pay. ¿Deseas proceder?", delay: 8000 },
      { sender: "user", text: "Sí, acabo de pagar en el link.", delay: 12000 },
      { sender: "bot", text: "¡Recibido! Tu pago fue aprobado. He agendado tu cita para mañana a las 15:30 hrs. ¡Te esperamos!", delay: 15000 }
    ];

    let timeouts: NodeJS.Timeout[] = [];

    messagesScript.forEach((msg, idx) => {
      const t = setTimeout(() => {
        setSecretaryTyping(true);
        const typingTimeout = setTimeout(() => {
          setSecretaryTyping(false);
          setChatMessages(prev => [...prev, { sender: msg.sender as any, text: msg.text, time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) }]);
        }, 1200);
        timeouts.push(typingTimeout);
      }, msg.delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(t => clearTimeout(t));
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, secretaryTyping]);

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "white" }}>Cargando administrador...</div>;
  }

  if (!business) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "white" }}>
        <h1>Negocio no encontrado</h1>
        <Link href="/">Registrar un negocio</Link>
      </div>
    );
  }

  return (
    <main className={styles.adminContainer}>
      <div className={styles.sidebar}>
        <div className={styles.brandLogo}>
          <img src="/logo.png" alt="AgendaLink" style={{ height: "24px" }} />
        </div>
        
        <span className={styles.navSectionTitle}>Operación</span>
        <nav className={styles.navList}>
          <button className={`${styles.navItem} ${activeTab === "reservas" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("reservas")}>
            📅 Reservas
          </button>
        </nav>

        <span className={styles.navSectionTitle}>Asistentes Linki IA</span>
        <nav className={styles.navList}>
          <button className={`${styles.navItem} ${activeTab === "secretary" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("secretary")}>
            💬 Linki Secretary
          </button>
          <button className={`${styles.navItem} ${activeTab === "marketing" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("marketing")}>
            📈 Linki Marketing
          </button>
          <button className={`${styles.navItem} ${activeTab === "business" ? styles.navItemActive : ""}`} onClick={() => setActiveTab("business")}>
            🧠 Linki Business
          </button>
        </nav>
      </div>

      <div className={styles.contentArea}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "800" }}>{business.name}</h1>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
              Panel de Administración · Plan Automático: {business.teamSize}
            </p>
          </div>
          <Link href={`/${business.slug}`} className={styles.navItemActive} style={{ padding: "8px 16px", borderRadius: "9999px", fontSize: "13px", display: "inline-block" }}>
            Ver link público ↗
          </Link>
        </header>

        {activeTab === "reservas" && (
          <section className={styles.glassCard}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Próximas Reservas Recibidas</h2>
            {business.appointments?.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
                Aún no tienes citas agendadas. Comparte tu link para empezar.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {business.appointments?.map((app) => (
                  <div key={app.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", border: "1px solid var(--card-border)", background: "rgba(255,255,255,0.9)", color: "#000" }}>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: "700" }}>{app.clientName}</h3>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>WhatsApp: {app.clientWhatsApp}</p>
                      <p style={{ fontSize: "12px", color: "var(--primary)", marginTop: "4px", fontWeight: "600" }}>
                        {app.service?.name} con {app.professional?.name}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700" }}>
                        {new Date(app.dateTime).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div style={{ marginTop: "4px" }}>
                        <span className={styles.badgePaid}>✓ PAGADO</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "secretary" && (
          <section className={styles.glassCard}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>Linki Secretary · Agendador de WhatsApp 24/7</h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", marginBottom: "20px" }}>
              Monitorea en tiempo real cómo tu asistente de inteligencia artificial conversa con tus clientes para reservar cupos.
            </p>
            <div className={styles.chatWindow}>
              <div className={styles.chatHeader}>
                <div className={styles.chatAvatar}>LS</div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>Linki Secretary</div>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>En línea • Respondiendo automáticamente</div>
                </div>
              </div>
              <div className={styles.chatBody}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={msg.sender === "user" ? styles.msgIn : styles.msgOut}>
                    {msg.text}
                    <div style={{ fontSize: "9px", color: "gray", textAlign: "right", marginTop: "4px" }}>{msg.time}</div>
                  </div>
                ))}
                {secretaryTyping && (
                  <div className={styles.msgOut} style={{ fontStyle: "italic", color: "gray" }}>
                    Linki Secretary está escribiendo...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </section>
        )}

        {activeTab === "marketing" && (
          <section className={styles.glassCard}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Linki Marketing · Reactivación de Clientes</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: "24px", fontWeight: "800" }}>32</span>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>Clientes Inactivos Detectados</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: "24px", fontWeight: "800" }}>28</span>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>WhatsApp Promocionales Enviados</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", padding: "16px", borderRadius: "10px", textAlign: "center", border: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: "24px", fontWeight: "800" }}>14%</span>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>Tasa de Retorno y Agendamiento</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Campaña Activa: Fidelización de 30 Días</h3>
              <div style={{ padding: "14px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", fontSize: "13px", lineHeight: "1.5" }}>
                <strong>Mensaje automático enviado:</strong><br />
                "¡Hola [Nombre]! Te extrañamos en {business.name}. Hace un mes que no nos visitas. Agenda tu hora hoy y obtén un 10% de descuento usando tu link de reservas: agendalink.com/{business.slug} ⚡️"
              </div>
            </div>
          </section>
        )}

        {activeTab === "business" && (
          <section className={styles.glassCard}>
            <div className={styles.reportTitle}>
              <span>🧠</span> Linki Business • Reporte del Lunes
            </div>
            <div style={{ borderLeft: "4px solid var(--primary)", paddingLeft: "16px", margin: "16px 0" }}>
              <p className={styles.reportParagraph} style={{ fontStyle: "italic", fontWeight: "500" }}>
                "Hola. He analizado el rendimiento del negocio durante los últimos 7 días. Aquí tienes mi balance estratégico:"
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p className={styles.reportParagraph}>
                📈 **Rendimiento General**: Las reservas de esta semana aumentaron un **12%** comparado con la semana anterior, registrando una facturación simulada de **$280.000 CLP**.
              </p>
              <p className={styles.reportParagraph}>
                ⭐ **Servicios y Staff Estrella**: Tu servicio más demandado fue la configuración por defecto y tu profesional más solicitado fue el asignado. Hay alta retención en el bloque de las 15:00 hrs.
              </p>
              <p className={styles.reportParagraph}>
                💡 **Consejo de IA**: He notado que los días martes por la mañana tienen baja ocupación (menos del 20%). Le he sugerido a **Linki Marketing** programar un recordatorio automático con un descuento especial para incentivar reservas los martes temprano.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Compilar y verificar**

Run: `npm run build`
Expected: Compilación exitosa del proyecto con el nuevo dashboard.
Run: `git add src/app/admin/[slug]/page.tsx src/app/admin/[slug]/admin.module.css && git commit -m "feat: design macOS style admin dashboard and implement dynamic linki ai simulators"`
Expected: Commit exitoso.
