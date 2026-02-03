<?php
// api/push_fix_keys.php
require_once __DIR__ . '/db.php';

$privKeyPEM = "-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgs9QXcG4VcDQ9XeeE
YVeCshR/5nZBfXUrUYxALWMu+eKhRANCAARS/g8cS56lqmb+xY1a04jLmGKg0P2U
Lnhv5up3qSjhEm1jnLLda1UudWNBCUrbpGmhlDmRtAHsbYBPeRWApoN2
-----END PRIVATE KEY-----";

$res = openssl_pkey_get_private($privKeyPEM);
$details = openssl_pkey_get_details($res);
$pubKeyBinary = $details['ec']['public_key'];

function base64url_encode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

$publicKeyURL = base64url_encode($pubKeyBinary);

echo "PUBLIC KEY (USE ESTA): " . $publicKeyURL . "\n";
echo "LENGTH: " . strlen($publicKeyURL) . "\n";
?>