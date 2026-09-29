const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getLibrary, getLibraryFile } = require('../controllers/libraryController');

const router = express.Router();

router.use(requireAuth);
router.get('/', getLibrary);
router.get('/:id/file', getLibraryFile);

module.exports = router;
