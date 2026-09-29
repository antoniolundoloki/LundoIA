// ============================================================================
// LundoIA — serviço de email (Nodemailer / Gmail SMTP).
//
// Se SMTP_USER/SMTP_PASSWORD não estiverem configurados no .env, não tenta
// enviar (isso rebentaria) — em vez disso regista no log o que teria
// enviado. Assim o registo de conta nunca falha por causa do email.
// ============================================================================

const path = require('path');
const nodemailer = require('nodemailer');

const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
const port = Number(process.env.SMTP_PORT) || 465;
const BRAND_GOLD = '#D97706';
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.png');
const LOGO_CID = 'lundoia-logo';

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })
  : null;

// Moldura visual partilhada por todos os emails: logo + "LundoIA" a dourado
// no topo, o conteúdo específico de cada email no meio, assinatura no fim.
function renderEmailShell({ title, bodyHtml }) {
  return `
  <body style="margin:0; padding:0; background:#f4f1ec;">
    <div style="max-width:480px; margin:0 auto; padding:32px 16px; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #ece5d8;">

        <div style="background:#1a120c; padding:28px 24px; text-align:center;">
          <img src="cid:${LOGO_CID}" alt="LundoIA" width="56" height="56" style="display:block; margin:0 auto 12px; border-radius:12px;">
          <span style="color:${BRAND_GOLD}; font-size:22px; font-weight:700; letter-spacing:0.02em;">LundoIA</span>
        </div>

        <div style="padding:32px 28px; color:#1a120c; line-height:1.6; font-size:15px;">
          ${title ? `<h2 style="margin:0 0 16px; font-size:19px; color:#1a120c;">${title}</h2>` : ''}
          ${bodyHtml}
        </div>

        <div style="padding:20px 28px; border-top:1px solid #f0ece2; text-align:center;">
          <span style="color:${BRAND_GOLD}; font-weight:600; font-size:13px;">— LundoIA</span>
        </div>

      </div>
    </div>
  </body>`;
}

async function send({ to, subject, title, bodyHtml }) {
  const html = renderEmailShell({ title, bodyHtml });

  if (!transporter) {
    console.log('[email simulado — SMTP não configurado] Para: %s | Assunto: %s', to, subject);
    return { simulated: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"LundoIA" <no-reply@lundoia.ao>',
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'lundoia-logo.png',
          path: LOGO_PATH,
          cid: LOGO_CID,
        },
      ],
    });
    return { simulated: false };
  } catch (err) {
    // Um email falhado nunca deve rebentar o pedido que o despoletou (ex.:
    // registo de conta) — só regista o erro para investigação.
    console.error('Falha ao enviar email para %s:', to, err.message);
    return { simulated: false, error: true };
  }
}

function sendWelcomeEmail(user) {
  return send({
    to: user.email,
    subject: 'Bem-vindo à LundoIA 🎓',
    title: `Olá, ${user.name}!`,
    bodyHtml: `
      <p>A tua conta na LundoIA foi criada com sucesso.</p>
      <p>Agora é só entrar e completar o teu perfil académico para começares a estudar com a tua tutora de IA, feita para estudantes angolanos.</p>
    `,
  });
}

function sendStudyRemindersEnabledEmail(user) {
  return send({
    to: user.email,
    subject: 'Lembretes de estudo ativados 🔔',
    title: `Olá, ${user.name}!`,
    bodyHtml: `
      <p>Acabaste de ativar os <strong>lembretes de estudo</strong> nas Definições da LundoIA.</p>
      <p>A partir de agora vais receber lembretes para manteres a tua rotina de estudo em dia.</p>
      <p>Podes desativar isto a qualquer momento em Definições → Notificações.</p>
    `,
  });
}

function sendPlatformNewsEnabledEmail(user) {
  return send({
    to: user.email,
    subject: 'Novidades da LundoIA ativadas 📣',
    title: `Olá, ${user.name}!`,
    bodyHtml: `
      <p>Acabaste de ativar as <strong>novidades da plataforma</strong> nas Definições da LundoIA.</p>
      <p>A partir de agora vais receber emails sempre que houver novos módulos, recursos ou funcionalidades na LundoIA.</p>
      <p>Podes desativar isto a qualquer momento em Definições → Notificações.</p>
    `,
  });
}

function sendStudyReminderEmail(user) {
  return send({
    to: user.email,
    subject: 'Hora de estudar? 📌',
    title: `Olá, ${user.name}!`,
    bodyHtml: `
      <p>Este é o teu lembrete diário para manteres a rotina de estudo em dia.</p>
      <p>Entra na LundoIA e continua de onde ficaste — mesmo 15 minutos hoje já ajudam.</p>
      <p>Podes desativar estes lembretes a qualquer momento em Definições → Notificações.</p>
    `,
  });
}

function sendPasswordResetEmail(user, token) {
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5500').replace(/\/+$/, '');
  const resetUrl = `${baseUrl}/entrar.html?reset=${token}`;
  return send({
    to: user.email,
    subject: 'Recuperar a tua palavra-passe',
    title: `Olá, ${user.name}!`,
    bodyHtml: `
      <p>Pediste para repor a tua palavra-passe na LundoIA.</p>
      <p style="text-align:center; margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block; background:#D97706; color:#1a120c; font-weight:700; text-decoration:none; padding:12px 24px; border-radius:8px;">Definir nova palavra-passe</a>
      </p>
      <p>Este link expira em 30 minutos. Se não foste tu a pedir isto, ignora este email — a tua conta continua segura.</p>
    `,
  });
}

module.exports = {
  send,
  sendWelcomeEmail,
  sendStudyRemindersEnabledEmail,
  sendPlatformNewsEnabledEmail,
  sendStudyReminderEmail,
  sendPasswordResetEmail,
};
