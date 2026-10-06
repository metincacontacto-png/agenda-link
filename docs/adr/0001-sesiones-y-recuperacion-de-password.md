# ADR-0001: Sesiones y recuperación de contraseña

- Estado: Aceptado
- Fecha: 2026-10-05
- Alcance: MVP de autenticación propia de AgendaLink

## Contexto

AgendaLink necesita identificar al usuario en las solicitudes y páginas protegidas, correr en Cloudflare Workers y permitir cerrar sesiones. Aún no existe un proveedor de email transaccional para entregar enlaces de recuperación. La decisión debe limitar el impacto de robo de cookies sin exigir una consulta a D1 en cada request.

## Decisiones

### Sesión

Usar una cookie de sesión firmada con HMAC-SHA-256, validada con `crypto.subtle` compatible con Workers. El payload contiene únicamente el identificador de usuario (`sub`), `iat` y `exp`; no contiene email, roles ni datos de negocio. Roles y membresías se consultan desde D1 al autorizar operaciones.

- Expiración máxima: 8 horas desde el inicio de sesión, sin refresh silencioso en el MVP.
- Cookie: `HttpOnly`, `Secure` en producción, `SameSite=Lax`, `Path=/` y `Max-Age` alineado con `exp`.
- Logout: expirar la cookie inmediatamente.
- Clave HMAC: `SESSION_SIGNING_SECRET`, aleatoria, independiente de `SUPER_ADMIN_PASSWORD`, configurada como secreto de Cloudflare; nunca en el repositorio ni en el bundle cliente.
- Rotar la clave invalida todas las cookies existentes. La revocación individual antes de `exp` no está disponible en la estrategia stateless.
- Rechazar firmas inválidas, payload malformado, expiración vencida y timestamps futuros fuera de una tolerancia pequeña. Comparar firmas en tiempo constante cuando la API del runtime lo permita.

### Hash de contraseña

Usar PBKDF2-HMAC-SHA-256 con salt aleatorio de 16 bytes y 100.000 iteraciones. Cloudflare Workers rechaza más de 100.000 iteraciones por operación Web Crypto; el límite se adopta para mantener compatibilidad con el runtime. Mantener límites de intentos y revisar el costo cuando cambie la plataforma. El formato persistido incluye algoritmo e iteraciones para permitir una migración futura.

### Recuperación de contraseña

Posponer los enlaces de recuperación hasta integrar email transaccional. Durante el MVP, el restablecimiento será manual por el superadmin mediante un flujo autenticado que obligue a establecer una contraseña nueva; nunca enviar ni registrar contraseñas en logs. Registrar como mínimo quién realizó el cambio y cuándo, si el mecanismo de auditoría ya está disponible.

## Alternativas consideradas

### Sesiones almacenadas en D1

Permiten revocar una sesión individual y auditarla de inmediato, pero requieren lecturas en D1 para cada request autenticada y un modelo/proceso adicional de limpieza. Se reconsiderará si se necesita revocación inmediata, sesiones por dispositivo o control de sesiones activas.

### Cookies HMAC con estado completamente autosuficiente

Evitan consultas adicionales, pero incluir roles o membresías dentro del payload dejaría permisos obsoletos hasta que expire la cookie. Por eso la cookie solo lleva identidad y timestamps; autorización por negocio siempre consulta los datos actuales de D1.

### Enlaces de recuperación por email

Se posponen: no hay proveedor transaccional. Añadirlos sin entrega confiable, expiración, uso único y protección contra enumeración crearía un flujo incompleto.

## Consecuencias

- No se crea un modelo `Session` en Prisma para este MVP.
- Las rutas autenticadas deben validar firma y expiración, y comprobar roles/membresías vigentes en D1.
- Logout cierra la sesión del navegador actual; para cerrar todas las sesiones se debe rotar `SESSION_SIGNING_SECRET`.
- La recuperación manual es una operación administrativa temporal y debe migrarse a email cuando exista el proveedor.
- El registro y login deben responder con errores que no permitan inferir si una cuenta existe.

## Verificación y revisión

Los tests de autenticación deben cubrir firma válida e inválida, expiración, logout, cookie segura en producción, permisos actualizados después de iniciar sesión y comportamiento al rotar la clave. Revisar este ADR antes de implementar refresh tokens, sesiones por dispositivo o recuperación por email.
