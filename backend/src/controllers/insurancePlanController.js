const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list(req, res) {
  try {
    const plans = await prisma.insurancePlan.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' },
    });
    res.json(plans);
  } catch (err) {
    console.error('Erro ao listar planos de convênio:', err);
    res.status(500).json({ error: 'Erro ao listar planos de convênio' });
  }
}

async function create(req, res) {
  try {
    const { name, repasse, notes } = req.body;
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Nome é obrigatório' });
    const repasseValue = repasse !== undefined && repasse !== null && repasse !== '' ? parseFloat(repasse) : 0;
    const plan = await prisma.insurancePlan.create({
      data: {
        userId: req.user.id,
        name: String(name).trim(),
        repasse: isNaN(repasseValue) ? 0 : repasseValue,
        notes: notes || null,
      },
    });
    res.status(201).json(plan);
  } catch (err) {
    console.error('Erro ao criar plano de convênio:', err);
    res.status(500).json({ error: 'Erro ao criar plano de convênio' });
  }
}

async function update(req, res) {
  try {
    const exists = await prisma.insurancePlan.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!exists) return res.status(404).json({ error: 'Plano não encontrado' });
    const { name, repasse, notes } = req.body;
    const plan = await prisma.insurancePlan.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(repasse !== undefined && { repasse: parseFloat(repasse) || 0 }),
        ...(notes !== undefined && { notes }),
      },
    });
    res.json(plan);
  } catch (err) {
    console.error('Erro ao atualizar plano de convênio:', err);
    res.status(500).json({ error: 'Erro ao atualizar plano de convênio' });
  }
}

async function remove(req, res) {
  try {
    const exists = await prisma.insurancePlan.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!exists) return res.status(404).json({ error: 'Plano não encontrado' });
    await prisma.insurancePlan.delete({ where: { id: req.params.id } });
    res.json({ message: 'Plano removido' });
  } catch (err) {
    console.error('Erro ao remover plano de convênio:', err);
    res.status(500).json({ error: 'Erro ao remover plano de convênio' });
  }
}

module.exports = { list, create, update, remove };
