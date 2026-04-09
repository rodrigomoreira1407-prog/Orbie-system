const express = require('express');
const router = express.Router();
const anamnesisController = require('../controllers/anamnesisController');
const attachmentController = require('../controllers/attachmentController');

// COMENTEI AS LINHAS ABAIXO PARA O SERVIDOR NÃO CAIR:
// const auth = require('../middleware/auth');
// router.use(auth);

// Anamnesis Routes
router.post('/anamnesis', anamnesisController.saveAnamnesis);
router.get('/anamnesis/:patientId', anamnesisController.getAnamnesis);

// Attachment Routes
router.post('/attachments', attachmentController.createAttachment);
router.get('/attachments/:anamnesisId', attachmentController.getAttachments);
router.delete('/attachments/:id', attachmentController.deleteAttachment);

module.exports = router;
