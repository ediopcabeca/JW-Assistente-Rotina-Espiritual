<?php
// api/view_logs.php - v2.0.2
header('Content-Type: text/plain; charset=UTF-8');

$logFile = __DIR__ . '/../push_log.txt';

if (file_exists($logFile)) {
    echo "--- LOG DO WORKER NODE.JS ---\n\n";
    echo file_get_contents($logFile);
} else {
    echo "Arquivo de log ainda não criado. O Worker ainda não rodou ou não tem permissão de escrita.";
}
?>