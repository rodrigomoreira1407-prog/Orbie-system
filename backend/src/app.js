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
const convenioRoutes = require('./routes/convenios');

const app = express();

// ── Segurança
app.use(helmet());
app.use(compression());

// ── CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
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
app.use('/api/convenios', convenioRoutes);

// ── Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', service: 'Orbie API' });
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
