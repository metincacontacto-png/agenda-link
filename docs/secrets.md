# Gestion de secretos

## Regla

Los secretos no se escriben en el repositorio, archivos `.env` versionados, ejemplos ni logs. Las variables requeridas deben fallar de forma explicita cuando no estan configuradas.

`SUPER_ADMIN_PASSWORD` queda únicamente en el deployment legado de Pages mientras siga atendiendo los dominios actuales. El Worker ya autoriza Super Admin mediante el rol global de la cuenta y no usa esta contraseña.

`SESSION_SIGNING_SECRET` firma las cookies de sesión HMAC. Debe ser un secreto aleatorio independiente de la contraseña de superadmin y tener al menos 32 caracteres. Al rotarlo se invalidan todas las sesiones activas.

## Pages actual

El proyecto Pages activo es `agenda-link`. Para crear o rotar el secreto de produccion:

```bash
npx wrangler pages secret put SUPER_ADMIN_PASSWORD --project-name agenda-link
npx wrangler pages secret put SESSION_SIGNING_SECRET --project-name agenda-link
```

Wrangler solicita el valor sin mostrarlo. Pages requiere un nuevo deployment para que el cambio se aplique.

Comprobar solo los nombres configurados:

```bash
npx wrangler pages secret list --project-name agenda-link
```

## Worker despues del cutover

Cuando AgendaLink se despliegue como Worker, usar:

```bash
npx wrangler secret put SUPER_ADMIN_PASSWORD
npx wrangler secret put SESSION_SIGNING_SECRET
```

No asumir que los secretos de Pages se transfieren al Worker.

## Rotacion

1. Generar un valor aleatorio largo en un gestor de contraseñas o canal seguro.
2. Configurarlo en Pages con `wrangler pages secret put`.
3. Desplegar Pages y comprobar que la API superadmin responde con la nueva credencial.
4. Invalidar el valor anterior en todos los gestores y canales donde se hubiera guardado.
5. Si el secreto falta, `/api/super-admin` responde `503` en vez de usar un fallback.

## Alta/restablecimiento manual de Super Admin

Después de asignar `globalRole = SUPER_ADMIN` a la cuenta autorizada, establece su contraseña desde una terminal interactiva. El script pide la contraseña sin mostrarla, la guarda como hash PBKDF2 en D1 y no la escribe en el repositorio ni en logs:

```bash
node scripts/set-super-admin-password.mjs admin@example.com
```

El script solo modifica una cuenta existente cuyo rol global ya sea `SUPER_ADMIN`. Si no actualiza exactamente una cuenta, falla sin crearla ni cambiar otras cuentas.
