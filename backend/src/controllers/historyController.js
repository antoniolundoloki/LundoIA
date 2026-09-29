const pool = require('../config/db');

// GET /api/history — atividade real do utilizador. Só aparecem módulos que já
// foram estudados (last_studied_at preenchido); uma conta recém-criada não
// tem nenhuma entrada porque ainda não estudou nada.
async function getHistory(req, res, next) {
  try {
    const userId = req.userId;

    const [rows] = await pool.query(
      `SELECT m.name, um.progress_percent, um.last_studied_at
       FROM user_modules um
       JOIN modules m ON m.id = um.module_id
       WHERE um.user_id = :userId AND um.last_studied_at IS NOT NULL
       ORDER BY um.last_studied_at DESC
       LIMIT 50`,
      { userId }
    );

    res.json({ history: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory };
