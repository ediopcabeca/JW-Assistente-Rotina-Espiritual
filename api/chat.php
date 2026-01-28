<?php
// api/chat.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Tenta pegar a chave de várias fontes (prioridade: Banco de Dados > key.php > config.php)
$aiKey = getenv('JW_API_GEMINI') ?: getenv('GEMINI_API_KEY');

// 1. Busca no Banco de Dados (Mais persistente)
try {
    require_once __DIR__ . '/db.php';
    $stmt = $pdo->prepare("SELECT s_value FROM app_settings WHERE s_key = 'gemini_api_key' LIMIT 1");
    $stmt->execute();
    $dbKey = $stmt->fetchColumn();
    if ($dbKey)
        $aiKey = $dbKey;
} catch (Exception $e) { /* Silencioso se der erro no banco */
}

// 2. Fallbacks para arquivos
if (!$aiKey) {
    if (file_exists(__DIR__ . '/key.php')) {
        include_once __DIR__ . '/key.php';
        if (isset($CFG_GEMINI_KEY))
            $aiKey = $CFG_GEMINI_KEY;
    } elseif (file_exists(__DIR__ . '/config.php')) {
        include_once __DIR__ . '/config.php';
        if (isset($CFG_GEMINI_KEY))
            $aiKey = $CFG_GEMINI_KEY;
    }
}

if (!$aiKey) {
    http_response_code(503);
    echo json_encode(["error" => "AI Key não configurada no servidor."]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Prepara o payload para o Gemini
$geminiPayload = [];

if (isset($data['contents'])) {
    // Se já vem estruturado do frontend (novo padrão)
    $geminiPayload['contents'] = is_array($data['contents']) ? $data['contents'] : [["parts" => [["text" => $data['contents']]]]];

    // Adiciona configurações opcionais se existirem
    if (isset($data['config'])) {
        // Mapeia instruções do sistema (REST usa system_instruction)
        if (isset($data['config']['systemInstruction'])) {
            $geminiPayload['system_instruction'] = ["parts" => [["text" => $data['config']['systemInstruction']]]];
        }

        // Mapeia configurações de geração (REST usa snake_case em v1)
        $genConfig = [];
        if (isset($data['config']['responseMimeType'])) {
            $genConfig['response_mime_type'] = $data['config']['responseMimeType'];
        }
        if (isset($data['config']['responseSchema'])) {
            $genConfig['response_schema'] = $data['config']['responseSchema'];
        }

        if (!empty($genConfig)) {
            $geminiPayload['generation_config'] = $genConfig;
        }
    }
} else {
    // Padrão simples: { prompt: "..." } ou texto puro
    $prompt = $data['prompt'] ?? $input;
    $geminiPayload = [
        "contents" => [["parts" => [["text" => $prompt]]]]
    ];
}

$url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" . $aiKey;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($geminiPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode ?: 500);
    $errorBody = json_decode($response, true);
    if (isset($errorBody['error']['message'])) {
        echo json_encode(["error" => "Gemini API: " . $errorBody['error']['message']]);
    } else {
        echo $response ?: json_encode(["error" => "Erro na conexão com Google API: " . $curlError]);
    }
} else {
    $resData = json_decode($response, true);
    $text = $resData['candidates'][0]['content']['parts'][0]['text'] ?? 'Erro ao processar resposta da IA.';

    // Limpeza Proativa: Se a IA retornar blocos de código Markdown (```json ... ```), removemos
    // Isso garante que o frontend receba um JSON limpo para o JSON.parse()
    if (preg_match('/^```(?:json)?\s*([\s\S]*?)\s*```$/i', trim($text), $matches)) {
        $text = $matches[1];
    }

    echo json_encode(["reply" => $text]);
}
?>