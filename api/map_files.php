<?php
// api/map_files.php
header('Content-Type: text/plain');

function listDir($dir, $prefix = '', $maxDepth = 2)
{
    if ($maxDepth < 0)
        return;
    $files = @scandir($dir);
    if (!$files)
        return;
    foreach ($files as $file) {
        if ($file === '.' || $file === '..')
            continue;
        $path = $dir . '/' . $file;
        echo $prefix . $file . (is_dir($path) ? '/' : '') . " (" . @date("Y-m-d H:i:s", @filemtime($path)) . ")\n";
        if (is_dir($path) && $maxDepth > 0 && !in_array($file, ['node_modules', '.git'])) {
            listDir($path, $prefix . '  ', $maxDepth - 1);
        }
    }
}

$grandParent = realpath(__DIR__ . '/../../');
echo "--- MAPEAMENTO DA RAIZ DA CONTA ---\n";
echo "Dir: " . $grandParent . "\n\n";
if ($grandParent)
    listDir($grandParent);
else
    echo "Não foi possível subir dois níveis.\n";
?>