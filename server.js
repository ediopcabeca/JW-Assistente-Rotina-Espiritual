import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-shhhh';

// 1. Middlewares
app.use(express.json());
app.use(cors());

// 2. Logger
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

// 3. Database Connection (Graceful)
let pool;
const connectDB = async () => {
    if (!process.env.DB_HOST) {
        console.warn("[DB] Variáveis de ambiente faltando. Rodando em modo 'Sem Sincronização'.");
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
        console.log("[DB] Conexão MySQL estabelecida.");

        // Init Tables
        await p.execute(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await p.execute(`CREATE TABLE IF NOT EXISTS user_data (user_id INT PRIMARY KEY, sync_data LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);

        return p;
    } catch (err) {
        console.error("[DB ERRO]", err.message);
        return null;
    }
};

// 4. AI Setup
const genAI = new GoogleGenerativeAI(process.env.JW_API_GEMINI || process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 5. API Routes
app.get("/api/test", (req, res) => {
    res.json({ message: "O Servidor Node.js está VIVO na raiz!", db: pool ? "conectado" : "ausente" });
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", db: !!pool });
});

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!pool) return res.status(503).json({ error: 'Sincronização indisponível. Configure o banco de dados na Hostinger.' });
    if (!email || !password) return res.status(400).json({ error: 'Preencha tudo.' });
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
        if (existing.length > 0) return res.status(400).json({ error: 'E-mail já existe.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', [normalizedEmail, hashedPassword]);
        res.status(201).json({ message: 'Ok', userId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!pool) return res.status(503).json({ error: 'Sincronização indisponível.' });
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
        if (users.length === 0) return res.status(401).json({ error: 'Incorreto.' });

        const valid = await bcrypt.compare(password, users[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Incorreto.' });

        const token = jwt.sign({ id: users[0].id, email: users[0].email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: users[0].id, email: users[0].email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sync Endpoints
app.post('/api/sync', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !pool) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const token = auth.split(' ')[1];
        const user = jwt.verify(token, JWT_SECRET);
        const data = JSON.stringify(req.body.sync_data);
        await pool.execute('INSERT INTO user_data (user_id, sync_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE sync_data = ?', [user.id, data, data]);
        res.json({ message: 'Synced' });
    } catch (err) {
        res.status(401).json({ error: 'Invalid Session' });
    }
});

app.get('/api/sync', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !pool) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const token = auth.split(' ')[1];
        const user = jwt.verify(token, JWT_SECRET);
        const [rows] = await pool.execute('SELECT sync_data FROM user_data WHERE user_id = ?', [user.id]);
        res.json({ sync_data: rows[0] ? JSON.parse(rows[0].sync_data) : null });
    } catch (err) {
        res.status(401).json({ error: 'Invalid Session' });
    }
});

// AI Proxies
app.post("/api/chat", async (req, res) => {
    try {
        const result = await model.generateContent(req.body.prompt || req.body);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Static Serving
app.use(express.static(distPath));

// 7. SPA Fallback
app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

// 8. Start
const start = async () => {
    pool = await connectDB();
    app.listen(PORT, () => {
        console.log(`[OK] Servidor rodando na porta ${PORT}`);
    });
};

start();
