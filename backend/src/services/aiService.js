// ============================================================================
// LundoIA — serviço de IA (Google Gemini).
//
// Usa fetch nativo (Node 18+), sem dependências extra. Se GEMINI_API_KEY não
// estiver configurada, devolve uma resposta explicativa em vez de rebentar —
// assim o chat nunca derruba o resto da app só por falta de chave.
// ============================================================================

const dns = require('dns');
// Corrige a causa mais comum de "TypeError: fetch failed" no Node em Windows
// e em muitas redes domésticas: o Node tenta primeiro IPv6, isso falha (ou
// demora) silenciosamente, e só depois tentaria IPv4. Forçar IPv4 primeiro
// evita essa falha logo à partida.
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (err) {
  /* Node < 18.3 não tem este método — sem problema, ignora e segue em frente */
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const FALLBACK_REPLY =
  'A IA da LundoIA ainda não está configurada (falta a GEMINI_API_KEY no .env da backend). ' +
  'Assim que a configurares, passo a responder de verdade às tuas perguntas.';

/**
 * @param {string} systemPrompt - instruções de sistema (persona + contexto).
 * @param {Array<{role: 'user'|'assistant', content: string}>} history - mensagens anteriores da conversa.
 * @param {Array} imageParts - partes de imagem (inlineData) a juntar à última mensagem do utilizador.
 * @returns {Promise<string>} a resposta da IA.
 */
async function generateReply(systemPrompt, history, imageParts = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('[chat simulado — GEMINI_API_KEY não configurada]');
    return FALLBACK_REPLY;
  }

  const contents = history.map((turn, index) => {
    const isLastUserTurn = index === history.length - 1 && turn.role === 'user';
    const parts = [{ text: turn.content }];
    if (isLastUserTurn && imageParts.length) {
      parts.push(...imageParts);
    }
    return {
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });

  try {
    const res = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Erro da API Gemini:', res.status, errBody);

      if (res.status === 429) {
        return 'Atingi o limite gratuito da IA por agora (a Google limita o número de mensagens por minuto/dia no nível grátis). Espera um pouco e tenta outra vez — se isto acontecer muito, pode ser preciso ativar faturação na tua conta Google AI Studio.';
      }
      return 'Não consegui gerar uma resposta agora — tenta novamente daqui a pouco.';
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    return text || 'Não consegui gerar uma resposta agora — tenta reformular a pergunta.';
  } catch (err) {
    console.error('Falha ao chamar a API Gemini:', err.message, err.cause ? `(causa: ${err.cause.code || err.cause.message})` : '');

    if (err.cause?.code === 'ENOTFOUND' || err.message === 'fetch failed') {
      return 'Não consegui ligar-me à internet a partir do servidor (falha de rede/DNS ao contactar a Google). Confirma que a máquina onde a backend está a correr tem acesso à internet e que a firewall/antivírus não está a bloquear o Node.';
    }
    return 'Não foi possível ligar ao serviço de IA. Tenta novamente daqui a pouco.';
  }
}

module.exports = { generateReply };
