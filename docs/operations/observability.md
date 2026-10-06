# Observabilidad y diagnóstico en Workers

AgendaLink usa Cloudflare Workers Logs/Observability como seguimiento de errores operativo del MVP. Los Route Handlers escriben eventos JSON con `event`, `requestId` (Cloudflare Ray ID), método, ruta sin query string, `businessId` cuando está disponible y únicamente clase/código de error.

No se registran cuerpos de request, contraseñas, hashes, cookies, tokens, email, WhatsApp, mensajes de error arbitrarios ni stack traces. Si un error requiere más diagnóstico, reproducirlo en local o añadir contexto no sensible con un cambio revisado.

## Investigar un error

Desde la raíz del repositorio, conectar logs en vivo del Worker de prueba o del Worker de producción:

```bash
npx wrangler tail agenda-link --format pretty
```

Para revisar invocaciones con estado de error:

```bash
npx wrangler tail agenda-link --format json --status error
```

En el dashboard, abrir **Workers & Pages → agenda-link → Observability/Logs** y filtrar por versión, ruta o Ray ID. Un evento `*.failed` contiene el `requestId` y el identificador de negocio opcional para correlación sin guardar datos de cliente.

## Runbook de un 500

1. Anotar hora, ruta y Ray ID de la respuesta; no copiar cookies ni parámetros sensibles.
2. Buscar el evento estructurado con ese Ray ID en Workers Logs.
3. Comparar el `event`, `error.name`/`error.code` y la versión activa del Worker.
4. Revisar salud de D1, binding `BUCKET`, rate-limit bindings y la versión desplegada.
5. Reproducir con datos sintéticos en local y validar `npm test`, lint, typecheck y build antes de publicar un arreglo.

La consulta en vivo no reemplaza la retención del dashboard. Para errores intermitentes, usar el periodo de retención/logpush de la cuenta y conservar el Ray ID, no el contenido de la petición.
