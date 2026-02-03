<?php
// api/push_debug.php
require_once __DIR__ . '/db.php';

$user = verifyToken();
if (!$user)
    respond(["status" => "error", "message" => "Não autorizado"], 401);

$userId = $user['id'];

try {
    // Busca os últimos 10 agendamentos
    $stmt = $pdo->prepare("SELECT id, title, scheduled_time, sent, created_at 
                           FROM scheduled_notifications 
                           WHERE user_id = ? 
                           ORDER BY created_at DESC LIMIT 10");
    $stmt->execute([$userId]);
    $notes = $stmt->fetchAll();

    // Busca subscrições
    $stmtSub = $pdo->prepare("SELECT count(*) as total FROM push_subscriptions WHERE user_id = ?");
    $stmtSub->execute([$userId]);
    $subCount = $stmtSub->fetch()['total'];

    respond([
        "status" => "success",
        "user_id" => $userId,
        "subscriptions" => $subCount,
        "recent_schedules" => $notes,
        "server_time" => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    respond(["status" => "error", "message" => $e->getMessage()], 500);
}
?>