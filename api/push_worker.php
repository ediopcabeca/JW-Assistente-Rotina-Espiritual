<?php
// api/push_worker.php - v2.1.5 FIX (No Loop, Timezone Fix, Sanitized)
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');

// Define Time Limit curto para evitar timeout do browser/client
set_time_limit(30);

$processed = 0;
$log = [];

try {
    // 1. Correção de Timezone:
    // O usuário agenda em horário LOCAL (-3h). O Banco salva "2024-02-03 21:00:00".
    // O Servidor está em UTC "2024-02-04 00:00:00".
    // Se usarmos UTC_TIMESTAMP(), "21:00" < "00:00", então DEVERIA processar.
    // Mas para garantir, vamos pegar tudo que scheduled_time <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)
    // Isso dá uma margem de segurança.

    $stmt = $pdo->prepare("SELECT n.*, u.email 
                           FROM scheduled_notifications n
                           JOIN users u ON n.user_id = u.id
                           WHERE n.sent = 0 
                           AND n.scheduled_time <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE)
                           LIMIT 20");
    $stmt->execute();
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($tasks as $task) {
        // 2. Sanitização (A Mesma Regra do Frontend)
        $rawTopic = "jw_assistant_" . $task['email'];
        $cleanTopic = preg_replace('/[^a-zA-Z0-9]/', '_', $rawTopic);

        // 3. Header Seguro (ASCII Only)
        // Remove acentos e emojis do Título para o Header
        $safeTitle = iconv('UTF-8', 'ASCII//TRANSLIT', $task['title']);
        $safeTitle = preg_replace('/[^a-zA-Z0-9 ]/', '', $safeTitle);

        // O Corpo pode ter emojis, o NTFY aceita no body

        $ch = curl_init("https://ntfy.sh/" . $cleanTopic);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $task['body']);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Title: " . $safeTitle,
            "Priority: high",
            "Tags: bell"
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $resp = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // 4. Marca como enviado
        $upd = $pdo->prepare("UPDATE scheduled_notifications SET sent = 1 WHERE id = ?");
        $upd->execute([$task['id']]);

        $processed++;
        $log[] = ["id" => $task['id'], "info" => "Sent to $cleanTopic ($httpCode)"];
    }

} catch (Exception $e) {
    $log[] = ["error" => $e->getMessage()];
}

echo json_encode([
    "status" => "success",
    "worker_version" => "v2.1.5",
    "processed_count" => $processed,
    "details" => $log,
    "server_time_utc" => gmdate('Y-m-d H:i:s')
]);
?>