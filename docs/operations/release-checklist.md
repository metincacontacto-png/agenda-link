# Checklist de release

Usar esta lista para cada publicación del Worker. Las rutas `agendalink.cl/*` y `www.agendalink.cl/*` están activas: todo deploy del Worker afecta producción. `workers.dev` está deshabilitado en esta configuración. Pages conserva sus asociaciones como fallback; el procedimiento de rollback está en [Cloudflare deployment](../cloudflare-deployment.md).

## Antes de desplegar

- [ ] Revisar el diff completo y confirmar que no contiene secretos, datos personales de clientes ni archivos locales.
- [ ] Confirmar que las migraciones D1 son incrementales, revisadas y compatibles con el estado remoto. Nunca usar `prisma db push`, `prisma migrate reset` o `prisma migrate deploy` contra D1.
- [ ] Si hay una migración, guardar un respaldo de D1, anotar las tablas afectadas y seguir [D1 reconciliation](../d1-migration-reconciliation.md).
- [ ] Ejecutar todas las validaciones locales:

  ```bash
  npm ci
  npx prisma generate
  npm test
  npm run test:e2e
  npm run lint
  npx tsc --noEmit
  npm run build:cloudflare
  npm run preview
  ```

- [ ] Confirmar que el workflow de CI terminó en verde para el commit que se va a desplegar.
- [ ] Hacer preflight del bundle remoto:

  ```bash
  npm run deploy -- --dry-run
  ```

- [ ] Comprobar que el Worker tiene `SESSION_SIGNING_SECRET`, los bindings `DB`, `BUCKET`, `ASSETS`, `WORKER_SELF_REFERENCE` y los rate limiters requeridos. No copiar secretos de Pages al Worker.
- [ ] Registrar el identificador de la versión activa con `npx wrangler deployments list`.

## Publicación y smoke test del Worker

- [ ] Para cambios locales sin publicar, ejecutar `npm run build:cloudflare` y `npm run deploy -- --dry-run`.
- [ ] Para un deploy autorizado, recordar que Worker Routes activas enrutan ambos dominios de producción al Worker.
- [ ] Comprobar `agendalink.cl`, `www.agendalink.cl` y `/api/maintenance-check`. La URL `workers.dev` responde `404` si no se habilita explícitamente.
- [ ] Probar una landing y disponibilidad pública de un negocio de prueba; confirmar que servicios, profesionales, horarios y zona horaria coinciden.
- [ ] Confirmar que `/api/super-admin` devuelve `401` sin sesión y que una sesión sin rol Super Admin no obtiene acceso.
- [ ] Confirmar que una ruta `/api/media/<key>` inexistente devuelve `404` y que una imagen existente usa un tipo MIME seguro.
- [ ] Revisar Workers Logs por errores 5xx y confirmar que los logs no incluyan contraseñas, cookies, tokens ni PII innecesaria.
- [ ] Confirmar que Pages mantiene los dominios asociados para que el rollback por retirada de rutas sea inmediato.

## Cutover de dominios

**No ejecutar sin una ventana aprobada.** Seguir íntegramente el [runbook de cutover y rollback](../cloudflare-deployment.md#runbook-de-cutover-pages-a-worker), incluyendo retiro temporal de dominios de Pages, asignación al Worker, verificación funcional y restauración de Pages si falla cualquier aceptación.

Antes de cerrar la ventana:

- [ ] Landing, agenda y creación de reserva verificadas en ambos dominios.
- [ ] Acceso Super Admin autenticado por sesión y rol global verificado.
- [ ] Lectura D1 y objetos R2 verificados en el Worker.
- [ ] Plan de rollback disponible y versión anterior identificada.
- [ ] Observabilidad revisada durante la ventana y sin errores críticos pendientes.

## Rollback

- Si falla la aplicación pero los dominios no se movieron, volver a la versión de Worker registrada antes del deploy:

  ```bash
  npx wrangler rollback <version-id> --name agenda-link
  ```

- Si el fallo ocurre durante el cutover, retirar los custom domains del Worker y volver a asociarlos al proyecto Pages siguiendo el runbook.
- No revertir ni borrar datos D1 como respuesta automática. Para problemas de migración, usar el procedimiento de recuperación de `docs/d1-migration-reconciliation.md`.
- Registrar el síntoma, versión afectada, hora y acción de rollback en el seguimiento del incidente.
