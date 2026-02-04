<?php
// worker_v2.php - Root Level Rescue Worker
require_once __DIR__ . '/api/db.php'; // Tenta puxar a conexão da pasta API (espero que a leitura funcione)

header('Content-Type: application/json');

// Se falhar o require acima (pq a pasta api ta zoada), definimos a conexão aqui mesmo fallback
if (!isset($pdo)) {
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $db = getenv('DB_NAME') ?: 'u875922357_jw_assist';
    $user = getenv('DB_USER') ?: 'u875922357_admin';
    $pass = getenv('DB_PASS') ?: 'Jw_assist_2024';
    $charset = 'utf8mb4';
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (\PDOException $e) {
        die(json_encode(["error" => "DB Connection Failed: " . $e->getMessage()]));
    }
}

set_time_limit(50); // Menos que 60 para evitar timeout HTTP

$processed = 0;
$errors = [];

// Loop rápido de processamento
for ($i = 0; $i < 3; $i++) {
    // 1. Pega notificações atrasadas ou atuais
    // IMPORTANTE: Ajuste de Timezone. O servidor está em UTC. O banco tem horário local?
    // Se o user gravou 21:15 (local) e o servidor é 00:15 (UTC), a diferença é 3h.
    // Se o banco gravou 21:15 string...
    // Vamos processar tudo que scheduled_time <= NOW() e sent=0.

    try {
        $stmt = $pdo->prepare("SELECT n.*, u.email 
                               FROM scheduled_notifications n
                               JOIN users u ON n.user_id = u.id
                               WHERE n.sent = 0 AND n.scheduled_time <= UTC_TIMESTAMP() 
                               ORDER BY n.scheduled_time ASC
                               LIMIT 15");
        $stmt->execute();
        $tasks = $stmt->fetchAll();

        foreach ($tasks as $task) {
            // Sanitização v2.1.2 - CRÍTICO
            $rawTopic = "jw_assistant_" . $task['email'];
            // A regra é: substituir tudo que não é alfanumérico por _
            $cleanTopic = preg_replace('/[^a-zA-Z0-9]/', '_', $rawTopic);

            // Disparo NTFY - Headers Seguros v2.1.4
            $ch = curl_init("https://ntfy.sh/" . $cleanTopic);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $task['body']);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Title: " . preg_replace('/[^\x20-\x7E]/', '', $task['title']), // Remove emojis do titulo header
                "Priority: high",
                "Tags: bell"
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $resp = curl_exec($ch);
            curl_close($ch);

            // Marca como enviado
            $upd = $pdo->prepare("UPDATE scheduled_notifications SET sent = 1 WHERE id = ?");
            $upd->execute([$task['id']]);
            $processed++;
        }
    } catch (Exception $e) {
        $errors[] = $e->getMessage();
    }

    if ($processed == 0 && count($tasks) == 0)
        sleep(2);
    else
        break; // Se processou, sai. Se não tinha nada, espera um pouco e tenta de novo (simulando worker)
}

echo json_encode([
    "worker" => "v2.1.5_root_rescue",
    "status" => "ok",
    "processed" => $processed,
    "errors" => $errors,
    "time_check" => date('Y-m-d H:i:s')
]);
?>