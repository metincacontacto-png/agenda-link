# Rate limiting en Cloudflare Workers

El Worker aplica los Rate Limiting bindings nativos de Cloudflare por IP y operación. El periodo es 60 segundos:

| Binding | Operación | Límite |
| --- | --- | ---: |
| `AUTH_RATE_LIMITER` | login y registro (contadores separados por ruta) | 10/min |
| `ONBOARDING_RATE_LIMITER` | creación de negocios | 5/min |
| `BOOKING_RATE_LIMITER` | reservas públicas | 20/min |
| `SUPER_ADMIN_RATE_LIMITER` | operaciones de Super Admin | 10/min |

Al superar el umbral la ruta responde `429` sin procesar el cuerpo ni exponer datos. Los bindings usan namespaces distintos y límites locales a la ubicación Cloudflare que atiende la solicitud; no representan una cuota global distribuida. Ajustar umbrales antes de una campaña o cambio de tráfico en `wrangler.toml`.

En `next dev`, si el binding no está disponible, el control se omite para permitir desarrollo local. Los despliegues que atienden tráfico deben tener los cuatro bindings configurados; si falta uno, la ruta falla con `503` en vez de omitir el límite.
