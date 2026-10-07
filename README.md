# AgendaLink

AgendaLink permite que negocios publiquen sus servicios, profesionales y disponibilidad para recibir reservas en línea. La aplicación usa Next.js 16, Prisma sobre SQLite local o Cloudflare D1, y almacenamiento de archivos en Cloudflare R2.

## Requisitos

- Node.js 22.6 o superior y npm (la suite usa el test runner integrado y el strip de tipos de Node).
- Wrangler autenticado con Cloudflare para preview/deploy, D1 remota y secretos.
- Acceso al proyecto Cloudflare `agenda-link` para operaciones de producción.

## Configuración local

```bash
npm ci
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

La base local se guarda en `prisma/dev.db` y es desechable. `prisma db push` se usa solo con esa SQLite local; **no ejecutarlo contra producción**. Para probar autenticación local, establece `SESSION_SIGNING_SECRET` en `.env` con un valor aleatorio (por ejemplo, `openssl rand -hex 32`). No reutilizar secretos de producción.

Abre <http://localhost:3000> para probar la aplicación.

## Validaciones

```bash
npm test
npm run test:e2e
npm run lint
npx tsc --noEmit
npm run build
npm run build:cloudflare
npm run preview
```

`npm test` ejecuta pruebas unitarias con dependencias falsas, casos de horarios/DST y journeys API contra D1 local aislada por fixtures. `npm run test:e2e` ejecuta journeys de navegador con Playwright y Chromium; el primer setup local requiere `npx playwright install chromium`. Ninguna suite conecta con D1 de producción. `npm run preview` compila y ejecuta localmente el Worker generado por OpenNext.

## Cloudflare y despliegue

La salida objetivo de producción es un Cloudflare Worker construido con OpenNext. `npm run deploy` publica el Worker y requiere que los bindings D1 (`DB`) y R2 (`BUCKET`) estén configurados en `wrangler.toml`, además de los secretos gestionados con Wrangler. El proyecto Cloudflare Pages sigue atendiendo los dominios de producción mientras se prepara y aprueba el cutover; no mover dominios desde este README.

- [Decisión de despliegue, comandos y runbook de cutover/rollback](docs/cloudflare-deployment.md)
- [Baseline D1, migraciones, verificación y recuperación](docs/d1-migration-reconciliation.md)
- [Variables y rotación de secretos](docs/secrets.md)
- [Contratos públicos y políticas de medios](docs/api/public-availability.md) · [R2/media](docs/api/media.md) · [datos administrativos](docs/api/admin-business.md)
- [Rate limiting por operación](docs/api/rate-limiting.md)
- [Logs estructurados y runbook de incidentes](docs/operations/observability.md)
- [Límites de features y server](docs/architecture/feature-boundaries.md)
- [Checklist de release y rollback](docs/operations/release-checklist.md)
- [Plan técnico por escalones](docs/plan-mejora-agendalink.md)
- [ADR-0001: sesiones y recuperación](docs/adr/0001-sesiones-y-recuperacion-de-password.md) · [ADR-0002: zona horaria y reservas UTC](docs/adr/0002-zona-horaria-y-reservas-utc.md) · [ADR-0003: cancelación y reprogramación](docs/adr/0003-cancelacion-y-reprogramacion.md)

### Migraciones D1

Las migraciones remotas se aplican con Wrangler y nunca con `prisma db push`, `prisma migrate deploy` ni `prisma migrate reset`:

```bash
npx wrangler d1 migrations list agenda-link-db --remote
npx wrangler d1 migrations apply agenda-link-db --remote
npx wrangler d1 execute agenda-link-db --remote --command "PRAGMA foreign_key_check"
```

Antes de una migración de producción, revisar el SQL, respaldar la base y seguir el procedimiento de rollback de `docs/d1-migration-reconciliation.md`. Confirmar también los conteos de las tablas afectadas y el funcionamiento de la aplicación.

### Secretos

No agregar credenciales a `.env.example`, al código ni a archivos versionados. Los secretos de producción se configuran en Cloudflare; consultar `docs/secrets.md` para los comandos y la rotación.

## Estructura principal

- `src/app/`: páginas, API routes y middleware de Next.js.
- `src/features/`: validación, contratos y casos de uso de booking, schedule, businesses, catalog, team, branding, media y platform.
- `src/server/`: auth, autorización, rate limiting, errores y logs seguros.
- `src/lib/`: adaptadores Prisma/D1 y acceso directo a bindings Cloudflare, incluido R2.
- `prisma/schema.prisma`: esquema compartido entre SQLite local y D1.
- `prisma/migrations/`: secuencia canónica de migraciones D1.
- `docs/`: decisiones, contratos API, arquitectura, operación y roadmap.
