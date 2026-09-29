const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getHistory } = require('../controllers/historyController');

const router = express.Router();

router.use(requireAuth);
router.get('/', getHistory);

module.exports = router;
