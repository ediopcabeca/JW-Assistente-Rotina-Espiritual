<?php
// api/push_send.php - v2.1.2 (NTFY-Only + Safe Headers)
require_once __DIR__ . '/db.php';

$user = verifyToken();
if (!$user)
    respond(["status" => "error", "message" => "Não autorizado"], 401);

$email = $user['email'];
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['title']) || !isset($data['body'])) {
    respond(["status" => "error", "message" => "Dados insuficientes"], 400);
}

try {
    // Canal Sanitizado v2.1.2
    $topic = "jw_assistant_" . $email;
    $safeChannel = preg_replace('/[^a-zA-Z0-9]/', '_', $topic);

    $ch = curl_init("https://ntfy.sh/" . $safeChannel);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data['body']);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Title: ' . $data['title'],
        'Priority: high',
        'Tags: bell'
    ]);

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    respond([
        "status" => "success",
        "channel" => $safeChannel,
        "http_code" => $status,
        "message" => "Notificação disparada exclusivamente via NTFY."
    ]);

} catch (Exception $e) {
    respond(["status" => "error", "message" => $e->getMessage()], 500);
}
?>