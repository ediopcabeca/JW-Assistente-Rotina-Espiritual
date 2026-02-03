<?php
// debug.php - v1.0.0
header('Content-Type: text/plain');
$log = __DIR__ . '/node_boot.log';
if (file_exists($log)) {
    echo "--- NODE BOOT LOG ---\n";
    echo file_get_contents($log);
} else {
    echo "Log não encontrado em: " . $log;
    echo "\n\nArquivos na raiz:\n";
    print_r(scandir(__DIR__));
}
?>