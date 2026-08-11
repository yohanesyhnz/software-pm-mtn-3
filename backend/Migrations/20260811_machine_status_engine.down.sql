BEGIN;

-- Safe rollback is intentionally non-destructive: disable acquisition while
-- retaining realtime state, running-hours totals, status history and events.
UPDATE master_machine
SET acquisition_enabled = false, updated_at = now()
WHERE machine_id IN (
    'WASHING_RRU_A', 'TUNNEL_HQL_A', 'WASHING_RRU_B', 'TUNNEL_HQL_B',
    'FILLING_ALF_A', 'FILLING_ALF_B', 'MIXING_AR_TK101_A',
    'MIXING_AR_TK101_B', 'LABELING_RE400_A', 'LABELING_RE400_B'
);

COMMIT;
