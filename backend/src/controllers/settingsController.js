const pool = require('../config/db');
const mailService = require('../services/mailService');

const DEFAULTS = {
  dark_mode: true,
  study_reminders: true,
  platform_news: false,
  save_chat_history: true,
};

// GET /api/settings
async function getSettings(req, res, next) {
  try {
    const userId = req.userId;
    const [rows] = await pool.query('SELECT * FROM user_settings WHERE user_id = :userId', { userId });

    if (rows.length === 0) {
      // Conta recém-criada: garante que existe uma linha com os valores por omissão.
      await pool.query(
        `INSERT INTO user_settings (user_id, dark_mode, study_reminders, platform_news, save_chat_history)
         VALUES (:userId, :darkMode, :studyReminders, :platformNews, :saveChatHistory)`,
        {
          userId,
          darkMode: DEFAULTS.dark_mode,
          studyReminders: DEFAULTS.study_reminders,
          platformNews: DEFAULTS.platform_news,
          saveChatHistory: DEFAULTS.save_chat_history,
        }
      );
      return res.json({ settings: { user_id: userId, ...DEFAULTS } });
    }

    res.json({ settings: rows[0] });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/settings — atualização parcial (só os campos enviados mudam)
async function updateSettings(req, res, next) {
  try {
    const userId = req.userId;
    const { darkMode, studyReminders, platformNews, saveChatHistory } = req.body;

    // Garante que a linha existe (com os valores por omissão) antes de a atualizar.
    await pool.query(
      `INSERT IGNORE INTO user_settings (user_id, dark_mode, study_reminders, platform_news, save_chat_history)
       VALUES (:userId, :darkMode, :studyReminders, :platformNews, :saveChatHistory)`,
      {
        userId,
        darkMode: DEFAULTS.dark_mode,
        studyReminders: DEFAULTS.study_reminders,
        platformNews: DEFAULTS.platform_news,
        saveChatHistory: DEFAULTS.save_chat_history,
      }
    );

    // Lido ANTES do update, para conseguirmos detetar uma ativação (transição
    // de desligado -> ligado) e não disparar email sempre que a mesma
    // preferência é gravada já ligada (ex.: PATCH repetido sem mudança real).
    const [beforeRows] = await pool.query('SELECT * FROM user_settings WHERE user_id = :userId', { userId });
    const before = beforeRows[0] || {};

    // COALESCE contra a própria coluna: campos não enviados (null) mantêm o
    // valor já guardado em vez de serem substituídos por omissões.
    await pool.query(
      `UPDATE user_settings
       SET dark_mode = COALESCE(:darkMode, dark_mode),
           study_reminders = COALESCE(:studyReminders, study_reminders),
           platform_news = COALESCE(:platformNews, platform_news),
           save_chat_history = COALESCE(:saveChatHistory, save_chat_history)
       WHERE user_id = :userId`,
      {
        userId,
        darkMode: darkMode ?? null,
        studyReminders: studyReminders ?? null,
        platformNews: platformNews ?? null,
        saveChatHistory: saveChatHistory ?? null,
      }
    );

    const activatedStudyReminders = studyReminders === true && !before.study_reminders;
    const activatedPlatformNews = platformNews === true && !before.platform_news;

    if (activatedStudyReminders || activatedPlatformNews) {
      const [userRows] = await pool.query('SELECT id, name, email FROM users WHERE id = :userId', { userId });
      const user = userRows[0];
      if (user) {
        if (activatedStudyReminders) mailService.sendStudyRemindersEnabledEmail(user).catch(() => {});
        if (activatedPlatformNews) mailService.sendPlatformNewsEnabledEmail(user).catch(() => {});
      }
    }

    res.json({ message: 'Definições atualizadas.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings };
