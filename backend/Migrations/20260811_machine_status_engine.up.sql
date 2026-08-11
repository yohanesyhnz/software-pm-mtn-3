BEGIN;

-- Additive application schema. Run with the database owner/DBA account; the
-- runtime appuser intentionally has no DDL permission in production.
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
    display_mode varchar(16) NOT NULL DEFAULT 'AUTO',
    is_active boolean NOT NULL DEFAULT true,
    status varchar(32) NOT NULL DEFAULT 'DATA UNAVAILABLE',
    card_config jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    image_updated_at timestamptz
);

ALTER TABLE master_machine ADD COLUMN IF NOT EXISTS source_table_name varchar(128);
ALTER TABLE master_machine ADD COLUMN IF NOT EXISTS source_timestamp_column varchar(128) DEFAULT 'timestamp_zone';
ALTER TABLE master_machine ADD COLUMN IF NOT EXISTS parameter_name varchar(128);
ALTER TABLE master_machine ADD COLUMN IF NOT EXISTS parameter_type varchar(16);
ALTER TABLE master_machine ADD COLUMN IF NOT EXISTS parameter_unit varchar(32) DEFAULT '';
ALTER TABLE master_machine ADD COLUMN IF NOT EXISTS running_threshold numeric;
ALTER TABLE master_machine ADD COLUMN IF NOT EXISTS stop_timeout_seconds integer NOT NULL DEFAULT 10;
ALTER TABLE master_machine ADD COLUMN IF NOT EXISTS acquisition_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS machine_realtime (
    machine_id text PRIMARY KEY REFERENCES master_machine(machine_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    status varchar(32) NOT NULL DEFAULT 'DATA UNAVAILABLE',
    counter_value numeric,
    speed_value numeric,
    counter_unit varchar(32) NOT NULL DEFAULT 'pcs',
    speed_unit varchar(32) NOT NULL DEFAULT '',
    running_hours numeric NOT NULL DEFAULT 0,
    source_timestamp timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE machine_realtime ADD COLUMN IF NOT EXISTS parameter_name varchar(128);
ALTER TABLE machine_realtime ADD COLUMN IF NOT EXISTS parameter_type varchar(16);
ALTER TABLE machine_realtime ADD COLUMN IF NOT EXISTS parameter_unit varchar(32) DEFAULT '';
ALTER TABLE machine_realtime ADD COLUMN IF NOT EXISTS parameter_value numeric;
ALTER TABLE machine_realtime ADD COLUMN IF NOT EXISTS previous_value numeric;
ALTER TABLE machine_realtime ADD COLUMN IF NOT EXISTS last_change_time timestamptz;
ALTER TABLE machine_realtime ADD COLUMN IF NOT EXISTS running_started_at timestamptz;
ALTER TABLE machine_realtime ADD COLUMN IF NOT EXISTS total_running_seconds numeric NOT NULL DEFAULT 0;
ALTER TABLE machine_realtime ADD COLUMN IF NOT EXISTS connection_status varchar(32) NOT NULL DEFAULT 'DATA UNAVAILABLE';

CREATE TABLE IF NOT EXISTS machine_history (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id text NOT NULL REFERENCES master_machine(machine_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    status varchar(32) NOT NULL,
    counter_value numeric,
    speed_value numeric,
    running_hours numeric,
    recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS machine_status_history (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id text NOT NULL REFERENCES master_machine(machine_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    machine_name varchar(200) NOT NULL,
    previous_status varchar(32),
    status varchar(32) NOT NULL,
    parameter_value numeric,
    parameter_name varchar(128),
    changed_at timestamptz NOT NULL,
    duration_seconds numeric
);

CREATE TABLE IF NOT EXISTS machine_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id text NOT NULL REFERENCES master_machine(machine_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    machine_name varchar(200) NOT NULL,
    event_type varchar(64) NOT NULL,
    parameter_name varchar(128),
    previous_value numeric,
    current_value numeric,
    occurred_at timestamptz NOT NULL
);

-- Existing deployments may have spare_parts; missing deployments receive the
-- minimum compatible table without deleting or replacing any existing data.
CREATE TABLE IF NOT EXISTS spare_parts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    spare_part_id text,
    machine_id text,
    machine_name varchar(200),
    part_name varchar(200),
    spare_part_name varchar(200),
    lifetime_hours numeric,
    last_replacement_running_hours numeric,
    current_running_hours numeric,
    remaining_hours numeric,
    remaining_percentage numeric,
    status varchar(24),
    last_replacement_date date,
    next_replacement_date date,
    is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS machine_name varchar(200);
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS part_name varchar(200);
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS spare_part_name varchar(200);
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS remaining_hours numeric;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS remaining_percentage numeric;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS status varchar(24);
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS last_replacement_date date;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS next_replacement_date date;
ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS ix_master_machine_acquisition
    ON master_machine (acquisition_enabled, is_active, display_order);
CREATE INDEX IF NOT EXISTS ix_machine_status_history_machine_changed
    ON machine_status_history (machine_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS ix_machine_events_machine_occurred
    ON machine_events (machine_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_spare_parts_machine_health
    ON spare_parts (machine_id, is_active, remaining_percentage);

-- The audited production schema uses timestamp_zone, bobot_actual and
-- infeed_counter. velo_mm is absent, so Tunnel uses the configurable
-- velocity_belt candidate without inventing a unit. Labeling B is retained as
-- configured but will report DATA UNAVAILABLE until its source table exists.
INSERT INTO master_machine
    (machine_id, machine_name, machine_code, line, area, display_order, status,
     source_table_name, source_timestamp_column, parameter_name, parameter_type,
     parameter_unit, running_threshold, stop_timeout_seconds, acquisition_enabled)
VALUES
    ('WASHING_RRU_A', 'WASHING RRU_A', 'WASHING_RRU_A', 'LINE 07', 'Washing', 1, 'DATA UNAVAILABLE', 'ILE7_D0710_BOSCH_RRU_3085_01_A', 'timestamp_zone', 'counting_product', 'COUNTER', 'pcs', 0, 10, true),
    ('TUNNEL_HQL_A', 'TUNNEL HQL_A', 'TUNNEL_HQL_A', 'LINE 07', 'Tunnel', 2, 'DATA UNAVAILABLE', 'ILE7_D0710_BOSCH_RRU_3085_01_A', 'timestamp_zone', 'velocity_belt', 'SPEED', '', 0, 10, true),
    ('WASHING_RRU_B', 'WASHING RRU_B', 'WASHING_RRU_B', 'LINE 07', 'Washing', 3, 'DATA UNAVAILABLE', 'ILE7_D0710_BOSCH_RRU_3085_01_B', 'timestamp_zone', 'counting_product', 'COUNTER', 'pcs', 0, 10, true),
    ('TUNNEL_HQL_B', 'TUNNEL HQL_B', 'TUNNEL_HQL_B', 'LINE 07', 'Tunnel', 4, 'DATA UNAVAILABLE', 'ILE7_D0710_BOSCH_RRU_3085_01_B', 'timestamp_zone', 'velocity_belt', 'SPEED', '', 0, 10, true),
    ('FILLING_ALF_A', 'FILLING ALF_A', 'FILLING_ALF_A', 'LINE 07', 'Filling', 5, 'DATA UNAVAILABLE', 'ILE7_D0703_BOSCH_ALF_4080_01_A', 'timestamp_zone', 'counting_product', 'COUNTER', 'pcs', 0, 10, true),
    ('FILLING_ALF_B', 'FILLING ALF_B', 'FILLING_ALF_B', 'LINE 07', 'Filling', 6, 'DATA UNAVAILABLE', 'ILE7_D0703_BOSCH_ALF_4080_01_B', 'timestamp_zone', 'counting_product', 'COUNTER', 'pcs', 0, 10, true),
    ('MIXING_AR_TK101_A', 'MIXING AR/TK101_A', 'MIXING_AR_TK101_A', 'LINE 07', 'Mixing', 7, 'DATA UNAVAILABLE', 'ILE7_MIXING_AUSTAR_A', 'timestamp_zone', 'bobot_actual', 'WEIGHT', 'kg', 1, 10, true),
    ('MIXING_AR_TK101_B', 'MIXING AR/TK101_B', 'MIXING_AR_TK101_B', 'LINE 07', 'Mixing', 8, 'DATA UNAVAILABLE', 'ILE7_MIXING_AUSTAR_B', 'timestamp_zone', 'bobot_actual', 'WEIGHT', 'kg', 1, 10, true),
    ('LABELING_RE400_A', 'LABELING RE-400_A', 'LABELING_RE400_A', 'LINE 07', 'Labeling', 9, 'DATA UNAVAILABLE', 'ILE7_LABELLING_ROTA_A', 'timestamp_zone', 'infeed_counter', 'COUNTER', 'pcs', 0, 10, true),
    ('LABELING_RE400_B', 'LABELING RE-400_B', 'LABELING_RE400_B', 'LINE 07', 'Labeling', 10, 'DATA UNAVAILABLE', 'ILE7_LABELLING_ROTA_B', 'timestamp_zone', 'infeed_counter', 'COUNTER', 'pcs', 0, 10, true)
ON CONFLICT (machine_id) DO UPDATE SET
    source_table_name = EXCLUDED.source_table_name,
    source_timestamp_column = EXCLUDED.source_timestamp_column,
    parameter_name = EXCLUDED.parameter_name,
    parameter_type = EXCLUDED.parameter_type,
    parameter_unit = EXCLUDED.parameter_unit,
    running_threshold = EXCLUDED.running_threshold,
    stop_timeout_seconds = EXCLUDED.stop_timeout_seconds,
    acquisition_enabled = EXCLUDED.acquisition_enabled,
    updated_at = now();

COMMIT;
