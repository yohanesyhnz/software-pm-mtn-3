<?php
/* 
 * PredictaCore Industrial SCADA SSE (Server-Sent Events) Engine
 * High-Performance Zero-Latency Telemetry Stream for Synology NAS & PostgreSQL
 */

// Disable output buffering for instant streaming on Nginx / Apache Web Station
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
@ini_set('zlib.output_compression', 0);
@ini_set('implicit_flush', 1);
while (ob_get_level()) {
    ob_end_flush();
}

header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: *');
header('X-Accel-Buffering: no'); // Disable Nginx proxy buffering on Synology Web Station

// Prevent PHP execution timeout for long-lived SSE stream
set_time_limit(0);

$pgHost = '10.165.41.45';
$pgPort = 5432;
$pgDb   = 'production';
$pgUser = 'appuser';
$pgPass = 'appuser';

// Machine mapping configuration
$machineMap = [
    ['key'=>'RRU',       'unit01'=>true,  'table'=>'ILE7_D0710_BOSCH_RRU_3085_01_A',      'col'=>'counting_product', 'is_velo'=>false],
    ['key'=>'RRU',       'unit01'=>false, 'table'=>'ILE7_D0710_BOSCH_RRU_3085_01_B',      'col'=>'counting_product', 'is_velo'=>false],
    ['key'=>'HQL',       'unit01'=>true,  'table'=>'ILE7_D0710_BOSCH_RRU_3085_01_A',      'col'=>'velocity_object',  'is_velo'=>true],
    ['key'=>'HQL',       'unit01'=>false, 'table'=>'ILE7_D0710_BOSCH_RRU_3085_01_B',      'col'=>'velocity_object',  'is_velo'=>true],
    ['key'=>'ALF',       'unit01'=>true,  'table'=>'ILE7_D0703_BOSCH_ALF_4080_01_A',      'col'=>'counting_product', 'is_velo'=>false],
    ['key'=>'ALF',       'unit01'=>false, 'table'=>'ILE7_D0703_BOSCH_ALF_4080_01_B',      'col'=>'counting_product', 'is_velo'=>false],
    ['key'=>'LABELLING', 'unit01'=>true,  'table'=>'ILE7_LABELLING_ROTA_RE-400_SN_18750_A', 'col'=>'infeed_counter',   'is_velo'=>false],
    ['key'=>'ROTA',      'unit01'=>true,  'table'=>'ILE7_LABELLING_ROTA_RE-400_SN_18750_A', 'col'=>'infeed_counter',   'is_velo'=>false],
    ['key'=>'18750',     'unit01'=>true,  'table'=>'ILE7_LABELLING_ROTA_RE-400_SN_18750_A', 'col'=>'infeed_counter',   'is_velo'=>false],
];

// Persistent PDO connection with connection pooling & fast timeout
$pdo = null;
try {
    $dsn = "pgsql:host=$pgHost;port=$pgPort;dbname=$pgDb;user=$pgUser;password=$pgPass";
    $pdo = new PDO($dsn, null, null, [
        PDO::ATTR_ERRMODE          => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT          => 2,
        PDO::ATTR_PERSISTENT       => true // Connection Pooling
    ]);
} catch (Exception $e) {
    echo "event: error\n";
    echo 'data: ' . json_encode(['message' => 'PostgreSQL Connection Failed: ' . $e->getMessage()]) . "\n\n";
    flush();
    exit;
}

// In-memory state tracking to send ONLY DELTA updates (only changed fields)
$lastTelemetryState = [];
$uniqueTables = array_unique(array_column($machineMap, 'table'));

$heartbeatTimer = microtime(true);
$maxExecutionTime = 300; // Stream for 5 minutes per client session, then reconnect automatically
$streamStartTime = time();

while (true) {
    if ((time() - $streamStartTime) > $maxExecutionTime) {
        // Send reconnect event & terminate cleanly so client reconnects seamlessly
        echo "event: reconnect\n";
        echo 'data: ' . json_encode(['action' => 'reconnect']) . "\n\n";
        flush();
        break;
    }

    // Fast query latest rows from all tables in 1 cycle
    $tableRows = [];
    foreach ($uniqueTables as $tbl) {
        try {
            $q = $pdo->query("SELECT * FROM public.\"$tbl\" ORDER BY ctid DESC LIMIT 1");
            $row = $q->fetch(PDO::FETCH_ASSOC);
            if ($row !== false) {
                $tableRows[$tbl] = array_change_key_case($row, CASE_LOWER);
            }
        } catch (Exception $ex) {
            $tableRows[$tbl] = null;
        }
    }

    $deltaUpdates = [];
    $currentTime = microtime(true);

    foreach ($machineMap as $idx => $m) {
        $tbl  = $m['table'];
        $col  = $m['col'];
        $isV  = $m['is_velo'];
        $row  = $tableRows[$tbl] ?? null;

        $counterVal = 0.0;
        $bitVal     = 0;
        $connected  = ($row !== null);

        if ($row) {
            $counterVal = isset($row[$col]) ? floatval($row[$col]) : 0.0;
            if ($isV) {
                if ($counterVal > 5.0) $counterVal = round($counterVal / 1000, 3);
                $bitVal = ($counterVal > 0) ? 1 : 0;
            } else {
                $bitVal = ($counterVal > 0) ? 1 : 0;
            }
        }

        $stateKey = $m['key'] . '_' . ($m['unit01'] ? '01' : '02');
        $prevState = $lastTelemetryState[$stateKey] ?? null;

        $hasChanged = ($prevState === null) ||
                      ($prevState['counter_value'] !== $counterVal) ||
                      ($prevState['bit_value'] !== $bitVal) ||
                      ($prevState['connected'] !== $connected);

        if ($hasChanged) {
            $updateItem = [
                'key'           => $m['key'],
                'unit01'        => $m['unit01'],
                'table'         => $tbl,
                'col'           => $col,
                'is_velocity'   => $isV,
                'connected'     => $connected,
                'counter_value' => $counterVal,
                'bit_value'     => $bitVal,
                'unit'          => $isV ? 'm/s' : 'Pcs',
                'ts'            => round($currentTime * 1000)
            ];
            $deltaUpdates[] = $updateItem;
            $lastTelemetryState[$stateKey] = $updateItem;
        }
    }

    // Push DELTA telemetry payload if there are any changes (100-200ms frequency)
    if (!empty($deltaUpdates)) {
        echo "event: telemetry_delta\n";
        echo 'data: ' . json_encode([
            'status'     => 'success',
            'timestamp'  => round($currentTime * 1000),
            'deltas'     => $deltaUpdates
        ], JSON_UNESCAPED_UNICODE) . "\n\n";
        flush();
    }

    // Heartbeat every 1 second (1000ms) for running hours alignment
    if (($currentTime - $heartbeatTimer) >= 1.0) {
        echo "event: heartbeat\n";
        echo 'data: ' . json_encode([
            'status'    => 'alive',
            'timestamp' => round($currentTime * 1000)
        ]) . "\n\n";
        flush();
        $heartbeatTimer = $currentTime;
    }

    // High frequency sleep loop: 100ms (100,000 microseconds)
    usleep(100000);
}
