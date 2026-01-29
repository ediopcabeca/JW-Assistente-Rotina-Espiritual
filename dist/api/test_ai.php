<?php
// api/test_ai.php - Script de diagnóstico
header("Content-Type: text/plain; charset=UTF-8");

echo "--- Diagnóstico de Conexão IA ---\n";

$CFG_GEMINI_KEY = getenv('JW_API_GEMINI') ?: getenv('GEMINI_API_KEY') ?: '';

// 1. Busca no Banco de Dados
try {
    require_once __DIR__ . '/db.php';
    $stmt = $pdo->prepare("SELECT s_value FROM app_settings WHERE s_key = 'gemini_api_key' LIMIT 1");
    $stmt->execute();
    $dbKey = $stmt->fetchColumn();
    if ($dbKey)
        $CFG_GEMINI_KEY = $dbKey;
} catch (Exception $e) {
    echo "Aviso: Erro ao buscar no banco: " . $e->getMessage() . "\n";
}

// 2. Fallbacks
if (empty($CFG_GEMINI_KEY) || $CFG_GEMINI_KEY === 'SUA_CHAVE_AQUI' || $CFG_GEMINI_KEY === 'INSIRA_SUA_NOVA_CHAVE_AQUI') {
    if (file_exists(__DIR__ . '/key.php')) {
        include_once __DIR__ . '/key.php';
    } elseif (file_exists(__DIR__ . '/config.php')) {
        include_once __DIR__ . '/config.php';
    }
}

if (empty($CFG_GEMINI_KEY) || $CFG_GEMINI_KEY === 'SUA_CHAVE_AQUI' || $CFG_GEMINI_KEY === 'INSIRA_SUA_NOVA_CHAVE_AQUI') {
    echo "ERRO: Chave API não configurada corretamente no Banco de Dados, key.php ou config.php\n";
    exit;
}

echo "Chave API encontrada: " . substr($CFG_GEMINI_KEY, 0, 8) . "...\n";

$url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" . $CFG_GEMINI_KEY;
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