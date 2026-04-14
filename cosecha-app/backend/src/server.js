require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

const start = async () => {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('❌ No se pudo conectar a la base de datos. Verifica tu .env');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║     🥔  COSECHA APP - API Server        ║
║     Puerto: ${PORT}                         ║
║     Entorno: ${process.env.NODE_ENV || 'development'}              ║
║     API: http://localhost:${PORT}/api        ║
╚══════════════════════════════════════════╝
    `);
  });
};

start();
