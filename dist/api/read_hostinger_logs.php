<?php
// api/read_hostinger_logs.php
header('Content-Type: text/plain');

echo "\n--- LISTANDO ARQUIVOS NA PASTA API ---\n";
print_r(scandir(__DIR__));

echo "\n--- LISTANDO ARQUIVOS NA RAIZ ---\n";
print_r(scandir(__DIR__ . '/..'));

$logDir = realpath(__DIR__ . '/../.builds/logs');
if (!$logDir) {
    die("\nDiretório de logs não encontrado.");
}

$dirs = scandir($logDir, SCANDIR_SORT_DESCENDING);
foreach ($dirs as $dir) {
    if ($dir === '.' || $dir === '..')
        continue;
    $fullPath = $logDir . DIRECTORY_SEPARATOR . $dir;
    if (is_dir($fullPath)) {
        echo "\n--- LENDO LOG MAIS RECENTE: $dir ---\n\n";
        $files = scandir($fullPath);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..')
                continue;
            echo "Arquivo: $file\n";
            echo file_get_contents($fullPath . DIRECTORY_SEPARATOR . $file);
            echo "\n---------------------------\n";
        }
        break; // Pega apenas o primeiro (mais recente)
    }
}
?>