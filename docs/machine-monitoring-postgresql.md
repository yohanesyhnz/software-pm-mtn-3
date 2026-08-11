# PostgreSQL Machine Monitoring

## Architecture

The browser never connects to PostgreSQL. One ASP.NET Core hosted service opens
pooled backend connections, validates the configured source identifiers against
`information_schema`, reads one latest row per unique source table in one SQL
round-trip, evaluates machine status, persists running time, and broadcasts the
result through the existing Machine Dashboard WebSocket.

The acquisition flow is:

`PostgreSQL source tables -> MachineDataAcquisitionService -> MachineStatusEngine -> MachineRealtimeRegistry -> persistence -> WebSocket -> Machine Card`

Master Machine stores the source table, timestamp column, parameter name/type,
unit, threshold, timeout, and enable switch. Adding a compatible machine does
not require a frontend or backend source change.

## Backend environment

Provide these values only to the ASP.NET Core process:

```text
POSTGRES_HOST=
POSTGRES_PORT=5432
POSTGRES_DATABASE=
POSTGRES_USER=
POSTGRES_PASSWORD=
```

Do not use `NEXT_PUBLIC_` and do not store the production values in Git. On the
NAS, `scripts/nas/start.sh` loads the administrator-owned file
`shared/config/postgres.env`. Restrict it to the deployment account (`chmod
600`).

## Production schema audit (2026-08-11)

Read-only inspection confirmed `timestamp_zone` as the ordering column on the
available sources. It also found:

- RRU A/B: `counting_product`, `velocity_belt`, and `velocity_object`; the requested `velo_mm` column does not exist.
- Mixing A/B: the actual column is `bobot_actual`, not `"Bobot aktual"`.
- Labeling A: the actual column is `infeed_counter`, not `"Infeed Counter"`.
- `ILE7_LABELLING_ROTA_B` does not currently exist.
- Current source rows generally arrive every 15 seconds; Labeling A currently arrives every 60 seconds.
- The runtime role can read source data but has no `CREATE` privilege on the database or `public` schema.

Tunnel A/B therefore use the configurable `velocity_belt` candidate with an
empty unit. A database/automation owner should confirm whether
`velocity_belt` or `velocity_object` is the authoritative HQL speed signal.
Labeling B remains configured and reports `DATA UNAVAILABLE` until the source
table appears; it never fabricates a STOPPED status.

Because source records arrive more slowly than the requested 10-second stop
timeout, the engine evaluates inactivity only when a new source timestamp is
available. This avoids alternating RUNNING/STOPPED between PostgreSQL inserts.
Detection precision cannot be faster than the upstream sampling interval.

## Database migration

Back up the `production` database, then have the database owner run:

```bash
psql --set ON_ERROR_STOP=1 --file backend/Migrations/20260811_machine_status_engine.up.sql
```

The migration uses `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`,
and upserts only the monitoring configuration. It does not drop history or
replace source tables. The application continues to use the existing durable
server-state fallback if the migration has not yet been applied, so status and
running-hours values survive browser refresh and backend restart.

## Rollback

1. Stop the application.
2. Back up `master_machine`, `machine_realtime`, `machine_status_history`, and `machine_events`.
3. Run `backend/Migrations/20260811_machine_status_engine.down.sql` as the database owner.
4. Deploy the prior release.
5. Start the application and verify `/api/health`.

The down migration disables acquisition for the seeded machines and retains
all state/history. It deliberately performs no destructive `DROP` operation.

## Diagnostics

`GET /api/machine-monitoring/diagnostics` reports configured machine count,
application-schema readiness, per-machine value/status/running hours, source
timestamp, last update, and connection status. It never returns a host,
username, password, or connection string.
