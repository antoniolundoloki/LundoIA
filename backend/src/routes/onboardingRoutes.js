const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { submitOnboarding } = require('../controllers/profileController');

const router = express.Router();

router.use(requireAuth);
router.post('/', submitOnboarding);

module.exports = router;
