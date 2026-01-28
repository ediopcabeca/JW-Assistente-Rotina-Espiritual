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

// Função auxiliar robusta para verificar se um capítulo está dentro de uma string de capítulos complexa
function isChapterInRange($requested, $stored)
{
    // Ex: requested = "Gênesis 31", stored = "Gênesis 30-32; Gênesis 34"
    if (trim(strtolower($requested)) === trim(strtolower($stored)))
        return true;

    // Regex para extrair Livro e Número do pedido (ex: "Gênesis 31")
    if (!preg_match('/^(.+)\s(\d+)$/u', $requested, $m))
        return false;
    $bookReq = trim($m[1]);
    $numReq = (int) $m[2];

    // Se o livro não está na string armazenada, nem adianta continuar
    if (stripos($stored, $bookReq) === false)
        return false;

    // Remove o nome do livro da string armazenada, tratando case-insensitive e acentos
    // Usamos regex para garantir que pegamos o nome do livro seguido de espaço ou número
    $numbersPart = preg_replace('/' . preg_quote($bookReq, '/') . '/iu', '', $stored);

    // Separa por delimitadores comuns (ponto e vírgula, vírgula, ou espaço redundante)
    $parts = preg_split('/[;,]/', $numbersPart);

    foreach ($parts as $part) {
        $part = trim($part);
        if (empty($part))
            continue;

        // Caso 1: Intervalo (ex: "30-32")
        if (preg_match('/^(\d+)\s*-\s*(\d+)$/', $part, $range)) {
            if ($numReq >= (int) $range[1] && $numReq <= (int) $range[2])
                return true;
        }
        // Caso 2: Número único (ex: "31")
        elseif (preg_match('/^(\d+)$/', $part, $single)) {
            if ($numReq === (int) $single[1])
                return true;
        }
    }

    return false;
}

switch ($method) {
    case 'GET':
        $chapters = $_GET['chapters'] ?? null;
        if ($chapters) {
            // 1. Busca exata (Primeiro passo para performance)
            $stmt = $pdo->prepare("SELECT * FROM bible_highlights WHERE user_id = ? AND chapters = ? ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$userId, $chapters]);
            $highlight = $stmt->fetch();

            if (!$highlight) {
                // 2. Busca aproximada (Archive)
                // Puxamos todos os registros do usuário para processar via PHP (mais flexível que SQL para ranges)
                $stmt = $pdo->prepare("SELECT * FROM bible_highlights WHERE user_id = ? ORDER BY created_at DESC");
                $stmt->execute([$userId]);
                $rows = $stmt->fetchAll();

                foreach ($rows as $row) {
                    if (isChapterInRange($chapters, $row['chapters'])) {
                        $highlight = $row;
                        break;
                    }
                }
            }
        } else {
            // Busca a última não lida (Pérolas de hoje)
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
            // Update parcial (ex: cache de áudio)
            $stmt = $pdo->prepare("UPDATE bible_highlights SET audio_content = IFNULL(?, audio_content) WHERE id = ? AND user_id = ?");
            $stmt->execute([$audio, $id, $userId]);
            echo json_encode(["status" => "updated", "id" => $id]);
        } else {
            // Upsert por capítulos exatos
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