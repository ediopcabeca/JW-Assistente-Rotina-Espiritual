<?php
// api/push_audit.php - v2.0.0 Final
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/db.php';
    global $pdo;

    // 1. Horários do Servidor
    $stmt_time = $pdo->query("SELECT NOW() as local_now, UTC_TIMESTAMP() as utc_now");
    $times = $stmt_time->fetch();

    // 2. Próximas Notificações
    $stmt_next = $pdo->query("SELECT n.*, u.email as ntfy_topic FROM scheduled_notifications n JOIN users u ON n.user_id = u.id WHERE n.sent = 0 ORDER BY n.scheduled_time ASC LIMIT 5");
    $next_notifications = $stmt_next->fetchAll(PDO::FETCH_ASSOC);

    // 3. Notificações Recém Enviadas
    $stmt_sent = $pdo->query("SELECT n.*, u.email as ntfy_topic FROM scheduled_notifications n JOIN users u ON n.user_id = u.id WHERE n.sent = 1 ORDER BY n.scheduled_time DESC LIMIT 5");
    $sent_notifications = $stmt_sent->fetchAll(PDO::FETCH_ASSOC);

    // 4. Logs do Sistema (v2.0.4)
    $stmt_logs = $pdo->query("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 20");
    $system_logs = $stmt_logs->fetchAll(PDO::FETCH_ASSOC);

    // 5. Hostinger Internal Logs (v2.0.8) - Para ver por que o Node.js não liga
    $hostinger_logs = [];
    $logDir = realpath(__DIR__ . '/../.builds/logs');
    if ($logDir && is_dir($logDir)) {
        $dirs = scandir($logDir, SCANDIR_SORT_DESCENDING);
        foreach ($dirs as $dir) {
            if ($dir === '.' || $dir === '..')
                continue;
            $fullPath = $logDir . DIRECTORY_SEPARATOR . $dir;
            if (is_dir($fullPath)) {
                $files = scandir($fullPath);
                foreach ($files as $file) {
                    if ($file === '.' || $file === '..')
                        continue;
                    $hostinger_logs[$dir][$file] = substr(file_get_contents($fullPath . DIRECTORY_SEPARATOR . $file), -1000);
                }
                break; // Apenas o mais recente
            }
        }
    }

    // --- GATILHO DE TESTE NTFY v2.1.2 ---
    if (isset($_GET['test_ntfy'])) {
        $email = isset($_GET['email']) ? $_GET['email'] : 'ediopereira1978@hotmail.com';
        $topic = "jw_assistant_" . $email;
        $safeChannel = preg_replace('/[^a-zA-Z0-9]/', '_', $topic);

        $ch = curl_init("https://ntfy.sh/" . $safeChannel);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, "Sinal v2.1.2 via Audit Trigger em " . $times['local_now']);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Title: JW Audit ✅", "Priority: high"]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        die(json_encode(["test_result" => "sent", "channel" => $safeChannel, "http_code" => $code, "response" => $res]));
    }

    // --- AUDITORIA DE SINCRONIA ---
    $files_audit = [
        "api_folder" => scandir(__DIR__),
        "root_folder" => scandir(__DIR__ . '/..'),
        "diag_exists" => is_dir(__DIR__ . '/../diag') ? "SIM" : "NÃO",
        "inspect_exists" => file_exists(__DIR__ . '/inspect.php') ? "SIM" : "NÃO"
    ];

    echo json_encode([
        "status" => "success",
        "v2.1.2_sync" => true,
        "server_times" => $times,
        "system_logs" => $system_logs,
        "hostinger_internal_logs" => $hostinger_logs,
        "next_to_send" => $next_notifications,
        "recently_sent" => $sent_notifications,
        "files_audit" => $files_audit
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>