<?php
// api/view_db_logs.php - v2.0.4
header('Content-Type: application/json; charset=UTF-8');

try {
    require_once __DIR__ . '/db.php';
    global $pdo;

    $stmt = $pdo->query("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "message" => "Logs do robô Node.js recuperados do banco de dados.",
        "logs" => $logs
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>