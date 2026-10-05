# Legacy migration snapshots

These SQL files predate the canonical D1 migration history introduced in
`prisma/migrations/00000000000000_agendalink_baseline/migration.sql`.

They are preserved as audit evidence only. Do not apply them to any database:
they contain competing baselines, duplicated payment columns, and restaurant
schema that is not part of the current Prisma model. Production migrations are
discovered through the D1 configuration in `wrangler.toml`.
