import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { model } from "./config/gemini.js";
import { initDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import syncRoutes from "./routes/sync.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../"); // Vai de backend/src/ para a raiz do projeto
const distPath = path.join(rootDir, "dist");

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

// Middlewares Iniciais
app.use(express.json());
app.use(cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Logger de Requisições (EXTREMAMENTE IMPORTANTE PARA DEBUG NA HOSTINGER)
app.use((req, res, next) => {
    console.log(`[REQ] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// TESTE DE ROTA PURA (Acesse /api/test no navegador)
app.get("/api/test", (req, res) => {
    res.json({ message: "API está respondendo corretamente!", timestamp: new Date() });
});

// Rotas de API (DEVEM VIR ANTES DO STATIC E DO FALLBACK)
app.use("/api/auth", authRoutes);
app.use("/api/sync", syncRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Servidor online", db: "pending" });
});

app.post("/api/chat", async (req, res) => {
    try {
        const payload = req.body;
        if (!payload) return res.status(400).json({ error: "Corpo vazio." });
        const result = await model.generateContent(payload.prompt || payload);
        const response = await result.response;
        return res.json({ reply: response.text() });
    } catch (error) {
        console.error("[ERRO CHAT]", error);
        return res.status(500).json({ error: "Erro na IA." });
    }
});

// Servidor de Arquivos Estáticos (Frontend Build)
app.use(express.static(distPath));

// Fallback para SPA (Single Page Application)
app.get("*", (req, res) => {
    // Se a rota começa com /api e chegou aqui, é um 404 de API real
    if (req.url.startsWith('/api')) {
        console.warn(`[404 API] Rota não encontrada: ${req.url}`);
        return res.status(404).json({ error: "API Route Not Found" });
    }
    // Caso contrário, serve o index.html do frontend
    res.sendFile(path.join(distPath, "index.html"));
});

const start = async () => {
    app.listen(PORT, async () => {
        console.log(`[SERVER] Rodando na porta ${PORT}`);
        console.log(`[SERVER] Dist Path: ${distPath}`);

        try {
            await initDB();
            console.log("[DB] Banco de dados inicializado.");
        } catch (err) {
            console.error("[DB ERRO]", err.message);
        }
    });
};

start();
