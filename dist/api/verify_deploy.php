<?php
// api/verify_deploy.php
header('Content-Type: application/json');

$root = __DIR__ . '/../';
$files = [
    'server.js' => file_exists($root . 'server.js') ? date("Y-m-d H:i:s", filemtime($root . 'server.js')) : 'NOT FOUND',
    'package.json' => file_exists($root . 'package.json') ? date("Y-m-d H:i:s", filemtime($root . 'package.json')) : 'NOT FOUND',
    'dist_index' => file_exists($root . 'dist/index.html') ? date("Y-m-d H:i:s", filemtime($root . 'dist/index.html')) : 'NOT FOUND',
    '.htaccess' => file_exists($root . '.htaccess') ? date("Y-m-d H:i:s", filemtime($root . '.htaccess')) : 'NOT FOUND'
];

$server_js_content = file_exists($root . 'server.js') ? substr(file_get_contents($root . 'server.js'), 0, 1000) : '';
$is_v2_0_4 = strpos($server_js_content, 'v2.0.4') !== false;

echo json_encode([
    "file_timestamps" => $files,
    "current_server_time" => date("Y-m-d H:i:s"),
    "is_server_js_v2_0_4" => $is_v2_0_4,
    "partial_server_js" => $is_v2_0_4 ? "OK (v2.0.4 detected)" : "STALE (v2.0.4 NOT detected)"
]);
?>