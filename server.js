/**
 * server.js (Project Root)
 * Ponto de entrada principal para o deploy na Hostinger.
 */
console.log("[ROOT STARTUP] Iniciando JW Assistente...");

// Importação dinâmica do servidor real que está na pasta backend
import('./backend/src/server.js')
    .then(() => {
        console.log("[ROOT STARTUP] Servidor backend carregado com sucesso.");
    })
    .catch((err) => {
        console.error("[ROOT ERRO FATAL] Falha ao carregar o servidor:");
        console.error(err);
    });
