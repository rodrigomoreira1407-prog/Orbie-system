const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.upsertAnamnesis = async (req, res) => {
  const { patientId, type, data } = req.body;
  const userId = req.userId;

  try {
    // Check if patient belongs to user
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    // Upsert anamnesis (update if exists, create if not)
    const anamnesis = await prisma.anamnesis.upsert({
      where: { patientId },
      update: { type, data, updatedAt: new Date() },
      create: { patientId, type, data, userId }
    });

    res.status(200).json(anamnesis);
  } catch (error) {
    console.error('❌ Upsert anamnesis error:', error);
    res.status(500).json({ error: 'Erro ao salvar anamnese' });
  }
};

exports.getAnamnesis = async (req, res) => {
  const { patientId } = req.params;
  const userId = req.userId;

  try {
    const anamnesis = await prisma.anamnesis.findFirst({
      where: { patientId, userId }
    });

    if (!anamnesis) {
      return res.status(404).json({ error: 'Anamnese não encontrada' });
    }

    res.status(200).json(anamnesis);
  } catch (error) {
    console.error('❌ Get anamnesis error:', error);
    res.status(500).json({ error: 'Erro ao carregar anamnese' });
  }
};
