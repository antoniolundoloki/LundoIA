const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

router.use(requireAuth);
router.get('/', getSettings);
router.patch('/', updateSettings);

module.exports = router;
