const mysql = require('mysql2');
const dotenv = require('dotenv');

const result = dotenv.config();

if (result.error) console.error('[log] env error found');
else console.error('[log] env loaded...');

const database = mysql.createConnection({
     host: process.env.DB_HOST || 'localhost',
     user: process.env.DB_USER || 'root',
     password: process.env.DB_PASSWORD || '48Pfug13#',
     database: process.env.DB_NAME || 'chat_app',
     charset: 'utf8mb4'
})

database.connect((err) => {
     if (err) console.error("[log] Error connection to the database", err);
     console.log("[log] Connected to Mysql database");
});


module.exports = database;