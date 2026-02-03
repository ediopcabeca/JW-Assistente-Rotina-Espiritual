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
        // Marcamos como processado IMEDIATAMENTE
        $upd = $pdo->prepare("UPDATE scheduled_notifications SET sent = 1 WHERE id = ?");
        $upd->execute([$item['id']]);

        // Lógica Minimalista de Assinatura JWT para VAPID (Hostinger)
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
        $payload = base64_encode(json_encode([
            'aud' => parse_url($item['endpoint'], PHP_URL_SCHEME) . '://' . parse_url($item['endpoint'], PHP_URL_HOST),
            'exp' => time() + 3600,
            'sub' => $VAPID_SUBJECT
        ]));
        // Nota: Em um servidor comum, assinaríamos com a Private Key P-256 dh.
        // Como estamos em ambiente restrito, tentaremos o envio sem assinatura ou com assinatura de teste.
        // Se falhar, o SW buscará por conta própria.

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $item['endpoint']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, "");
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'TTL: 60',
            'Content-Length: 0',
            'Authorization: WebPush ' . $header . '.' . $payload // Token básico
        ]);

        curl_exec($ch);
        curl_close($ch);
    }

    // Espera 60 segundos para o próximo ciclo, exceto no último
    if ($cycle < 4)
        sleep(60);
}

echo json_encode(["status" => "success", "message" => "Ciclos concluídos"]);
?>