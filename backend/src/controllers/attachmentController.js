const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createAttachment = async (req, res) => {
  const { patientId, name, url, type } = req.body;
  const userId = req.userId;

  try {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const attachment = await prisma.attachment.create({
      data: {
        patientId,
        userId,
        name,
        url,
        type
      }
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error('❌ Create attachment error:', error);
    res.status(500).json({ error: 'Erro ao salvar anexo' });
  }
};

exports.getAttachments = async (req, res) => {
  const { patientId } = req.params;
  const userId = req.userId;

  try {
    const attachments = await prisma.attachment.findMany({
      where: { patientId, userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(attachments);
  } catch (error) {
    console.error('❌ Get attachments error:', error);
    res.status(500).json({ error: 'Erro ao carregar anexos' });
  }
};

exports.deleteAttachment = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const attachment = await prisma.attachment.findFirst({
      where: { id, userId }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    await prisma.attachment.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('❌ Delete attachment error:', error);
    res.status(500).json({ error: 'Erro ao excluir anexo' });
  }
};
