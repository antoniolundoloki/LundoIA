require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function seed() {
  // Usa uma ligação própria com multipleStatements — o pool partilhado
  // (config/db.js) não tem essa opção ativada de propósito (evita permitir
  // várias instruções SQL em pedidos normais da aplicação).
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await connection.query(seedSql);
    console.log('✓ Seed concluído — catálogo de módulos criado (ou já existia).');
  } finally {
    await connection.end();
  }
}

seed().catch((err) => {
  console.error('✗ Falha no seed:', err.message);
  process.exit(1);
});
