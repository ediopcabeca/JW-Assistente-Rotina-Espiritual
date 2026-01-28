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

// Função para inicializar o banco de dados
const initDB = async () => {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                google_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Banco de dados inicializado com sucesso.");
    } catch (error) {
        console.error("Erro ao inicializar banco de dados:", error);
    }
};

initDB();

export { pool };
