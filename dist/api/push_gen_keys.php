<?php
// api/push_gen_keys.php
header("Content-Type: text/plain");

// Tenta gerar chaves P-256 reais via OpenSSL
$config = array(
    "curve_name" => "prime256v1",
    "private_key_type" => OPENSSL_KEYTYPE_EC,
);

$res = openssl_pkey_new($config);
if (!$res) {
    echo "Erro: OpenSSL não suporta geração de chaves EC P-256 neste servidor.";
    exit;
}

openssl_pkey_export($res, $privKey);
$details = openssl_pkey_get_details($res);
$pubKeyInPEM = $details['key'];

// Converte para formato Base64URL para o Web Push
function base64url_encode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

// Extrair a parte binária da chave pública (65 bytes)
// A chave pública no formato PEM contém o cabeçalho e rodapé.
// Para VAPID, precisamos apenas dos dados brutos do ponto.
$res = openssl_pkey_get_public($pubKeyInPEM);
$details = openssl_pkey_get_details($res);
$pubKeyBinary = $details['ec']['public_key'];

echo "--- COPIE ESTAS CHAVES PARA api/push_config.php ---\n\n";
echo "VAPID_PUBLIC_KEY:\n" . base64url_encode($pubKeyBinary) . "\n\n";
echo "VAPID_PRIVATE_KEY (Base64):\n" . base64_encode($privKey) . "\n";
echo "\nNota: Se as de cima não funcionarem, aqui está o PEM completo da privada:\n" . $privKey;
?>