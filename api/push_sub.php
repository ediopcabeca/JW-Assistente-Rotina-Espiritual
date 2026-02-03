<?php
// api/push_sub.php
require_once __DIR__ . '/db.php';

$user = verifyToken();
if (!$user) {
    respond(["status" => "error", "message" => "Não autorizado"], 401);
}

$data = json_decode(file_get_contents("php://input"), true);
$userId = $user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($data['endpoint']) || !isset($data['keys']['p256dh']) || !isset($data['keys']['auth'])) {
        respond(["status" => "error", "message" => "Dados inválidos"], 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) 
                               VALUES (?, ?, ?, ?) 
                               ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth)");
        $stmt->execute([$userId, $data['endpoint'], $data['keys']['p256dh'], $data['keys']['auth']]);
        respond(["status" => "success", "message" => "Subscrição salva"]);
    } catch (Exception $e) {
        respond(["status" => "error", "message" => $e->getMessage()], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($data['endpoint'])) {
        respond(["status" => "error", "message" => "Endpoint necessário"], 400);
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?");
        $stmt->execute([$userId, $data['endpoint']]);
        respond(["status" => "success", "message" => "Subscrição removida"]);
    } catch (Exception $e) {
        respond(["status" => "error", "message" => $e->getMessage()], 500);
    }
}
?>