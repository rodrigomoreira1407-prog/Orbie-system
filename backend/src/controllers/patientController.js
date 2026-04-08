const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list(req, res) {
  try {
    const { search, type, status } = req.query;
    const where = { userId: req.user.id };
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const patients = await prisma.patient.findMany({
      where, orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, type: true, status: true, phone: true,
        email: true, cpf: true, birthDate: true, emergName: true, emergPhone: true,
        resp1Name: true, resp1Phone: true, resp1Relation: true,
        createdAt: true,
        _count: { select: { appointments: true, records: true } },
      },
    });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar pacientes' });
  }
}

async function get(req, res) {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        _count: { select: { appointments: true, records: true } },
      },
    });
    if (!patient) return res.status(404).json({ error: 'Paciente nao encontrado' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar paciente' });
  }
}

async function create(req, res) {
  try {
    const patient = await prisma.patient.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json(patient);
  } catch (err) {
    console.error('❌ Erro ao criar paciente:', err);
    res.status(500).json({ error: 'Erro ao criar paciente: ' + err.message });
  }
}

async function update(req, res) {
  try {
    const exists = await prisma.patient.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!exists) return res.status(404).json({ error: 'Paciente nao encontrado' });
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar paciente' });
  }
}

async function remove(req, res) {
  try {
    const exists = await prisma.patient.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!exists) return res.status(404).json({ error: 'Paciente nao encontrado' });
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.json({ message: 'Paciente removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover paciente' });
  }
}

module.exports = { list, get, create, update, remove };