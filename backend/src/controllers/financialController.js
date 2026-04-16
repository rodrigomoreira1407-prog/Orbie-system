const prisma = require('../lib/prisma');

async function list(req, res) {
  try {
    const { type, status, month, year } = req.query;
    const where = { userId: req.user.id };
    if (type) where.type = type;
    if (status) where.status = status;
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month)-1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }
    const items = await prisma.financial.findMany({
      where, orderBy: { date: 'desc' },
      include: { patient: { select: { id: true, name: true } } },
    });
    const income = items.filter(i => i.type === 'INCOME').reduce((s, i) => s + i.value, 0);
    const expense = items.filter(i => i.type === 'EXPENSE').reduce((s, i) => s + i.value, 0);
    const pending = items.filter(i => i.status === 'PENDING' && i.type === 'INCOME').reduce((s, i) => s + i.value, 0);
    res.json({ items, summary: { income, expense, balance: income - expense, pending } });
  } catch (err) {
    console.error('Erro ao listar financeiro:', err);
    res.status(500).json({ error: 'Erro ao listar financeiro', detail: err?.message || String(err) });
  }
}

async function create(req, res) {
  try {
    const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...safeBody } = req.body;
    const data = { ...safeBody, userId: req.user.id };
    if (data.date && typeof data.date === 'string') {
      const d = new Date(data.date);
      if (!isNaN(d.getTime())) data.date = d.toISOString();
      else data.date = new Date().toISOString();
    }
    const item = await prisma.financial.create({ data });
    res.status(201).json(item);
  } catch (err) {
    console.error('❌ Erro ao criar lancamento:', err);
    res.status(500).json({ error: 'Erro ao criar lancamento: ' + err.message });
  }
}

async function update(req, res) {
  try {
    const exists = await prisma.financial.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!exists) return res.status(404).json({ error: 'Lancamento nao encontrado' });
    const { id: _id, userId: _uid, patientId: _pid, createdAt: _ca, updatedAt: _ua, ...safeData } = req.body;
    if (safeData.date && typeof safeData.date === 'string') {
      const d = new Date(safeData.date);
      if (!isNaN(d.getTime())) safeData.date = d.toISOString();
      else safeData.date = new Date().toISOString();
    }
    const item = await prisma.financial.update({ where: { id: req.params.id }, data: safeData });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar lancamento' });
  }
}

async function remove(req, res) {
  try {
    const exists = await prisma.financial.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!exists) return res.status(404).json({ error: 'Lancamento nao encontrado' });
    await prisma.financial.delete({ where: { id: req.params.id } });
    res.json({ message: 'Lancamento removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover lancamento' });
  }
}

module.exports = { list, create, update, remove };