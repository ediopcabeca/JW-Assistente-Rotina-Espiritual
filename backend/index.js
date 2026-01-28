// Arquivo de entrada padrão para garantir compatibilidade com Hostinger
console.log("[INDEX] Ponto de entrada carregado. Iniciando servidor...");

try {
    await import('./src/server.mjs');
    console.log("[INDEX] Importação do server.mjs concluída.");
} catch (err) {
    console.error("[INDEX ERRO] Falha crítica ao carregar server.mjs:", err.message);
    process.exit(1);
}
