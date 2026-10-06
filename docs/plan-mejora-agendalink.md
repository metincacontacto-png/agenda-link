# Plan de mejora de AgendaLink

## Decisiones base

- Autenticación propia con email y password.
- Pagos reales pospuestos.
- La primera fase prioriza estabilidad y seguridad.
- No se hará una reescritura completa: se mejorará el producto por escalones.

## Objetivo

Convertir el prototipo actual en una aplicación mantenible y segura para reservas multiempresa, sin detener el avance del producto ni mezclar infraestructura, reglas de negocio y UI.

## Escalón 0 - Baseline reproducible

### Completado

- La D1 remota fue auditada, preservada y registrada con una baseline reproducible. Ver `docs/d1-migration-reconciliation.md`.
- El build usa OpenNext 1.20.8 y la salida nativa `.open-next` para Cloudflare Workers; no depende de scripts de parche ni de una salida Pages manual. Ver `docs/cloudflare-deployment.md`.

### Pendiente

- No existe una guía de configuración ni `.env.example`.
- El password de superadmin por defecto (`Giovanni2026`) está comprometido en el historial de git.
- `npm run lint` falla con 6 errores bloqueantes además de warnings.

### Acciones

1. Rotar `SUPER_ADMIN_PASSWORD`: el valor actual está en el historial de git y debe tratarse como expuesto. Configurar uno nuevo como variable/secreto en Cloudflare.
2. Resolver los errores bloqueantes de lint actuales (son pocos y baratos): `require()` prohibidos y `any` explícitos.
3. Crear `.env.example` con las variables necesarias, incluyendo `SUPER_ADMIN_PASSWORD`.
4. Documentar el entorno local:
   - `npm ci`
   - `npx prisma generate`
   - `npx prisma db push`
   - `npm run dev`

### Criterio de aceptación

- Una instalación limpia puede ejecutar `npx tsc --noEmit` y el build sin archivos manuales faltantes.
- La base local y la remota se inicializan desde un esquema conocido, sin destruir datos existentes.
- `npm run lint` termina sin errores (los warnings pueden mantenerse documentados).
- Ningún secreto vigente existe en el código ni en su historial como credencial válida.

## Escalón 1 - Seguridad y autenticación propia

### Riesgos actuales

- El panel de un negocio es accesible con solo conocer su `slug`.
- Endpoints administrativos exponen datos sin comprobar una sesión.
- Superadmin usa password por query string/header y tiene un fallback hardcodeado.
- El endpoint `google-seed` crea negocios demo sin autenticación.

### Decisiones adoptadas

Las decisiones de sesión y recuperación están aceptadas en [ADR-0001](adr/0001-sesiones-y-recuperacion-de-password.md): cookie HMAC stateless con expiración máxima de 8 horas, roles/membresías consultados en D1 y restablecimiento manual temporal hasta disponer de email transaccional. No se crea modelo `Session` para este MVP.

### Modelo mínimo

Agregar los modelos:

- `User`: email, hash de password, nombre y rol global.
- `BusinessMember`: relación entre usuario, negocio y rol dentro del negocio.
- `Session`: solo si se elige sesión con estado en D1. Si se usan cookies firmadas, este modelo no se crea.

### Acciones

1. Implementar hash y verificación de password con WebCrypto compatible con Cloudflare Workers.
2. Implementar sesiones mediante cookies `httpOnly`, `Secure` y `SameSite=Lax` según la estrategia decidida.
3. Crear endpoints:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
   - `GET /api/auth/me`
4. Crear helpers de servidor:
   - `requireSession()`
   - `requireBusinessAccess(businessId)`
   - `requireSuperAdmin()`
5. Proteger `/api/admin`, `/api/services`, `/api/appointments`, `/api/super-admin`, `/admin/[slug]` y `/super-admin`.
6. Eliminar password en URL, headers como mecanismo de autorización y cuentas demo fijas.
7. Limitar o eliminar `google-seed` en producción.

### Criterio de aceptación

- Toda API privada responde `401` sin sesión.
- Un usuario no puede consultar ni modificar un negocio del que no es miembro.
- Superadmin se autoriza por rol, no por un secreto compartido en la URL.

## Escalón 2 - Reservas correctas

### Problemas actuales

- Se puede reservar un servicio o profesional de otro negocio.
- Dos reservas concurrentes pueden tomar el mismo horario.
- La disponibilidad es fija, no considera duración, horarios configurables ni zona horaria.
- El bloqueo de horarios se hace por negocio, no por profesional.
- El endpoint público de disponibilidad devuelve datos internos de `Business`.
- `dateTime` se guarda como fecha naive construida en el navegador del cliente, sin zona horaria.

### Primer entregable: modelo temporal

La decisión quedó aceptada en [ADR-0002](adr/0002-zona-horaria-y-reservas-utc.md): zona IANA por negocio, citas persistidas como instantes UTC, resolución determinista de horas DST inexistentes/repetidas y citas existentes que conservan su instante al cambiar la zona.

### Acciones

1. Validar el input de disponibilidad y reserva con schemas tipados.
2. Verificar que el servicio y profesional pertenecen al negocio solicitado.
3. Validar fecha futura, horario de atención y duración del servicio.
4. Crear la cita en una transacción con un segundo chequeo de conflicto.
5. Añadir una restricción o control de unicidad para `businessId`, `professionalId` y `dateTime`.
6. Guardar fechas en UTC y definir la zona horaria del negocio.
7. Devolver DTOs públicos limitados, sin email, plan, bypass ni otros flags internos.
8. Implementar cancelación y reprogramación como casos de uso explícitos.
9. Escribir en este mismo escalón los tests de reserva: válida, inválida, servicio de otro negocio y doble reserva concurrente. Los tests no se diferiran a un escalón posterior porque validan el núcleo del producto.

### Criterio de aceptación

- No existe doble reserva para el mismo profesional y horario, verificada con test de concurrencia.
- Un servicio o profesional de otro negocio es rechazado.
- Las APIs públicas no filtran información privada del negocio.
- Una cita creada en horario con cambio de hora DST se muestra a la hora local correcta.

## Escalón 3 - Datos, archivos y plataforma

### Acciones

1. Paginar citas y clientes en los endpoints administrativos.
2. Restringir la exposición de WhatsApp y datos personales según el rol.
3. Validar uploads por MIME real, tamaño máximo y extensión permitida.
4. Sanitizar la `key` usada por `/api/media/[key]`.
5. Mantener Base64 solo como fallback de desarrollo; exigir R2 en producción.
6. Añadir rate limiting a login, onboarding, reservas y superadmin.
7. Revisar `domain-lookup`, `maintenance-check` y `middleware` para reducir llamadas internas por request.
8. Definir una política de logs, errores y datos personales.
9. Añadir observabilidad mínima:
   - Logs estructurados (`console` con formato JSON en Workers).
   - Error tracking centralizado (Sentry u otro compatible con Workers).
   - Revisión periódica de Workers Logs / Cloudflare dashboard.

### Criterio de aceptación

- Un upload inválido no llega a R2.
- Los endpoints sensibles tienen límites razonables.
- Las lecturas administrativas se mantienen rápidas con datos crecientes.
- Un error 500 en producción queda registrado con contexto suficiente para diagnosticarlo.

## Escalón 4 - Organización por features

La arquitectura principal será modular por dominio. La arquitectura hexagonal se aplicará solo donde haya proveedores intercambiables o reglas complejas.

```text
src/
  app/
    api/
    admin/
    super-admin/
    [slug]/
  features/
    auth/
    booking/
    businesses/
    catalog/
    team/
    schedule/
    branding/
    media/
    admin/
    platform/
    billing/
    notifications/
  server/
    auth.ts
    authorize.ts
    validation.ts
    errors.ts
  lib/
    db.ts
    cloudflare.ts
    r2.ts
    rate-limit.ts
```

### Responsabilidades

- `app/`: routing, layouts y handlers HTTP delgados.
- `features/`: casos de uso y reglas de negocio por dominio.
- `server/`: sesión, autorización, validación y manejo de errores compartidos.
- `lib/`: infraestructura pura, sin reglas de negocio.

### Regla para las API routes

Cada `route.ts` debe:

1. Leer y validar el request.
2. Comprobar sesión y permisos.
3. Llamar a un caso de uso de `features/`.
4. Devolver un DTO o error HTTP.

No debe contener consultas Prisma largas, reglas de disponibilidad, ni lógica de almacenamiento de archivos.

## Escalón 5 - Hexagonal pragmática

Usar puertos y adaptadores solo donde reduzcan acoplamiento real:

```text
features/booking/
  domain/
    slots.ts
    conflicts.ts
    types.ts
  ports/
    BookingRepository.ts
    Clock.ts
  adapters/
    prisma-booking-repository.ts
    system-clock.ts
  service.ts
  schema.ts
```

Aplicar este patrón a:

- Reservas y disponibilidad.
- `PaymentProvider` para futuro Stripe o Mercado Pago.
- `MessagingProvider` para OTP demo, WhatsApp o email.
- `StorageProvider` para R2 y almacenamiento local.
- `Clock` para reglas de fecha y zona horaria testeables.

No aplicarlo a CRUD simple de servicios, profesionales, branding o componentes UI.

## Escalón 6 - Refactor vertical de interfaz

### Admin

Dividir `src/app/admin/[slug]/page.tsx` en:

- `DashboardTab`
- `AgendaTab`
- `ServicesTab`
- `TeamTab`
- `BrandingTab`
- `SettingsTab`

El archivo de ruta debe conservar solo carga de sesión, layout y composición del panel.

### Landing y reserva

Separar en `src/app/[slug]/page.tsx`:

- `PublicLanding`
- `BookingFlow`
- `ServicePicker`
- `ProfessionalPicker`
- `SlotGrid`
- `BookingSummary`

Los modales de OTP y pago demo deben ser proveedores explícitos, no reglas centrales de reserva.

## Escalón 7 - Calidad mínima

### Tests

1. API:
   - registro, login y logout.
   - acceso cruzado entre negocios.
   - (Las pruebas de reservas se escriben en el Escalón 2 junto con el núcleo.)
2. E2E:
   - onboarding.
   - reserva pública.
   - acceso al panel admin.
3. Infraestructura:
   - conexión Prisma/D1.
   - uploads R2.
   - middleware de dominio y mantenimiento.

### Calidad de código

- Mantener lint sin errores desde el Escalón 0; aquí se reducen warnings relevantes.
- Eliminar `any` evitables en admin.
- Eliminar `require()` dinámicos cuando la configuración de build ya sea estable.
- Mantener DTOs y schemas compartidos por feature.

### Documentación

- README operativo real.
- Arquitectura y estructura de features.
- Variables de entorno y bindings Cloudflare.
- Migraciones y estrategia de rollback.
- Desarrollo local y despliegue.

## Escalón 8 - Integraciones futuras

Posponer hasta que los escalones anteriores estén cerrados:

- Stripe o Mercado Pago con webhooks.
- Email transaccional (habilita recuperación de password, confirmaciones y recordatorios).
- WhatsApp, OTP y correos reales.
- IA Linki.
- Campañas, referidos, membresías y gift cards.
- Dominios personalizados con verificación DNS y HTTPS.

> Advertencia de arquitectura: los dominios personalizados a escala de SaaS superan el límite de Cloudflare Pages. Esta integración exigirá evaluar Workers for Platforms (dominios como recursos del Worker), lo que puede alterar la vía de despliegue elegida en el Escalón 0. La decisión del Escalón 0 debe registrarse con este riesgo conocido y el costo de migrar después.

## Orden de ejecución

1. Escalón 0: baseline reproducible (incluye rotación de secreto y lint bloqueante).
2. Escalón 1: auth y autorización (con decisiones de sesión y recuperación tomadas al inicio).
3. Escalón 2: reservas correctas (modelo temporal primero, tests de concurrencia incluidos).
4. Escalón 3: datos, archivos, plataforma y observabilidad.
5. Escalón 4 y 5: features y hexagonal pragmática.
6. Escalón 6: refactor de interfaz.
7. Escalón 7: tests complementarios, warnings y documentación.
8. Escalón 8: integraciones comerciales.
