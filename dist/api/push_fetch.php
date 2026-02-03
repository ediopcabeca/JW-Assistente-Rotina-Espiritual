<?php
// api/push_fetch.php
require_once __DIR__ . '/db.php';

// Este endpoint não pode exigir JWT fixo no header se vier do SW em background sem cookies?
// Na verdade, o SW tem acesso ao token se o salvarmos no IndexedDB ou se o enviarmos via postMessage.
// Mas para simplicidade, vamos tentar via Cookie ou um token persistente no Cache.

// No PWA, o SW pode enviar o token se ele estiver salvo.
$headers = getallheaders();
$auth = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $auth);

$userId = null;
if ($token) {
    $user = verifyToken($token);
    if ($user)
        $userId = $user['id'];
}

if (!$userId)
    respond(["status" => "error", "message" => "Não autorizado"], 401);

try {
    // Busca a notificação mais recente agendada para "agora" que ainda não foi enviada
    // Damos uma margem de 10 minutos
    $stmt = $pdo->prepare("SELECT * FROM scheduled_notifications WHERE user_id = ? AND sent = 0 AND scheduled_time <= NOW() ORDER BY scheduled_time DESC LIMIT 1");
    $stmt->execute([$userId]);
    $note = $stmt->fetch();

    if ($note) {
        // Marca como enviada
        $upd = $pdo->prepare("UPDATE scheduled_notifications SET sent = 1 WHERE id = ?");
        $upd->execute([$note['id']]);

        respond([
            "status" => "success",
            "title" => $note['title'],
            "body" => $note['body']
        ]);
    } else {
        respond(["status" => "info", "message" => "Nenhuma notificação pendente."]);
    }

} catch (Exception $e) {
    respond(["status" => "error", "message" => $e->getMessage()], 500);
}
?>