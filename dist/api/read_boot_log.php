<?php
// api/read_boot_log.php
header('Content-Type: text/plain');
$log = __DIR__ . '/../node_boot.log';
if (file_exists($log)) {
    echo "--- CONTTEÚDO DO LOG DE BOOT ---\n";
    echo file_get_contents($log);
} else {
    echo "Arquivo de log não encontrado em: " . $log;
}
?>