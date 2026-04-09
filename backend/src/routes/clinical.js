const express = require('express');
const router = express.Router();
const anamnesisController = require('../controllers/anamnesisController');
const attachmentController = require('../controllers/attachmentController');

// Se o erro persistir, comente a linha abaixo colocando // no início dela
const auth = require('../middleware/auth');

// Roteamento
// Se der erro de "middleware function", coloque um // antes da linha abaixo
router.use(auth);

// Anamnesis Routes
router.post('/anamnesis', anamnesisController.saveAnamnesis);
router.get('/anamnesis/:patientId', anamnesisController.getAnamnesis);

// Attachment Routes
router.post('/attachments', attachmentController.createAttachment);
router.get('/attachments/:anamnesisId', attachmentController.getAttachments);
router.delete('/attachments/:id', attachmentController.deleteAttachment);

module.exports = router;
