import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

export const initDB = async () => {
    try {
        console.log("[DB] Inicializando tabelas...");

        // Tabela de usuários
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de dados do usuário (JSON blob para sincronização simples)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS user_data (
                user_id INT PRIMARY KEY,
                sync_data LONGTEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log("[DB] Tabelas verificadas/criadas com sucesso.");
    } catch (error) {
        console.error("[DB] Erro ao inicializar banco de dados:", error.message);
        // Não jogamos o erro para não travar o boot do servidor na Hostinger
    }
};
