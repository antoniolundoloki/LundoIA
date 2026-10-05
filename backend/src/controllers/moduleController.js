const pool = require('../config/db');
const { getCategoryFor } = require('../utils/categoryMatching');

// GET /api/modules — catálogo completo
// (para a área de Definições, ex: adicionar módulo)
async function listModules(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, category FROM modules ORDER BY category, name'
    );

    res.json({ modules: rows });
  } catch (err) {
    next(err);
  }
}


// GET /api/modules/suggestions?course=Engenharia Informática&area=Informática
// Devolve os módulos gerais + os módulos específicos do curso,
// para pré-selecionar na Tela 3 do onboarding.
async function suggestModules(req, res, next) {
  try {
    const matchText = [req.query.course, req.query.area]
      .filter(Boolean)
      .join(' ');

    const category = getCategoryFor(matchText);

    // Módulos gerais + módulos específicos do curso
    const [rows] = await pool.query(
      `SELECT id, name, category
       FROM modules
       WHERE category IN (:category, 'geral')
       ORDER BY
         CASE
           WHEN category = 'geral' THEN 0
           ELSE 1
         END,
         name`,
      { category }
    );

    res.json({
      category,
      modules: rows
    });
  } catch (err) {
    next(err);
  }
}


// PATCH /api/modules/:id
// Ativar/desativar um módulo ou atualizar progresso
async function updateUserModule(req, res, next) {
  try {
    const userId = req.userId;
    const moduleId = req.params.id;
    const { isActive, progressPercent } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM user_modules WHERE user_id = :userId AND module_id = :moduleId',
      { userId, moduleId }
    );

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO user_modules
         (user_id, module_id, is_active, progress_percent)
         VALUES (:userId, :moduleId, :isActive, :progressPercent)`,
        {
          userId,
          moduleId,
          isActive: isActive ?? true,
          progressPercent: progressPercent ?? 0,
        }
      );
    } else {
      await pool.query(
        `UPDATE user_modules
         SET is_active = COALESCE(:isActive, is_active),
             progress_percent = COALESCE(:progressPercent, progress_percent),
             last_studied_at = IF(
               :progressPercent IS NOT NULL,
               NOW(),
               last_studied_at
             )
         WHERE user_id = :userId
           AND module_id = :moduleId`,
        {
          userId,
          moduleId,
          isActive: isActive ?? null,
          progressPercent: progressPercent ?? null,
        }
      );
    }

    res.json({ message: 'Módulo atualizado.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listModules,
  suggestModules,
  updateUserModule
};