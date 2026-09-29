const pool = require('../config/db');
const { OAuth2Client } = require('google-auth-library');
const { hashPassword, verifyPassword } = require('../utils/password');
const {
  signAccessToken,
  generateRefreshToken,
  refreshTokenExpiryDate,
  signPasswordResetToken,
  verifyPasswordResetToken,
} = require('../utils/jwt');
const mailService = require('../services/mailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function createSession(userId) {
  const refreshToken = generateRefreshToken();
  const expiresAt = refreshTokenExpiryDate();
  await pool.query(
    'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES (:userId, :refreshToken, :expiresAt)',
    { userId, refreshToken, expiresAt }
  );
  return refreshToken;
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
    }

    const passwordHash = await hashPassword(password);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, auth_provider) VALUES (:name, :email, :passwordHash, "local")',
      { name, email, passwordHash }
    );

    await pool.query('INSERT INTO user_settings (user_id) VALUES (:userId)', { userId: result.insertId });

    const user = { id: result.insertId, name, email };
    const accessToken = signAccessToken(user);
    const refreshToken = await createSession(user.id);

    // Fire-and-forget: o registo não deve falhar nem demorar mais só porque
    // o envio do email de boas-vindas está lento ou indisponível.
    mailService.sendWelcomeEmail(user).catch(() => {});

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Já existe uma conta com este email.' });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = :email', { email });
    const user = rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = await createSession(user.id);

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken em falta.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM sessions WHERE refresh_token = :refreshToken AND expires_at > NOW()',
      { refreshToken }
    );
    const session = rows[0];
    if (!session) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada. Inicia sessão novamente.' });
    }

    const [userRows] = await pool.query('SELECT * FROM users WHERE id = :id', { id: session.user_id });
    const user = userRows[0];
    if (!user) {
      return res.status(401).json({ error: 'Utilizador não encontrado.' });
    }

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query('DELETE FROM sessions WHERE refresh_token = :refreshToken', { refreshToken });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function googleAuth(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'credential (ID token do Google) em falta.' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID não está configurado na backend.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email;

    let [rows] = await pool.query('SELECT * FROM users WHERE google_id = :googleId', { googleId });
    let user = rows[0];
    let isNewUser = false;

    if (!user) {
      // Ainda não entrou com o Google antes — mas pode já ter conta local
      // com este email. Nesse caso, liga a conta em vez de duplicar.
      [rows] = await pool.query('SELECT * FROM users WHERE email = :email', { email });
      user = rows[0];

      if (user) {
        await pool.query('UPDATE users SET google_id = :googleId WHERE id = :id', { googleId, id: user.id });
      } else {
        const [result] = await pool.query(
          'INSERT INTO users (name, email, auth_provider, google_id) VALUES (:name, :email, "google", :googleId)',
          { name, email, googleId }
        );
        await pool.query('INSERT INTO user_settings (user_id) VALUES (:userId)', { userId: result.insertId });
        user = { id: result.insertId, name, email };
        isNewUser = true;
      }
    }

    const accessToken = signAccessToken(user);
    const refreshToken = await createSession(user.id);

    // Só envia o email de boas-vindas quando a conta é mesmo nova — não ao
    // entrar numa conta já existente nem ao ligar o Google a uma conta local.
    if (isNewUser) {
      mailService.sendWelcomeEmail(user).catch(() => {});
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    if (err.message?.includes('Token used too late') || err.message?.includes('Wrong recipient')) {
      return res.status(401).json({ error: 'Token do Google inválido ou expirado.' });
    }
    next(err);
  }
}

// POST /api/auth/forgot-password — envia um link de recuperação por email.
// Responde sempre com sucesso, exista ou não a conta, para não revelar quais
// emails estão registados.
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email em falta.' });

    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE email = :email', { email });
    const user = rows[0];

    if (user) {
      const token = signPasswordResetToken(user);
      mailService.sendPasswordResetEmail(user, token).catch((err) => {
        console.error('Falha ao enviar email de recuperação:', err.message);
      });
    }

    res.json({ message: 'Se existir uma conta com esse email, foi enviado um link de recuperação.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password — troca a palavra-passe usando o token do email.
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'token e password são obrigatórios.' });
    if (password.length < 8) return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });

    let payload;
    try {
      payload = verifyPasswordResetToken(token);
    } catch (err) {
      return res.status(400).json({ error: 'Link de recuperação inválido ou expirado. Pede um novo.' });
    }

    const passwordHash = await hashPassword(password);
    await pool.query('UPDATE users SET password_hash = :passwordHash WHERE id = :userId', {
      passwordHash,
      userId: payload.sub,
    });

    // Invalida todas as sessões ativas — quem tinha a conta comprometida
    // fica desligado em qualquer dispositivo.
    await pool.query('DELETE FROM sessions WHERE user_id = :userId', { userId: payload.sub });

    res.json({ message: 'Palavra-passe alterada com sucesso.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, googleAuth, forgotPassword, resetPassword };
