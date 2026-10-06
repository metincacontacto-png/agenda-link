# Reconciliacion de migraciones D1

## Estado auditado

Auditoria realizada el 2026-10-03 sobre `agenda-link-db`.

- Base remota: `cc3d3e2c-ce4c-46f5-b25e-b3e71a3fb611`.
- La base contiene datos reales: 11 negocios, 15 servicios, 13 profesionales, 16 citas y 1 ajuste de sistema.
- `PRAGMA foreign_key_check` no devolvio errores.
- No existia `_prisma_migrations` ni historial previo de migraciones D1.
- La D1 tenia las tablas actuales de AgendaLink y tres restos del modelo anterior de restaurante: `Table`, `MenuItem`, y las columnas `Appointment.peopleCount`/`Appointment.tableId`.
- Las tablas legacy y las columnas legacy no contienen datos, pero no se eliminan en esta reconciliacion.

## Decision adoptada

`prisma/schema.prisma` sigue siendo el modelo de datos de Prisma. Las migraciones de produccion se aplican con Wrangler sobre D1.

```text
prisma/
  schema.prisma
  migrations/
    migration_lock.toml
    00000000000000_agendalink_baseline/
      migration.sql
  migrations-legacy/
    ... snapshots SQL anteriores, no ejecutables
```

`wrangler.toml` descubre el formato de Prisma mediante:

```toml
migrations_dir = "prisma/migrations"
migrations_pattern = "prisma/migrations/*/migration.sql"
```

No usar estos comandos contra produccion:

- `prisma db push`
- `prisma migrate deploy`
- `prisma migrate reset`

`prisma db push` queda reservado para la SQLite desechable de desarrollo (`prisma/dev.db`). La D1 remota se cambia solo con `wrangler d1 migrations apply`.

## Baseline aplicada

La migracion `00000000000000_agendalink_baseline/migration.sql` es intencionalmente idempotente:

- Usa `CREATE TABLE IF NOT EXISTS` e indices `IF NOT EXISTS`.
- Crea el esquema actual en una D1 nueva.
- En la D1 poblada no reescribe tablas ni datos; solo registra la baseline en `d1_migrations`.
- Fue probada primero en una D1 local aislada.

Wrangler registro la baseline remota el 2026-10-03 00:38:57. Despues de aplicarla:

- No hay migraciones pendientes.
- Los conteos de negocios, servicios, profesionales, citas y ajustes no cambiaron.
- La integridad de claves foraneas sigue valida.

## Legacy pendiente de retiro

La D1 remota conserva `Table`, `MenuItem`, `Appointment.peopleCount` y `Appointment.tableId`. No pertenecen al modelo Prisma actual.

Su eliminacion debe ser una migracion separada, despues de:

1. Crear o verificar un backup recuperable.
2. Revisar nuevamente que las tablas y columnas siguen sin datos.
3. Probar la migracion en una copia local de D1.
4. Recrear `Appointment` sin las columnas legacy, porque SQLite no permite eliminar columnas con la misma seguridad en todas las versiones.

No mezclar esa limpieza con una migracion funcional de producto.

## Flujo para futuras migraciones

La migración `20261005200000_identity_membership` añade `User` y `BusinessMember`, crea usuarios sin credenciales para emails de negocio no vacíos (normalizados con `LOWER(TRIM(email))`) y los asocia como `OWNER`. `passwordHash` queda nulo hasta provisionar credenciales mediante el proceso manual autorizado; no se inventan passwords ni se habilita un reclamo de cuenta solo por conocer el email. Los negocios sin email quedan sin membresía hasta completar una asociación manual verificada. En la auditoría previa había 4 negocios sin email.

La migración `20261006200000_professional_schedules_timezone` añade la zona IANA de negocio, horarios semanales de negocio/profesional, descansos recurrentes y bloqueos puntuales. Para preservar la disponibilidad existente, se inicializaron los negocios y profesionales previos con horario diario 09:00–18:00 en hora local. Los bloqueos puntuales se guardan en UTC; las ventanas semanales se expresan en minutos de la hora civil local.

La migración `20261006210000_appointment_conflict_lookup` añade un índice de consulta por negocio, profesional e instante. La reserva hace el re-chequeo final y el `INSERT` en una única sentencia SQLite/D1, que descarta solapamientos de duración y bloqueos concurrentes antes de insertar.

1. Cambiar `prisma/schema.prisma`.
2. Generar y revisar el SQL de diferencia:

   ```bash
   npx prisma migrate diff \
     --from-migrations prisma/migrations \
     --to-schema-datamodel prisma/schema.prisma \
     --script
   ```

3. Crear `prisma/migrations/<timestamp>_<nombre>/migration.sql` con el SQL revisado.
4. Probarlo en una D1 local aislada:

   ```bash
   npx wrangler d1 migrations apply agenda-link-db --local \
     --persist-to /tmp/agendalink-d1-test
   ```

5. Inspeccionar esquema, conteos y claves foraneas locales.
6. Confirmar pendientes remotos:

   ```bash
   npx wrangler d1 migrations list agenda-link-db --remote
   ```

7. Aplicar a produccion:

   ```bash
   npx wrangler d1 migrations apply agenda-link-db --remote
   ```

Wrangler captura un backup antes de aplicar migraciones remotas. Aun asi, toda migracion que elimine datos o reconstruya tablas necesita un plan de restore documentado antes de ejecutarse.

## Verificacion minima despues de cada deploy

```bash
npx wrangler d1 migrations list agenda-link-db --remote
npx wrangler d1 execute agenda-link-db --remote --command "PRAGMA foreign_key_check"
```

Ademas, validar los conteos de las tablas afectadas y ejecutar los tests de la feature que introdujo la migracion.
