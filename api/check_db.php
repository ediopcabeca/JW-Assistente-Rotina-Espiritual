<?php
// api/check_db.php
header('Content-Type: application/json');

$files = scandir(__DIR__);
$config_exists = file_exists(__DIR__ . '/config.php');

$db_vars = [];
if ($config_exists) {
    include __DIR__ . '/config.php';
    $db_vars = [
        'host' => isset($CFG_DB_HOST) ? 'SET' : 'NOT SET',
        'db' => isset($CFG_DB_NAME) ? 'SET' : 'NOT SET',
        'user' => isset($CFG_DB_USER) ? 'SET' : 'NOT SET',
        'pass' => isset($CFG_DB_PASS) ? 'SET' : 'NOT SET'
    ];
}

echo json_encode([
    "php_version" => PHP_VERSION,
    "current_dir" => __DIR__,
    "files_in_api" => $files,
    "config_exists" => $config_exists,
    "db_vars_status" => $db_vars
]);
?>