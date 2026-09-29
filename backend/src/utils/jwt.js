const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function refreshTokenExpiryDate() {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || 30);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Token de recuperação de palavra-passe: curta duração (30 min), propósito
// próprio para não poder ser reutilizado como token de acesso normal.
function signPasswordResetToken(user) {
  return jwt.sign(
    { sub: user.id, purpose: 'password_reset' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '30m' }
  );
}

function verifyPasswordResetToken(token) {
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  if (payload.purpose !== 'password_reset') {
    throw new Error('Token não é de recuperação de palavra-passe.');
  }
  return payload;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  refreshTokenExpiryDate,
  signPasswordResetToken,
  verifyPasswordResetToken,
};
