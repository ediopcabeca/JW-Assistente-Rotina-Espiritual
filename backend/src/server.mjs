import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { model } from "./config/gemini.mjs";
import { initDB } from "./config/db.mjs";
import authRoutes from "./routes/auth.mjs";

dotenv.config();

const app = express();

// Porta padrão 3000 ou a definida pela Hostinger
const PORT = process.env.PORT || 3000;
// URL do seu frontend na Hostinger
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

// Verificação de Variáveis de Ambiente Críticas
const REQUIRED_ENV = ['GOOGLE_CLIENT_ID', 'JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
console.log("--- Verificando Configurações ---");
REQUIRED_ENV.forEach(env => {
    if (!process.env[env]) {
        console.warn(`[AVISO] Variável ${env} não configurada!`);
    } else {
        console.log(`[OK] Variável ${env} detectada.`);
    }
});
console.log("---------------------------------");

// Middlewares
app.use(express.json());

// CORS Configurado para segurança
app.use(
    cors({
        origin: FRONTEND_ORIGIN,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    })
);

// Healthcheck - Útil para monitorar na Hostinger
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Servidor online", timestamp: new Date() });
});

app.get("/", (req, res) => {
    res.send("<h1>Assistente Espiritual Backend</h1><p>O servidor está rodando corretamente.</p>");
});

// Rotas de Autenticação
app.use("/api/auth", authRoutes);

// Endpoint principal: proxy para Gemini (suporta prompt simples ou objeto complexo)
app.post("/api/chat", async (req, res) => {
    try {
        const payload = req.body;

        if (!payload) {
            return res.status(400).json({ error: "Corpo da requisição vazio." });
        }

        // Chamada ao Gemini - passa o payload diretamente para suportar contents/config
        const result = await model.generateContent(payload.prompt || payload);
        const response = await result.response;
        const text = response.text();

        return res.json({ reply: text });
    } catch (error) {
        console.error("Erro ao chamar Gemini no backend:", error);
        return res.status(500).json({
            error: "Erro ao processar a requisição com a IA no servidor.",
            message: error.message
        });
    }
});

// Inicia servidor
const start = async () => {
    console.log("[SERVER] Iniciando processo...");
    await initDB();

    app.listen(PORT, () => {
        console.log(`[SERVER] Rodando na porta ${PORT}`);
        console.log(`[SERVER] Frontend autorizado: ${FRONTEND_ORIGIN}`);
    });
};

start();
