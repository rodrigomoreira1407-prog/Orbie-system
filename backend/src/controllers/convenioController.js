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
    const { name, cnpj, phone, email, contactName, address, notes, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const data = { name, cnpj, phone, email, contactName, address, notes, userId: req.user.id };
    if (active !== undefined) data.active = active;
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
    const { name, cnpj, phone, email, contactName, address, notes, active } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (cnpj !== undefined) data.cnpj = cnpj;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (contactName !== undefined) data.contactName = contactName;
    if (address !== undefined) data.address = address;
    if (notes !== undefined) data.notes = notes;
    if (active !== undefined) data.active = active;
    const convenio = await prisma.convenio.update({
      where: { id: req.params.id },
      data,
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
