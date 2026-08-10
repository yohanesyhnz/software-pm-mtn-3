BEGIN;

CREATE TABLE IF NOT EXISTS master_machine (
    machine_id text PRIMARY KEY,
    legacy_id integer UNIQUE,
    machine_name varchar(200) NOT NULL,
    machine_code varchar(100) NOT NULL UNIQUE,
    line varchar(100) NOT NULL,
    area varchar(100) NOT NULL DEFAULT '',
    department varchar(100) NOT NULL DEFAULT '',
    machine_type varchar(100) NOT NULL DEFAULT '',
    machine_image_url text,
    status_tag varchar(255),
    counter_tag varchar(255),
    speed_tag varchar(255),
    running_hours_tag varchar(255),
    realtime_dashboard_url text,
    display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    display_mode varchar(16) NOT NULL DEFAULT 'AUTO' CHECK (display_mode IN ('AUTO', 'COMPACT', 'STANDARD', 'LARGE')),
    is_active boolean NOT NULL DEFAULT true,
    status varchar(24) NOT NULL DEFAULT 'DATA OFFLINE',
    card_config jsonb NOT NULL DEFAULT '{
      "showImage": true,
      "showMachineName": true,
      "showMachineCode": true,
      "showLine": true,
      "showArea": true,
      "showStatus": true,
      "showCounter": true,
      "showSpeed": true,
      "showRunningHours": true,
      "showHealth": true
    }'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    image_updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS machine_realtime (
    machine_id text PRIMARY KEY REFERENCES master_machine(machine_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    status varchar(24) NOT NULL DEFAULT 'DATA OFFLINE',
    counter_value numeric,
    speed_value numeric,
    counter_unit varchar(32) NOT NULL DEFAULT 'pcs',
    speed_unit varchar(32) NOT NULL DEFAULT 'unit/min',
    running_hours numeric,
    source_timestamp timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS machine_history (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id text NOT NULL REFERENCES master_machine(machine_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    status varchar(24) NOT NULL,
    counter_value numeric,
    speed_value numeric,
    running_hours numeric,
    recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_master_machine_dashboard_order
    ON master_machine (is_active, display_order, machine_name);
CREATE INDEX IF NOT EXISTS ix_machine_history_machine_recorded
    ON machine_history (machine_id, recorded_at DESC);

ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS spare_part_id text;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS machine_id text;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS spare_part_name varchar(200);
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS lifetime_hours numeric;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS last_replacement_running_hours numeric;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS current_running_hours numeric;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS remaining_hours numeric;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS remaining_percentage numeric;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS status varchar(24);
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS last_replacement_date date;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS next_replacement_date date;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS ux_spare_parts_spare_part_id
    ON spare_parts (spare_part_id) WHERE spare_part_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_spare_parts_machine_health
    ON spare_parts (machine_id, is_active, remaining_percentage);

COMMIT;
