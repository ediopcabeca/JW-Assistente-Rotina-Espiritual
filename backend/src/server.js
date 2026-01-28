import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { model } from "./config/gemini.js";
import { initDB, pool } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import syncRoutes from "./routes/sync.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");
const distPath = path.join(rootDir, "dist");

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

// 1. Middlewares
app.use(express.json());
app.use(cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// 2. Request Logger
app.use((req, res, next) => {
    console.log(`[REQ] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 3. API Routes
app.get("/api/test", (req, res) => {
    res.json({ message: "API está respondendo corretamente!", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/sync", syncRoutes);

app.get("/api/health", async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: "ok",
            message: "Servidor online e integrado",
            db: "conectado",
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("[HEALTH CHECK] Erro no DB:", err.message);
        res.status(500).json({
            status: "error",
            message: "Servidor online, mas erro no Banco de Dados",
            db: "erro",
            error: err.message
        });
    }
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
        return res.status(500).json({ error: "IA Error" });
    }
});

// 4. API Fallback (404 JSON para qualquer /api que não existia acima)
app.all("/api/*", (req, res) => {
    console.warn(`[404 API] Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API Route Not Found", path: req.url });
});

// 5. Static Files (Frontend)
app.use(express.static(distPath));

// 6. SPA Fallback (Serve index.html para qualquer rota GET que não seja arquivo estático)
app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
    console.error("[GLOBAL ERROR]", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
});

const start = async () => {
    app.listen(PORT, async () => {
        console.log(`[SERVER] Rodando na porta ${PORT}`);
        console.log(`[SERVER] Static files from: ${distPath}`);

        try {
            await initDB();
            console.log("[DB] Banco de dados inicializado.");
        } catch (err) {
            console.error("[DB ERRO]", err.message);
        }
    });
};

start();
