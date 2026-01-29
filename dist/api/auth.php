<?php
// api/auth.php
require_once 'db.php';

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);

if ($action === 'register') {
    $email = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';

    if (!$email || !$password)
        respond(["error" => "E-mail e senha obrigatórios"], 400);

    // Verifica se existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch())
        respond(["error" => "E-mail já cadastrado"], 400);

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
    try {
        $stmt->execute([$email, $hash]);
        respond(["message" => "Usuário criado com sucesso", "userId" => $pdo->lastInsertId()], 201);
    } catch (Exception $e) {
        respond(["error" => "Erro ao criar usuário"], 500);
    }
}

if ($action === 'login') {
    $email = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        respond(["error" => "Credenciais inválidas"], 401);
    }

    $token = generateToken($user['id'], $user['email']);
    respond([
        "token" => $token,
        "user" => ["id" => $user['id'], "email" => $user['email']]
    ]);
}

respond(["error" => "Ação inválida"], 404);
?>