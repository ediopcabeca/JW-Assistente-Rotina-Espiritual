<?php
// api/discourses.php - Gerenciamento de discursos preparados
require_once __DIR__ . '/db.php';

$userData = verifyToken();
if (!$userData) {
    http_response_code(401);
    echo json_encode(["error" => "Não autorizado"]);
    exit;
}

$userId = $userData['id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Retorna o histórico de discursos do usuário
        $stmt = $pdo->prepare("SELECT * FROM user_discourses WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $discourses = $stmt->fetchAll();
        echo json_encode($discourses);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $material = $input['material'] ?? '';
        $scriptures = $input['scriptures'] ?? '';
        $time_min = $input['time_min'] ?? '';
        $resources = $input['resources'] ?? '';
        $full_text = $input['full_text'] ?? '';
        $summary = $input['summary'] ?? '';

        if (!$full_text || !$summary) {
            http_response_code(400);
            echo json_encode(["error" => "Conteúdo insuficiente para salvar."]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO user_discourses (user_id, material, scriptures, time_min, resources, full_text, summary) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $material, $scriptures, $time_min, $resources, $full_text, $summary]);

        echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "ID não fornecido"]);
            break;
        }
        $stmt = $pdo->prepare("DELETE FROM user_discourses WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(["status" => "deleted"]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método não permitido"]);
        break;
}
?>