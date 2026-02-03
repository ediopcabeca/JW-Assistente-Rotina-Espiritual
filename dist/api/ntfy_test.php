<?php
// api/ntfy_test.php - v1.9.2 Fallback
header('Content-Type: application/json');

$userId = isset($_GET['user_id']) ? $_GET['user_id'] : '1';
$channel = "jw_assistant_" . $userId;
$title = "JW Assistente ✅ (PHP Fallback)";
$message = "Teste de Notificação NTFY funcionando via PHP!";

$ch = curl_init("https://ntfy.sh/" . $channel);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $message);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Title: " . $title,
    "Priority: high",
    "Tags: bell,check"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo json_encode([
    "status" => $httpCode == 200 ? "success" : "error",
    "http_code" => $httpCode,
    "channel" => $channel,
    "message" => "Se o seu celular tocou, o sistema está pronto!"
]);
?>