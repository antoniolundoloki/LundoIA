const pool = require('../config/db');

const VALID_LEVELS = ['medio', 'universitario'];

function validateOnboardingPayload(body) {
  const { level, institutionName, course, yearOrGrade, area, modules } = body;

  if (!VALID_LEVELS.includes(level)) {
    return 'level deve ser "medio" ou "universitario".';
  }
  if (!institutionName || !course || !yearOrGrade) {
    return 'institutionName, course e yearOrGrade são obrigatórios.';
  }
  if (level === 'medio' && !area) {
    return 'area é obrigatória para o Ensino Médio.';
  }
  if (!Array.isArray(modules)) {
    return 'modules deve ser uma lista de nomes de módulos.';
  }
  return null;
}

// GET /api/profile — perfil completo (dados de conta + académicos + módulos ativos)
async function getProfile(req, res, next) {
  try {
    const userId = req.userId;

    const [userRows] = await pool.query(
      'SELECT id, name, email, auth_provider, created_at FROM users WHERE id = :userId',
      { userId }
    );
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    const [profileRows] = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = :userId',
      { userId }
    );
    const profile = profileRows[0] || null;

    const [moduleRows] = await pool.query(
      `SELECT m.id, m.name, m.category, um.is_active, um.progress_percent, um.last_studied_at
       FROM user_modules um
       JOIN modules m ON m.id = um.module_id
       WHERE um.user_id = :userId AND um.is_active = TRUE
       ORDER BY um.progress_percent DESC`,
      { userId }
    );

    res.json({
      user,
      profile,
      onboardingCompleted: Boolean(profile?.onboarding_completed_at),
      modules: moduleRows,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/onboarding — grava as 3 primeiras telas do onboarding de uma vez
async function submitOnboarding(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const userId = req.userId;
    const validationError = validateOnboardingPayload(req.body);
    if (validationError) {
      connection.release();
      return res.status(400).json({ error: validationError });
    }

    const { level, institutionName, course, yearOrGrade, area, modules } = req.body;

    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO user_profiles (user_id, level, institution_name, course, year_or_grade, area, onboarding_completed_at)
       VALUES (:userId, :level, :institutionName, :course, :yearOrGrade, :area, NOW())
       ON DUPLICATE KEY UPDATE
         level = VALUES(level),
         institution_name = VALUES(institution_name),
         course = VALUES(course),
         year_or_grade = VALUES(year_or_grade),
         area = VALUES(area),
         onboarding_completed_at = NOW()`,
      { userId, level, institutionName, course, yearOrGrade, area: area || null }
    );

    // Desativa módulos anteriores (caso o utilizador refaça o onboarding) e
    // ativa só os que vieram nesta submissão.
    await connection.query('UPDATE user_modules SET is_active = FALSE WHERE user_id = :userId', { userId });

    for (const moduleName of modules) {
      const [moduleRows] = await connection.query('SELECT id FROM modules WHERE name = :moduleName', { moduleName });
      let moduleId = moduleRows[0]?.id;

      if (!moduleId) {
        const [inserted] = await connection.query('INSERT INTO modules (name) VALUES (:moduleName)', { moduleName });
        moduleId = inserted.insertId;
      }

      await connection.query(
        `INSERT INTO user_modules (user_id, module_id, is_active)
         VALUES (:userId, :moduleId, TRUE)
         ON DUPLICATE KEY UPDATE is_active = TRUE`,
        { userId, moduleId }
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Onboarding concluído com sucesso.' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

// PATCH /api/profile — edição manual do formulário de Perfil
async function updateProfile(req, res, next) {
  try {
    const userId = req.userId;
    const { name, institutionName, course, yearOrGrade, area } = req.body;

    if (name) {
      await pool.query('UPDATE users SET name = :name WHERE id = :userId', { name, userId });
    }

    await pool.query(
      `UPDATE user_profiles
       SET institution_name = COALESCE(:institutionName, institution_name),
           course = COALESCE(:course, course),
           year_or_grade = COALESCE(:yearOrGrade, year_or_grade),
           area = COALESCE(:area, area)
       WHERE user_id = :userId`,
      { userId, institutionName: institutionName ?? null, course: course ?? null, yearOrGrade: yearOrGrade ?? null, area: area ?? null }
    );

    res.json({ message: 'Perfil atualizado.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, submitOnboarding, updateProfile };
