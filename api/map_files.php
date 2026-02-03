<?php
// api/map_files.php
header('Content-Type: text/plain');

function listDir($dir, $prefix = '')
{
    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..')
            continue;
        $path = $dir . '/' . $file;
        echo $prefix . $file . (is_dir($path) ? '/' : '') . " (" . date("Y-m-d H:i:s", filemtime($path)) . ")\n";
        if (is_dir($path) && substr_count($prefix, '  ') < 2) { // Profundidade 2
            listDir($path, $prefix . '  ');
        }
    }
}

echo "--- MAPEAMENTO DE DIRETÓRIOS ---\n\n";
echo "Ponto Inicial (api/): " . __DIR__ . "\n";
echo "Raiz (../): " . realpath(__DIR__ . '/../') . "\n\n";

listDir(realpath(__DIR__ . '/../'));
?>