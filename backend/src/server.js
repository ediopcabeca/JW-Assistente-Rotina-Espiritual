import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { model } from "./config/gemini.js";
import { initDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import syncRoutes from "./routes/sync.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

// Verificação de Variáveis
const REQUIRED_ENV = ['JW_API_GEMINI', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
console.log("--- Verificando Configurações ---");
REQUIRED_ENV.forEach(env => {
    if (!process.env[env] && env !== 'JW_API_GEMINI') {
        console.warn(`[AVISO] Variável ${env} não configurada!`);
    } else if (env === 'JW_API_GEMINI' && !process.env.JW_API_GEMINI && !process.env.GEMINI_API_KEY) {
        console.warn(`[AVISO] Variável de IA não configurada!`);
    } else {
        console.log(`[OK] ${env} detectada.`);
    }
});
console.log("---------------------------------");

app.use(express.json());

app.use(
    cors({
        origin: FRONTEND_ORIGIN,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Rotas de Autenticação e Sincronização
app.use("/api/auth", authRoutes);
app.use("/api/sync", syncRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Servidor online", timestamp: new Date() });
});

app.get("/", (req, res) => {
    res.send("<h1>Assistente Espiritual Backend</h1><p>O servidor está rodando com suporte a Sincronização MySQL.</p>");
});

app.post("/api/chat", async (req, res) => {
    try {
        const payload = req.body;
        if (!payload) return res.status(400).json({ error: "Corpo vazio." });

        const result = await model.generateContent(payload.prompt || payload);
        const response = await result.response;
        return res.json({ reply: response.text() });
    } catch (error) {
        console.error("Erro no backend:", error);
        return res.status(500).json({ error: "Erro na IA.", message: error.message });
    }
});

const start = async () => {
    // Inicia o servidor primeiro para evitar timeout na Hostinger
    app.listen(PORT, async () => {
        console.log(`[SERVER] Rodando na porta ${PORT}`);
        console.log(`[SERVER] Frontend autorizado: ${FRONTEND_ORIGIN}`);

        // Inicializa o DB em background
        try {
            await initDB();
        } catch (err) {
            console.error("[SERVER] Falha ao inicializar o banco:", err.message);
        }
    });
};

start();
