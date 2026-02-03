<?php
// api/inspect.php - v2.1.2 Diagnostics
header('Content-Type: text/plain');
header('Cache-Control: no-cache, must-revalidate');

echo "--- INFORMAÇÕES DO SERVIDOR ---\n";
echo "Tempo do Servidor: " . date('Y-m-d H:i:s') . "\n";
echo "Diretório Atual: " . __DIR__ . "\n";

echo "\n--- LISTA DE ARQUIVOS NA PASTA API ---\n";
print_r(scandir(__DIR__));

echo "\n--- LISTA DE ARQUIVOS NA RAIZ ---\n";
print_r(scandir(__DIR__ . '/..'));

echo "\n--- CONTEÚDO DO server.js (Últimos 500 bytes) ---\n";
$sjs = __DIR__ . '/../server.js';
if (file_exists($sjs)) {
    echo substr(file_get_contents($sjs), -500);
} else {
    echo "server.js NÃO ENCONTRADO";
}

echo "\n\n--- CONTEÚDO DO node_boot.log ---\n";
$log = __DIR__ . '/../node_boot.log';
if (file_exists($log)) {
    echo file_get_contents($log);
} else {
    echo "node_boot.log NÃO ENCONTRADO";
}

echo "\n\n--- VERIFICAÇÃO DE PROCESSOS NODE ---\n";
exec('ps aux | grep node', $nodeOut);
print_r($nodeOut);
?>