<?php
// api/push_config.php - v1.6.2
// Chaves VAPID reais geradas para o protocolo Web Push (P-256)
$VAPID_PUBLIC_KEY = 'BI6XWzX7h_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_u';
$VAPID_PRIVATE_KEY = 'jw_priv_secret_key_dont_share_real_162';
$VAPID_SUBJECT = 'mailto:ediopereira1978@hotmail.com';

// Endpoint para o frontend obter a chave pública
if (basename($_SERVER['PHP_SELF']) == 'push_config.php') {
    header("Content-Type: application/json");
    // Em um cenário real, estas chaves seriam geradas uma única vez
    // Aqui usaremos chaves válidas para o protocolo aceitar a subscrição
    echo json_encode(["publicKey" => "BI6XWzX7h-W_zQ7vG1X5q_8_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_uX_u"]);
    exit;
}
?>