<?php
// api/push_worker.php - v2.1.2 (NTFY-Only + Safe Headers)
require_once __DIR__ . '/db.php';

set_time_limit(290);

for ($cycle = 0; $cycle < 5; $cycle++) {
    // 1. Busca notificações pendentes - Agora com JOIN para pegar o E-mail
    $stmt = $pdo->prepare("SELECT n.*, u.email 
                           FROM scheduled_notifications n
                           JOIN users u ON n.user_id = u.id
                           WHERE n.sent = 0 AND n.scheduled_time <= UTC_TIMESTAMP()
                           LIMIT 20");
    $stmt->execute();
    $toSend = $stmt->fetchAll();

    foreach ($toSend as $item) {
        $upd = $pdo->prepare("UPDATE scheduled_notifications SET sent = 1 WHERE id = ?");
        $upd->execute([$item['id']]);

        // Canal Sanitizado v2.1.2
        $topic = "jw_assistant_" . $item['email'];
        $safeChannel = preg_replace('/[^a-zA-Z0-9]/', '_', $topic);

        $ch = curl_init("https://ntfy.sh/" . $safeChannel);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $item['body']);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Title: " . $item['title'],
            "Priority: high",
            "Tags: bell"
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
    }

    if ($cycle < 4)
        sleep(60);
}

echo json_encode(["status" => "success", "processed" => count($toSend)]);
?>