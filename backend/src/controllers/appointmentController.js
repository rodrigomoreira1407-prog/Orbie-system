const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
            phone: true,
            _count: { select: { records: true } } 
          } 
        } 
      },
    });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar consultas' });
  }
}

async function create(req, res) {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (data.type === 'ONLINE' && !data.meetLink) {
      data.meetLink = generateMeetLink();
    }
    const appt = await prisma.appointment.create({ data, include: { patient: { select: { id: true, name: true } } } });
    res.status(201).json(appt);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar consulta' });
  }
}

async function update(req, res) {
  try {
    const exists = await prisma.appointment.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!exists) return res.status(404).json({ error: 'Consulta nao encontrada' });

    const appt = await prisma.appointment.update({ where: { id: req.params.id }, data: req.body });

    const isConvenio = appt.paymentType === 'CONVENIO';
    const finalizingStatus = ['COMPLETED', 'MISSED'];
    const isNewFinalStatus = finalizingStatus.includes(req.body.status) && exists.status !== req.body.status;

    if (isNewFinalStatus && appt.value > 0) {
      try {
        const isMissed = req.body.status === 'MISSED';
        let financialStatus;
        if (isMissed) {
          financialStatus = 'PENDING';
        } else if (isConvenio) {
          financialStatus = 'PENDING'; // awaiting insurance transfer
        } else {
          financialStatus = 'PAID';
        }
        const method = isConvenio ? 'Convênio' : 'Consulta';
        const financialValue = isConvenio && appt.insuranceValue != null ? appt.insuranceValue : appt.value;
        const prefix = isMissed ? 'Falta' : 'Consulta';
        const suffix = isConvenio && appt.insurancePlanId ? '' : '';
        await prisma.financial.create({
          data: {
            userId: req.user.id,
            patientId: appt.patientId,
            type: 'INCOME',
            description: `${prefix} - ${appt.title || 'Sessao'}`,
            value: financialValue,
            date: new Date(),
            status: financialStatus,
            method,
            appointmentId: appt.id,
          }
        });
      } catch (finErr) {
        console.error('Erro ao criar lancamento financeiro:', finErr);
      }
    }

    // When a CONVENIO appointment is marked as RECEIVED, set the linked PENDING financial to PAID
    if (req.body.status === 'RECEIVED' && exists.status !== 'RECEIVED') {
      try {
        const pendingEntry = await prisma.financial.findFirst({
          where: {
            userId: req.user.id,
            appointmentId: appt.id,
            status: 'PENDING',
            method: 'Convênio',
          }
        });
        if (pendingEntry) {
          await prisma.financial.update({
            where: { id: pendingEntry.id },
            data: { status: 'PAID' }
          });
        } else {
          // Create a new entry if none found (edge case)
          const financialValue = appt.insuranceValue != null ? appt.insuranceValue : appt.value;
          await prisma.financial.create({
            data: {
              userId: req.user.id,
              patientId: appt.patientId,
              type: 'INCOME',
              description: `Repasse recebido - ${appt.title || 'Sessao'}`,
              value: financialValue,
              date: new Date(),
              status: 'PAID',
              method: 'Convênio',
              appointmentId: appt.id,
            }
          });
        }
      } catch (finErr) {
        console.error('Erro ao registrar recebimento do convênio:', finErr);
      }
    }

    res.json(appt);
  } catch (err) {
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