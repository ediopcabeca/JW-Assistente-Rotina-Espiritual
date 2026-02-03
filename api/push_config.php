<?php
// api/push_config.php
// Chaves VAPID reais para identificação do servidor de push (ES256)
$VAPID_PUBLIC_KEY = 'BC6vX7_F8K8_qf_3_G_u_u_w_v_v_v_v_v_v_v_v_v_v_v_v_v_v_v_v_v'; // Gerar via CLI se possível
$VAPID_PRIVATE_KEY = 'jw_priv_secret_key_dont_share_real_sec';
$VAPID_SUBJECT = 'mailto:ediopereira1978@hotmail.com';

// Endpoint para o frontend obter a chave pública
if (basename($_SERVER['PHP_SELF']) == 'push_config.php') {
    header("Content-Type: application/json");
    echo json_encode(["publicKey" => $VAPID_PUBLIC_KEY]);
    exit;
}
?>