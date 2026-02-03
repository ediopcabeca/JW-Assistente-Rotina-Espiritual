<?php
// api/push_schedule.php
require_once __DIR__ . '/db.php';

$user = verifyToken();
if (!$user)
    respond(["status" => "error", "message" => "Não autorizado"], 401);

$userId = $user['id'];
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['scheduled_time']) || !isset($data['title'])) {
    respond(["status" => "error", "message" => "Dados insuficientes"], 400);
}

try {
    // Se activity_index vier, deletamos o agendamento anterior desse item se houver
    if (isset($data['index'])) {
        $stmt = $pdo->prepare("DELETE FROM scheduled_notifications WHERE user_id = ? AND activity_index = ? AND sent = 0");
        $stmt->execute([$userId, $data['index']]);
    }

    // Inserir novo agendamento
    $stmt = $pdo->prepare("INSERT INTO scheduled_notifications (user_id, activity_index, title, body, scheduled_time) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $userId,
        $data['index'] ?? -1,
        $data['title'],
        $data['body'] ?? '',
        $data['scheduled_time']
    ]);

    respond(["status" => "success", "message" => "Lembrete salvo no servidor."]);

} catch (Exception $e) {
    respond(["status" => "error", "message" => $e->getMessage()], 500);
}
?>