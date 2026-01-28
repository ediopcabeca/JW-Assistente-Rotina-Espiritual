import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configurações Iniciais
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "dist");

console.log("=========================================");
console.log(`[BOOT] Iniciando Servidor: ${new Date().toISOString()}`);
console.log(`[BOOT] Direitório base: ${__dirname}`);
console.log(`[BOOT] Pasta Dist: ${distPath}`);
console.log("=========================================");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-padrao-troque-por-seguranca';

// 1. Middlewares Basais
app.use(express.json());
app.use(cors());

// 2. Database Connection
let pool = null;
const initConnection = async () => {
    if (!process.env.DB_HOST) {
        console.warn("[DB] AVISO: DB_HOST não definido. O servidor funcionará sem sincronização.");
        return null;
    }
    try {
        const p = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10
        });
        await p.execute('SELECT 1');
        console.log("[DB] OK: Conexão com MySQL estabelecida.");

        // Criar tabelas se não existirem
        await p.execute(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await p.execute(`CREATE TABLE IF NOT EXISTS user_data (user_id INT PRIMARY KEY, sync_data LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);

        return p;
    } catch (err) {
        console.error("[DB ERRO FATAL]:", err.message);
        return null;
    }
};

// 3. AI Setup (Sem explodir se faltar chave)
let model = null;
try {
    const aiKey = process.env.JW_API_GEMINI || process.env.GEMINI_API_KEY;
    if (aiKey) {
        const genAI = new GoogleGenerativeAI(aiKey);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("[AI] OK: Modelo Gemini configurado.");
    } else {
        console.warn("[AI] AVISO: Chave da IA não encontrada.");
    }
} catch (e) {
    console.error("[AI ERRO]:", e.message);
}

// 4. Rotas de API Puras
app.get("/api/test", (req, res) => {
    res.json({
        message: "O Servidor Node.js está VIVO na Hostinger!",
        db: pool ? "CONECTADO" : "AUSENTE",
        env: {
            db_host: !!process.env.DB_HOST,
            ai_key: !!(process.env.JW_API_GEMINI || process.env.GEMINI_API_KEY)
        },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auth/register', async (req, res) => {
    console.log(`[AUTH] Tentativa de registro: ${req.body.email}`);
    const { email, password } = req.body;
    if (!pool) return res.status(503).json({ error: 'Serviço de banco de dados indisponível no momento.' });
    if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são necessários.' });

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
        if (existing.length > 0) return res.status(400).json({ error: 'Este e-mail já está em uso.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', [normalizedEmail, hashedPassword]);
        res.status(201).json({ message: 'Conta criada com sucesso!', userId: result.insertId });
    } catch (err) {
        console.error("[REGISTER ERRO]", err);
        res.status(500).json({ error: 'Erro interno ao criar conta.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!pool) return res.status(503).json({ error: 'Sincronização indisponível.' });
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
        if (users.length === 0) return res.status(401).json({ error: 'Credenciais inválidas.' });

        const valid = await bcrypt.compare(password, users[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Credenciais inválidas.' });

        const token = jwt.sign({ id: users[0].id, email: users[0].email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: users[0].id, email: users[0].email } });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao processar login.' });
    }
});

app.post("/api/chat", async (req, res) => {
    if (!model) return res.status(503).json({ error: "IA não configurada no servidor." });
    try {
        const result = await model.generateContent(req.body.prompt || req.body);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (err) {
        res.status(500).json({ error: "Erro ao consultar a IA." });
    }
});

// 5. Arquivos Estáticos (Frontend)
app.use(express.static(distPath));

// 6. SPA Logic (Fallback de rotas para o React)
app.get("*", (req, res) => {
    // Se for um recurso (js, css, png), não servimos o index.html como fallback se não existir
    if (req.url.includes('.')) {
        return res.status(404).end();
    }
    res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
            console.error("[SPA ERROR] Falha ao enviar index.html:", err);
            res.status(500).send("Erro ao carregar o frontend. Verifique o build.");
        }
    });
});

// 7. Inicialização
const start = async () => {
    pool = await initConnection();
    app.listen(PORT, () => {
        console.log(`[SERVER] OK: Escutando na porta ${PORT}`);
    });
};

start().catch(err => {
    console.error("[FATAL STARTUP ERROR]", err);
});
