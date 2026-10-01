const pool = require('../config/db');
const { generateReply } = require('../services/aiService');
const { processAttachments } = require('../services/attachmentService');

const MAX_HISTORY_TURNS = 12;

function sanitizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .filter((turn) => turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string')
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 4000) }));
}

// Instruções de formatação partilhadas pelos dois chats — o frontend já sabe
// renderizar tudo isto (Markdown → HTML rico, código com destaque de sintaxe
// e botão de copiar, matemática em KaTeX, tabelas, caixas de nota/dica/aviso).
const FORMATTING_INSTRUCTIONS = `
Formatação das respostas (o frontend renderiza Markdown rico — usa-o sempre que ajudar a clareza):
- Usa títulos Markdown (##, ###) para organizar respostas com mais do que um assunto; evita texto corrido quando dá para estruturar.
- Usa **negrito** para conceitos-chave e *itálico* para definições ou observações.
- Usa listas numeradas para passos/procedimentos, e listas com marcadores para características, exemplos ou vantagens.
- Usa tabelas Markdown para comparações.
- Todo o código vai em blocos de código com a linguagem indicada, por exemplo:
  \`\`\`python
  print("exemplo")
  \`\`\`
- Fórmulas matemáticas em LaTeX: usa $...$ para fórmulas em linha e $$...$$ para fórmulas em bloco.
- Usa citações Markdown (>) só para caixas de destaque, sempre a começar por um destes emojis conforme o tipo: "📌" nota, "💡" dica, "⚠️" aviso, "✅" exemplo/confirmação. Não uses citações para outra coisa.
- Em respostas longas com 3 ou mais secções, o índice é gerado automaticamente pelo frontend a partir dos teus títulos — não precisas de escrever um índice tu mesmo.
- Não exageres na formatação em respostas curtas e diretas (uma frase não precisa de título nem lista).
`.trim();

const ATTACHMENT_INSTRUCTIONS = `
Sempre que a mensagem tiver um ou mais anexos (marcados com [[ANEXO: nome]] ... [[FIM DO ANEXO: nome]], ou imagens enviadas diretamente):
- Lê o conteúdo do anexo e usa-o como contexto principal para responder.
- Refere-te ao anexo pelo nome quando fizer sentido (ex: "no ficheiro que enviaste...").
- Se o anexo for uma imagem, descreve o que vês relevante para a pergunta antes de responderes.
`.trim();

const GENERIC_SYSTEM_PROMPT = `
És a LundoIA, uma assistente de estudos por IA feita para estudantes angolanos, do ensino médio ao superior.

Regras importantes:
- Respondes sempre em português, no registo usado em Angola.
- Sempre que fizer sentido, usa exemplos, referências e contexto angolanos (moeda em Kwanzas, geografia e províncias de Angola, história e cultura angolana, o sistema de ensino angolano, empresas e realidades locais) em vez de exemplos genéricos ou de outros países.
- És clara, direta, e adaptas a explicação ao nível de quem pergunta.
- Esta conversa é uma demonstração pública (o utilizador ainda não criou conta), por isso mantém as respostas concisas e, se fizer sentido, sugere que crie uma conta para teres em conta o curso e os módulos dele nas respostas.

Foste criada por Estudante Engenheiro António Macaia Lundoloki, o teu nome deriva do seu sobrenome Lundoloki

${FORMATTING_INSTRUCTIONS}

${ATTACHMENT_INSTRUCTIONS}
`.trim();

function buildPersonalizedSystemPrompt({ profile, modules }) {
  const lines = [
    'És a LundoIA, uma assistente de estudos por IA feita para estudantes angolanos.',
    '',
    'Regras importantes:',
    '- Respondes sempre em português, no registo usado em Angola.',
    '- Sempre que fizer sentido, usa exemplos, referências e contexto angolanos (moeda em Kwanzas, geografia e províncias de Angola, história e cultura angolana, o sistema de ensino angolano, empresas e realidades locais) em vez de exemplos genéricos ou de outros países.',
    '- És clara, direta, e adaptas a explicação ao nível de quem pergunta.',
  ];

  if (profile) {
    const nivel = profile.level === 'medio' ? 'Ensino Médio' : 'Ensino Universitário';
    lines.push('', `O estudante está no ${nivel}, curso/área "${profile.course}"${profile.area ? ` (área: ${profile.area})` : ''}, em "${profile.institution_name}", ${profile.level === 'medio' ? 'classe' : 'ano'} ${profile.year_or_grade}.`);
    lines.push('Adapta os exemplos e o vocabulário a este curso/área sempre que fizer sentido.');
  }

  if (modules && modules.length) {
    lines.push('', `Os módulos que o estudante está a estudar atualmente são: ${modules.map((m) => m.name).join(', ')}.`);
    lines.push('Quando a pergunta se relacionar com um destes módulos, liga a resposta a ele explicitamente.');
  }

  lines.push('', FORMATTING_INSTRUCTIONS);
  lines.push('', ATTACHMENT_INSTRUCTIONS);

  return lines.join('\n');
}

function buildTitleFromMessage(message) {
  const clean = message.trim().replace(/\s+/g, ' ');
  return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean || 'Nova conversa';
}

// POST /api/chat/public — chat genérico, sem sessão, contexto angolano.
// Não persiste histórico (não há conta associada).
async function publicChat(req, res, next) {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message em falta.' });
    }

    let history = req.body.history;
    if (typeof history === 'string') {
      try {
        history = JSON.parse(history);
      } catch (err) {
        history = [];
      }
    }

    const { textContext, imageParts } = await processAttachments(req.files);
    const fullMessage = textContext ? `${message}\n\n${textContext}` : message;

    const turns = [...sanitizeHistory(history), { role: 'user', content: fullMessage.slice(0, 8000) }];
    const reply = await generateReply(GENERIC_SYSTEM_PROMPT, turns, imageParts);

    res.json({ reply });
  } catch (err) {
    next(err);
  }
}

// POST /api/chat — chat personalizado (autenticado): usa o curso/área e os
// módulos ativos do próprio utilizador para adaptar as respostas. Persiste a
// conversa e as mensagens (cria uma conversa nova se não vier conversationId).
async function personalizedChat(req, res, next) {
  try {
    const userId = req.userId;
    const { message, conversationId: rawConversationId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message em falta.' });
    }

    let conversationId = rawConversationId ? Number(rawConversationId) : null;

    if (conversationId) {
      const [ownRows] = await pool.query(
        'SELECT id FROM chat_conversations WHERE id = :id AND user_id = :userId',
        { id: conversationId, userId }
      );
      if (!ownRows[0]) return res.status(404).json({ error: 'Conversa não encontrada.' });
    } else {
      const [result] = await pool.query(
        'INSERT INTO chat_conversations (user_id, title) VALUES (:userId, :title)',
        { userId, title: buildTitleFromMessage(message) }
      );
      conversationId = result.insertId;
    }

    const [historyRows] = await pool.query(
      `SELECT role, content FROM chat_messages WHERE conversation_id = :conversationId
       ORDER BY id ASC LIMIT ${MAX_HISTORY_TURNS}`,
      { conversationId }
    );

    const [profileRows] = await pool.query('SELECT * FROM user_profiles WHERE user_id = :userId', { userId });
    const [moduleRows] = await pool.query(
      `SELECT m.name FROM user_modules um JOIN modules m ON m.id = um.module_id
       WHERE um.user_id = :userId AND um.is_active = TRUE`,
      { userId }
    );

    const { textContext, imageParts, meta } = await processAttachments(req.files);
    const fullMessage = textContext ? `${message}\n\n${textContext}` : message;

    const systemPrompt = buildPersonalizedSystemPrompt({ profile: profileRows[0] || null, modules: moduleRows });
    const turns = [...sanitizeHistory(historyRows), { role: 'user', content: fullMessage.slice(0, 8000) }];
    const reply = await generateReply(systemPrompt, turns, imageParts);

    await pool.query(
      'INSERT INTO chat_messages (conversation_id, role, content, attachments) VALUES (:conversationId, :role, :content, :attachments)',
      {
        conversationId,
        role: 'user',
        content: message,
        attachments: meta.length ? JSON.stringify(meta) : null
      }
    );

    await pool.query(
      'INSERT INTO chat_messages (conversation_id, role, content) VALUES (:conversationId, :role, :content)',
      {
        conversationId,
        role: 'assistant',
        content: reply
      }
    );
    await pool.query('UPDATE chat_conversations SET updated_at = NOW() WHERE id = :conversationId', { conversationId });


    

    // Progresso automático: se a pergunta falou de um módulo que o
    // utilizador tem ativo, considera-se que "estudou" esse módulo hoje —
    // avança um pouco o progresso e atualiza a data, sem precisar de
    // nenhum botão manual.
    await autoAdvanceModuleProgress(userId, message);

    res.json({ reply, conversationId });
  } catch (err) {
    next(err);
  }
}

// Casa palavras da mensagem com os nomes dos módulos ativos do utilizador
// (por palavra inteira, sem distinguir maiúsculas/acentos) e avança um pouco
// o progresso de cada módulo mencionado, até um máximo de 100%.
async function autoAdvanceModuleProgress(userId, message) {
  const normalizedMessage = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const [activeModules] = await pool.query(
    `SELECT um.module_id, um.progress_percent, m.name
     FROM user_modules um JOIN modules m ON m.id = um.module_id
     WHERE um.user_id = :userId AND um.is_active = TRUE`,
    { userId }
  );

  for (const mod of activeModules) {
    const normalizedName = mod.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Casa se qualquer palavra do nome do módulo (com 4+ letras, para evitar
    // falsos positivos com palavras curtas tipo "de"/"em") aparecer na mensagem.
    const nameWords = normalizedName.split(/\s+/).filter((w) => w.length >= 4);
    const matched = nameWords.some((word) => normalizedMessage.includes(word));

    if (matched) {
      const newProgress = Math.min(100, mod.progress_percent + 5);
      await pool.query(
        `UPDATE user_modules SET progress_percent = :newProgress, last_studied_at = NOW()
         WHERE user_id = :userId AND module_id = :moduleId`,
        { userId, moduleId: mod.module_id, newProgress }
      );
    }
  }
}

// GET /api/chat/conversations — lista as conversas do utilizador (mais recente primeiro)
async function listConversations(req, res, next) {
  try {
    const userId = req.userId;
    const [rows] = await pool.query(
      `SELECT c.id, c.title, c.updated_at,
              (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_message
       FROM chat_conversations c
       WHERE c.user_id = :userId
       ORDER BY c.updated_at DESC`,
      { userId }
    );
    res.json({ conversations: rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/chat/conversations/:id — conversa completa com todas as mensagens
async function getConversation(req, res, next) {
  try {
    const userId = req.userId;
    const conversationId = Number(req.params.id);

    const [convRows] = await pool.query(
      'SELECT id, title, updated_at FROM chat_conversations WHERE id = :id AND user_id = :userId',
      { id: conversationId, userId }
    );
    if (!convRows[0]) return res.status(404).json({ error: 'Conversa não encontrada.' });

    const [messages] = await pool.query(
      'SELECT id, role, content, attachments, created_at FROM chat_messages WHERE conversation_id = :id ORDER BY id ASC',
      { id: conversationId }
    );

    res.json({ conversation: convRows[0], messages });
  } catch (err) {
    next(err);
  }
}

module.exports = { publicChat, personalizedChat, listConversations, getConversation };
