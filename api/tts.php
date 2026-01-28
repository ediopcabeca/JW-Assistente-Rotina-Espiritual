<?php
// api/tts.php - Proxy para Google Cloud Text-to-Speech
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/db.php';

// 1. Busca a chave no Banco de Dados
$ttsKey = null;
try {
    $stmt = $pdo->prepare("SELECT s_value FROM app_settings WHERE s_key = 'google_tts_key' LIMIT 1");
    $stmt->execute();
    $ttsKey = $stmt->fetchColumn();
} catch (Exception $e) {
    // Silencioso
}

if (!$ttsKey) {
    http_response_code(503);
    echo json_encode(["error" => "Configuração de Voz (TTS) não encontrada no servidor."]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);
$text = $data['text'] ?? '';

if (empty($text)) {
    http_response_code(400);
    echo json_encode(["error" => "Texto não fornecido."]);
    exit;
}

// Limpa o texto de tags Markdown para a leitura ficar mais fluida
$cleanText = strip_tags($text); // Remove HTML se houver
$cleanText = preg_replace('/[*_#`]/', '', $cleanText); // Remove símbolos markdown comuns

$url = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" . $ttsKey;

$payload = [
    "input" => ["text" => $cleanText],
    "voice" => [
        "languageCode" => "pt-BR",
        "name" => "pt-BR-Wavenet-B" // Voz fluida. Se o usuário preferir a Standard (4M free), pode trocar para pt-BR-Standard-A
    ],
    "audioConfig" => [
        "audioEncoding" => "MP3",
        "pitch" => 0,
        "speakingRate" => 1.0
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode(["error" => "Erro de conexão cURL: " . $curlError]);
    exit;
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo $response; // Retorna o erro do Google
    exit;
}

// O Google retorna um JSON com {"audioContent": "BASE64..."}
echo $response;
?>