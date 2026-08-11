<?php
/*
 * PredictaCore legacy URL adapter.
 *
 * Domain behavior and PostgreSQL access live exclusively in the ASP.NET Core
 * Web API. This file exists only for older Web Station deployments that still
 * route browser requests to /api.php.
 */

$backendOrigin = rtrim(getenv('BACKEND_ORIGIN') ?: 'http://127.0.0.1:5080', '/');
$target = $backendOrigin . '/api.php';
if (!empty($_SERVER['QUERY_STRING'])) {
    $target .= '?' . $_SERVER['QUERY_STRING'];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body = file_get_contents('php://input');
$contentType = $_SERVER['CONTENT_TYPE'] ?? 'application/json';

if (function_exists('curl_init')) {
    $curl = curl_init($target);
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => ['Content-Type: ' . $contentType],
    ]);
    if ($method !== 'GET' && $method !== 'HEAD' && $body !== false) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    }
    $response = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($response === false) {
        http_response_code(502);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['status' => 'error', 'message' => 'ASP.NET Core backend tidak dapat dijangkau.', 'detail' => $error]);
        exit;
    }
    http_response_code($status > 0 ? $status : 200);
    header('Content-Type: application/json; charset=utf-8');
    echo $response;
    exit;
}

$headers = "Content-Type: {$contentType}\r\n";
$context = stream_context_create(['http' => [
    'method' => $method,
    'header' => $headers,
    'content' => ($method !== 'GET' && $method !== 'HEAD' && $body !== false) ? $body : '',
    'timeout' => 30,
    'ignore_errors' => true,
]]);
$response = @file_get_contents($target, false, $context);
header('Content-Type: application/json; charset=utf-8');
if ($response === false) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'ASP.NET Core backend tidak dapat dijangkau.']);
    exit;
}
echo $response;
?>
