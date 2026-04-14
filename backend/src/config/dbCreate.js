const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const run = async () => {
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres',
  });

  try {
    const dbName = process.env.DB_NAME || 'cosecha_app';
    const check = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
    );

    if (check.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Base de datos "${dbName}" creada`);
    } else {
      console.log(`ℹ️  Base de datos "${dbName}" ya existe`);
    }

    await adminPool.end();

    const appPool = new Pool({ connectionString: process.env.DATABASE_URL });
    const schemaPath = path.join(__dirname, '..', '..', '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await appPool.query(schema);
    console.log('✅ Esquema aplicado correctamente');

    const seedPath = path.join(__dirname, '..', '..', '..', 'database', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf8');
      try {
        await appPool.query(seed);
        console.log('✅ Datos de prueba insertados');
      } catch (e) {
        console.log('ℹ️  Datos de prueba ya existentes o error:', e.message);
      }
    }

    await appPool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
