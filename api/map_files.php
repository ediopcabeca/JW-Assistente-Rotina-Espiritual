<?php
// api/map_files.php
header('Content-Type: text/plain');

function listDir($dir, $prefix = '', $maxDepth = 3)
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
        if (is_dir($path)) {
            listDir($path, $prefix . '  ', $maxDepth - 1);
        }
    }
}

echo "--- MAPEAMENTO PROFUNDO ---\n\n";
listDir(realpath(__DIR__ . '/../../')); // Sobe dois níveis para ver tudo
?>