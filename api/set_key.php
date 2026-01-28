<?php
// api/set_key.php - Salva a chave da API no Banco de Dados para sobreviver ao deploy
require_once __DIR__ . '/db.php';

header("Content-Type: text/plain; charset=UTF-8");

echo "--- Configurador de Chaves via Banco de Dados ---\n\n";

$nova_chave = $_GET['key'] ?? '';
$tipo = $_GET['type'] ?? 'gemini'; // tts ou gemini

if (empty($nova_chave)) {
    echo "ERRO: Você precisa passar a chave pela URL. \n\n";
    echo "Exemplo para IA (Gemini):\n";
    echo "api/set_key.php?key=SUA_CHAVE_AQUI\n\n";
    echo "Exemplo para VOZ (Text-to-Speech):\n";
    echo "api/set_key.php?type=tts&key=SUA_CHAVE_AQUI\n";
    exit;
}

// Mapeia o tipo para a chave no banco
$db_key = ($tipo === 'tts') ? 'google_tts_key' : 'gemini_api_key';
$label = ($tipo === 'tts') ? 'VOZ (Text-to-Speech)' : 'IA (Gemini)';

try {
    // Salva ou atualiza a chave na tabela app_settings
    $stmt = $pdo->prepare("INSERT INTO app_settings (s_key, s_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE s_value = ?");
    $stmt->execute([$db_key, $nova_chave, $nova_chave]);

    echo "SUCESSO: Chave de $label salva com sucesso!\n";
    echo "Agora o sistema usará esta chave mesmo após novos deploys do GitHub.\n";
} catch (Exception $e) {
    echo "ERRO ao salvar no banco: " . $e->getMessage() . "\n";
}
?>