# Especificación de Diseño: Agenda Link (Fase 1)
Fecha: 2026-06-07  
Estado: Aprobado por el usuario  
Versión: 1.0 - Onboarding & Core Booking

---

## 1. Visión y Objetivos de la Fase 1
Agenda Link busca simplificar al máximo el agendamiento y cobro de servicios en LATAM. Para esta primera fase, implementaremos el núcleo del producto:
* **Onboarding Ultra Rápido**: El negocio se configura en menos de 2 minutos mediante un flujo interactivo de 3 pasos.
* **Página Pública de Agendamiento**: Una URL limpia y atractiva (Estilo Apple) donde el cliente final puede agendar un servicio seleccionando profesional, fecha y hora libre en un máximo de 3 toques.
* **Autenticación sin Contraseña**: El cliente se valida usando su número de WhatsApp y un código temporal (OTP) de 4 dígitos simulado.
* **Descarga de QR**: Generación y visualización de un archivo imprimible para el negocio con el código QR que apunta a su página de reservas.
* **Base de Datos Local**: Persistencia de datos mediante SQLite y Prisma ORM para registrar y gestionar negocios, servicios, profesionales y citas.

---

## 2. Arquitectura de la Aplicación (Next.js & SQLite)
Construiremos una aplicación full-stack utilizando **Next.js (App Router)**.

### Estructura de Rutas
* `/` (Home y Onboarding interactivo en 3 pasos)
* `/[slug]` (Página pública del negocio para reservas de clientes)
* `/[slug]/success` (Pantalla de confirmación tras agendar con éxito)
* `/admin/[slug]` (Dashboard simplificado para que el negocio vea sus citas)
* `/api/onboarding` (Endpoint POST para registrar el negocio y crear sus servicios)
* `/api/appointments` (Endpoints GET y POST para gestionar reservas)
* `/api/availability` (Endpoint GET para calcular horas disponibles en tiempo real)

---

## 3. Modelo de Datos (SQLite)
Utilizaremos Prisma para interactuar con una base de datos local SQLite.

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Business {
  id           String        @id @default(uuid())
  name         String
  slug         String        @unique
  ownerName    String
  category     String
  teamSize     String
  country      String
  currency     String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  services     Service[]
  professionals Professional[]
  appointments Appointment[]
}

model Service {
  id          String        @id @default(uuid())
  businessId  String
  business    Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  duration    Int           // Duración en minutos
  price       Float
  createdAt   DateTime      @default(now())
  appointments Appointment[]
}

model Professional {
  id          String        @id @default(uuid())
  businessId  String
  business    Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name        String
  avatar      String?       // Iniciales o URL
  createdAt   DateTime      @default(now())
  appointments Appointment[]
}

model Appointment {
  id             String        @id @default(uuid())
  businessId     String
  business       Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  serviceId      String
  service        Service       @relation(fields: [serviceId], references: [id])
  professionalId String
  professional   Professional  @relation(fields: [professionalId], references: [id])
  clientName     String
  clientWhatsApp String
  dateTime       DateTime      // Fecha y hora de la reserva
  status         String        @default("PENDING") // PENDING, CONFIRMED, CANCELLED
  createdAt      DateTime      @default(now())
}
```

---

## 4. Diseño de Interfaz y Experiencia (Estilo Apple)
El diseño visual se inspirará directamente en la estética de Apple: simplicidad, espacio en blanco, tipografía elegante y micro-interacciones suaves.

### Sistema de Diseño (CSS Vanilla / CSS Modules)
* **Tipografía**: Fuente sans-serif premium (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, u *Outfit* cargada desde Google Fonts).
* **Paleta de Colores**:
  * Fondos: `#F5F5F7` (Light Gray Apple) o `#000000` (Pure Dark).
  * Contenedores: `#FFFFFF` con sombra sutil `box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03)`.
  * Efecto Vidrio (Glassmorphism): `background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(20px);`.
  * Color de Acento: `#0071E3` (Apple Blue) o `#000000` para botones primarios limpios.
  * Bordes: `border-radius: 16px` para tarjetas y `border-radius: 9999px` para botones tipo píldora.
* **Transiciones**: `transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);` para un comportamiento elástico y premium.

### Flujo de Onboarding Interactivo (Paso a Paso)
1. **Paso 1: Identidad**: Formulario limpio que pregunta nombre del negocio, rubro, país y número de personas.
2. **Paso 2: Servicios**: Campo de entrada simple para añadir el primer servicio (nombre, duración, precio).
3. **Paso 3: Éxito**: Pantalla final con confeti sutil o animación de checkmark, mostrando la URL única del negocio (ej. `/salon-bella`) y un botón para **descargar el cartel con código QR** (PDF formateado en A4 y tarjeta de visita).

### Flujo de Reservas del Cliente
1. El cliente abre `/[slug]`.
2. Selecciona un servicio de la lista interactiva.
3. Elige el profesional deseado.
4. Selecciona el día y la hora disponible (diseñado como un selector de fechas nativo de iOS, limpio y con colores de acento suaves).
5. Se abre un modal de WhatsApp: el cliente ingresa su número, se le pide ingresar el código de 4 dígitos (simulado de forma interactiva con inputs autodeplazables), y al ingresar `1234` (código por defecto), la cita se confirma.
6. Pantalla de confirmación con detalles y el botón de reagendamiento.

---

## 5. Criterios de Éxito y Verificación
* El onboarding se completa en menos de 2 minutos de forma fluida.
* Al finalizar el onboarding, la base de datos se puebla con el negocio, los servicios creados y un profesional por defecto.
* La ruta dinámica `/[slug]` carga la información correcta del negocio.
* El proceso de reserva no requiere registro de cuenta para el cliente.
* El código QR se genera dinámicamente y es visualizable en pantalla y descargable.
* La base de datos guarda correctamente las reservas.
