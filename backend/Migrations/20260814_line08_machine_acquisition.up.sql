BEGIN;

-- Requires the additive machine monitoring schema from
-- 20260811_machine_status_engine.up.sql. Run as the database owner/DBA;
-- the production appuser intentionally has no DDL privilege.
ALTER TABLE master_machine ADD COLUMN IF NOT EXISTS parameter_label varchar(128);
ALTER TABLE machine_realtime ADD COLUMN IF NOT EXISTS line varchar(100);
ALTER TABLE machine_status_history ADD COLUMN IF NOT EXISTS line varchar(100);

-- Audited on 2026-08-14: all four sources use timestamp_zone and did not
-- have a timestamp index. These indexes keep the shared latest-row query
-- efficient without introducing per-card polling.
CREATE INDEX IF NOT EXISTS ix_ile8_washing_rtf_timestamp_zone
    ON public."ILE8_WASHING_RTF" (timestamp_zone DESC);
CREATE INDEX IF NOT EXISTS ix_ile8_tunnel_rtf_timestamp_zone
    ON public."ILE8_TUNNEL_RTF" (timestamp_zone DESC);
CREATE INDEX IF NOT EXISTS ix_ile8_filling_rtf_timestamp_zone
    ON public."ILE8_FILLING_RTF" (timestamp_zone DESC);
CREATE INDEX IF NOT EXISTS ix_ile8_capping_rtf_timestamp_zone
    ON public."ILE8_CAPPING_RTF" (timestamp_zone DESC);

-- Preserve the four existing LINE 08 assets (legacy IDs 24-27) while moving
-- them to stable machine IDs. Foreign keys use ON UPDATE CASCADE.
UPDATE master_machine SET machine_id = 'ILE8_WASHING_KQCLS20_3'
WHERE legacy_id = 24 AND machine_id <> 'ILE8_WASHING_KQCLS20_3'
  AND NOT EXISTS (SELECT 1 FROM master_machine WHERE machine_id = 'ILE8_WASHING_KQCLS20_3');
UPDATE master_machine SET machine_id = 'ILE8_TUNNEL_KSZ_200_60M'
WHERE legacy_id = 25 AND machine_id <> 'ILE8_TUNNEL_KSZ_200_60M'
  AND NOT EXISTS (SELECT 1 FROM master_machine WHERE machine_id = 'ILE8_TUNNEL_KSZ_200_60M');
UPDATE master_machine SET machine_id = 'ILE8_FILLING_PDS16'
WHERE legacy_id = 26 AND machine_id <> 'ILE8_FILLING_PDS16'
  AND NOT EXISTS (SELECT 1 FROM master_machine WHERE machine_id = 'ILE8_FILLING_PDS16');
UPDATE master_machine SET machine_id = 'ILE8_CAPPING_2G16'
WHERE legacy_id = 27 AND machine_id <> 'ILE8_CAPPING_2G16'
  AND NOT EXISTS (SELECT 1 FROM master_machine WHERE machine_id = 'ILE8_CAPPING_2G16');

INSERT INTO master_machine
    (machine_id, legacy_id, machine_name, machine_code, line, area, display_order,
     status, source_table_name, source_timestamp_column, parameter_name,
     parameter_label, parameter_type, parameter_unit, running_threshold,
     stop_timeout_seconds, acquisition_enabled)
VALUES
    ('ILE8_WASHING_KQCLS20_3', 24, 'WASHING KQCLS20/3', 'ILE8_WASHING_KQCLS20_3', 'LINE 08', 'Washing', 24,
     'DATA UNAVAILABLE', 'ILE8_WASHING_RTF', 'timestamp_zone', 'single_shift_output',
     'Output Washing', 'COUNTER', '', 0, 10, true),
    ('ILE8_TUNNEL_KSZ_200_60M', 25, 'TUNNEL KSZ/200/60M', 'ILE8_TUNNEL_KSZ_200_60M', 'LINE 08', 'Tunnel', 25,
     'DATA UNAVAILABLE', 'ILE8_TUNNEL_RTF', 'timestamp_zone', 'air_speed_heating_zone',
     'Velocity Heating Zone', 'SPEED', '', 0, 10, true),
    ('ILE8_FILLING_PDS16', 26, 'FILLING PDS16', 'ILE8_FILLING_PDS16', 'LINE 08', 'Filling', 26,
     'DATA UNAVAILABLE', 'ILE8_FILLING_RTF', 'timestamp_zone', 'act_speed',
     'Act Speed', 'SPEED', '', 0, 10, true),
    ('ILE8_CAPPING_2G16', 27, 'CAPPING 2G16', 'ILE8_CAPPING_2G16', 'LINE 08', 'Capping', 27,
     'DATA UNAVAILABLE', 'ILE8_CAPPING_RTF', 'timestamp_zone', 'infeed_number',
     'Input Count', 'COUNTER', '', 0, 10, true)
ON CONFLICT (machine_id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    machine_name = EXCLUDED.machine_name,
    machine_code = EXCLUDED.machine_code,
    line = EXCLUDED.line,
    area = EXCLUDED.area,
    source_table_name = EXCLUDED.source_table_name,
    source_timestamp_column = EXCLUDED.source_timestamp_column,
    parameter_name = EXCLUDED.parameter_name,
    parameter_label = EXCLUDED.parameter_label,
    parameter_type = EXCLUDED.parameter_type,
    parameter_unit = EXCLUDED.parameter_unit,
    running_threshold = EXCLUDED.running_threshold,
    stop_timeout_seconds = EXCLUDED.stop_timeout_seconds,
    acquisition_enabled = EXCLUDED.acquisition_enabled,
    is_active = true,
    updated_at = now();

COMMIT;
