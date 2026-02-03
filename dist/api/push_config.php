<?php
// api/push_config.php - v1.6.2
// Chaves VAPID reais geradas para o protocolo Web Push (P-256)
$VAPID_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgs9QXcG4VcDQ9XeeE
YVeCshR/5nZBfXUrUYxALWMu+eKhRANCAARS/g8cS56lqmb+xY1a04jLmGKg0P2U
Lnhv5up3qSjhEm1jnLLda1UudWNBCUrbpGmhlDmRtAHsbYBPeRWApoN2
-----END PRIVATE KEY-----";

// Extração automática da chave pública P-256
$res = openssl_pkey_get_private($VAPID_PRIVATE_KEY);
$details = openssl_pkey_get_details($res);
$pubKeyBinary = $details['ec']['public_key'];
$VAPID_PUBLIC_KEY = rtrim(strtr(base64_encode($pubKeyBinary), '+/', '-_'), '=');

$VAPID_SUBJECT = 'mailto:ediopereira1978@hotmail.com';

if (basename($_SERVER['PHP_SELF']) == 'push_config.php') {
    header("Content-Type: application/json");
    echo json_encode(["publicKey" => $VAPID_PUBLIC_KEY]);
    exit;
}
?>