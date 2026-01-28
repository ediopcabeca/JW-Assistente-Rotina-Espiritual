import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Configurações futuras para conexão com MySQL Hostinger
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "3306"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Exporta a função para ser chamada explicitamente
export const initDB = async () => {
    console.log("[DB] Iniciando verificação de tabelas...");
    try {
        const connection = await pool.getConnection();
        console.log("[DB] Conexão com MySQL estabelecida.");

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                google_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("[DB] Tabela 'users' verificada/criada.");
        connection.release();
    } catch (error) {
        console.error("[ERRO DB] Falha ao conectar/inicializar banco de dados:", error.message);
        console.warn("[AVISO] O servidor continuará funcionando, mas o login pode falhar.");
    }
};

export { pool };
