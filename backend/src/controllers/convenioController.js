const prisma = require('../lib/prisma');

async function list(req, res) {
  try {
    const { search, active } = req.query;
    const where = { userId: req.user.id };
    if (active !== undefined) where.active = active === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const convenios = await prisma.convenio.findMany({
      where, orderBy: { name: 'asc' },
    });
    res.json(convenios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar convênios' });
  }
}

async function get(req, res) {
  try {
    const convenio = await prisma.convenio.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!convenio) return res.status(404).json({ error: 'Convênio não encontrado' });
    res.json(convenio);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar convênio' });
  }
}

async function create(req, res) {
  try {
    const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...safeBody } = req.body;
    const data = { ...safeBody, userId: req.user.id };
    const convenio = await prisma.convenio.create({ data });
    res.status(201).json(convenio);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar convênio' });
  }
}

async function update(req, res) {
  try {
    const existing = await prisma.convenio.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Convênio não encontrado' });
    const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...safeBody } = req.body;
    const convenio = await prisma.convenio.update({
      where: { id: req.params.id },
      data: safeBody,
    });
    res.json(convenio);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar convênio' });
  }
}

async function remove(req, res) {
  try {
    const existing = await prisma.convenio.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Convênio não encontrado' });
    await prisma.convenio.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover convênio' });
  }
}

module.exports = { list, get, create, update, remove };
