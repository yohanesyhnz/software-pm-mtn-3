BEGIN;

-- Keep machine identities and history intact; rollback only disables the new
-- acquisition mappings and removes the four query-performance indexes.
UPDATE master_machine
SET acquisition_enabled = false, updated_at = now()
WHERE machine_id IN (
    'ILE8_WASHING_KQCLS20_3',
    'ILE8_TUNNEL_KSZ_200_60M',
    'ILE8_FILLING_PDS16',
    'ILE8_CAPPING_2G16'
);

DROP INDEX IF EXISTS public.ix_ile8_washing_rtf_timestamp_zone;
DROP INDEX IF EXISTS public.ix_ile8_tunnel_rtf_timestamp_zone;
DROP INDEX IF EXISTS public.ix_ile8_filling_rtf_timestamp_zone;
DROP INDEX IF EXISTS public.ix_ile8_capping_rtf_timestamp_zone;

COMMIT;
