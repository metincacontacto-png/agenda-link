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

## Estado de Pages y cutover

El proyecto Pages `agenda-link` sigue atendiendo `agenda-link.pages.dev`, `agendalink.cl` y `www.agendalink.cl`. Esta tarjeta no cambia DNS, dominios ni el deploy activo.

Un futuro cutover debe:

1. Desplegar y probar el Worker sin rutas de produccion.
2. Configurar los dominios de la zona de AgendaLink en el Worker.
3. Verificar landing, reserva, D1, R2 y rutas administrativas.
4. Retirar los dominios del proyecto Pages solo despues de confirmar el Worker.
5. Volver a asociar los dominios a Pages si falla la validacion.

No se deben configurar dominios Pages y Worker simultaneamente para el mismo hostname.

## Runbook de cutover Pages a Worker

No ejecutar estos pasos sin una ventana de cambio aprobada. El Worker de prueba actual esta disponible en `https://agenda-link.metincacontacto.workers.dev` y no tiene dominios de produccion asociados.

### Preflight

1. Confirmar que el Worker responde en su URL `workers.dev` y que `/api/maintenance-check` devuelve el estado esperado.
2. Confirmar que `SUPER_ADMIN_PASSWORD` aparece en ambos listados, sin intentar leer su valor:

   ```bash
   npx wrangler secret list
   npx wrangler pages secret list --project-name agenda-link
   ```

3. Guardar el deployment y version activos antes del cambio:

   ```bash
   npx wrangler deployments list
   ```

4. Tener disponible la credencial de superadmin en un gestor de contraseñas para validar la API mediante el header `x-super-admin-password`.

### Cambio

1. En el dashboard de Cloudflare, abrir **Workers & Pages > agenda-link > Custom domains** y retirar `agendalink.cl` y `www.agendalink.cl` del proyecto Pages.
2. Añadir los dominios al Worker en `wrangler.toml`:

   ```toml
   routes = [
     { pattern = "agendalink.cl", custom_domain = true },
     { pattern = "www.agendalink.cl", custom_domain = true },
   ]
   ```

3. Desplegar el Worker y comprobar que el nuevo deployment conserva los bindings `DB`, `BUCKET`, `ASSETS` y `WORKER_SELF_REFERENCE`:

   ```bash
   npm run deploy
   ```

4. Validar ambos dominios: landing, reserva, `/api/maintenance-check`, una petición de superadmin con el header de autenticación y un intento inválido que devuelva `401`.

### Rollback

1. Si falla una validación de dominio, retirar los custom domains del Worker en el dashboard de Cloudflare.
2. Volver a añadir los dominios al proyecto Pages desde **Workers & Pages > agenda-link > Custom domains**.
3. Validar Pages antes de cerrar el incidente.
4. Si el problema es una versión del Worker y no el dominio, volver a una versión anterior:

   ```bash
   npx wrangler rollback <version-id> --name agenda-link
   ```

## Dominios de clientes

Workers normales solo pueden configurar custom domains en zonas de la cuenta. Para un SaaS con dominios propios de clientes se requiere Workers for Platforms junto con Cloudflare for SaaS. Esa capacidad no se habilita en este cambio; el Worker unico deja una ruta de migracion compatible para cuando se necesite.

## Bindings

`wrangler.toml` mantiene los bindings actuales de D1 (`DB`) y R2 (`BUCKET`), y agrega los bindings requeridos por OpenNext:

- `ASSETS` sirve `.open-next/assets`.
- `WORKER_SELF_REFERENCE` permite las llamadas internas de OpenNext.

No agregar secretos al archivo de configuración. Los secretos de Worker se gestionan con `wrangler secret put`.

## Proxy de mantenimiento y dominios

El Proxy lee `maintenanceMode` y `customDomain` con una sola consulta D1 directa. No hace self-fetch a `/api/maintenance-check` ni `/api/domain-lookup`, y mantiene fuera del lookup los hosts del sistema, assets, rutas API y paneles administrativos. Los custom domains se reescriben una sola vez al slug resuelto. Los errores se registran con Ray ID y ruta, sin query string ni datos del cliente.
