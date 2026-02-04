<?php
// diag/test_range.php - Teste isolado da função isChapterInRange
header('Content-Type: application/json');

function normalizeString($str)
{
    $str = trim(strtolower($str));
    $str = preg_replace('/[áàãâä]/u', 'a', $str);
    $str = preg_replace('/[éèêë]/u', 'e', $str);
    $str = preg_replace('/[íìîï]/u', 'i', $str);
    $str = preg_replace('/[óòõôö]/u', 'o', $str);
    $str = preg_replace('/[úùûü]/u', 'u', $str);
    $str = preg_replace('/[ç]/u', 'c', $str);
    return $str;
}

function isChapterInRange($requested, $stored)
{
    $normReq = normalizeString($requested);
    $normStored = normalizeString($stored);

    if ($normReq === $normStored)
        return true;

    if (!preg_match('/^(.+)\s(\d+)$/u', $requested, $m))
        return false;

    $bookReqOrig = trim($m[1]);
    $bookReqNorm = normalizeString($bookReqOrig);
    $numReq = (int) $m[2];

    if (stripos($normStored, $bookReqNorm) === false)
        return false;

    $numbersPart = preg_replace('/' . preg_quote($bookReqNorm, '/') . '/i', '', $normStored);

    $parts = preg_split('/[;,]/', $numbersPart);
    foreach ($parts as $part) {
        $part = trim($part);
        if (empty($part))
            continue;
        if (preg_match('/^(\d+)\s*-\s*(\d+)$/', $part, $range)) {
            if ($numReq >= (int) $range[1] && $numReq <= (int) $range[2])
                return true;
        } elseif (preg_match('/^(\d+)$/', $part, $single)) {
            if ($numReq === (int) $single[1])
                return true;
        }
    }
    return false;
}

// Simulando casos reais do usuário
$tests = [
    ["req" => "Isaías 1", "stored" => "Isaías 1-3", "expect" => true],
    ["req" => "isaias 5", "stored" => "Isaías 4-6", "expect" => true],
    ["req" => "Gênesis 32", "stored" => "Gênesis 31, 32", "expect" => true],
];

$results = [];
foreach ($tests as $t) {
    $results[] = [
        "req" => $t['req'],
        "stored" => $t['stored'],
        "match" => isChapterInRange($t['req'], $t['stored']),
        "expected" => $t['expect']
    ];
}

echo json_encode($results);
?>