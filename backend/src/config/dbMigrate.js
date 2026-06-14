const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Aplica todas las migraciones SQL del directorio ../../../database/
 * en orden alfabetico (migration_v1, v2, v3...).
 *
 * Las migraciones usan ALTER TABLE ... ADD COLUMN IF NOT EXISTS, por lo
 * que son idempotentes: ejecutar este script multiples veces es seguro.
 */
async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const dir = path.join(__dirname, '..', '..', '..', 'database');
    const files = fs.readdirSync(dir)
      .filter((f) => /^migration_.*\.sql$/i.test(f))
      .sort();

    if (files.length === 0) {
      console.log('ℹ️  No se encontraron migraciones en', dir);
      return;
    }

    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      try {
        await pool.query(sql);
        console.log(`✅ ${file}`);
      } catch (err) {
        console.error(`❌ ${file}:`, err.message);
        throw err;
      }
    }

    console.log('\n✅ Todas las migraciones aplicadas correctamente.');
  } catch (err) {
    console.error('\n❌ Error aplicando migraciones:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
