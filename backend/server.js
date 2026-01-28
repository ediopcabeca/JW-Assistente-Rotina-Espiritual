// Ponto de entrada padrão para Hostinger (server.js)
console.log("[STARTUP] Iniciando servidor Node.js...");

// Importação dinâmica para suportar ES Modules e capturar erros de carregamento
import('./src/server.mjs')
    .then(() => {
        console.log("[STARTUP] server.mjs carregado com sucesso.");
    })
    .catch((err) => {
        console.error("[STARTUP ERRO FATAL] Falha ao carregar server.mjs:");
        console.error(err);
        // Não encerramos o processo para permitir que o log seja lido no painel
    });
