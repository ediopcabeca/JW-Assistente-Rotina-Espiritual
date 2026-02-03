<?php
// diag/test.php - Pure NTFY Test
header('Content-Type: text/plain');

$email = "ediopereira1978@hotmail.com";
$topic = "jw_assistant_" . $email;
$safeChannel = preg_replace('/[^a-zA-Z0-9]/', '_', $topic);

echo "--- TESTE DE NOTIFICAÇÃO NTFY (DIAG) ---\n";
echo "Email: $email\n";
echo "Canal Calculado: $safeChannel\n";

$ch = curl_init("https://ntfy.sh/" . $safeChannel);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, "Teste v2.1.2 via PHP DIAG em " . date('Y-m-d H:i:s'));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Title: JW DIAG ✅",
    "Priority: high"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$resp = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $http\n";
echo "Resposta: $resp\n";
if ($err)
    echo "Erro cURL: $err\n";

echo "\n--- LISTANDO ARQUIVOS NA PASTA DIAG ---\n";
print_r(scandir(__DIR__));
?>