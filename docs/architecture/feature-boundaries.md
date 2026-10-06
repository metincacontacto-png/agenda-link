# Límites entre rutas, features, servidor e infraestructura

## Estructura

- `src/app/`: convenciones de Next.js, páginas y adaptadores HTTP (`route.ts`).
- `src/features/<dominio>/`: esquemas, reglas y operaciones propias de un dominio. Booking y horarios viven en `features/booking` y `features/schedule`; las reglas de imágenes públicas, en `features/media`.
- `src/server/`: sesión, autorización, rate limiting, errores y logging seguro. Solo se importa desde código de servidor.
- `src/lib/`: adaptadores técnicos compartidos sin política de producto, como Prisma/D1 y Cloudflare R2.

No crear carpetas vacías. Mover código a un límite cuando exista un caso de uso real, no como reescritura global.

## Responsabilidad de un Route Handler

Un handler debe:

1. Leer y validar el request mediante un esquema de la feature.
2. Autenticar la sesión y autorizar el negocio/rol en `server/`.
3. Invocar el comportamiento de `features/` o el adaptador de persistencia necesario.
4. Convertir el resultado a un DTO explícito y a un estado HTTP.

Los handlers no deben confiar en `businessId`, `userId`, precio, estado de pago ni rol proporcionados por el cliente. Nunca devolver modelos Prisma completos desde rutas públicas.

## Ejemplo ya aplicado

La reserva pública valida sus campos con `features/booking/validation.ts`, resuelve los slots con `features/booking/availability.ts` y convierte la hora local a UTC usando `features/schedule/time.ts`. `POST /api/appointments` verifica que servicio y profesional pertenecen al negocio, determina precio/estado de pago en servidor y hace el chequeo final de solapamiento en una sola sentencia D1 atómica. La disponibilidad pública se proyecta mediante `PublicBusinessDTO`.

Las rutas administrativas llaman a `server/authorize.ts`; el endpoint de Super Admin exige rol global. El cliente solo recibe páginas limitadas de citas y datos privados reducidos según su rol.

## Regla de imports

- Un Client Component puede consumir contratos/funciones puras de `features/`, pero nunca importar Prisma, D1 o `server/`.
- Un Route Handler puede importar `server/`, `features/` y `lib/`.
- `server/` y `lib/` no deben importar páginas o componentes de `app/`.
- `lib/` no define autorización ni reglas de horarios, pagos o reservas.
