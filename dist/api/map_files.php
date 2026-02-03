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
        if (is_dir($path) && $maxDepth > 0) {
            listDir($path, $prefix . '  ', $maxDepth - 1);
        }
    }
}

$sourceDir = realpath(__DIR__ . '/../.builds/source');
echo "--- CONTEÚDO DE .builds/source ---\n";
if ($sourceDir)
    listDir($sourceDir);
else
    echo "Pasta .builds/source não encontrada.\n";

echo "\n--- RAÍZ DO SITE ---\n";
listDir(realpath(__DIR__ . '/../'), '', 1);
?>