import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from "@google/generative-ai";
import webPush from 'web-push';
import https from 'https';

// Configurações Iniciais
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "dist");

// Configuração VAPID (v1.8.1)
// Usamos as mesmas chaves estáveis da v1.8.0
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BG4VYkdzZ9ueo3Ry_8bomwBu_7iQ3WsVMzkaYkf91hVd5FZZj6Hoi2dwua92vdQbOd_9twskmZ4-E5HYIvnvPwA';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'o6ZqmL5hvCPOyXFnnvHz54K5p-NnUis5sPqMZtXfAq4';

webPush.setVapidDetails(
    'mailto:ediopereira1978@hotmail.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-padrao-troque-por-seguranca';

// 1. Middlewares
app.use(express.json());
app.use(cors());

// 2. Database Connection
let pool = null;
const initConnection = async () => {
    if (!process.env.DB_HOST) {
        console.warn("[DB] AVISO: DB_HOST não definido.");
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

        // Tabelas Core
        await p.execute(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await p.execute(`CREATE TABLE IF NOT EXISTS user_data (user_id INT PRIMARY KEY, sync_data LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);

        // Tabelas de Push (Versão Node.js)
        await p.execute(`CREATE TABLE IF NOT EXISTS push_subscriptions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, endpoint TEXT NOT NULL, p256dh VARCHAR(255) NOT NULL, auth VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, endpoint(191)), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
        await p.execute(`CREATE TABLE IF NOT EXISTS scheduled_notifications (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, activity_index INT NOT NULL, title VARCHAR(255) NOT NULL, body TEXT NOT NULL, scheduled_time DATETIME NOT NULL, sent TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, activity_index, scheduled_time), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);

        return p;
    } catch (err) {
        console.error("[DB ERRO FATAL]:", err.message);
        return null;
    }
};

// --- AUTH & AI (Mantidos) ---
let aiModel = null;
const aiSetup = () => {
    try {
        const aiKey = process.env.JW_API_GEMINI || process.env.GEMINI_API_KEY;
        if (aiKey) {
            const genAI = new GoogleGenerativeAI(aiKey);
            aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        }
    } catch (e) { console.error("[AI ERRO]", e); }
};

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// --- API ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!pool) return res.status(503).json({ error: 'DB indisponível' });
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', [normalizedEmail, hashedPassword]);
        res.status(201).json({ message: 'OK', userId: result.insertId });
    } catch (err) { res.status(400).json({ error: 'E-mail já existe' }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!pool) return res.status(503).json({ error: 'DB indisponível' });
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
        if (users.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });
        const valid = await bcrypt.compare(password, users[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
        const token = jwt.sign({ id: users[0].id, email: users[0].email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: users[0].id } });
    } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

app.post("/api/chat", async (req, res) => {
    if (!aiModel) return res.status(503).json({ error: "IA off" });
    try {
        const result = await aiModel.generateContent(req.body.prompt || req.body);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (err) { res.status(500).json({ error: "Erro AI" }); }
});

// --- PUSH ENDPOINTS (v1.8.1) ---

app.post('/api/push_sub.php', authenticate, async (req, res) => {
    const { endpoint, keys } = req.body;
    try {
        await pool.execute(
            "INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth)",
            [req.user.id, endpoint, keys.p256dh, keys.auth]
        );
        res.json({ status: 'success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/push_schedule.php', authenticate, async (req, res) => {
    const { index, title, body, scheduled_time } = req.body;
    try {
        if (index !== undefined) {
            await pool.execute("DELETE FROM scheduled_notifications WHERE user_id = ? AND activity_index = ? AND sent = 0", [req.user.id, index]);
        }
        await pool.execute(
            "INSERT INTO scheduled_notifications (user_id, activity_index, title, body, scheduled_time) VALUES (?, ?, ?, ?, ?)",
            [req.user.id, index ?? -1, title, body || '', scheduled_time]
        );
        res.json({ status: 'success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/push_fetch.php', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT id, title, body FROM scheduled_notifications WHERE user_id = ? AND sent = 1 ORDER BY scheduled_time DESC LIMIT 1",
            [req.user.id]
        );
        if (rows.length > 0) res.json({ status: 'success', title: rows[0].title, body: rows[0].body });
        else res.json({ status: 'error' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/push_test_v2.php', async (req, res) => {
    if (req.query.debug_key !== 'jw_debug_123') return res.status(401).send("No");
    try {
        const [subs] = await pool.execute("SELECT * FROM push_subscriptions ORDER BY created_at DESC LIMIT 1");
        if (subs.length === 0) return res.send("No subs");
        const sub = { endpoint: subs[0].endpoint, keys: { p256dh: subs[0].p256dh, auth: subs[0].auth } };
        await webPush.sendNotification(sub, JSON.stringify({ title: "Node.js Push", body: "Funciona!" }));
        res.json({ status: "Sent", endpoint: sub.endpoint });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Função de Log para Depuração na Hostinger (v2.0.2)
const ntfyLog = (msg) => {
    try {
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] ${msg}\n`;
        fs.appendFileSync(path.join(__dirname, 'push_log.txt'), logMsg);
    } catch (e) {
        console.error("Erro ao gravar log:", e.message);
    }
};

// Função Robust v2.0.2 para disparar NTFY sem depender de fetch
const sendNtfyNative = (channel, title, body) => {
    return new Promise((resolve, reject) => {
        const data = body;
        const options = {
            hostname: 'ntfy.sh',
            port: 443,
            path: `/${channel}`,
            method: 'POST',
            headers: {
                'Title': Buffer.from(title).toString('base64'),
                'X-Title': 'base64',
                'Priority': 'high',
                'Tags': 'bell',
                'Content-Type': 'text/plain',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode === 200) resolve();
            else reject(new Error(`Status: ${res.statusCode}`));
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
};

// --- PUSH WORKER ---
const pushWorker = async () => {
    if (!pool) return;
    try {
        const [toSend] = await pool.execute(
            "SELECT n.*, s.endpoint, s.p256dh, s.auth FROM scheduled_notifications n LEFT JOIN push_subscriptions s ON n.user_id = s.user_id WHERE n.sent = 0 AND n.scheduled_time <= UTC_TIMESTAMP() LIMIT 20"
        );

        if (toSend.length > 0) {
            ntfyLog(`Processando ${toSend.length} notificações...`);
        }

        for (const item of toSend) {
            const ntfyChannel = `jw_assistant_${item.user_id}`;
            try {
                await sendNtfyNative(ntfyChannel, item.title, item.body);
                ntfyLog(`Sucesso: ${ntfyChannel} (${item.title})`);
            } catch (ntfyErr) {
                ntfyLog(`FALHA: ${ntfyChannel} - ${ntfyErr.message}`);
                console.error("[NTFY] Falha v2.0.2:", ntfyErr.message);
            }

            if (item.endpoint) {
                const sub = { endpoint: item.endpoint, keys: { p256dh: item.p256dh, auth: item.auth } };
                webPush.sendNotification(sub, "").catch(() => { });
            }

            await pool.execute("UPDATE scheduled_notifications SET sent = 1 WHERE id = ?", [item.id]);
        }
    } catch (e) {
        ntfyLog(`ERRO WORKER: ${e.message}`);
        console.error("[WORKER ERRO]", e.message);
    }
};
setInterval(pushWorker, 60000);

// --- PING ---
app.get('/api/ping', (req, res) => {
    res.json({
        status: 'alive',
        version: 'v2.0.1',
        node: process.version,
        fetch_exists: typeof fetch !== 'undefined',
        time_utc: new Date().toISOString()
    });
});

// --- TESTE NTFY DIRETO ---
app.get('/api/ntfy_test.php', async (req, res) => {
    const userId = req.query.user_id || '999';
    const channel = `jw_assistant_${userId}`;
    try {
        await sendNtfyNative(channel, 'JW Assistente ✅', 'Teste v2.0.2 Manual via Node.js');
        res.json({ status: "Enviado v2.0.2", channel: channel });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- STATIC & SPA ---
app.use(express.static(distPath));
app.get("*", (req, res) => {
    if (req.url.includes('.')) return res.status(404).end();
    res.sendFile(path.join(distPath, "index.html"));
});

// START
const start = async () => {
    pool = await initConnection();
    aiSetup();
    app.listen(PORT, () => console.log(`[SERVER] v2.0.2 (NTFY Resiliente) na porta ${PORT}`));
};
start();
