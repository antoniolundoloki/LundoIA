const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const { getCategoryFor } = require('../utils/categoryMatching');

const LIBRARY_FILES_DIR = path.join(__dirname, '..', 'library-files');
const SELECT_COLUMNS = 'id, title, category, resource_type, pages, file_name, source_url, source_label';

// GET /api/library — recursos da categoria correspondente ao curso/área do
// próprio utilizador autenticado (não precisa de parâmetros).
async function getLibrary(req, res, next) {
  try {
    const userId = req.userId;

    const [profileRows] = await pool.query(
      'SELECT course, area FROM user_profiles WHERE user_id = :userId',
      { userId }
    );
    const profile = profileRows[0];
    const matchText = profile ? [profile.course, profile.area].filter(Boolean).join(' ') : '';
    const category = getCategoryFor(matchText);

    const [resources] = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM library_resources WHERE category = :category ORDER BY title`,
      { category }
    );

    // Sem recursos nessa categoria específica? Mostra pelo menos os genéricos.
    if (resources.length === 0 && category !== 'generico') {
      const [fallback] = await pool.query(
        `SELECT ${SELECT_COLUMNS} FROM library_resources WHERE category = :category ORDER BY title`,
        { category: 'generico' }
      );
      return res.json({ category: 'generico', resources: fallback });
    }

    res.json({ category, resources });
  } catch (err) {
    next(err);
  }
}

// GET /api/library/:id/file — serve um recurso alojado localmente (só os que
// têm file_name preenchido; os externos usam source_url em vez disto).
// GET /api/library/:id/file
// Abre ou baixa um PDF armazenado em src/library-files/
async function getLibraryFile(req, res, next) {
  try {
    const { id } = req.params;
    const mode = req.query.mode === 'download' ? 'download' : 'inline';

    const [rows] = await pool.query(
      'SELECT title, file_name FROM library_resources WHERE id = :id',
      { id }
    );

    const resource = rows[0];

    if (!resource || !resource.file_name) {
      return res.status(404).json({
        error: 'Este recurso não possui um ficheiro local.'
      });
    }

    // Impede caminhos como ../../outro-arquivo
    const safeFileName = path.basename(resource.file_name);

    const filePath = path.join(LIBRARY_FILES_DIR, safeFileName);

    if (!fs.existsSync(filePath)) {
      console.error(`Ficheiro não encontrado: ${filePath}`);

      return res.status(404).json({
        error: 'Ficheiro não encontrado no servidor.',
        file: safeFileName
      });
    }

    // Garante que o navegador reconhece o ficheiro como PDF
    res.setHeader('Content-Type', 'application/pdf');

    if (mode === 'download') {
      return res.download(
        filePath,
        safeFileName,
        {
          headers: {
            'Content-Type': 'application/pdf'
          }
        },
        (err) => {
          if (err && !res.headersSent) {
            next(err);
          }
        }
      );
    }

    // mode=inline → abre o PDF no navegador
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${safeFileName}"`
    );

    return res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

module.exports = { getLibrary, getLibraryFile };
