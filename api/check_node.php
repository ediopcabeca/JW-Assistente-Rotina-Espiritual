<?php
// api/check_node.php
header('Content-Type: application/json');

// 1. Tenta listar processos (pode estar desativado por segurança)
$ps = [];
if (function_exists('shell_exec')) {
    $ps = shell_exec('ps aux | grep node');
}

// 2. Testa escrita
$logFile = __DIR__ . '/../push_log.txt';
$writable = is_writable(__DIR__ . '/../');
$file_exists = file_exists($logFile);

// 3. Verifica .htaccess (conteúdo)
$htaccess = file_exists(__DIR__ . '/../.htaccess') ? file_get_contents(__DIR__ . '/../.htaccess') : 'N/A';

echo json_encode([
    "node_processes" => $ps,
    "log_file" => [
        "path" => $logFile,
        "exists" => $file_exists,
        "dir_writable" => $writable
    ],
    "htaccess_content" => $htaccess
]);
?>