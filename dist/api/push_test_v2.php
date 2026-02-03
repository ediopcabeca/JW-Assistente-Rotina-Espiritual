<?php
// api/push_test_v2.php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/push_config.php';

$user = verifyToken();
if (!$user)
    respond(["status" => "error", "message" => "Não autorizado"], 401);

$userId = $user['id'];

try {
    // Busca uma subscrição válida
    $stmt = $pdo->prepare("SELECT * FROM push_subscriptions WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $sub = $stmt->fetch();

    if (!$sub) {
        respond(["status" => "error", "message" => "Nenhum dispositivo registrado."]);
    }

    // Tenta enviar um push real e capturar a resposta
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
    $payload = base64_encode(json_encode([
        'aud' => parse_url($sub['endpoint'], PHP_URL_SCHEME) . '://' . parse_url($sub['endpoint'], PHP_URL_HOST),
        'exp' => time() + 3600,
        'sub' => $VAPID_SUBJECT
    ]));

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $sub['endpoint']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, "");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'TTL: 60',
        'Content-Length: 0',
        'Authorization: WebPush ' . $header . '.' . $payload
    ]);

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    respond([
        "status" => "diagnostico",
        "endpoint" => $sub['endpoint'],
        "http_code" => $status,
        "push_service_response" => $response,
        "server_time_utc" => gmdate('Y-m-d H:i:s'),
        "server_time_local" => date('Y-m-d H:i:s'),
        "openssl_ecdsa_supported" => in_array('ecdsa-with-SHA256', openssl_get_md_methods())
    ]);

} catch (Exception $e) {
    respond(["status" => "error", "message" => $e->getMessage()], 500);
}
?>