<?php
// api/push_config.php - v1.8.0
// Chaves VAPID Estáticas e Estáveis

$VAPID_PUBLIC_KEY = 'BG4VYkdzZ9ueo3Ry_8bomwBu_7iQ3WsVMzkaYkf91hVd5FZZj6Hoi2dwua92vdQbOd_9twskmZ4-E5HYIvnvPwA';
$VAPID_PRIVATE_KEY = 'o6ZqmL5hvCPOyXFnnvHz54K5p-NnUis5sPqMZtXfAq4';
$VAPID_SUBJECT = 'mailto:ediopereira1978@hotmail.com';

if (basename($_SERVER['PHP_SELF']) == 'push_config.php') {
    header("Content-Type: application/json");
    echo json_encode(["publicKey" => $VAPID_PUBLIC_KEY]);
    exit;
}
?>