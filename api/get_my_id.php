<?php
// api/get_my_id.php - v1.9.4
header('Content-Type: application/json');

// Tenta carregar credenciais do db.php ou variáveis de ambiente
$db_host = getenv('DB_HOST');
$db_user = getenv('DB_USER');
$db_pass = getenv('DB_PASSWORD');
$db_name = getenv('DB_NAME');

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $stmt = $pdo->query("SELECT id, email FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "info" => "Procure pelo seu e-mail abaixo e veja qual o ID ao lado dele.",
        "users" => $users
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>