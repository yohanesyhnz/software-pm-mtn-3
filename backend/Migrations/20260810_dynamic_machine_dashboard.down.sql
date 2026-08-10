BEGIN;

DROP INDEX IF EXISTS ix_spare_parts_machine_health;
DROP INDEX IF EXISTS ux_spare_parts_spare_part_id;

-- The additive spare_parts columns are deliberately retained. Because the up
-- migration uses ADD COLUMN IF NOT EXISTS, PostgreSQL cannot know whether a
-- column pre-dated this release; dropping it could destroy existing data.

DROP TABLE IF EXISTS machine_history;
DROP TABLE IF EXISTS machine_realtime;
DROP TABLE IF EXISTS master_machine;

COMMIT;
