const express = require('express');
const router = express.Router();
const anamnesisController = require('../controllers/anamnesisController');
const attachmentController = require('../controllers/attachmentController');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all clinical routes
router.use(auth);

// Anamnesis Routes
router.post('/anamnesis', anamnesisController.upsertAnamnesis);
router.get('/anamnesis/:patientId', anamnesisController.getAnamnesis);

// Attachment Routes
router.post('/attachments', attachmentController.createAttachment);
router.get('/attachments/:patientId', attachmentController.getAttachments);
router.delete('/attachments/:id', attachmentController.deleteAttachment);

module.exports = router;
