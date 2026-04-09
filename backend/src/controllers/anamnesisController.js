const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.upsertAnamnesis = async (req, res) => {
  const { patientId, type, data, complaint, observations } = req.body;
  const userId = req.user.id;

  try {
    // Check if patient belongs to user
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    // Find existing anamnesis by patientId
    const existing = await prisma.anamnesis.findFirst({
      where: { patientId }
    });

    let anamnesis;
    if (existing) {
      anamnesis = await prisma.anamnesis.update({
        where: { id: existing.id },
        data: { 
          type: type || existing.type, 
          data: data || existing.data,
          complaint: complaint !== undefined ? complaint : existing.complaint,
          observations: observations !== undefined ? observations : existing.observations,
          updatedAt: new Date() 
        }
      });
    } else {
      anamnesis = await prisma.anamnesis.create({
        data: { 
          patientId, 
          userId,
          type: type || 'ADULT', 
          data: data || {},
          complaint: complaint || '',
          observations: observations || ''
        }
      });
    }

    res.status(200).json(anamnesis);
  } catch (error) {
    console.error('❌ Upsert anamnesis error:', error);
    res.status(500).json({ error: 'Erro ao salvar anamnese' });
  }
};

exports.getAnamnesis = async (req, res) => {
  const { patientId } = req.params;
  const userId = req.user.id;

  try {
    const anamnesis = await prisma.anamnesis.findFirst({
      where: { patientId, userId }
    });

    if (!anamnesis) {
      // Return an empty structure instead of 404 to make frontend life easier
      return res.status(200).json({ 
        patientId, 
        type: 'ADULT', 
        data: {}, 
        complaint: '', 
        observations: '' 
      });
    }

    res.status(200).json(anamnesis);
  } catch (error) {
    console.error('❌ Get anamnesis error:', error);
    res.status(500).json({ error: 'Erro ao carregar anamnese' });
  }
};
