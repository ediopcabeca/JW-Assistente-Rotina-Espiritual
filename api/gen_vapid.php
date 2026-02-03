<?php
// api/gen_vapid.php
$config = [
    "curve_name" => "prime256v1",
    "private_key_type" => OPENSSL_KEYTYPE_EC,
];
$res = openssl_pkey_new($config);
openssl_pkey_export($res, $privKey);
$pubKey = openssl_pkey_get_details($res);

function base64url_encode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

// Extrair os bits brutos
// O OpenSSL expõe o 'ec' array com 'd' (privado) e 'x', 'y' (público)
$privRaw = $pubKey['ec']['d'];
$pubRaw = "\x04" . $pubKey['ec']['x'] . $pubKey['ec']['y'];

echo "VAPID_PRIVATE_KEY: " . base64url_encode($privRaw) . "\n";
echo "VAPID_PUBLIC_KEY: " . base64url_encode($pubRaw) . "\n";
?>