<?php
// api/db.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. Carregar Configurações (Tenta env do servidor primeiro, depois arquivo local)
$host = getenv('DB_HOST') ?: 'localhost';
$db = getenv('DB_NAME');
$user = getenv('DB_USER');
$pass = getenv('DB_PASSWORD');
$jwt_secret = getenv('JWT_SECRET') ?: 'jw_segredo_padrao_2026';

// Se não encontrou no servidor, tenta carregar de um arquivo config.php na raiz (fora do dist) 
// ou na mesma pasta para facilitar
if (file_exists(__DIR__ . '/config.php')) {
    include_once __DIR__ . '/config.php';
    // O arquivo config.php deve definir as variáveis se elas não existirem
    if (isset($CFG_DB_HOST))
        $host = $CFG_DB_HOST;
    if (isset($CFG_DB_NAME))
        $db = $CFG_DB_NAME;
    if (isset($CFG_DB_USER))
        $user = $CFG_DB_USER;
    if (isset($CFG_DB_PASS))
        $pass = $CFG_DB_PASS;
    if (isset($CFG_JWT_SECRET))
        $jwt_secret = $CFG_JWT_SECRET;
}

if (!$db || !$user) {
    http_response_code(500);
    echo json_encode(["error" => "Configuração do banco de dados ausente no servidor. Crie o arquivo api/config.php."]);
    exit;
}

$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro de conexão MySQL: " . $e->getMessage()]);
    exit;
}

// Helpers
function respond($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function generateToken($userId, $email)
{
    global $jwt_secret;
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(['id' => $userId, 'email' => $email, 'exp' => time() + (30 * 24 * 60 * 60)]);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $jwt_secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verifyToken()
{
    global $jwt_secret;
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$authHeader)
        return null;

    $token = str_replace('Bearer ', '', $authHeader);
    $parts = explode('.', $token);
    if (count($parts) !== 3)
        return null;

    list($header, $payload, $signature) = $parts;
    $validSignature = hash_hmac('sha256', $header . "." . $payload, $jwt_secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($validSignature));

    if ($base64UrlSignature !== $signature)
        return null;
    $data = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
    if ($data['exp'] < time())
        return null;

    return $data;
}
?>