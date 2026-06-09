# Especificación de Diseño: Rebranding y Funcionalidades de AgendaLink

**Fecha**: 2026-06-08  
**Estado**: Aprobado por el usuario  
**Meta**: Rediseñar la interfaz de la aplicación de agendamiento para adoptar la marca, colores y estética de **AgendaLink** (minimalismo estilo Apple), integrando un simulador de pasarela de pago y un Centro de Control de IA interactivo para los asistentes Linki en el panel de administración.

---

## 1. Identidad Gráfica y Sistema de Diseño (Apple Style)

### Assets
* **Logo**: `public/logo.png`
* **Fondo degradado**: `public/hero-bg.png`

### Paleta de Colores y Estilos CSS
Modificaremos los archivos `src/app/theme.css` y `src/app/globals.css` para utilizar la nueva identidad gráfica:
* **Fondo**: Se utilizará la imagen `public/hero-bg.png` como fondo principal con transiciones de desenfoque.
* **Componentes**: Tarjetas translúcidas (*glassmorphism*) mediante `background: rgba(255, 255, 255, 0.7)` para modo claro y `rgba(22, 22, 23, 0.7)` para modo oscuro, combinando `backdrop-filter: blur(24px)` y bordes sutiles `border: 1px solid rgba(255, 255, 255, 0.15)`.
* **Tipografía**: Fuente del sistema de Apple (San Francisco/Inter).

---

## 2. Cambios en la Base de Datos (Prisma)

Modificaremos el modelo `Appointment` en `prisma/schema.prisma` para soportar estados y montos de pago:

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
  paymentMethod  String?      // Credit Card (Apple Pay Sim), etc.
  paymentAmount  Float?       // Monto de la transacción
  createdAt      DateTime     @default(now())
}
```

---

## 3. Flujo de Pago Simulado en Reserva (`/[slug]`)

1. **Selección**: El cliente selecciona servicio, profesional y slot de hora.
2. **Proceder al Pago**: El botón de acción principal cambia a "Proceder al Pago".
3. **Widget de Pago (Apple Pay / Tarjeta)**:
   * Abre un modal o interfaz superpuesta de pago.
   * Cuenta con un selector de método (Apple Pay simulado o Tarjeta de crédito ficticia).
   * Valida inputs de tarjeta (autoformato de espacios cada 4 dígitos, CVV e inputs numéricos).
   * Al presionar "Pagar", muestra una micro-animación de carga (spinner de Apple) y un check de éxito.
4. **Verificación WhatsApp OTP**:
   * Tras completar el pago con éxito, se muestra el modal OTP (`OtpModal`) pidiendo nombre, WhatsApp y verificando con `1234`.
5. **Redirección**: Al guardar la cita mediante la API POST a `/api/appointments` con `paymentStatus = "PAID"`, se redirige al cliente a la página de éxito.

---

## 4. Centro de Control de IA Linki (`/admin/[slug]`)

Rediseñaremos la vista de administración para incorporar pestañas navegables con diseño de aplicación nativa de macOS:

1. **Reservas**: Listado cronológico de citas con un badge en verde que denota si fue **PAGADA** y el método simulado.
2. **Linki Secretary**:
   * Simulación interactiva de WhatsApp.
   * Animaciones en tiempo real que simulan una conversación dinámica entre un cliente que pide hora y la IA agendándola de forma autónoma.
3. **Linki Marketing**:
   * Panel de estadísticas de clientes reactivados.
   * Visor de plantillas de promociones automáticas enviadas a clientes inactivos hace 30 días.
4. **Linki Business**:
   * "El Reporte del Lunes": Análisis descriptivo redactado por la IA sobre el rendimiento del negocio, los ingresos semanales y consejos de optimización.
