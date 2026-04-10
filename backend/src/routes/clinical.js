const express = require('express');
const router = express.Router();
const anamnesisController = require('../controllers/anamnesisController');
const attachmentController = require('../controllers/attachmentController');

const { auth, requirePlan } = require('../middleware/auth');
const needPlan = requirePlan(['BASIC', 'PRO']);

// Anamnesis Routes
router.post('/anamnesis', auth, needPlan, anamnesisController.saveAnamnesis);
router.get('/anamnesis/:patientId', auth, needPlan, anamnesisController.getAnamnesis);

// Attachment Routes
router.post('/attachments', auth, needPlan, attachmentController.createAttachment);
router.get('/attachments/:anamnesisId', auth, needPlan, attachmentController.getAttachments);
router.delete('/attachments/:id', auth, needPlan, attachmentController.deleteAttachment);

module.exports = router;
