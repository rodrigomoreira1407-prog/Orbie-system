const prisma = require('../lib/prisma');

async function list(req, res) {
  try {
    const { patientId } = req.query;
    const where = { userId: req.user.id };
    if (patientId) where.patientId = patientId;
    const records = await prisma.record.findMany({
      where, orderBy: { sessionDate: 'desc' },
      include: { patient: { select: { id: true, name: true } } },
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar prontuarios' });
  }
}

async function create(req, res) {
  try {
    const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, ...safeBody } = req.body;
    const record = await prisma.record.create({
      data: { ...safeBody, userId: req.user.id },
      include: { patient: { select: { id: true, name: true } } },
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar prontuario' });
  }
}

async function update(req, res) {
  try {
    const exists = await prisma.record.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!exists) return res.status(404).json({ error: 'Registro nao encontrado' });
    const { id: _id, userId: _uid, patientId: _pid, createdAt: _ca, updatedAt: _ua, ...safeData } = req.body;
    const record = await prisma.record.update({ where: { id: req.params.id }, data: safeData });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar prontuario' });
  }
}

async function remove(req, res) {
  try {
    const exists = await prisma.record.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!exists) return res.status(404).json({ error: 'Registro nao encontrado' });
    await prisma.record.delete({ where: { id: req.params.id } });
    res.json({ message: 'Prontuario removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover prontuario' });
  }
}

module.exports = { list, create, update, remove };