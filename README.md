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
npm run lint
npx tsc --noEmit
npm run build
npm run build:cloudflare
npm run preview
```

`npm test` ejecuta las pruebas de horarios/DST y un journey de reserva contra D1 local aislada por fixtures que se eliminan al finalizar. `npm run preview` compila y ejecuta localmente el Worker generado por OpenNext.

## Cloudflare y despliegue

La salida objetivo de producción es un Cloudflare Worker construido con OpenNext. `npm run deploy` publica el Worker y requiere que los bindings D1 (`DB`) y R2 (`BUCKET`) estén configurados en `wrangler.toml`, además de los secretos gestionados con Wrangler. El proyecto Cloudflare Pages sigue atendiendo los dominios de producción mientras se prepara y aprueba el cutover; no mover dominios desde este README.

- [Decisión de despliegue, comandos y runbook de cutover/rollback](docs/cloudflare-deployment.md)
- [Baseline D1, migraciones, verificación y recuperación](docs/d1-migration-reconciliation.md)
- [Variables y rotación de secretos](docs/secrets.md)
- [Plan técnico por escalones](docs/plan-mejora-agendalink.md)

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
- `src/lib/`: acceso a datos y adaptadores de infraestructura.
- `prisma/schema.prisma`: esquema compartido entre SQLite local y D1.
- `prisma/migrations/`: secuencia canónica de migraciones D1.
- `docs/`: decisiones, operación y roadmap.
