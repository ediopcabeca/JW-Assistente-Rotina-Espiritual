<?php
// api/highlights.php - Gerenciamento persistente de Pérolas Bíblicas
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
        $chapters = $_GET['chapters'] ?? null;
        if ($chapters) {
            // 1. Busca exata (ex: "Gênesis 1-3")
            $stmt = $pdo->prepare("SELECT * FROM bible_highlights WHERE user_id = ? AND chapters = ? ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$userId, $chapters]);
            $highlight = $stmt->fetch();

            if (!$highlight) {
                // 2. Busca aproximada (Archive)
                // Se o usuário procurou por "Gênesis 31", mas salvamos como "Gênesis 30-32"

                // Primeiro tenta um LIKE simples
                $stmt = $pdo->prepare("SELECT * FROM bible_highlights WHERE user_id = ? AND chapters LIKE ? ORDER BY created_at DESC LIMIT 1");
                $stmt->execute([$userId, "%$chapters%"]);
                $highlight = $stmt->fetch();

                if (!$highlight && preg_match('/^(.+)\s(\d+)$/', $chapters, $matches)) {
                    $bookRequested = $matches[1];
                    $numRequested = (int) $matches[2];

                    // Busca todos os registros desse livro para este usuário
                    $stmt = $pdo->prepare("SELECT * FROM bible_highlights WHERE user_id = ? AND chapters LIKE ? ORDER BY created_at DESC");
                    $stmt->execute([$userId, "$bookRequested%"]);
                    $potentialMatches = $stmt->fetchAll();

                    foreach ($potentialMatches as $row) {
                        // Verifica se o padrão é "Livro Inicio-Fim"
                        if (preg_match('/^' . preg_quote($bookRequested) . '\s(\d+)-(\d+)$/', $row['chapters'], $rMatches)) {
                            $start = (int) $rMatches[1];
                            $end = (int) $rMatches[2];
                            if ($numRequested >= $start && $numRequested <= $end) {
                                $highlight = $row;
                                break;
                            }
                        }
                    }
                }
            }
        } else {
            // Busca a última não lida
            $stmt = $pdo->prepare("SELECT * FROM bible_highlights WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$userId]);
            $highlight = $stmt->fetch();
        }

        echo json_encode($highlight ?: ["status" => "none"]);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        $chapters = $input['chapters'] ?? '';
        $content = $input['content'] ?? '';
        $audio = $input['audio_content'] ?? null;

        if (!$chapters || !$content) {
            http_response_code(400);
            echo json_encode(["error" => "Dados incompletos"]);
            exit;
        }

        if ($id) {
            $stmt = $pdo->prepare("UPDATE bible_highlights SET audio_content = IFNULL(?, audio_content) WHERE id = ? AND user_id = ?");
            $stmt->execute([$audio, $id, $userId]);
            echo json_encode(["status" => "updated", "id" => $id]);
        } else {
            $check = $pdo->prepare("SELECT id FROM bible_highlights WHERE user_id = ? AND chapters = ? LIMIT 1");
            $check->execute([$userId, $chapters]);
            $existing = $check->fetch();

            if ($existing) {
                $stmt = $pdo->prepare("UPDATE bible_highlights SET content = ?, audio_content = IFNULL(?, audio_content), is_read = 0 WHERE id = ?");
                $stmt->execute([$content, $audio, $existing['id']]);
                echo json_encode(["status" => "updated", "id" => $existing['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO bible_highlights (user_id, chapters, content, audio_content, is_read) VALUES (?, ?, ?, ?, 0)");
                $stmt->execute([$userId, $chapters, $content, $audio]);
                echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
            }
        }
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        $chapters = $input['chapters'] ?? null;

        if ($id) {
            $stmt = $pdo->prepare("UPDATE bible_highlights SET is_read = 1 WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
        } elseif ($chapters) {
            $stmt = $pdo->prepare("UPDATE bible_highlights SET is_read = 1 WHERE user_id = ? AND chapters = ?");
            $stmt->execute([$userId, $chapters]);
        }
        echo json_encode(["status" => "success"]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método não permitido"]);
        break;
}
?>