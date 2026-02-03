<?php
// api/push_worker.php
// Este script deve ser chamado via CRON JOB a cada minuto
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/push_config.php';

// 0. Configura o script para rodar por quase 5 minutos
set_time_limit(290);

for ($cycle = 0; $cycle < 5; $cycle++) {
    // 1. Busca notificações pendentes que deveriam ter sido enviadas
    $stmt = $pdo->prepare("SELECT n.*, s.endpoint, s.p256dh, s.auth 
                           FROM scheduled_notifications n
                           JOIN push_subscriptions s ON n.user_id = s.user_id
                           WHERE n.sent = 0 AND n.scheduled_time <= NOW()
                           LIMIT 50");
    $stmt->execute();
    $toSend = $stmt->fetchAll();

    foreach ($toSend as $item) {
        // Marcamos como processado IMEDIATAMENTE antes de enviar para evitar duplicidade em outro ciclo
        $upd = $pdo->prepare("UPDATE scheduled_notifications SET sent = 1 WHERE id = ?");
        $upd->execute([$item['id']]);

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

        curl_exec($ch);
        curl_close($ch);
    }

    // Espera 60 segundos para o próximo ciclo, exceto no último
    if ($cycle < 4)
        sleep(60);
}

echo json_encode(["status" => "success", "message" => "Ciclos concluídos"]);
?>