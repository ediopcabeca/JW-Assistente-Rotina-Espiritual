<?php
// api/push_audit.php - v2.0.0 Final
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/db.php';
    global $pdo;

    // 1. Horários do Servidor
    $stmt_time = $pdo->query("SELECT NOW() as local_now, UTC_TIMESTAMP() as utc_now");
    $times = $stmt_time->fetch();

    // 2. Próximas Notificações
    $stmt_next = $pdo->query("SELECT * FROM scheduled_notifications WHERE sent = 0 ORDER BY scheduled_time ASC LIMIT 5");
    $next_notifications = $stmt_next->fetchAll(PDO::FETCH_ASSOC);

    // 3. Notificações Recém Enviadas
    $stmt_sent = $pdo->query("SELECT * FROM scheduled_notifications WHERE sent = 1 ORDER BY scheduled_time DESC LIMIT 5");
    $sent_notifications = $stmt_sent->fetchAll(PDO::FETCH_ASSOC);

    // 4. Logs do Sistema (v2.0.4)
    $stmt_logs = $pdo->query("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 20");
    $system_logs = $stmt_logs->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "server_times" => $times,
        "system_logs" => $system_logs,
        "next_to_send" => $next_notifications,
        "recently_sent" => $sent_notifications
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>