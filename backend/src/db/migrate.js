require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    const dbName = process.env.DB_NAME;
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(schemaSql);

    console.log('✓ Migração concluída — todas as tabelas foram criadas (ou já existiam).');
  } finally {
    await connection.end();
  }
}

migrate().catch((err) => {
  console.error('✗ Falha na migração:', err.message);
  process.exit(1);
});
