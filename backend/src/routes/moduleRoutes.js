const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listModules, suggestModules, updateUserModule } = require('../controllers/moduleController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listModules);
router.get('/suggestions', suggestModules);
router.patch('/:id', updateUserModule);

module.exports = router;
