# Plan de mejora de AgendaLink

## Estado al 2026-10-07

- Los escalones 0-3 están implementados y verificados localmente; los cambios recientes también están publicados en el Worker de prueba `agenda-link.metincacontacto.workers.dev`.
- El escalón 4 tiene límites `features/`, `server/` y `lib/`; la extracción vertical de booking, businesses, catálogo, team, branding, media y platform está aplicada.
- El escalón 5 está parcial: `BookingRepository` y `Clock` están inyectados y probados con fakes; faltan providers para otros dominios.
- El escalón 6 está implementado: las vistas del admin son componentes independientes, los hooks de carga, agenda, reservas y branding están extraídos, y `src/app/admin/[slug]/page.tsx` quedó como guardas, shell y composición de tabs (355 líneas).
- El escalón 7 tiene 33 pruebas unitarias/integración y E2E de onboarding, login, acceso al panel, reservas, ventas/clientes, acceso cruzado y mantenimiento; pasan localmente. El workflow CI está configurado, pero todavía falta confirmar CI remoto verde para el commit de release.
- Pages conserva los dominios de producción. Las Worker Routes reversibles están preparadas en `wrangler.toml` y pasan `--dry-run`; falta aprobación para activarlas y validar los dominios en vivo. Ver [runbook](cloudflare-deployment.md#runbook-de-cutover-reversible-pages-a-worker-routes).

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

### Hallazgos iniciales resueltos

- La guía de configuración, `.env.example` y runbook están disponibles en `README.md` y `docs/`.
- El password de superadmin por defecto (`Giovanni2026`) se trató como comprometido: el fallback fue retirado y el secreto legado de Pages se rotó. El Worker autoriza por sesión y rol global.
- Los errores bloqueantes de lint y typecheck fueron resueltos; quedan warnings no bloqueantes registrados por ESLint.

### Acciones completadas

1. Rotar y retirar el fallback de `SUPER_ADMIN_PASSWORD`; la estrategia por deployment y `SESSION_SIGNING_SECRET` están en [gestión de secretos](secrets.md).
2. Resolver los errores bloqueantes de lint (`require()` prohibidos y `any` explícitos).
3. Crear `.env.example` sin secretos.
4. Documentar el entorno local en `README.md`:
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

### Riesgos identificados al iniciar el trabajo

- El panel de un negocio es accesible con solo conocer su `slug`.
- Endpoints administrativos exponen datos sin comprobar una sesión.
- Superadmin usa password por query string/header y tiene un fallback hardcodeado.
- El endpoint `google-seed` crea negocios demo sin autenticación.

El Worker actual usa sesiones, membresías y rol global. La ruta experimental `google-seed` fue retirada; Pages sigue atendiendo dominios de producción hasta que se apruebe y complete el cutover.

### Decisiones adoptadas

Las decisiones de sesión y recuperación están aceptadas en [ADR-0001](adr/0001-sesiones-y-recuperacion-de-password.md): cookie HMAC stateless con expiración máxima de 8 horas, roles/membresías consultados en D1 y restablecimiento manual temporal hasta disponer de email transaccional. No se crea modelo `Session` para este MVP.

### Modelo implementado

Se agregaron los modelos:

- `User`: email, hash de password, nombre y rol global.
- `BusinessMember`: relación entre usuario, negocio y rol dentro del negocio.
- No se creó `Session`: el ADR eligió cookies HMAC stateless.

### Acciones implementadas en el Worker

1. Hash y verificación de password con WebCrypto compatible con Cloudflare Workers.
2. Sesiones mediante cookies `httpOnly`, `Secure` y `SameSite=Lax` según la estrategia decidida.
3. Endpoints implementados:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
   - `GET /api/auth/me`
4. Helpers de servidor implementados:
   - `requireSession()`
   - `requireBusinessAccess(businessId)`
   - `requireSuperAdmin()`
5. `/api/admin`, `/api/services`, `/api/appointments`, `/api/super-admin`, `/admin/[slug]` y `/super-admin` requieren sesión y autorización correspondiente en el Worker.
6. Se retiró la autorización por password en URL/header del Worker y las cuentas demo fijas.
7. Se eliminó `/api/auth/google-seed`; la creación de cuentas y negocios usa el flujo validado de onboarding.

### Criterio de aceptación

- Toda API privada responde `401` sin sesión.
- Un usuario no puede consultar ni modificar un negocio del que no es miembro.
- Superadmin se autoriza por rol, no por un secreto compartido en la URL.

## Escalón 2 - Reservas correctas

Estado: completado. El modelo UTC/DST, disponibilidad, validación de pertenencia, persistencia atómica, DTO público, cancelación/reprogramación y cobertura correspondiente están implementados.

### Problemas identificados al iniciar el trabajo

- Se puede reservar un servicio o profesional de otro negocio.
- Dos reservas concurrentes pueden tomar el mismo horario.
- La disponibilidad es fija, no considera duración, horarios configurables ni zona horaria.
- El bloqueo de horarios se hace por negocio, no por profesional.
- El endpoint público de disponibilidad devuelve datos internos de `Business`.
- `dateTime` se guarda como fecha naive construida en el navegador del cliente, sin zona horaria.

### Primer entregable: modelo temporal

La decisión quedó aceptada en [ADR-0002](adr/0002-zona-horaria-y-reservas-utc.md): zona IANA por negocio, citas persistidas como instantes UTC, resolución determinista de horas DST inexistentes/repetidas y citas existentes que conservan su instante al cambiar la zona.

### Acciones implementadas

1. Se valida el input de disponibilidad y reserva con schemas tipados.
2. Se comprueba que el servicio y profesional pertenecen al negocio solicitado.
3. Se validan la fecha futura, el horario de atención y la duración del servicio.
4. La cita se crea con un chequeo atómico final de conflicto.
5. La escritura D1 serializada impide solapamientos para `businessId`, `professionalId` y `dateTime`.
6. Las citas se guardan como instantes UTC con la zona IANA del negocio.
7. Se devuelven DTOs públicos limitados, sin email, plan, bypass ni otros flags internos.
8. Se implementaron la cancelación y reprogramación autenticadas, con auditoría y re-chequeo atómico. Ver [ADR-0003](adr/0003-cancelacion-y-reprogramacion.md).
9. La suite cubre reservas válidas/inválidas, servicio de otro negocio, concurrencia y DST.

### Criterio de aceptación

- No existe doble reserva para el mismo profesional y horario, verificada con test de concurrencia.
- Un servicio o profesional de otro negocio es rechazado.
- Las APIs públicas no filtran información privada del negocio.
- Una cita creada en horario con cambio de hora DST se muestra a la hora local correcta.

## Escalón 3 - Datos, archivos y plataforma

El escalón quedó implementado: PII administrativa paginada por rol, archivos validados, límites de petición, routing de dominios/mantenimiento y logging estructurado. Ver `docs/api/`, `docs/operations/observability.md` y `docs/architecture/feature-boundaries.md`.

### Acciones implementadas

1. Citas y clientes se paginan en los endpoints administrativos.
2. WhatsApp y datos personales se restringen según el rol.
3. Los uploads se validan por MIME real, tamaño máximo y formato permitido.
4. La `key` de `/api/media/[key]` se valida antes de leer R2.
5. Base64 se conserva como fallback de desarrollo; producción requiere el binding R2.
6. Login, onboarding, reservas y Super Admin usan rate limiting.
7. El routing evita self-fetch y combina mantenimiento/dominio en una lectura D1.
8. Logs y errores tienen una política que excluye secretos y PII innecesaria.
9. La observabilidad incluye logs estructurados, correlación por request y un runbook de Workers Logs/dashboard; el proveedor externo de error tracking queda pendiente.

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
    booking/
    businesses/
    catalog/
    team/
    schedule/
    branding/
    media/
    platform/
  server/
    auth.ts
    authorize.ts
  lib/
    db.ts
    cloudflare.ts
    r2.ts
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

Estado: parcial. `features/booking/create-booking.ts` ya recibe un `BookingRepository` y `Clock`; `lib/prisma-booking-repository.ts` conecta Prisma/D1 y el caso de uso se prueba con fakes. Quedan por introducir providers intercambiables para pagos y mensajería cuando exista una implementación real adicional.

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
