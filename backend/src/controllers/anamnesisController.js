const prisma = require('../lib/prisma');

exports.saveAnamnesis = async (req, res) => {
  try {
    const { patientId, type, data, complaint, observations } = req.body;
    
    // Find existing anamnesis
    const existing = await prisma.anamnesis.findFirst({
      where: {
        patientId,
        userId: req.user.id
      }
    });

    let anamnesis;
    if (existing) {
      // Update existing
      const updateData = {};
      if (type) updateData.type = type;
      if (data) updateData.data = data;
      if (complaint !== undefined) updateData.complaint = complaint;
      if (observations !== undefined) updateData.observations = observations;
      
      anamnesis = await prisma.anamnesis.update({
        where: { id: existing.id },
        data: updateData
      });
    } else {
      // Create new
      anamnesis = await prisma.anamnesis.create({
        data: {
          userId: req.user.id,
          patientId,
          type: type || 'ADULT',
          data: data || {},
          complaint: complaint || '',
          observations: observations || ''
        }
      });
    }

    res.json(anamnesis);
  } catch (error) {
    console.error('Save Anamnesis Error:', error.message || error);
    res.status(500).json({ error: 'Erro ao salvar informações clínicas: ' + (error.message || 'Erro desconhecido') });
  }
};

exports.getAnamnesis = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const anamnesis = await prisma.anamnesis.findFirst({
      where: {
        patientId,
        userId: req.user.id
      }
    });

    if (!anamnesis) {
      return res.status(404).json({ error: 'Anamnese não encontrada' });
    }

    res.json(anamnesis);
  } catch (error) {
    console.error('Get Anamnesis Error:', error);
    res.status(500).json({ error: 'Erro ao buscar anamnese' });
  }
};
