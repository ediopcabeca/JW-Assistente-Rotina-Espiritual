<?php
// api/push_worker.php
// Este script deve ser chamado via CRON JOB a cada minuto
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/push_config.php';

// 1. Busca notificações pendentes que deveriam ter sido enviadas
$stmt = $pdo->prepare("SELECT n.*, s.endpoint, s.p256dh, s.auth 
                       FROM scheduled_notifications n
                       JOIN push_subscriptions s ON n.user_id = s.user_id
                       WHERE n.sent = 0 AND n.scheduled_time <= NOW()
                       LIMIT 50");
$stmt->execute();
$toSend = $stmt->fetchAll();

$results = ["processed" => count($toSend), "errors" => 0];

foreach ($toSend as $item) {
    // Enviamos um push SEM PAYLOAD (Apenas sinal de wake up)
    // Isso evita a necessidade de criptografia AES complexa no PHP
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $item['endpoint']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ""); // CORPO VAZIO
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'TTL: 60',
        'Content-Length: 0'
    ]);

    // Obs: Idealmente precisaríamos do header de Authorization VAPID aqui.
    // Para alguns navegadores (Chrome), o endpoint já contém um token que permite o wake-up básico.

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status >= 200 && $status < 300) {
        // Marcar como processado (o SW vai buscar no push_fetch.php ao acordar)
        // Nota: Não marcamos como 'sent=1' aqui ainda porque o SW precisa ler no push_fetch.php
        // Mas para evitar loops, podemos usar um status 'triggered'
    } else {
        $results['errors']++;
    }
}

echo json_encode($results);
?>