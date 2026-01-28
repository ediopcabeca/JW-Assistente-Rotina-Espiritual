<?php
// api/set_key.php - Salva a chave da API no Banco de Dados para sobreviver ao deploy
require_once __DIR__ . '/db.php';

echo "--- Configurador de Chave Gemini via Banco de Dados ---\n";

$nova_chave = $_GET['key'] ?? '';

if (empty($nova_chave)) {
    echo "ERRO: Você precisa passar a chave pela URL. \n";
    echo "Exemplo: api/set_key.php?key=SUA_CHAVE_AQUI\n";
    exit;
}

try {
    // Salva ou atualiza a chave na tabela app_settings
    $stmt = $pdo->prepare("INSERT INTO app_settings (s_key, s_value) VALUES ('gemini_api_key', ?) ON DUPLICATE KEY UPDATE s_value = ?");
    $stmt->execute([$nova_chave, $nova_chave]);

    echo "SUCESSO: Chave salva no Banco de Dados!\n";
    echo "Agora o sistema usará esta chave mesmo após novos deploys do GitHub.\n";
    echo "Por segurança, você pode deletar este arquivo (set_key.php) do servidor após o uso.\n";
} catch (Exception $e) {
    echo "ERRO ao salvar no banco: " . $e->getMessage() . "\n";
}
?>