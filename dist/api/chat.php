<?php
// api/chat.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Tenta pegar a chave de várias fontes (prioridade: Banco de Dados > env)
$aiKey = getenv('JW_API_GEMINI') ?: getenv('GEMINI_API_KEY');

try {
    require_once __DIR__ . '/db.php';
    $stmt = $pdo->prepare("SELECT s_value FROM app_settings WHERE s_key = 'gemini_api_key' LIMIT 1");
    $stmt->execute();
    $dbKey = $stmt->fetchColumn();
    if ($dbKey)
        $aiKey = $dbKey;
} catch (Exception $e) {
}

if (!$aiKey) {
    http_response_code(503);
    echo json_encode(["error" => "AI Key não configurada no servidor."]);
    exit;
}

// Helper para normalizar o Schema (Gemini REST v1beta exige tipos em MAIÚSCULO)
function normalizeSchema($schema)
{
    if (!is_array($schema))
        return $schema;
    if (isset($schema['type'])) {
        $schema['type'] = strtoupper($schema['type']);
    }
    if (isset($schema['properties']) && is_array($schema['properties'])) {
        foreach ($schema['properties'] as $key => $value) {
            $schema['properties'][$key] = normalizeSchema($value);
        }
    }
    if (isset($schema['items']) && is_array($schema['items'])) {
        $schema['items'] = normalizeSchema($schema['items']);
    }
    return $schema;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

$geminiPayload = [];

if (isset($data['contents'])) {
    $geminiPayload['contents'] = is_array($data['contents']) ? $data['contents'] : [["parts" => [["text" => $data['contents']]]]];

    if (isset($data['config'])) {
        if (isset($data['config']['systemInstruction'])) {
            $geminiPayload['system_instruction'] = ["parts" => [["text" => $data['config']['systemInstruction']]]];
        }

        $genConfig = [];
        if (isset($data['config']['responseMimeType'])) {
            $genConfig['response_mime_type'] = $data['config']['responseMimeType'];
        }
        if (isset($data['config']['responseSchema'])) {
            $genConfig['response_schema'] = normalizeSchema($data['config']['responseSchema']);
        }

        if (!empty($genConfig)) {
            $geminiPayload['generation_config'] = $genConfig;
        }
    }
} else {
    $prompt = $data['prompt'] ?? $input;
    $geminiPayload = [
        "contents" => [["parts" => [["text" => $prompt]]]]
    ];
}

// Adiciona Configurações de Segurança Permissivas (Para evitar falso-positivo em temas religiosos)
$geminiPayload['safety_settings'] = [
    ["category" => "HARM_CATEGORY_HARASSMENT", "threshold" => "BLOCK_NONE"],
    ["category" => "HARM_CATEGORY_HATE_SPEECH", "threshold" => "BLOCK_NONE"],
    ["category" => "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold" => "BLOCK_NONE"],
    ["category" => "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold" => "BLOCK_NONE"],
    ["category" => "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold" => "BLOCK_NONE"]
];

// Usando v1beta para garantir suporte total a response_schema e JSON
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . $aiKey;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($geminiPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 90); // Aumentado para 90s para textos gigantes

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode ?: 500);
    $errorBody = json_decode($response, true);
    if (isset($errorBody['error']['message'])) {
        echo json_encode(["error" => "Gemini: " . $errorBody['error']['message']]);
    } else {
        echo $response ?: json_encode(["error" => "Falha na conexão: " . $curlError]);
    }
} else {
    $resData = json_decode($response, true);
    $text = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';

    if (!$text) {
        // Se não voltou texto, pode ter sido bloqueado por segurança (mesmo com BLOCK_NONE em alguns casos raros)
        $finishReason = $resData['candidates'][0]['finishReason'] ?? 'UNKNOWN';
        echo json_encode(["error" => "A IA não retornou conteúdo. Motivo: $finishReason"]);
        exit;
    }

    // Limpeza de Markdown
    if (preg_match('/^```(?:json)?\s*([\s\S]*?)\s*```$/i', trim($text), $matches)) {
        $text = $matches[1];
    }

    echo json_encode(["reply" => $text]);
}
?>