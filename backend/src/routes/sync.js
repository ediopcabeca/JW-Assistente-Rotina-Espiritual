import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const router = express.Router();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido.' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-shhhh', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
        req.user = user;
        next();
    });
};

// Obter dados do usuário
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT sync_data FROM user_data WHERE user_id = ?', [req.user.id]);

        if (rows.length === 0) {
            return res.json({ sync_data: null });
        }

        res.json({ sync_data: JSON.parse(rows[0].sync_data) });
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ error: 'Erro ao buscar dados de sincronização.' });
    }
});

// Salvar dados do usuário
router.post('/', authenticateToken, async (req, res) => {
    const { sync_data } = req.body;

    if (!sync_data) {
        return res.status(400).json({ error: 'Dados ausentes.' });
    }

    try {
        const dataString = JSON.stringify(sync_data);

        // UPSERT (INSERT ... ON DUPLICATE KEY UPDATE)
        await pool.execute(
            'INSERT INTO user_data (user_id, sync_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE sync_data = ?',
            [req.user.id, dataString, dataString]
        );

        res.json({ message: 'Sincronizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        res.status(500).json({ error: 'Erro ao salvar dados de sincronização.' });
    }
});

export default router;
