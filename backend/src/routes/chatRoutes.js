const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { publicChatRateLimit } = require('../middleware/publicChatRateLimit');
const {
  publicChat,
  personalizedChat,
  listConversations,
  getConversation,
} = require('../controllers/chatController');

const router = express.Router();

// Ficheiros ficam em memória (não gravados em disco) — só usados para extrair
// texto/imagem e depois descartados. Até 5 ficheiros, 15MB cada.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 5 },
});

router.post('/public', publicChatRateLimit, upload.array('files'), publicChat);

router.use(requireAuth);
router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.post('/', upload.array('files'), personalizedChat);

module.exports = router;
