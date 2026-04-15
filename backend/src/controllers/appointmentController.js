const prisma = require('../lib/prisma');

function generateMeetLink() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (n) => Array.from({length: n}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return 'meet.google.com/' + rand(3) + '-' + rand(4) + '-' + rand(3);
}

async function list(req, res) {
  try {
    const { date, startDate, endDate, patientId, status } = req.query;
    const where = { userId: req.user.id };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    
    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0,0,0,0));
      const end = new Date(d.setHours(23,59,59,999));
      where.date = { gte: start, lte: end };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      where.date = { gte: start, lte: end };
    }
    
    const appointments = await prisma.appointment.findMany({
      where, orderBy: { date: 'asc' },
      include: { 
        patient: { 
          select: { 
            id: true, 
            name: true, 
            type: true, 
            phone: true
          } 
        } 
      },
    });
    res.json(appointments);
  } catch (err) {
    console.error('Erro ao listar consultas:', err);
    res.status(500).json({ error: 'Erro ao listar consultas', detail: err?.message || String(err) });
  }
}

async function create(req, res) {
  try {
    const body = req.body || {};
    if (!body.patientId || !body.date) {
      return res.status(400).json({ error: 'patientId e date são obrigatórios' });
    }
    const parsedDate = new Date(body.date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Data inválida' });
    }

    // Verify the patient belongs to the authenticated user
    const patient = await prisma.patient.findFirst({
      where: { id: body.patientId, userId: req.user.id },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const data = {
      patientId: body.patientId,
      date: parsedDate,
      duration: parseInt(body.duration) || 50,
      value: parseFloat(body.value) || 0,
      type: body.type || 'ONLINE',
      title: body.title || 'Consulta',
      notes: body.notes ?? null,
      status: 'SCHEDULED',
      userId: req.user.id,
    };
    if (data.type === 'ONLINE' && !data.meetLink) {
      data.meetLink = generateMeetLink();
    }
    const appt = await prisma.appointment.create({ data, include: { patient: { select: { id: true, name: true } } } });
    res.status(201).json(appt);
  } catch (err) {
    console.error('Erro ao criar consulta:', err);
    res.status(500).json({ error: 'Erro ao criar consulta', detail: err?.message || String(err) });
  }
}

async function update(req, res) {
  try {
    const exists = await prisma.appointment.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!exists) return res.status(404).json({ error: 'Consulta nao encontrada' });
    
    const { id: _id, userId: _uid, patientId: _pid, createdAt: _ca, updatedAt: _ua, ...safeData } = req.body;
    const appt = await prisma.appointment.update({ where: { id: req.params.id }, data: safeData });
    
    const finalizingStatus = ['COMPLETED', 'MISSED'];
    const isNewFinalStatus = finalizingStatus.includes(safeData.status) && exists.status !== safeData.status;
    if (isNewFinalStatus && appt.value > 0) {
      try {
        const isMissed = safeData.status === 'MISSED';
        await prisma.financial.create({
          data: {
            userId: req.user.id,
            patientId: appt.patientId,
            type: 'INCOME',
            description: `${isMissed ? 'Falta' : 'Consulta'} - ${appt.title || 'Sessao'}`,
            value: appt.value,
            date: new Date(),
            status: isMissed ? 'PENDING' : 'PAID',
            method: 'Consulta'
          }
        });
      } catch (finErr) {
        console.error('Erro ao criar lancamento financeiro:', finErr);
      }
    }
    
    res.json(appt);
  } catch (err) {
    console.error('Erro ao atualizar consulta:', err);
    res.status(500).json({ error: 'Erro ao atualizar consulta' });
  }
}

async function remove(req, res) {
  try {
    const exists = await prisma.appointment.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!exists) return res.status(404).json({ error: 'Consulta nao encontrada' });
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Consulta removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover consulta' });
  }
}

module.exports = { list, create, update, remove };