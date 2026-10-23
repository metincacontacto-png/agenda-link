# Diseño Técnico: Gestión de Horarios y Bloqueo Ágil (Agenda Semanal y Rangos Extendido)

**Fecha:** 2026-10-23  
**Estado:** Aprobado para Implementación  
**Autor:** Antigravity & Giovanni Repetto  

---

## 1. Resumen Ejecutivo y Objetivos

El sistema actual de bloqueo de horarios requería seleccionar una fecha individual y escribir manualmente las horas de inicio y fin en un formulario separado. El usuario requiere:
1. **Bloquear y habilitar horas puntuales de forma fácil y simple**: 1 clic directo en la grilla horaria de la vista semanal de la agenda de turnos.
2. **Bloquear por rangos extendidos (semanas, meses o vacaciones)**: Poder seleccionar una `Fecha Desde` y `Fecha Hasta` para bloquear períodos completos de una sola vez.
3. **Configurar el horario semanal habitual**: Establecer qué días atiende el negocio (Lunes a Domingo) y sus rangos horarios base.
4. **Efecto de Urgencia en Web Pública**: Todas las horas y períodos bloqueados se muestran al público en **ROJO con texto "Ocupado" tachado**, proyectando alta demanda (*social proof*) y protegiendo los días libres del profesional.

---

## 2. Requerimientos de Usuario y Flujos

### 2.1 Flujo 1: Bloqueo/Desbloqueo en 1 Clic desde la Agenda Semanal (`AgendaTab.tsx`)
- En la tabla de la agenda semanal (`hourSlots` x `weekDates`):
  - **Celda libre**: Muestra un botón sutil al posar el cursor o visible en dispositivos táctiles: `+ Bloquear hora`.
  - Al pulsar el botón: Se crea un `ScheduleBlock` para esa fecha y hora exacta (ej. 2026-10-26 de 11:00 a 12:00) y la celda se transforma inmediatamente en un bloque rojo:
    - Tarjeta: `🔴 Ocupado (Bloqueado)`.
    - Botón de acción rápida: `🔓 Desbloquear` (elimina el bloqueo con 1 clic).
  - **Celda con cita real**: Mantiene la visualización de la cita del cliente (`appointmentBlock`).

### 2.2 Flujo 2: Bloqueo por Rango Extendido (Semana / Mes / Vacaciones) (`ScheduleTab.tsx`)
- Selector de modo:
  - `🔘 Rango de Fechas (Semana, Mes o Vacaciones)`
  - `🔘 Día Completo Individual`
  - `🔘 Rango de Horas Específico`
- Al seleccionar `Rango de Fechas`:
  - Campo `Fecha Desde` (ej: `2026-11-01`).
  - Campo `Fecha Hasta` (ej: `2026-11-15`).
  - Motivo interno opcional (ej: "Vacaciones").
  - Botón: `⛔ Bloquear Período (Mostrar como Ocupado)`.
- En la lista de bloqueos activos, se renderiza como una única tarjeta agrupada:
  - `📅 Del 01/11/2026 al 15/11/2026 (15 días) · 🔴 En web: Ocupado [ Desbloquear Período ]`.

### 2.3 Flujo 3: Horario Semanal Habitual (`ScheduleTab.tsx` / `BusinessSchedule`)
- Sección de configuración de jornada recurrente para los 7 días (Lunes a Domingo):
  - Checkbox de activación por día: `[✓] Lunes`, `[✓] Martes`, etc.
  - Hora de apertura y hora de cierre (ej. `09:00` a `18:00`).
  - Guardado con botón `Guardar Horario Habitual`.

---

## 3. Arquitectura y Modelo de Datos

### 3.1 Modelo de Base de Datos (Prisma)
- **`ScheduleBlock`**:
  - `id`: UUID (String)
  - `businessId`: String
  - `professionalId`: String? (null aplica a todo el negocio)
  - `startsAt`: DateTime (UTC)
  - `endsAt`: DateTime (UTC)
  - `reason`: String?
- **`BusinessSchedule`**:
  - `id`: UUID (String)
  - `businessId`: String
  - `dayOfWeek`: Int (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
  - `startMinute`: Int (ej. 540 = 09:00)
  - `endMinute`: Int (ej. 1080 = 18:00)

### 3.2 Endpoints Backend

1. **`GET /api/schedule-blocks?slug=<slug>&startDate=<date>&endDate=<date>`**
   - Retorna la lista de bloqueos dentro del rango solicitado (o los 100 más recientes si no se pasa rango).
   - Utilizado por `AgendaTab` para pintar las celdas bloqueadas de la semana visualizada.

2. **`POST /api/schedule-blocks`**
   - Parámetros soportados:
     - `slug`: String
     - `mode`: `"slot"` | `"day"` | `"range"` | `"custom_hours"`
     - Si `mode === "slot"`: `date` (YYYY-MM-DD), `slotTime` (HH:mm), `durationMinutes` (default 60).
     - Si `mode === "range"`: `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD), `reason`?.
     - Si `mode === "day"`: `date` (YYYY-MM-DD), `reason`?.
     - Si `mode === "custom_hours"`: `date`, `startTime`, `endTime`, `reason`?.

3. **`DELETE /api/schedule-blocks?slug=<slug>&id=<id>`**
   - Elimina el bloqueo por ID (funciona tanto para horas sueltas como para períodos de vacaciones).

4. **`GET / PUT /api/business-schedule`**
   - Permite consultar y actualizar los días activos y minutos de inicio/fin en `BusinessSchedule`.

---

## 4. Estrategia de Pruebas y Verificación

1. **Pruebas Automatizadas Unitarias:**
   - Extender `tests/schedule.test.mjs` para verificar la generación de rangos multidiarios (`localDayUtcRange`) y la detección de intersección de slots puntuales.
2. **Pruebas de Integración y API:**
   - Comprobar que `POST /api/schedule-blocks` con `mode: "range"` genera el rango UTC correcto respetando la zona horaria chilena (`America/Santiago`).
   - Comprobar que `POST /api/schedule-blocks` con `mode: "slot"` crea el bloqueo exacto de 1 hora.
3. **Verificación Visual y UI:**
   - En la Agenda Semanal: hacer clic en una celda vacía -> comprobar que se transforma en tarjeta roja bloqueada al instante.
   - Hacer clic en `Desbloquear` -> comprobar que vuelve a quedar vacía.
   - En `ScheduleTab`: bloquear un rango de 7 días -> comprobar que los 7 días aparecen como "Ocupado" en la web pública.
4. **Build y Despliegue:**
   - `npm run build:cloudflare` sin advertencias.
   - `npx opennextjs-cloudflare deploy` en `agendalink.cl`.
