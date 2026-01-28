<?php
// api/db.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Em planos compartilhados, preferimos pegar as variáveis de ambiente do servidor 
// ou de um arquivo de configuração se elas não estiverem no $_ENV
$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME');
$user = getenv('DB_USER');
$pass = getenv('DB_PASSWORD');
$charset = 'utf8mb4';

if (!$db || !$user) {
    // Fallback para debug se você estiver testando localmente ou as variáveis sumirem
    // No servidor Hostinger, elas devem vir do painel de controle.
    http_response_code(500);
    echo json_encode(["error" => "Configuração do banco de dados ausente no servidor."]);
    exit;
}

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     http_response_code(500);
     echo json_encode(["error" => "Erro de conexão: " . $e->getMessage()]);
     exit;
}

// Helper para responder JSON
function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// JWT Simplificado para compatibilidade (Sem dependências externas)
function generateToken($userId, $email) {
    $secret = getenv('JWT_SECRET') ?: 'jw_segredo_padrao_2026';
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(['id' => $userId, 'email' => $email, 'exp' => time() + (30 * 24 * 60 * 60)]);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verifyToken() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$authHeader) return null;
    
    $token = str_replace('Bearer ', '', $authHeader);
    $secret = getenv('JWT_SECRET') ?: 'jw_segredo_padrao_2026';
    
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    
    list($header, $payload, $signature) = $parts;
    
    $validSignature = hash_hmac('sha256', $header . "." . $payload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($validSignature));
    
    if ($base64UrlSignature !== $signature) return null;
    
    $data = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
    if ($data['exp'] < time()) return null;
    
    return $data;
}
?>
