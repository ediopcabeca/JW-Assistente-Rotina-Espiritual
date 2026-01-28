import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { model } from "./config/gemini.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

// Verificação simplificada
const REQUIRED_ENV = ['JW_API_GEMINI'];
console.log("--- Verificando Configurações ---");
REQUIRED_ENV.forEach(env => {
    if (!process.env[env] && !process.env.GEMINI_API_KEY) {
        console.warn(`[AVISO] Variável ${env} (ou GEMINI_API_KEY) não configurada!`);
    } else {
        console.log(`[OK] Variável de IA detectada.`);
    }
});
console.log("---------------------------------");

app.use(express.json());

app.use(
    cors({
        origin: FRONTEND_ORIGIN,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    })
);

app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Servidor online", timestamp: new Date() });
});

app.get("/", (req, res) => {
    res.send("<h1>Assistente Espiritual Backend</h1><p>O servidor está rodando corretamente (Modo Simples).</p>");
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

app.listen(PORT, () => {
    console.log(`[SERVER] Rodando na porta ${PORT}`);
    console.log(`[SERVER] Frontend autorizado: ${FRONTEND_ORIGIN}`);
});
