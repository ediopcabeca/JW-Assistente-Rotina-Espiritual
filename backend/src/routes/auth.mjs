import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../config/db.mjs';

const router = express.Router();
console.log("[INÍCIO] Carregando Rotas de Autenticação...");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
if (process.env.GOOGLE_CLIENT_ID) {
    console.log("[INFO] Google Client ID carregado.");
} else {
    console.error("[ERRO] Google Client ID ausente!");
}

// Middleware para validar senha: 6-8 caracteres, alfanumérico
const validatePassword = (password) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,8}$/;
    return regex.test(password);
};

// Registro de Usuário
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ error: 'A senha deve ter de 6 a 8 caracteres e conter letras e números.' });
    }

    try {
        const normalizedEmail = email.toLowerCase();
        const hashedPassword = await bcrypt.hash(password.toLowerCase(), 10);

        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Usuário já cadastrado.' });
        }

        await pool.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [normalizedEmail, hashedPassword]
        );

        res.status(201).json({ message: 'Usuário criado com sucesso.' });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno ao criar usuário.' });
    }
});

// Login Tradicional
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const normalizedEmail = email.toLowerCase();
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const user = users[0];

        // Se o usuário só tiver login pelo Google
        if (!user.password_hash) {
            return res.status(401).json({ error: 'Este usuário utiliza login pelo Google.' });
        }

        const valid = await bcrypt.compare(password.toLowerCase(), user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
});

// Login com Google
router.post('/google', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, sub: googleId } = ticket.getPayload();
        const normalizedEmail = email.toLowerCase();

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ? OR google_id = ?', [normalizedEmail, googleId]);

        let user;
        if (users.length === 0) {
            // Criar novo usuário via Google
            const [result] = await pool.execute(
                'INSERT INTO users (email, google_id) VALUES (?, ?)',
                [normalizedEmail, googleId]
            );
            user = { id: result.insertId, email: normalizedEmail };
        } else {
            user = users[0];
            // Atualizar google_id se necessário (caso o usuário tenha criado conta com email antes)
            if (!user.google_id) {
                await pool.execute('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
            }
        }

        const sessionToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: sessionToken, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('Erro Google Auth:', error);
        res.status(500).json({ error: 'Erro ao autenticar com Google.' });
    }
});

export default router;
