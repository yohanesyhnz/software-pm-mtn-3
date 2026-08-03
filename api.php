<?php
/* PredictaCore CMMS - Synology NAS Central API Backend (Zero-Dependency Engine) */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$file = __DIR__ . '/database.json';
$input = @file_get_contents('php://input');
$jsonBody = @json_decode($input, true);

// Deteksi otomatis action save_state jika dikirim via POST
$action = $_GET['action'] ?? $_POST['action'] ?? ($jsonBody['action'] ?? null);
if (!$action) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' || (is_array($jsonBody) && isset($jsonBody['machines']))) {
        $action = 'save_state';
    } else {
        $action = 'get_state';
    }
}

// 0. DIAGNOSTIC CHECK (api.php?action=check_db)
if ($action === 'check_db') {
    $writable = @is_writable(__DIR__);
    echo json_encode([
        'status' => 'online',
        'php_version' => phpversion(),
        'json_file_writable' => $writable,
        'database_exists' => file_exists($file),
        'message' => $writable ? '✅ Server Synology NAS 100% Siap Menyimpan Data!' : '⚠️ Folder /web/predictacore/ butuh izin Write (CHMOD 777).'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// 0.1b FAST BULK POLL — Query all known PostgreSQL machine tables in ONE connection (api.php?action=poll_all_machines)
// Returns counter/velocity/status for ALL machines in a single HTTP round-trip — eliminates N×request latency
if ($action === 'poll_all_machines') {
    $pgHost = '10.165.41.45';
    $pgPort = 5432;
    $pgDb   = 'production';
    $pgUser = 'appuser';
    $pgPass = 'appuser';

    // Hardcoded machine→table mapping (known stable config — no trial-and-error loop)
    // Format: [ asset_keyword, table_name, counter_col, is_velocity ]
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

    $results = [];
    $start   = microtime(true);

    try {
        $dsn = "pgsql:host=$pgHost;port=$pgPort;dbname=$pgDb;user=$pgUser;password=$pgPass";
        $pdo = new PDO($dsn, null, null, [
            PDO::ATTR_ERRMODE    => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT    => 3,
        ]);

        // Collect unique tables needed
        $uniqueTables = array_unique(array_column($machineMap, 'table'));
        $tableRows    = [];

        foreach ($uniqueTables as $tbl) {
            try {
                $q   = $pdo->query("SELECT * FROM public.\"$tbl\" ORDER BY ctid DESC LIMIT 1");
                $row = $q->fetch(PDO::FETCH_ASSOC);
                if ($row !== false) {
                    $tableRows[$tbl] = array_change_key_case($row, CASE_LOWER);
                }
            } catch (Exception $te) {
                $tableRows[$tbl] = null;
            }
        }

        foreach ($machineMap as $m) {
            $tbl  = $m['table'];
            $col  = $m['col'];
            $isV  = $m['is_velo'];
            $row  = $tableRows[$tbl] ?? null;

            $counterVal = 0;
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

            $results[] = [
                'key'          => $m['key'],
                'unit01'       => $m['unit01'],
                'table'        => $tbl,
                'col'          => $col,
                'is_velocity'  => $isV,
                'connected'    => $connected,
                'counter_value'=> $counterVal,
                'bit_value'    => $bitVal,
                'unit'         => $isV ? 'm/s' : 'Pcs',
            ];
        }

        $latency = round((microtime(true) - $start) * 1000, 1);
        echo json_encode([
            'status'     => 'success',
            'latency_ms' => $latency,
            'machines'   => $results,
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        $latency = round((microtime(true) - $start) * 1000, 1);
        echo json_encode([
            'status'     => 'error',
            'latency_ms' => $latency,
            'message'    => $e->getMessage(),
            'machines'   => [],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 0.1 PLC CONNECTION PING & DIAGNOSTIC CHECK (api.php?action=test_plc_ping)
if ($action === 'test_plc_ping') {
    $ip = $_GET['ip'] ?? $jsonBody['ip'] ?? '127.0.0.1';
    $port = intval($_GET['port'] ?? $jsonBody['port'] ?? 102);
    $protocol = $_GET['protocol'] ?? $jsonBody['protocol'] ?? 'Siemens S7';
    $address = $_GET['address'] ?? $jsonBody['address'] ?? 'DB1.DBX0.0';
    $bitValue = isset($_GET['bit_value']) ? intval($_GET['bit_value']) : 1;

    if ($protocol === 'PostgreSQL' || $ip === '10.165.41.45') {
        $dbHost = $ip;
        $dbPort = $port ?: 5432;
        $dbName = 'production';
        $dbUser = 'appuser';
        $dbPass = 'appuser';
        
        $connected = false;
        $latency = 0;
        $dbValue = 0;
        $counterVal = 0;
        
        $start = microtime(true);
        try {
            $assetNumber = $_GET['asset_number'] ?? $jsonBody['asset_number'] ?? '';
            
            // Safe table name parsing
            // Detect if this is a second-unit machine (_02 suffix) -> use the _01_B table
            $isUnit02 = preg_match('/\b02\b/', $assetNumber) || preg_match('/[_\s\-]02([_\s\-]|$)/i', $assetNumber);

            $isAlf = (stripos($assetNumber, 'ALF') !== false || stripos($assetNumber, '4080') !== false || stripos($assetNumber, 'D0703') !== false);
            $isRota = (stripos($assetNumber, 'ROTA') !== false || stripos($assetNumber, 'LABEL') !== false || stripos($assetNumber, '18750') !== false || stripos($address, 'ROTA') !== false || stripos($counterAddress, 'ROTA') !== false || stripos($address, '18750') !== false || stripos($counterAddress, '18750') !== false);

            // Primary shared PostgreSQL tables for Bosch PLC & ROTA Labelling
            if ($isRota) {
                $candidateRawNames = [
                    'ILE7_LABELLING_ROTA_RE-400_SN_18750_A',
                    'ILE7_LABELLING_ROTA_RE_400_SN_18750_A',
                    'ILE7_LABELLING ROTA RE-400, SN: 18750_A',
                    'ILE7_LABELLING_ROTA_RE400_SN18750_A',
                    'ILE7_LABELLING_ROTA_RE400_18750_A'
                ];
            } else if ($isAlf) {
                if ($isUnit02) {
                    $candidateRawNames = [
                        'ILE7_D0703_BOSCH_ALF_4080_01_B',
                        'ILE7_D0703_BOSCH_ALF_4080_01_A',
                        'ILE7_D0703_BOSCH_ALF_4080'
                    ];
                } else {
                    $candidateRawNames = [
                        'ILE7_D0703_BOSCH_ALF_4080_01_A',
                        'ILE7_D0703_BOSCH_ALF_4080_01_B',
                        'ILE7_D0703_BOSCH_ALF_4080'
                    ];
                }
            } else if ($isUnit02) {
                $candidateRawNames = [
                    'ILE7_D0710_BOSCH_RRU_3085_01_B',
                    'ILE7_D0710_BOSCH_HQL_2440_01_B',
                    'ILE7_D0710_BOSCH_RRU_3085_01_A',
                    'ILE7_D0710_BOSCH_RRU_3085'
                ];
            } else {
                $candidateRawNames = [
                    'ILE7_D0710_BOSCH_RRU_3085_01_A',
                    'ILE7_D0710_BOSCH_RRU_3085',
                    'ILE7_D0710_BOSCH_HQL_3840_2440_01_A'
                ];
            }

            // Add raw table name from address if given (only if it is a real table name, not a PLC register like DB7 or DB5)
            if (!empty($address)) {
                $cleanAddr = trim(explode(';', $address)[0]);
                if (stripos($cleanAddr, '.') !== false) {
                    $cleanAddr = explode('.', $cleanAddr)[0];
                }
                if (!empty($cleanAddr) && !preg_match('/^(DB|M|Q|I)\d+/i', $cleanAddr)) {
                    $candidateRawNames[] = $cleanAddr;
                }
            }

            // Add raw table name from counter address if given
            if (!empty($counterAddress)) {
                $cleanCounter = trim(explode(';', $counterAddress)[0]);
                if (stripos($cleanCounter, '.') !== false) {
                    $cleanCounter = explode('.', $cleanCounter)[0];
                }
                if (!empty($cleanCounter) && !preg_match('/^(DB|M|Q|I)\d+/i', $cleanCounter)) {
                    $candidateRawNames[] = $cleanCounter;
                }
            }

            // Build full candidate list
            $candidates = [];
            foreach (array_unique($candidateRawNames) as $rName) {
                if (empty($rName)) continue;
                $candidates[] = 'public."' . $rName . '"';
                $candidates[] = 'public."' . strtolower($rName) . '"';
                $candidates[] = 'public.' . strtolower($rName);
                $candidates[] = '"' . $rName . '"';
                $candidates[] = '"' . strtolower($rName) . '"';
                $candidates[] = $rName;
                $candidates[] = strtolower($rName);
            }

            $row = null;
            $querySuccess = false;
            $availableTables = [];

            if (class_exists('PDO') && in_array('pgsql', PDO::getAvailableDrivers())) {
                $dsn = "pgsql:host=$dbHost;port=$dbPort;dbname=$dbName;user=$dbUser;password=$dbPass";
                $pdo = new PDO($dsn, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 2]);
                $connected = true;
                
                $queryErrorMessages = [];
                foreach ($candidates as $cand) {
                    try {
                        try {
                            $stmt = $pdo->query("SELECT * FROM $cand ORDER BY ctid DESC LIMIT 1");
                        } catch (Exception $qe) {
                            $stmt = $pdo->query("SELECT * FROM $cand LIMIT 1");
                        }
                        $row = $stmt->fetch(PDO::FETCH_ASSOC);
                        if ($row !== false) {
                            $table = $cand;
                            $querySuccess = true;
                            break;
                        }
                    } catch (Exception $qe) {
                        $queryErrorMessages[] = "$cand: " . $qe->getMessage();
                    }
                }
                
                // Self-healing discovery fallback: fetch all pg_tables, sort Bosch tables first, and test
                if (!$querySuccess) {
                    try {
                        $tableStmt = $pdo->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
                        $fetchedTables = [];
                        while ($tRow = $tableStmt->fetch(PDO::FETCH_ASSOC)) {
                            $fetchedTables[] = $tRow['tablename'];
                        }
                        
                        // Sort so that Bosch / ILE7 tables are tested before unrelated alarm/log tables
                        // Also prefer _01_B for unit 02 machines, _01_A for unit 01 machines
                        usort($fetchedTables, function($a, $b) use ($isUnit02) {
                            $aIsBosch = (stripos($a, 'ILE7') !== false || stripos($a, 'BOSCH') !== false || stripos($a, 'RRU') !== false || stripos($a, 'HQL') !== false);
                            $bIsBosch = (stripos($b, 'ILE7') !== false || stripos($b, 'BOSCH') !== false || stripos($b, 'RRU') !== false || stripos($b, 'HQL') !== false);
                            if ($aIsBosch && !$bIsBosch) return -1;
                            if (!$aIsBosch && $bIsBosch) return 1;
                            // Prefer _B for unit 02, _A for unit 01
                            if ($aIsBosch && $bIsBosch) {
                                $aIsB = stripos($a, '_01_B') !== false;
                                $bIsB = stripos($b, '_01_B') !== false;
                                if ($isUnit02) {
                                    if ($aIsB && !$bIsB) return -1;
                                    if (!$aIsB && $bIsB) return 1;
                                } else {
                                    if (!$aIsB && $bIsB) return -1;
                                    if ($aIsB && !$bIsB) return 1;
                                }
                            }
                            return 0;
                        });

                        foreach ($fetchedTables as $tblName) {
                            $availableTables[] = $tblName;
                            
                            if (!$querySuccess) {
                                foreach (["public.\"$tblName\"", "\"$tblName\"", "public.$tblName", $tblName] as $autoCand) {
                                    try {
                                        try {
                                            $stmt = $pdo->query("SELECT * FROM $autoCand ORDER BY ctid DESC LIMIT 1");
                                        } catch (Exception $qe) {
                                            $stmt = $pdo->query("SELECT * FROM $autoCand LIMIT 1");
                                        }
                                        $row = $stmt->fetch(PDO::FETCH_ASSOC);
                                        if ($row !== false) {
                                            $table = $autoCand;
                                            $querySuccess = true;
                                            break;
                                        }
                                    } catch (Exception $e2) {}
                                }
                            }
                        }
                    } catch (Exception $te) {}
                }

                if (!$querySuccess) {
                    $tableListMsg = !empty($availableTables) ? " | Tabel yang terdeteksi di DB: " . implode(', ', $availableTables) : " (Tidak ada tabel ditemukan di schema 'public')";
                    throw new Exception("Semua variasi nama tabel gagal diquery. " . (count($queryErrorMessages) > 0 ? "Detail: " . $queryErrorMessages[0] : "") . $tableListMsg);
                }
            } else if (function_exists('pg_connect')) {
                $connStr = "host=$dbHost port=$dbPort dbname=$dbName user=$dbUser password=$dbPass connect_timeout=2";
                $conn = @pg_connect($connStr);
                if ($conn) {
                    $connected = true;
                    
                    $queryErrorMessages = [];
                    foreach ($candidates as $cand) {
                        $result = @pg_query($conn, "SELECT * FROM $cand ORDER BY ctid DESC LIMIT 1");
                        if (!$result) {
                            $result = @pg_query($conn, "SELECT * FROM $cand LIMIT 1");
                        }
                        if ($result !== false) {
                            $row = @pg_fetch_assoc($result);
                            $table = $cand;
                            $querySuccess = true;
                            break;
                        } else {
                            $queryErrorMessages[] = "$cand: " . pg_last_error($conn);
                        }
                    }
                    
                    if (!$querySuccess) {
                        $tableRes = @pg_query($conn, "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
                        if ($tableRes) {
                            $fetchedTables = [];
                            while ($tRow = @pg_fetch_assoc($tableRes)) {
                                $fetchedTables[] = $tRow['tablename'];
                            }

                            usort($fetchedTables, function($a, $b) {
                                $aIsBosch = (stripos($a, 'ILE7') !== false || stripos($a, 'BOSCH') !== false || stripos($a, 'RRU') !== false || stripos($a, 'HQL') !== false);
                                $bIsBosch = (stripos($b, 'ILE7') !== false || stripos($b, 'BOSCH') !== false || stripos($b, 'RRU') !== false || stripos($b, 'HQL') !== false);
                                if ($aIsBosch && !$bIsBosch) return -1;
                                if (!$aIsBosch && $bIsBosch) return 1;
                                return 0;
                            });

                            foreach ($fetchedTables as $tblName) {
                                $availableTables[] = $tblName;
                                
                                if (!$querySuccess) {
                                    foreach (["public.\"$tblName\"", "\"$tblName\"", "public.$tblName", $tblName] as $autoCand) {
                                        $result = @pg_query($conn, "SELECT * FROM $autoCand ORDER BY ctid DESC LIMIT 1");
                                        if (!$result) {
                                            $result = @pg_query($conn, "SELECT * FROM $autoCand LIMIT 1");
                                        }
                                        if ($result !== false) {
                                            $row = @pg_fetch_assoc($result);
                                            $table = $autoCand;
                                            $querySuccess = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    @pg_close($conn);
                    
                    if (!$querySuccess) {
                        $tableListMsg = !empty($availableTables) ? " | Tabel yang terdeteksi di DB: " . implode(', ', $availableTables) : "";
                        throw new Exception("Semua variasi nama tabel gagal diquery (native): " . (count($queryErrorMessages) > 0 ? $queryErrorMessages[0] : "") . $tableListMsg);
                    }
                } else {
                    throw new Exception("pg_connect gagal menghubungkan ke host PostgreSQL.");
                }
            } else {
                throw new Exception("Driver database PostgreSQL tidak aktif di PHP. Silakan buka DSM Synology NAS -> Web Station -> Script Language Settings -> Edit PHP Profile yang digunakan -> tab Extensions -> aktifkan/centang extension 'pdo_pgsql' dan 'pgsql'.");
            }

            if ($row) {
                // Lowercase all keys for case-insensitive matching
                $rowLower = array_change_key_case($row, CASE_LOWER);
                
                // 1. Parse Status RUN/STOP Column from $address
                $statusCol = null;
                if (strpos($address, ';') !== false) {
                    $statusCol = strtolower(trim(substr($address, strpos($address, ';') + 1)));
                } else {
                    $statusCol = strtolower(trim($address));
                }

                // Find state
                $stateVal = null;
                $foundState = false;
                if (!empty($statusCol) && array_key_exists($statusCol, $rowLower)) {
                    $stateVal = strtolower(trim($rowLower[$statusCol]));
                    $foundState = true;
                }
                
                if (!$foundState) {
                    foreach (['state', 'x0.0', 'machine_status', 'status'] as $sk) {
                        if (array_key_exists($sk, $rowLower)) {
                            $stateVal = strtolower(trim($rowLower[$sk]));
                            $foundState = true;
                            break;
                        }
                    }
                }
                if (!$foundState) {
                    foreach ($rowLower as $rk => $rv) {
                        if (stripos($rk, 'state') !== false || stripos($rk, 'x0.0') !== false || stripos($rk, 'status') !== false) {
                            $stateVal = strtolower(trim($rv));
                            $foundState = true;
                            break;
                        }
                    }
                }
                if ($foundState) {
                    $dbValue = ($stateVal === 'running' || $stateVal === '1' || $stateVal === 'run' || $stateVal === 'active' || $stateVal === 'on' || $stateVal === 'true' || $stateVal === 't') ? 1 : 0;
                }

                // 2. Parse Counter Column from $counterAddress
                $counterCol = null;
                if (strpos($counterAddress, ';') !== false) {
                    $counterCol = strtolower(trim(substr($counterAddress, strpos($counterAddress, ';') + 1)));
                } else {
                    $counterCol = strtolower(trim($counterAddress));
                }

                // Find counter
                $counterVal = 0;
                $foundCounter = false;
                if (!empty($counterCol) && array_key_exists($counterCol, $rowLower)) {
                    $counterVal = floatval($rowLower[$counterCol]); // Support float for velocity (like velo_mm)
                    $foundCounter = true;
                }

                if (!$foundCounter) {
                    // Priority: infeed_counter for ROTA / LABELLING, counting_product for RRU/ALF, velocity_object/velo_obj for HQL
                    $isHql = (stripos($assetNumber, 'hql') !== false || stripos($assetNumber, '2440') !== false || stripos($assetNumber, '3840') !== false);
                    if ($isHql) {
                        $counterFallbacks = ['velocity_object', 'velo_obj', 'velo_mm', 'infeed_counter', 'infeed_counting', 'counting_product', 'di114', 'counter_product', 'counter'];
                    } else {
                        $counterFallbacks = ['infeed_counter', 'infeed_counting', 'infeed_count', 'counting_product', 'di114', 'counter_product', 'counter', 'velocity_object', 'velo_obj', 'velo_mm'];
                    }
                    foreach ($counterFallbacks as $ck) {
                        if (array_key_exists($ck, $rowLower)) {
                            $counterVal = floatval($rowLower[$ck]);
                            $foundCounter = true;
                            break;
                        }
                    }
                }
                if (!$foundCounter) {
                    $isHql = (stripos($assetNumber, 'hql') !== false || stripos($assetNumber, '2440') !== false || stripos($assetNumber, '3840') !== false);
                    foreach ($rowLower as $rk => $rv) {
                        $isVeloCol = stripos($rk, 'velocity') !== false || stripos($rk, 'velo') !== false;
                        $isCounterCol = stripos($rk, 'counting') !== false || stripos($rk, 'counter') !== false || stripos($rk, 'product') !== false || stripos($rk, 'di114') !== false;
                        if ($isHql ? $isVeloCol : $isCounterCol) {
                            $counterVal = floatval($rv);
                            $foundCounter = true;
                            break;
                        }
                    }
                    // Second pass if still not found
                    if (!$foundCounter) {
                        foreach ($rowLower as $rk => $rv) {
                            if (stripos($rk, 'velocity') !== false || stripos($rk, 'velo') !== false || stripos($rk, 'counting') !== false || stripos($rk, 'counter') !== false) {
                                $counterVal = floatval($rv);
                                $foundCounter = true;
                                break;
                            }
                        }
                    }
                }

                // 3. Determine if this is velocity-based (m/s) or counter-based (Pcs)
                // IMPORTANT: Detection is based on the column name AFTER the semicolon in counterAddress,
                // NOT on the PLC register prefix (DB5/DB7). Both RRU and HQL use DB5 addresses.
                $isVelocityCol = false;
                if (!empty($counterCol)) {
                    // Explicit velocity column keywords
                    if (stripos($counterCol, 'velo') !== false || stripos($counterCol, 'velocity') !== false || stripos($counterCol, 'speed') !== false || stripos($counterCol, 'm_s') !== false) {
                        $isVelocityCol = true;
                    }
                    // Explicit counter column keywords -> NOT velocity
                    // (counting_product, di114, counter_product, counter)
                } else {
                    // No explicit column specified: fall back to asset type
                    // HQL machines are velocity-based, RRU are counter-based
                    if (stripos($assetNumber, 'hql') !== false || stripos($assetNumber, '2440') !== false || stripos($assetNumber, '3840') !== false) {
                        $isVelocityCol = true;
                    }
                }

                if ($isVelocityCol) {
                    // The raw readings in factory database are in mm/s (e.g. 380.00, 397.00).
                    // Divide by 1000 to convert and register in meters per second (m/s) (e.g. 0.38 m/s, 0.397 m/s)
                    if ($counterVal > 5.0) {
                        $counterVal = round($counterVal / 1000, 3);
                    }

                    // For speed tags (m/s), status is RUNNING if speed > 0
                    if ($counterVal > 0) {
                        $dbValue = 1;
                    } elseif (!$foundState) {
                        $dbValue = 0;
                    }
                }
            }

            $latency = round((microtime(true) - $start) * 1000, 1);
            echo json_encode([
                'status' => 'success',
                'connected' => true,
                'ip' => $dbHost,
                'port' => $dbPort,
                'protocol' => $protocol,
                'address' => $table,
                'latency_ms' => $latency,
                'bit_value' => $dbValue,
                'counter_value' => $counterVal,
                'unit' => $isVelocityCol ? 'm/s' : 'Pcs',
                'signal_quality' => 'Strong (100%)',
                'message' => "✅ Terhubung! Sukses query status dari PostgreSQL $dbHost:$dbPort [$table]. State: " . ($dbValue ? 'RUNNING 🟢' : 'STOPPED 🔴') . ($isVelocityCol ? ", Kecepatan: $counterVal m/s" : ", Counter: $counterVal Pcs")
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;

        } catch (Exception $e) {
            $latency = round((microtime(true) - $start) * 1000, 1);
            echo json_encode([
                'status' => 'warning',
                'connected' => false,
                'ip' => $dbHost,
                'port' => $dbPort,
                'protocol' => $protocol,
                'address' => $address,
                'latency_ms' => $latency,
                'bit_value' => 0,
                'counter_value' => 0,
                'signal_quality' => 'Disconnected',
                'message' => "⚠️ Gagal menghubungkan ke database PostgreSQL $dbHost:$dbPort (" . $e->getMessage() . "). Nilai disetel ke 0 (STOPPED)."
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    $start = microtime(true);
    // Socket probe with 2 seconds timeout
    $fp = @fsockopen($ip, $port, $errno, $errstr, 2);
    $latency = round((microtime(true) - $start) * 1000, 1);

    if ($fp) {
        fclose($fp);
        // Mock counter simulation for other protocols
        $mockCounter = intval(floor(time() / 10) % 10000);
        echo json_encode([
            'status' => 'success',
            'connected' => true,
            'ip' => $ip,
            'port' => $port,
            'protocol' => $protocol,
            'address' => $address,
            'latency_ms' => $latency,
            'bit_value' => $bitValue,
            'counter_value' => $mockCounter,
            'signal_quality' => 'Strong (100%)',
            'message' => "✅ Terhubung! Socket $protocol ke IP $ip:$port [Tag: $address] berhasil dibuka ($latency ms)."
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } else {
        // Fallback for demo network isolation or host check
        echo json_encode([
            'status' => 'warning',
            'connected' => false,
            'ip' => $ip,
            'port' => $port,
            'protocol' => $protocol,
            'address' => $address,
            'bit_value' => $bitValue,
            'counter_value' => 0,
            'error_code' => $errno,
            'error_message' => $errstr ?: 'Connection timed out (Host Unreachable)',
            'message' => "⚠️ Socket ke $ip:$port tidak merespon ($errstr). Pastikan IP PLC berada dalam 1 Subnet WiFi/LAN dengan Synology NAS."
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// 1. SAVE STATE (Simpan Data Terpusat)
if ($action === 'save_state') {
    if ($input && strlen(trim($input)) > 10) {
        if (file_exists($file)) {
            @chmod($file, 0777);
        }
        $written = file_put_contents($file, $input);
        if ($written !== false) {
            echo json_encode(['status' => 'success', 'message' => 'Data terpusat Synology NAS berhasil tersimpan.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Gagal menulis file database.json. Periksa Izin Tulis (CHMOD 777) folder /web/predictacore/ di Synology NAS.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Payload input kosong / tidak valid.']);
    }
    exit;
}

// 2. GET STATE (Baca Data Terpusat)
if (file_exists($file)) {
    $content = @file_get_contents($file);
    $data = @json_decode($content, true);
    if (is_array($data)) {
        $data['status'] = 'success';
        echo json_encode($data);
        exit;
    }
}

echo json_encode(['status' => 'success', 'machines' => [], 'spare_parts' => [], 'users' => []]);
?>