import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from "@google/generative-ai";
import https from 'https';
import fs from 'fs';

// Configurações Iniciais
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "dist");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-padrao-troque-por-seguranca';

// 1. Middlewares
app.use(express.json());
app.use(cors());

// 2. Database Connection
let pool = null;
const initConnection = async () => {
    try {
        // Fallbacks para Hostinger se o .env falhar
        const config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'u875922357_admin',
            password: process.env.DB_PASSWORD || process.env.DB_PASS || 'Mp07gp24',
            database: process.env.DB_NAME || 'u875922357_jwapp',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        };
        const p = mysql.createPool(config);
        await p.execute('SELECT 1'); // Test connection
        console.log("[DB] OK: Conexão com MySQL estabelecida.");

        // Tabelas Core
        await p.execute(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await p.execute(`CREATE TABLE IF NOT EXISTS user_data (user_id INT PRIMARY KEY, sync_data LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);

        // Tabelas de Push (Versão NTFY-Only v2.1.0)
        await p.execute(`CREATE TABLE IF NOT EXISTS scheduled_notifications (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, activity_index INT NOT NULL, title VARCHAR(255) NOT NULL, body TEXT NOT NULL, scheduled_time DATETIME NOT NULL, sent TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, activity_index, scheduled_time), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);

        // Tabela de Logs (v2.0.4)
        await p.execute(`CREATE TABLE IF NOT EXISTS system_logs (id INT AUTO_INCREMENT PRIMARY KEY, level VARCHAR(20), message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`);

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

// --- PUSH ENDPOINTS (NTFY-Only v2.1.0) ---

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


// --- CAIXA PRETA v2.1.2 (Para ler erros se o Node não ligar) ---
const logFile = path.join(__dirname, 'node_boot.log');
const bootLog = (m) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${m}\n`);
process.on('uncaughtException', (e) => bootLog(`FATAL EXCEPTION: ${e.message}\n${e.stack}`));
process.on('unhandledRejection', (e) => bootLog(`FATAL REJECTION: ${e.message}`));

// Função de Log para Depuração no Banco de Dados (v2.0.4)
const ntfyLog = async (msg, level = 'info') => {
    try {
        bootLog(`[DBLOG] ${msg}`);
        if (pool) await pool.execute("INSERT INTO system_logs (level, message) VALUES (?, ?)", [level, msg]);
        console.log(`[LOG] ${msg}`);
    } catch (e) {
        console.error("Erro ao gravar log no DB:", e.message);
    }
};

// Função para tornar o tópico NTFY seguro (sem @ ou .)
const ntfySafe = (topic) => topic.replace(/[^a-zA-Z0-9]/g, '_');

// Função Robust v2.0.2 para disparar NTFY sem depender de fetch
const sendNtfyNative = (channel, title, body) => {
    return new Promise((resolve, reject) => {
        const safeChannel = ntfySafe(channel);
        const data = String(body);
        const options = {
            hostname: 'ntfy.sh',
            port: 443,
            path: `/${safeChannel}`,
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
            else reject(new Error(`HTTP ${res.statusCode}`));
        });

        req.on('error', (e) => reject(e));
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout 5s')); });
        req.write(data);
        req.end();
    });
};

// --- PUSH WORKER (NTFY-Only v2.1.1) ---
const pushWorker = async () => {
    if (!pool) return;
    try {
        const [toSend] = await pool.execute(
            "SELECT n.*, u.email FROM scheduled_notifications n JOIN users u ON n.user_id = u.id WHERE n.sent = 0 AND n.scheduled_time <= UTC_TIMESTAMP() LIMIT 20"
        );

        if (toSend.length > 0) {
            ntfyLog(`[WORKER] Processando ${toSend.length} notificações...`);
        }

        for (const item of toSend) {
            const ntfyChannel = `jw_assistant_${item.email}`;
            try {
                await sendNtfyNative(ntfyChannel, item.title, item.body);
                ntfyLog(`Sucesso NTFY: ${ntfyChannel} (${item.title})`);
            } catch (ntfyErr) {
                ntfyLog(`FALHA NTFY: ${ntfyChannel} - ${ntfyErr.message}`, 'error');
            }

            await pool.execute("UPDATE scheduled_notifications SET sent = 1 WHERE id = ?", [item.id]);
        }
    } catch (e) {
        ntfyLog(`ERRO WORKER: ${e.message}`, 'error');
    }
};
setInterval(pushWorker, 60000);

// --- PING ---
app.get('/api/ping', (req, res) => {
    res.json({
        status: 'alive',
        version: 'v2.1.2',
        engine: 'NTFY-Only',
        node: process.version,
        time_utc: new Date().toISOString()
    });
});

// --- TESTE NTFY DIRETO ---
app.get('/api/ntfy_test.php', async (req, res) => {
    const userId = req.query.user_id || '999';
    const channel = `jw_assistant_${userId}`;
    try {
        await sendNtfyNative(channel, 'JW Assistente ✅', 'Teste v2.0.4 Manual via Node.js');
        await ntfyLog(`Teste manual v2.0.4 disparado para ${channel}`);
        res.json({ status: "Enviado v2.0.4", channel: channel });
    } catch (err) {
        await ntfyLog(`FALHA Teste Manual: ${err.message}`, 'error');
        res.status(500).json({ error: err.message });
    }
});

// --- ROTAS DE ESCAPE v2.1.2 (Fugindo do conflito de diretório 'api' na Hostinger) ---
app.get('/notif/test', async (req, res) => {
    const userId = req.query.user_id || '999';
    // O canal aqui já vem sanitizado pelo sendNtfyNative
    try {
        await sendNtfyNative(`jw_assistant_${userId}`, 'JW Assistente ✅', 'Teste v2.1.2 via Node.js (Escape Route)');
        res.json({ status: "success", channel: ntfySafe(`jw_assistant_${userId}`) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/notif/schedule', async (req, res) => {
    const { user_id, index, title, body, scheduled_time } = req.body;
    if (!user_id || index === undefined || !title || !body || !scheduled_time) {
        return res.status(400).json({ error: "Faltam campos" });
    }
    try {
        await pool.execute(
            "INSERT INTO scheduled_notifications (user_id, activity_index, title, body, scheduled_time) VALUES ((SELECT id FROM users WHERE email = ?), ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body), scheduled_time=VALUES(scheduled_time), sent=0",
            [user_id, index, title, body, scheduled_time]
        );
        res.json({ status: "success" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GATILHO MANUAL DO WORKER v2.0.3
app.get('/api/trigger_worker', async (req, res) => {
    try {
        await pushWorker();
        res.json({ status: 'Worker triggered', time: new Date().toISOString() });
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
    bootLog("Tentando iniciar servidor v2.1.2...");
    try {
        pool = await initConnection();
        bootLog("Conexão DB OK");
        aiSetup();
        bootLog("IA Setup OK");
        await ntfyLog(`[BOOT] Servidor v2.1.2 (NTFY-Safe) iniciado na porta ${PORT}`);
        app.listen(PORT, () => {
            console.log(`[SERVER] v2.1.2 na porta ${PORT}`);
            bootLog(`ESCUTANDO NA PORTA ${PORT}`);
        });
    } catch (e) {
        bootLog(`ERRO NO START: ${e.message}`);
    }
};
start();
