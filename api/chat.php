<?php
// api/chat.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Tenta pegar a chave do config.php ou do env
$aiKey = getenv('JW_API_GEMINI') ?: getenv('GEMINI_API_KEY');

if (file_exists(__DIR__ . '/config.php')) {
    include_once __DIR__ . '/config.php';
    if (isset($CFG_GEMINI_KEY))
        $aiKey = $CFG_GEMINI_KEY;
}

if (!$aiKey) {
    http_response_code(503);
    echo json_encode(["error" => "AI Key não configurada no servidor."]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);
$prompt = $data['prompt'] ?? $input;

$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $aiKey;

$payload = [
    "contents" => [["parts" => [["text" => $prompt]]]]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo $response;
} else {
    $resData = json_decode($response, true);
    $text = $resData['candidates'][0]['content']['parts'][0]['text'] ?? 'Erro na resposta da IA.';
    echo json_encode(["reply" => $text]);
}
?>