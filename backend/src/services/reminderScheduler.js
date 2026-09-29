// ============================================================================
// LundoIA — agendador de lembretes de estudo.
//
// Não usa nenhuma dependência de "cron" — só setInterval nativo, verificando
// de hora a hora se já é a hora configurada (REMINDER_HOUR) e se ainda não
// foi enviado hoje. Simples, sem dependências novas para instalar.
// ============================================================================

const pool = require('../config/db');
const mailService = require('./mailService');

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // verifica de hora a hora
const REMINDER_HOUR = Number(process.env.REMINDER_HOUR ?? 18); // 18h por omissão

let lastSentDate = null; // 'YYYY-MM-DD' do último envio, para não repetir no mesmo dia

async function getUsersWithReminderEnabled() {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email
     FROM users u
     JOIN user_settings s ON s.user_id = u.id
     WHERE s.study_reminders = TRUE`
  );
  return rows;
}

async function sendDailyReminders() {
  const users = await getUsersWithReminderEnabled();
  console.log(`[lembretes] A enviar lembretes de estudo a ${users.length} utilizador(es)...`);

  for (const user of users) {
    try {
      await mailService.sendStudyReminderEmail(user);
    } catch (err) {
      console.error(`[lembretes] Falha ao enviar lembrete para ${user.email}:`, err.message);
    }
  }
}

function checkAndSend() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (now.getHours() === REMINDER_HOUR && lastSentDate !== today) {
    lastSentDate = today;
    sendDailyReminders().catch((err) => console.error('[lembretes] Falha geral:', err.message));
  }
}

function startReminderScheduler() {
  console.log(`[lembretes] Agendador ativo — envia às ${REMINDER_HOUR}h todos os dias a quem tiver lembretes ativados.`);
  checkAndSend(); // por segurança, verifica logo ao arrancar (caso o servidor reinicie perto da hora)
  setInterval(checkAndSend, CHECK_INTERVAL_MS);
}

module.exports = { startReminderScheduler, sendDailyReminders };
