<?php
// api/find_server.php
header('Content-Type: text/plain');

function findFile($dir, $fileName)
{
    if (!is_dir($dir))
        return;
    $files = @scandir($dir);
    if (!$files)
        return;
    foreach ($files as $file) {
        if ($file === '.' || $file === '..')
            continue;
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        if (is_dir($path)) {
            if (in_array($file, ['node_modules', '.git']))
                continue;
            findFile($path, $fileName);
        } elseif ($file === $fileName) {
            echo "ACHADO: " . $path . " (" . date("Y-m-d H:i:s", filemtime($path)) . ")\n";
            $content = file_get_contents($path);
            if (strpos($content, 'v2.0.5') !== false)
                echo "  - STATUS: ATUALIZADO (v2.0.5)\n";
            else if (strpos($content, 'v2.0.4') !== false)
                echo "  - STATUS: STALE (v2.0.4)\n";
            else
                echo "  - STATUS: MUITO ANTIGO\n";
        }
    }
}

echo "--- BUSCA POR server.js ---\n\n";
findFile(realpath(__DIR__ . '/../../'), 'server.js');
?>