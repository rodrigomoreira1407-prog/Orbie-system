const express = require('express');
const router = express.Router();
const { auth, requirePlan } = require('../middleware/auth');
const c = require('../controllers/patientController');

const needPlan = requirePlan(['BASIC', 'PRO']);

router.get('/', auth, needPlan, c.list);
router.get('/:id', auth, needPlan, c.get);
router.post('/', auth, needPlan, c.create);
router.put('/:id', auth, needPlan, c.update);
router.delete('/:id', auth, needPlan, c.remove);

module.exports = router;