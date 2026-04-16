const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createAttachment = async (req, res) => {
  try {
    const { anamnesisId, fileName, fileUrl, fileType, fileSize } = req.body;

    // Verify anamnesis belongs to user
    const anamnesis = await prisma.anamnesis.findFirst({
      where: {
        id: anamnesisId,
        userId: req.user.id
      }
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
    console.error('Create Attachment Error:', error);
    res.status(500).json({ error: 'Erro ao salvar anexo' });
  }
};

exports.getAttachments = async (req, res) => {
  try {
    const { anamnesisId } = req.params;

    // Verify anamnesis belongs to user
    const anamnesis = await prisma.anamnesis.findFirst({
      where: {
        id: anamnesisId,
        userId: req.user.id
      }
    });

    if (!anamnesis) {
      return res.status(404).json({ error: 'Anamnese não encontrada' });
    }

    const attachments = await prisma.attachment.findMany({
      where: { anamnesisId },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(attachments);
  } catch (error) {
    console.error('Get Attachments Error:', error);
    res.status(500).json({ error: 'Erro ao buscar anexos' });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify attachment and ownership
    const attachment = await prisma.attachment.findFirst({
      where: {
        id,
        anamnesis: {
          userId: req.user.id
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    await prisma.attachment.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete Attachment Error:', error);
    res.status(500).json({ error: 'Erro ao excluir anexo' });
  }
};
