// Limite simples em memória para o chat público (não autenticado), para
// evitar abuso — 15 mensagens a cada 10 minutos por IP. Para várias
// instâncias do servidor em produção, troca isto por um limitador com Redis.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 15;
const hits = new Map(); // ip -> { count, resetAt }

function publicChatRateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'desconhecido';
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Demasiadas mensagens seguidas — espera uns minutos e tenta de novo.' });
  }

  entry.count += 1;
  next();
}

module.exports = { publicChatRateLimit };
