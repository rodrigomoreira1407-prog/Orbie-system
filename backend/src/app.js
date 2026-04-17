const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const recordRoutes = require('./routes/records');
const financialRoutes = require('./routes/financial');
const subscriptionRoutes = require('./routes/subscriptions');
const aiRoutes = require('./routes/ai');
const clinicalRoutes = require('./routes/clinical');

const prisma = require('./lib/prisma');

const app = express();

// ── Trust proxy (Railway / reverse proxy)
app.set('trust proxy', 1);

// ── Segurança
app.use(helmet());
app.use(compression());

// ── CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, same-origin)
    if (!origin) return callback(null, true);

    const allowed = process.env.FRONTEND_URL;
    // If no FRONTEND_URL configured, allow all origins
    if (!allowed || allowed === '*') return callback(null, true);

    // Support comma-separated list of allowed origins
    const allowedList = allowed.split(',').map(s => s.trim());
    if (allowedList.includes(origin)) return callback(null, true);

    callback(null, false);
  },
  credentials: true,
}));

// ── Stripe webhook precisa do body raw
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

// ── Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting geral
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
}));

// ── Rate limiting para auth
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas tentativas de autenticação.' }
}));

// ── Rotas
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/clinical', clinicalRoutes);

// ── Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', version: '1.0.0', service: 'Orbie API', db: 'connected' });
  } catch (err) {
    console.error('Health check DB error:', err);
    res.status(503).json({ status: 'error', service: 'Orbie API', db: 'disconnected', error: err.message });
  }
});

// ── 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ── Error handler
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

module.exports = app;
