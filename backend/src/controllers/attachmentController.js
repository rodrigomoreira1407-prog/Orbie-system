const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createAttachment = async (req, res) => {
  const { anamnesisId, fileName, fileUrl, fileType, fileSize } = req.body;
  const userId = req.user.id;

  try {
    // Check if anamnesis exists and belongs to user
    const anamnesis = await prisma.anamnesis.findFirst({
      where: { id: anamnesisId, userId }
    });

    if (!anamnesis) {
      return res.status(404).json({ error: 'Anamnese não encontrada' });
    }

    const attachment = await prisma.attachment.create({
      data: {
        anamnesisId,
        fileName,
        fileUrl,
        fileType,
        fileSize
      }
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error('❌ Create attachment error:', error);
    res.status(500).json({ error: 'Erro ao salvar anexo' });
  }
};

exports.getAttachments = async (req, res) => {
  const { anamnesisId } = req.params;
  const userId = req.user.id;

  try {
    // Check if anamnesis belongs to user
    const anamnesis = await prisma.anamnesis.findFirst({
      where: { id: anamnesisId, userId }
    });

    if (!anamnesis) {
      return res.status(404).json({ error: 'Anamnese não encontrada' });
    }

    const attachments = await prisma.attachment.findMany({
      where: { anamnesisId },
      orderBy: { uploadedAt: 'desc' }
    });

    res.status(200).json(attachments);
  } catch (error) {
    console.error('❌ Get attachments error:', error);
    res.status(500).json({ error: 'Erro ao carregar anexos' });
  }
};

exports.deleteAttachment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check if attachment exists and its anamnesis belongs to user
    const attachment = await prisma.attachment.findFirst({
      where: { 
        id,
        anamnesis: { userId }
      }
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
