<?php
// api/test_ai.php - Script de diagnóstico
header("Content-Type: text/plain; charset=UTF-8");

echo "--- Diagnóstico de Conexão IA ---\n";

include_once __DIR__ . '/config.php';

if (!isset($CFG_GEMINI_KEY) || empty($CFG_GEMINI_KEY) || $CFG_GEMINI_KEY === 'SUA_CHAVE_AQUI') {
    echo "ERRO: Chave API não configurada corretamente em config.php\n";
    exit;
}

echo "Chave API encontrada: " . substr($CFG_GEMINI_KEY, 0, 8) . "...\n";

$url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" . $CFG_GEMINI_KEY;
$payload = [
    "contents" => [["parts" => [["text" => "Diga 'Olá Mundo' para testar a conexão."]]]]
];

echo "Iniciando CURL para Google Gemini API...\n";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
if ($curlError) {
    echo "CURL Error: $curlError\n";
}

echo "\nResposta Bruta:\n";
echo $response . "\n";

echo "\n--- Fim do Teste ---\n";
?>