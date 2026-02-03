import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        const p = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [rows] = await p.execute('SELECT id, email FROM users');
        console.log('--- ALL USERS ---');
        console.log(JSON.stringify(rows));
        console.log('-----------------');
        process.exit(0);
    } catch (err) {
        console.error('ERRO:', err.message);
        process.exit(1);
    }
}
check();
