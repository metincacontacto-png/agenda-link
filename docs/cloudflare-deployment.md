# Despliegue Cloudflare

## Decision

AgendaLink usa OpenNext sobre Cloudflare Workers como unica ruta objetivo de build y deploy.

La configuracion anterior adaptaba manualmente `.open-next` a una salida de Cloudflare Pages y modificaba artefactos generados. Esa combinacion no esta soportada por OpenNext y hacia que el build dependiera de `scratch/patch_worker.js`, un archivo inexistente.

La version `@opennextjs/cloudflare` 1.20.8 es compatible con Next.js 16.3.8 y Wrangler 4.147.0 instalados en el proyecto. El build produce `.open-next/worker.js` y `.open-next/assets`, que `wrangler.toml` usa directamente.

No configurar `config.default.minify = true` en `open-next.config.ts`. Esa optimizacion previa impide que OpenNext aplique su parche soportado para el loader de instrumentacion de Next.js y deja un `require` dinamico que Workers no admite. La minificacion final del Worker sigue a cargo de OpenNext.

## Comandos

```bash
# Compilar Next.js para produccion
npm run build

# Crear el Worker OpenNext
npm run build:cloudflare

# Probar el Worker compilado en local
npm run preview

# Desplegar el Worker cuando se haya aprobado el cutover
npm run deploy
```

Antes de un deploy remoto, validar el bundle sin subirlo:

```bash
npm run deploy -- --dry-run
```

## Estado actual de Pages y Worker Routes

El proyecto Pages `agenda-link` conserva `agenda-link.pages.dev` y la asociación de `agendalink.cl` / `www.agendalink.cl`. Desde el deploy de Worker Routes, el Worker intercepta tráfico de esos dos hostnames; Pages permanece asociado para rollback. No se borraron ni cambiaron registros DNS.

`workers.dev` queda deshabilitado por Wrangler al configurar rutas, salvo que se habilite explícitamente. En el deployment de producción no se habilitó, para no mantener una URL alternativa sobre los mismos bindings D1/R2.

Un cutover reversible mediante Worker Routes debe:

1. Desplegar y probar el Worker en `workers.dev` sin rutas de producción.
2. Confirmar que los DNS de `agendalink.cl` y `www.agendalink.cl` siguen proxied.
3. Añadir rutas Worker delante del origen Pages y desplegar.
4. Verificar landing, reserva, D1, R2 y rutas administrativas en ambos dominios.
5. Si falla una validación, retirar las rutas Worker; Pages permanece asociado como origen.

No adjuntar un Worker **Custom Domain** al mismo hostname mientras siga configurado como dominio personalizado de Pages. Para un cutover reversible, usar **Worker Routes** sobre los hostnames proxied que ya sirven Pages.

## Runbook reversible Pages a Worker Routes

Las rutas de producción ya están activas. Este runbook registra la activación y sirve para futuros cambios/rollback. Todo `npm run deploy` con estas rutas configuradas actualiza el Worker que atiende tráfico real; requiere revisión de release.

### Preflight

1. Antes de activar rutas, probar el Worker con `npm run preview` o con `workers.dev` solo si está habilitado explícitamente. Con rutas activas, comprobar `/api/maintenance-check` en ambos dominios de producción.
2. Confirmar los secretos que corresponden a cada deployment, sin leer sus valores:

   ```bash
   npx wrangler secret list
   npx wrangler pages secret list --project-name agenda-link
   ```

   El Worker debe tener `SESSION_SIGNING_SECRET`; Pages conserva `SUPER_ADMIN_PASSWORD` solo mientras siga ejecutando el flujo legado. El Worker no usa `SUPER_ADMIN_PASSWORD`.

3. Guardar el deployment y version activos antes del cambio:

   ```bash
   npx wrangler deployments list
   ```

4. Tener disponible la contraseña de una cuenta con `globalRole = SUPER_ADMIN` y confirmar que esa cuenta existe en la D1 enlazada al Worker.

### Cambio de tráfico

1. Confirmar en **DNS > Records** que los hostnames siguen proxied y que Pages conserva `agendalink.cl` y `www.agendalink.cl`. No borrar CNAME ni retirar los dominios de Pages.
2. Confirmar que `wrangler.toml` contiene las rutas Worker:

   ```toml
   [[routes]]
   pattern = "agendalink.cl/*"
   zone_name = "agendalink.cl"

   [[routes]]
   pattern = "www.agendalink.cl/*"
   zone_name = "agendalink.cl"
   ```

3. Desplegar el Worker y comprobar que el nuevo deployment conserva los bindings `DB`, `BUCKET`, `ASSETS` y `WORKER_SELF_REFERENCE`:

   ```bash
   npm run deploy
   ```

4. Validar ambos dominios: landing, reserva, assets, APIs y `/api/maintenance-check`. Iniciar sesión con la cuenta Super Admin y comprobar que `GET /api/super-admin` devuelve `200`; sin sesión debe devolver `401` y con una sesión sin el rol global debe devolver `403`. `agenda-link.pages.dev` sigue apuntando directamente a Pages y sirve de comparación/diagnóstico.

### Rollback

1. Retirar ambos bloques `[[routes]]` de `wrangler.toml` y desplegar de nuevo, o desactivar las rutas de `agenda-link` desde **Workers & Pages > agenda-link > Triggers > Routes**.
2. Confirmar que los dos hostnames vuelven a servir Pages y validar sus rutas públicas principales.
3. Si el problema es solo el código del Worker y no las rutas, volver a una versión anterior:

   ```bash
   npx wrangler rollback <version-id> --name agenda-link
   ```

4. Mantener los dominios asociados a Pages durante el rollback; no hace falta reconstruir DNS ni esperar certificados nuevos.

## Dominios de clientes

Workers normales solo pueden configurar custom domains en zonas de la cuenta. Para un SaaS con dominios propios de clientes se requiere Workers for Platforms junto con Cloudflare for SaaS. Esa capacidad no se habilita en este cambio; el Worker unico deja una ruta de migracion compatible para cuando se necesite.

## Bindings

`wrangler.toml` mantiene los bindings actuales de D1 (`DB`) y R2 (`BUCKET`), y agrega los bindings requeridos por OpenNext:

- `ASSETS` sirve `.open-next/assets`.
- `WORKER_SELF_REFERENCE` permite las llamadas internas de OpenNext.

No agregar secretos al archivo de configuración. Los secretos de Worker se gestionan con `wrangler secret put`.

## Proxy de mantenimiento y dominios

El Proxy delega la política de maintenance y custom domains a `features/platform/routing.ts`, que lee ambos valores con una sola consulta D1 parametrizada. No hace self-fetch a `/api/maintenance-check` ni `/api/domain-lookup`, y mantiene fuera del lookup los hosts del sistema, assets, rutas API y paneles administrativos. Los custom domains se reescriben una sola vez al slug resuelto. Los errores se registran con Ray ID y ruta, sin query string ni datos del cliente.
