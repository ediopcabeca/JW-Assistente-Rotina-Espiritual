<?php
// api/sync.php
require_once 'db.php';

$userData = verifyToken();
if (!$userData)
    respond(["error" => "Não autorizado"], 401);

$userId = $userData['id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $syncData = json_encode($data['sync_data'] ?? []);

    $stmt = $pdo->prepare("INSERT INTO user_data (user_id, sync_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE sync_data = ?, updated_at = CURRENT_TIMESTAMP");
    $stmt->execute([$userId, $syncData, $syncData]);
    respond(["message" => "Dados sincronizados com sucesso"]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT sync_data FROM user_data WHERE user_id = ?");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    respond(["sync_data" => $row ? json_decode($row['sync_data'], true) : null]);
}

respond(["error" => "Método não permitido"], 405);
?>