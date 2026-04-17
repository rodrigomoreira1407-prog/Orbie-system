const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token nao fornecido' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'Usuario nao encontrado' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido ou expirado' });
  }
};

const requirePlan = (plans) => async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || !plans.includes(user.plan)) {
      return res.status(403).json({ error: 'Plano insuficiente', upgrade: true });
    }
    if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
      return res.status(403).json({ error: 'Assinatura expirada', expired: true });
    }
    next();
  } catch (err) {
    console.error('requirePlan error:', err);
    return res.status(500).json({ error: 'Erro interno ao verificar plano', detail: err?.message || String(err) });
  }
};

module.exports = { auth, requirePlan };