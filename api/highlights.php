<?php
// api/highlights.php - Gerenciamento persistente de Pérolas Bíblicas
@ini_set('memory_limit', '512M');
@ini_set('upload_max_filesize', '64M');
@ini_set('post_max_size', '64M');
@set_time_limit(300); // 5 minutos por requisição
require_once __DIR__ . '/db.php';

$userData = verifyToken();
if (!$userData) {
    http_response_code(401);
    echo json_encode(["error" => "Não autorizado"]);
    exit;
}

// DEBUG LOGGER
function logDebug($msg)
{
    file_put_contents(__DIR__ . '/highlights_debug.log', date('Y-m-d H:i:s') . " - " . $msg . "\n", FILE_APPEND);
}
logDebug("Request: " . $_SERVER['REQUEST_URI'] . " Method: " . $method);

$userId = $userData['id'];
$method = $_SERVER['REQUEST_METHOD'];

// Função para remover acentos e normalizar strings para busca
function normalizeString($str)
{
    $str = trim(strtolower($str));
    $str = preg_replace('/[áàãâä]/u', 'a', $str);
    $str = preg_replace('/[éèêë]/u', 'e', $str);
    $str = preg_replace('/[íìîï]/u', 'i', $str);
    $str = preg_replace('/[óòõôö]/u', 'o', $str);
    $str = preg_replace('/[úùûü]/u', 'u', $str);
    $str = preg_replace('/[ç]/u', 'c', $str);
    return $str;
}

// Função auxiliar robusta para verificar se um capítulo está dentro de uma string de capítulos complexa
function isChapterInRange($requested, $stored)
{
    $normReq = normalizeString($requested);
    $normStored = normalizeString($stored);

    if ($normReq === $normStored)
        return true;

    // Regex para extrair Livro e Número do pedido (ex: "Gênesis 31")
    if (!preg_match('/^(.+)\s(\d+)$/u', $requested, $m))
        return false;

    $bookReqOrig = trim($m[1]);
    $bookReqNorm = normalizeString($bookReqOrig);
    $numReq = (int) $m[2];

    // Verifica se o livro (normalizado) está na string armazenada (normalizada)
    if (stripos($normStored, $bookReqNorm) === false)
        return false;

    // Para o parsing dos números, removemos o nome do livro (ignorando acento)
    // Usamos a versão normalizada para achar a posição e extrair a parte numérica de forma segura
    // Simplificação: vamos pegar tudo que sobrou após o nome do livro e tratar os números
    $numbersPart = preg_replace('/' . preg_quote($bookReqNorm, '/') . '/i', '', $normStored);

    $parts = preg_split('/[;,]/', $numbersPart);
    foreach ($parts as $part) {
        $part = trim($part);
        if (empty($part))
            continue;
        if (preg_match('/^(\d+)\s*-\s*(\d+)$/', $part, $range)) {
            if ($numReq >= (int) $range[1] && $numReq <= (int) $range[2])
                return true;
        } elseif (preg_match('/^(\d+)$/', $part, $single)) {
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
            logDebug("Searching for: $chapters");
            // Match Exato
            $stmt = $pdo->prepare("SELECT * FROM bible_highlights WHERE user_id = ? AND chapters = ? ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$userId, $chapters]);
            $highlight = $stmt->fetch();

            if ($highlight) {
                logDebug("Found EXACT match: " . $highlight['chapters']);
            } else {
                logDebug("No exact match. Trying Range Search...");
                $stmt = $pdo->prepare("SELECT * FROM bible_highlights WHERE user_id = ? ORDER BY created_at DESC");
                $stmt->execute([$userId]);
                $rows = $stmt->fetchAll();
                logDebug("Total rows to scan: " . count($rows));

                $scanCount = 0;
                foreach ($rows as $row) {
                    $scanCount++;
                    if ($scanCount <= 5) {
                        logDebug("Scanning stored chapter: [" . $row['chapters'] . "] vs Requested: [" . $chapters . "]");
                    }

                    if (isChapterInRange($chapters, $row['chapters'])) {
                        $highlight = $row;
                        logDebug("Found RANGE match: " . $row['chapters']);
                        break;
                    }
                }
                if (!$highlight)
                    logDebug("No match found after scan.");
            }
        } else {
            // ... (rest of code)
            $stmt = $pdo->prepare("SELECT * FROM bible_highlights WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$userId]);
            $highlight = $stmt->fetch();
        }
        echo json_encode($highlight ?: ["status" => "none"]);
        break;

    case 'POST':
        $chapters = $_POST['chapters'] ?? null;
        $content = $_POST['content'] ?? null;
        $id = $_POST['id'] ?? null;
        $audio = null;

        if ($chapters !== null) {
            if (isset($_FILES['audio_file']) && $_FILES['audio_file']['error'] === UPLOAD_ERR_OK) {
                $audioData = file_get_contents($_FILES['audio_file']['tmp_name']);
                $audio = base64_encode($audioData);
            }
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? null;
            $chapters = $input['chapters'] ?? '';
            $content = $input['content'] ?? '';
            $audio = $input['audio_content'] ?? null;
        }

        if (!$chapters || (!$content && !$audio)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "Dados incompletos"]);
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
                if ($content) {
                    $stmt = $pdo->prepare("UPDATE bible_highlights SET content = ?, audio_content = IFNULL(?, audio_content), is_read = 0 WHERE id = ?");
                    $stmt->execute([$content, $audio, $existing['id']]);
                } else {
                    $stmt = $pdo->prepare("UPDATE bible_highlights SET audio_content = IFNULL(?, audio_content), is_read = 0 WHERE id = ?");
                    $stmt->execute([$audio, $existing['id']]);
                }
                echo json_encode(["status" => "updated", "id" => $existing['id']]);
            } else {
                if (!$content) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "error" => "Texto necessário para novo registro"]);
                    exit;
                }
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