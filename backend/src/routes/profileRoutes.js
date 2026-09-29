const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

router.use(requireAuth);
router.get('/', getProfile);
router.patch('/', updateProfile);

module.exports = router;
