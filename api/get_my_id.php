<?php
// api/get_my_id.php - v1.9.4
header('Content-Type: application/json');

try {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    require_once __DIR__ . '/db.php';
    global $pdo;

    if (!$pdo) {
        die(json_encode(["status" => "error", "message" => "PDO não inicializado em db.php"]));
    }

    $stmt = $pdo->query("SELECT id, email FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "info" => "Procure pelo seu e-mail abaixo e veja qual o ID ao lado dele.",
        "users" => $users
    ]);
} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage(), "trace" => $e->getTraceAsString()]);
}
?>