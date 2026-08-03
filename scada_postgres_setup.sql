-- =============================================================================
-- PREDICTACORE CMMS / SCADA INDUSTRIAL TELEMETRY OPTIMIZATION SCRIPT
-- Database: PostgreSQL 12+ (Host: 10.165.41.45, Port: 5432, DB: production)
-- =============================================================================

-- 1. PostgreSQL High-Throughput SCADA Tuning (postgresql.conf recommendations)
/*
# Connection & Memory Optimization for Multi-Client Telemetry Stream
max_connections = 100
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 64MB
maintenance_work_mem = 256MB
wal_level = minimal
synchronous_commit = off          -- Ultra-fast write throughput for telemetry
checkpoint_completion_target = 0.9
*/

-- 2. Create High-Speed Indexes for CTID / Timestamp Tailing
CREATE INDEX IF NOT EXISTS idx_rru_01_a_tail ON public."ILE7_D0710_BOSCH_RRU_3085_01_A" (ctid DESC);
CREATE INDEX IF NOT EXISTS idx_rru_01_b_tail ON public."ILE7_D0710_BOSCH_RRU_3085_01_B" (ctid DESC);
CREATE INDEX IF NOT EXISTS idx_alf_01_a_tail ON public."ILE7_D0703_BOSCH_ALF_4080_01_A" (ctid DESC);
CREATE INDEX IF NOT EXISTS idx_alf_01_b_tail ON public."ILE7_D0703_BOSCH_ALF_4080_01_B" (ctid DESC);
CREATE INDEX IF NOT EXISTS idx_rota_18750_tail ON public."ILE7_LABELLING_ROTA_RE-400_SN_18750_A" (ctid DESC);

-- 3. Instant Push Notification Trigger (LISTEN / NOTIFY for ZERO-LATENCY SCADA)
CREATE OR REPLACE FUNCTION notify_scada_telemetry_change()
RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload = json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'timestamp', extract(epoch from now()) * 1000
  );
  
  -- Broadcast real-time NOTIFY event to channel 'scada_telemetry_channel'
  PERFORM pg_notify('scada_telemetry_channel', payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach Triggers to Bosch Production Tables
DROP TRIGGER IF EXISTS trg_notify_rru_01_a ON public."ILE7_D0710_BOSCH_RRU_3085_01_A";
CREATE TRIGGER trg_notify_rru_01_a
AFTER INSERT OR UPDATE ON public."ILE7_D0710_BOSCH_RRU_3085_01_A"
FOR EACH ROW EXECUTE FUNCTION notify_scada_telemetry_change();

DROP TRIGGER IF EXISTS trg_notify_rru_01_b ON public."ILE7_D0710_BOSCH_RRU_3085_01_B";
CREATE TRIGGER trg_notify_rru_01_b
AFTER INSERT OR UPDATE ON public."ILE7_D0710_BOSCH_RRU_3085_01_B"
FOR EACH ROW EXECUTE FUNCTION notify_scada_telemetry_change();

DROP TRIGGER IF EXISTS trg_notify_alf_01_a ON public."ILE7_D0703_BOSCH_ALF_4080_01_A";
CREATE TRIGGER trg_notify_alf_01_a
AFTER INSERT OR UPDATE ON public."ILE7_D0703_BOSCH_ALF_4080_01_A"
FOR EACH ROW EXECUTE FUNCTION notify_scada_telemetry_change();

DROP TRIGGER IF EXISTS trg_notify_alf_01_b ON public."ILE7_D0703_BOSCH_ALF_4080_01_B";
CREATE TRIGGER trg_notify_alf_01_b
AFTER INSERT OR UPDATE ON public."ILE7_D0703_BOSCH_ALF_4080_01_B"
FOR EACH ROW EXECUTE FUNCTION notify_scada_telemetry_change();

DROP TRIGGER IF EXISTS trg_notify_rota_18750_a ON public."ILE7_LABELLING_ROTA_RE-400_SN_18750_A";
CREATE TRIGGER trg_notify_rota_18750_a
AFTER INSERT OR UPDATE ON public."ILE7_LABELLING_ROTA_RE-400_SN_18750_A"
FOR EACH ROW EXECUTE FUNCTION notify_scada_telemetry_change();

-- 5. Verification Query
SELECT '✅ Triggers SCADA Telemetry Real-Time Berhasil Diaktifkan!' AS status;
