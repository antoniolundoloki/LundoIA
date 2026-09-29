// ============================================================================
// LundoIA — extração de contexto a partir de anexos do chat.
//
// Cada ficheiro é tratado consoante o tipo:
// - Imagens → passam para a IA como imagem (multimodal), a Gemini "vê" o
//   conteúdo diretamente, não precisamos de extrair texto nenhum.
// - PDF/DOCX/TXT/MD/CSV/JSON → extrai-se o texto e junta-se à mensagem como
//   contexto, marcado com [[ANEXO: nome-do-ficheiro]].
// - ZIP → lista-se o conteúdo, e extrai-se o texto dos ficheiros de texto lá
//   dentro (até um limite), descrevendo os restantes só pelo nome.
// ============================================================================

const AdmZip = require('adm-zip');

const MAX_CHARS_PER_FILE = 6000;
const MAX_ZIP_ENTRIES_READ = 5;
const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.js', '.py', '.html', '.css'];

function truncate(text, limit = MAX_CHARS_PER_FILE) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n[...conteúdo cortado, o ficheiro é maior do que isto...]`;
}

function isTextFile(name) {
  return TEXT_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));
}

async function extractPdfText(buffer) {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('Falha ao ler PDF:', err.message);
    return '[Não foi possível ler o conteúdo deste PDF.]';
  }
}

async function extractDocxText(buffer) {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    console.error('Falha ao ler DOCX:', err.message);
    return '[Não foi possível ler o conteúdo deste documento Word.]';
  }
}

function extractZipSummary(buffer) {
  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries().filter((e) => !e.isDirectory);
    const names = entries.map((e) => e.entryName);

    let readCount = 0;
    const textExcerpts = [];
    for (const entry of entries) {
      if (readCount >= MAX_ZIP_ENTRIES_READ) break;
      if (isTextFile(entry.entryName)) {
        textExcerpts.push(`--- ${entry.entryName} ---\n${truncate(entry.getData().toString('utf8'), 2000)}`);
        readCount += 1;
      }
    }

    let summary = `Ficheiro zip com ${entries.length} ficheiro(s): ${names.join(', ')}.`;
    if (textExcerpts.length) {
      summary += `\n\nConteúdo dos ficheiros de texto encontrados dentro do zip:\n${textExcerpts.join('\n\n')}`;
    }
    return summary;
  } catch (err) {
    console.error('Falha ao ler ZIP:', err.message);
    return '[Não foi possível ler o conteúdo deste ficheiro zip.]';
  }
}

/**
 * @param {Array} files - ficheiros do multer (memoryStorage): { originalname, mimetype, buffer, size }
 * @returns {Promise<{ textContext: string, imageParts: Array, meta: Array }>}
 */
async function processAttachments(files) {
  if (!files || files.length === 0) {
    return { textContext: '', imageParts: [], meta: [] };
  }

  const textBlocks = [];
  const imageParts = [];
  const meta = [];

  for (const file of files) {
    const { originalname, mimetype, buffer, size } = file;
    meta.push({ name: originalname, type: mimetype, size });

    if (mimetype.startsWith('image/')) {
      imageParts.push({
        inlineData: {
          mimeType: mimetype,
          data: buffer.toString('base64'),
        },
      });
      continue;
    }

    let text = '';
    if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
      text = await extractPdfText(buffer);
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname.toLowerCase().endsWith('.docx')
    ) {
      text = await extractDocxText(buffer);
    } else if (mimetype === 'application/zip' || originalname.toLowerCase().endsWith('.zip')) {
      text = extractZipSummary(buffer);
    } else if (isTextFile(originalname) || mimetype.startsWith('text/')) {
      text = buffer.toString('utf8');
    } else {
      text = `[Ficheiro "${originalname}" (${mimetype}) anexado — tipo não suportado para leitura de conteúdo, só o nome é conhecido.]`;
    }

    textBlocks.push(`[[ANEXO: ${originalname}]]\n${truncate(text)}\n[[FIM DO ANEXO: ${originalname}]]`);
  }

  return { textContext: textBlocks.join('\n\n'), imageParts, meta };
}

module.exports = { processAttachments };
