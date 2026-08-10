# Migration Guide — Dynamic Machine Card Dashboard

Migration files:

- `backend/Migrations/20260810_dynamic_machine_dashboard.up.sql`
- `backend/Migrations/20260810_dynamic_machine_dashboard.down.sql`

## Before migration

1. Stop application writes and back up the PostgreSQL database.
2. Back up `backend/data/database.json` and `backend/data/uploads/machines` on the NAS.
3. Verify that the existing `spare_parts.machine_id` type is compatible with the stable text `machine_id`. If the legacy column is numeric, migrate it into a separate text column in a site-specific pre-migration instead of coercing historical identifiers in place.
4. Run the up migration in a staging database and populate `master_machine` from the legacy machine master before enabling the PostgreSQL connection string in production.

## Apply

```sql
\i backend/Migrations/20260810_dynamic_machine_dashboard.up.sql
```

The migration is additive: it creates `master_machine`, one-row-per-machine `machine_realtime`, append-only `machine_history`, and the spare-part fields required for health calculation. No history row is deleted.

## Backfill rules

- Keep the existing numeric ID in `master_machine.legacy_id`.
- Use the asset/machine code as the stable `machine_id` when it is already unique.
- Populate `spare_parts.machine_id` with that same stable ID.
- Keep `machine_realtime` at one row per machine. PLC/MQTT integration upserts the latest value there and appends historical samples to `machine_history`.
- Running hours must be calculated by the backend/PLC integration only while status is `RUNNING`; the browser never increments it.

## Rollback

1. Stop application writes.
2. Restore the pre-migration database backup if any production data was already written to the new tables.
3. Otherwise run the down migration.

```sql
\i backend/Migrations/20260810_dynamic_machine_dashboard.down.sql
```

The down migration intentionally does not drop pre-existing spare-part columns such as `lifetime_hours`, `current_running_hours`, `status`, and replacement dates. Restore from backup for a byte-for-byte rollback.
