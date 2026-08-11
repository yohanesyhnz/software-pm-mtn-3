<?php
/* Legacy SSE URL adapter; telemetry is produced by the ASP.NET Core backend. */

$backendOrigin = rtrim(getenv('BACKEND_ORIGIN') ?: 'http://127.0.0.1:5080', '/');
$target = $backendOrigin . '/api/telemetry/stream';

header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-store');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');
@ini_set('zlib.output_compression', 0);
@ini_set('implicit_flush', 1);
while (ob_get_level()) ob_end_flush();
set_time_limit(0);

if (function_exists('curl_init')) {
    $curl = curl_init($target);
    curl_setopt_array($curl, [
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_WRITEFUNCTION => function ($curlHandle, $chunk) {
            echo $chunk;
            flush();
            return strlen($chunk);
        },
    ]);
    $ok = curl_exec($curl);
    if ($ok === false) {
        echo "event: error\n";
        echo 'data: ' . json_encode(['message' => 'ASP.NET Core telemetry backend tidak dapat dijangkau.']) . "\n\n";
        flush();
    }
    curl_close($curl);
    exit;
}

$stream = @fopen($target, 'rb');
if ($stream === false) {
    echo "event: error\n";
    echo 'data: ' . json_encode(['message' => 'ASP.NET Core telemetry backend tidak dapat dijangkau.']) . "\n\n";
    flush();
    exit;
}
while (!feof($stream)) {
    $chunk = fread($stream, 8192);
    if ($chunk === false) break;
    echo $chunk;
    flush();
}
fclose($stream);
?>
