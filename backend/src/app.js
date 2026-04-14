const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ── Seguridad ──
app.use(helmet());

// ── CORS ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Parseo ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Compresión ──
app.use(compression());

// ── Logging ──
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Rutas API ──
app.use('/api', routes);

// ── Ruta raíz ──
app.get('/', (req, res) => {
  res.json({
    app: 'Cosecha App API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Error handler ──
app.use(errorHandler);

module.exports = app;
