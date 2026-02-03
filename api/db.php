<?php
// api/db.php
// Configuração Ultra-Robusta para Hostinger

// 1. Definições Iniciais de Erro (Desativado para produção, mas configurado para JSON caso ocorra algo)
error_reporting(E_ALL); // Temporário para diagnosticar se necessário
ini_set('display_errors', 0); // Não mostra erros na tela (evita quebrar o JSON)

// 2. Tenta carregar o arquivo de configuração
$host = 'localhost';
$db = '';
$user = '';
$pass = '';
$jwt_secret = 'jw_segredo_espiritual_2026';

try {
    if (file_exists(__DIR__ . '/config.php')) {
        // Se houver erro de sintaxe no config.php, isso vai capturar
        include_once __DIR__ . '/config.php';
        if (isset($CFG_DB_HOST))
            $host = $CFG_DB_HOST;
        if (isset($CFG_DB_NAME))
            $db = $CFG_DB_NAME;
        if (isset($CFG_DB_USER))
            $user = $CFG_DB_USER;
        if (isset($CFG_DB_PASS))
            $pass = $CFG_DB_PASS;
    }
} catch (Throwable $t) {
    header("Content-Type: application/json");
    http_response_code(500);
    echo json_encode(["status" => "error", "error" => "Erro de sintaxe no arquivo api/config.php. Verifique aspas e ponto-e-vírgula."]);
    exit;
}

// 3. Verifica se os dados básicos existem
if (empty($db) || empty($user)) {
    header("Content-Type: application/json");
    http_response_code(500);
    echo json_encode(["status" => "error", "error" => "Configuração do Banco de Dados incompleta no api/config.php"]);
    exit;
}

// 4. Conexão com o Banco
try {
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Auto-criação de tabelas
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(191) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;");
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_data (user_id INT PRIMARY KEY, sync_data LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;");
    $pdo->exec("CREATE TABLE IF NOT EXISTS app_settings (s_key VARCHAR(50) PRIMARY KEY, s_value TEXT) ENGINE=InnoDB;");
    $pdo->exec("CREATE TABLE IF NOT EXISTS bible_highlights (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, chapters VARCHAR(255) NOT NULL, content LONGTEXT NOT NULL, audio_content LONGTEXT, is_read TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(user_id, chapters), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;");
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_discourses (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, material LONGTEXT, scriptures VARCHAR(255), time_min VARCHAR(10), resources TEXT, full_text LONGTEXT NOT NULL, summary LONGTEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;");
    $pdo->exec("CREATE TABLE IF NOT EXISTS push_subscriptions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, endpoint TEXT NOT NULL, p256dh VARCHAR(255) NOT NULL, auth VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, endpoint(191)), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS scheduled_notifications (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, activity_index INT NOT NULL, title VARCHAR(255) NOT NULL, body TEXT NOT NULL, scheduled_time DATETIME NOT NULL, sent TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, activity_index, scheduled_time), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;");

    // Upgrade de colunas para quem já tinha o banco criado com limites menores
    $pdo->exec("ALTER TABLE user_data MODIFY COLUMN sync_data LONGTEXT;");
    $pdo->exec("ALTER TABLE bible_highlights MODIFY COLUMN content LONGTEXT;");
    $pdo->exec("ALTER TABLE bible_highlights MODIFY COLUMN audio_content LONGTEXT;");

} catch (PDOException $e) {
    header("Content-Type: application/json");
    http_response_code(500);
    echo json_encode(["status" => "error", "error" => "Erro de Conexão: " . $e->getMessage()]);
    exit;
}

// 5. Se chegou aqui, tudo OK - Define o Header Global para o restante do script
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
    exit(0);

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
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode(['id' => $userId, 'email' => $email, 'exp' => time() + (30 * 24 * 60 * 60)]));
    $signature = hash_hmac('sha256', "$header.$payload", $jwt_secret, true);
    return "$header.$payload." . base64_encode($signature);
}

function verifyToken()
{
    global $jwt_secret;

    // Tenta obter o header de várias formas (Hostinger/Apache/Nginx)
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$auth && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (!$auth)
        return null;

    $token = str_replace('Bearer ', '', $auth);
    $parts = explode('.', $token);
    if (count($parts) !== 3)
        return null;
    list($h, $p, $s) = $parts;
    if (base64_encode(hash_hmac('sha256', "$h.$p", $jwt_secret, true)) !== $s)
        return null;
    $data = json_decode(base64_decode($p), true);
    return ($data['exp'] < time()) ? null : $data;
}
?>