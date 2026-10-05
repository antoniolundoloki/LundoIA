// ============================================================================
// LundoIA — app.js
// Interatividade partilhada pelas telas internas (sidebar, painel de secções,
// chat, cursos, definições, autenticação e perfil).
// Liga-se à backend em API_BASE_URL (ver src/server.js no projeto da API).
// ============================================================================

const API_BASE_URL = 'https://lundoia-backend.onrender.com/api';

// Client ID do Google Cloud Console (Credentials → OAuth 2.0 Client ID → tipo
// "Web application"). Sem isto preenchido, os botões "Continuar com Google"
// ficam desativados. Tem de bater certo com o GOOGLE_CLIENT_ID do .env da backend.
const GOOGLE_CLIENT_ID = '689879800179-4jd1scakrrs0ois7o9qbt87ib1uev9cb.apps.googleusercontent.com';

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initThemeToggle();
  initViewRouter();
  initAuthTabs();
  initChatPage();
  initPublicChat();
  initLibrary();
  initSettingsFeedback();
  initAuthForms();
  initForgotPassword();
  initResetPassword();
  initGoogleAuth();
  initLogout();
  initProfileForm();
  initOnboarding();
  initModulesPage();
  initAppData();
  initMobileMenu();
});

// ----------------------------------------------------------------------------
// Sessão — tokens guardados em localStorage e wrapper de fetch que trata
// automaticamente da autenticação (anexa o token, renova-o quando expira).
// ----------------------------------------------------------------------------
const TOKEN_KEYS = {
  access: 'lundoia-access-token',
  refresh: 'lundoia-refresh-token',
  user: 'lundoia-user',
};

function getAccessToken() {
  return window.localStorage.getItem(TOKEN_KEYS.access);
}

function getRefreshToken() {
  return window.localStorage.getItem(TOKEN_KEYS.refresh);
}

function setSession({ accessToken, refreshToken, user }) {
  if (accessToken) window.localStorage.setItem(TOKEN_KEYS.access, accessToken);
  if (refreshToken) window.localStorage.setItem(TOKEN_KEYS.refresh, refreshToken);
  if (user) window.localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(user));
}

function clearSession() {
  window.localStorage.removeItem(TOKEN_KEYS.access);
  window.localStorage.removeItem(TOKEN_KEYS.refresh);
  window.localStorage.removeItem(TOKEN_KEYS.user);
}

function goToLogin() {
  clearSession();
  window.location.replace('entrar.html');
}

// Tenta renovar o access token com o refresh token guardado.
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setSession({ accessToken: data.accessToken });
    return true;
  } catch (err) {
    return false;
  }
}

// Wrapper de fetch: anexa o Bearer token e, se a backend responder 401
// (token expirado), tenta renová-lo uma vez e repete o pedido original.
// Se a renovação falhar, envia para o login.
async function apiFetch(path, options = {}) {
  const accessToken = getAccessToken();
  const isFormData = options.body instanceof FormData;
  const headers = { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    const renewed = await refreshAccessToken();
    if (renewed) {
      headers.Authorization = `Bearer ${getAccessToken()}`;
      res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    }
  }

  if (res.status === 401) {
    goToLogin();
    throw new Error('Sessão expirada.');
  }

  return res;
}

// ----------------------------------------------------------------------------
// Sidebar (abrir/fechar em ecrãs pequenos)
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// Menu hambúrguer (index.html) — abre/fecha o menu móvel e troca o ícone.
// ----------------------------------------------------------------------------
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-nav');
  if (!toggle || !menu) return;

  const iconMenu = toggle.querySelector('.icon-menu');
  const iconClose = toggle.querySelector('.icon-close');

  function setOpen(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (iconMenu) iconMenu.hidden = open;
    if (iconClose) iconClose.hidden = !open;
  }

  toggle.addEventListener('click', () => setOpen(menu.hidden));

  // Fecha ao escolher uma opção do menu, e ao passar para ecrã de desktop.
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && !menu.hidden) setOpen(false);
  });
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar || !toggle || !overlay) return;

  function open() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-open');
  }
  function close() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');
  }

  toggle.addEventListener('click', open);
  overlay.addEventListener('click', close);
  sidebar.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
}

// ----------------------------------------------------------------------------
// Alternância de tema — troca de facto entre modo escuro e modo claro,
// mostrando sempre apenas o ícone do tema que ainda NÃO está ativo
// (lua azul para ativar o escuro, sol laranja para ativar o claro), e
// guarda a preferência para a próxima visita.
// ----------------------------------------------------------------------------
// Remove acentos e normaliza para minúsculas — usado para comparar o curso
// escrito livremente pelo utilizador com listas de palavras-chave.
function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const THEME_STORAGE_KEY = 'lundoia-theme';

// Aplica o tema (chamada partilhada pelo botão da sidebar e pelo interruptor
// "Modo escuro" em Definições, para os dois ficarem sempre sincronizados).
function applyTheme(theme) {
  const root = document.documentElement;
  const isLight = theme === 'light';
  root.classList.toggle('light', isLight);

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    const sunIcon = btn.querySelector('.icon-sun');
    const moonIcon = btn.querySelector('.icon-moon');
    // Mostra o ícone que representa o tema ATUAL: sol quando o modo claro
    // está ativo, lua quando o modo escuro está ativo.
    // NOTA: usamos toggleAttribute (não a propriedade .hidden) porque em
    // elementos <svg> a propriedade .hidden não remove o atributo "hidden"
    // do HTML de forma fiável — o ícone ficava sempre escondido pelo CSS
    // "svg[hidden]" mesmo depois de .hidden ser definido como false.
    sunIcon.toggleAttribute('hidden', !isLight);
    moonIcon.toggleAttribute('hidden', isLight);
    btn.setAttribute('aria-pressed', String(isLight));
    btn.setAttribute('aria-label', isLight ? 'Ativar modo escuro' : 'Ativar modo claro');
  }

  const settingsToggle = document.getElementById('settings-dark-mode');
  if (settingsToggle) settingsToggle.checked = !isLight;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (err) {
    /* localStorage indisponível — a preferência não é guardada nesta sessão */
  }
}

function getSavedTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  } catch (err) {
    return 'dark';
  }
}

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  applyTheme(getSavedTheme());
  if (!btn) return;

  btn.addEventListener('click', () => {
    const next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
    applyTheme(next);
    if (document.getElementById('onboarding-overlay')) {
      // Só existe em painel.html, onde há sessão — persiste na backend.
      apiFetch('/settings', { method: 'PATCH', body: JSON.stringify({ darkMode: next === 'dark' }) }).catch(() => {});
    }
  });
}

// ----------------------------------------------------------------------------
// Router de secções da app (painel.html) — troca a área visível dentro da
// MESMA página, sem recarregar. A navegação usa a hash do URL (#chat,
// #biblioteca, ...), o que também permite partilhar/recarregar numa secção.
// ----------------------------------------------------------------------------
function initViewRouter() {
  const sections = document.querySelectorAll('main .view[data-view]');
  const navLinks = document.querySelectorAll('.sidebar__nav .nav-item');
  if (!sections.length) return;

  const views = Array.from(sections).map((s) => s.dataset.view);
  const titles = {
    painel: 'Painel',
    chat: 'Chat IA',
    modulos: 'Módulos',
    biblioteca: 'Biblioteca',
    historico: 'Histórico',
    perfil: 'Perfil',
    definicoes: 'Definições',
  };

  function activate(view) {
    if (!views.includes(view)) view = views[0];

    sections.forEach((section) => {
      const isActive = section.dataset.view === view;
      section.classList.toggle('is-active', isActive);
      section.hidden = !isActive;
    });

    if (view === 'historico') {
      loadConversations();
      loadHistory();
    }

    navLinks.forEach((link) => {
      const target = (link.getAttribute('href') || '').replace('#', '');
      link.classList.toggle('is-active', target === view);
    });

    document.title = titles[view] ? `${titles[view]} — LundoIA` : 'LundoIA';

    const main = document.querySelector('.main');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'instant' });
      main.classList.toggle('main--chat', view === 'chat');
    }
  }

  function route() {
    const view = (window.location.hash || `#${views[0]}`).slice(1);
    activate(view);
  }

  window.addEventListener('hashchange', route);
  route();
}

// ----------------------------------------------------------------------------
// Alternador Entrar / Criar conta (entrar.html) — troca a área do formulário
// dentro da MESMA página, sem navegar para outro ficheiro.
// ----------------------------------------------------------------------------
function initAuthTabs() {
  const tabs = document.querySelectorAll('[data-auth-tab]');
  const panels = document.querySelectorAll('[data-auth-panel]');
  if (!panels.length) return;

  const titles = {
    entrar: 'Entrar — LundoIA',
    criar: 'Criar conta — LundoIA',
    recuperar: 'Recuperar password — LundoIA',
    'nova-password': 'Nova password — LundoIA',
  };
  const validModes = Object.keys(titles);

  function activate(mode) {
    if (!validModes.includes(mode)) mode = 'entrar';

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.authPanel !== mode;
    });

    document.querySelectorAll('.auth-tabs__btn[data-auth-tab]').forEach((btn) => {
      const isActive = btn.dataset.authTab === mode;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    document.title = titles[mode];
  }

  tabs.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = el.dataset.authTab;
      activate(mode);
      window.history.replaceState(null, '', `#${mode}`);
    });
  });

  document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    activate('recuperar');
    window.history.replaceState(null, '', '#recuperar');
  });

  // Veio de um link de email (?reset=TOKEN) — abre já o painel de nova password.
  const resetToken = new URLSearchParams(window.location.search).get('reset');
  if (resetToken) {
    activate('nova-password');
  } else {
    activate((window.location.hash || '#entrar').slice(1));
  }
}

// ----------------------------------------------------------------------------
// Renderização das mensagens da LundoIA — Markdown → HTML rico (títulos,
// listas, tabelas, código com destaque de sintaxe e botão de copiar,
// matemática em KaTeX, caixas de nota/dica/aviso/exemplo, índice automático).
// ----------------------------------------------------------------------------
const CALLOUT_MARKERS = {
  '📌': 'note',
  '💡': 'tip',
  '⚠️': 'warning',
  '✅': 'example',
};

function slugifyHeading(text, usedSlugs) {
  let base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'seccao';
  let slug = base;
  let i = 2;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  usedSlugs.add(slug);
  return slug;
}

function enhanceCodeBlocks(bubble) {
  bubble.querySelectorAll('pre').forEach((pre) => {
    const code = pre.querySelector('code');
    if (!code) return;

    if (window.hljs) {
      try {
        window.hljs.highlightElement(code);
      } catch (err) {
        /* código sem linguagem reconhecida — fica sem destaque de sintaxe */
      }
    }

    const langMatch = Array.from(code.classList).find((c) => c.startsWith('language-'));
    const langLabel = langMatch ? langMatch.replace('language-', '') : 'texto';

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    const header = document.createElement('div');
    header.className = 'code-block__header';
    header.innerHTML = `<span class="code-block__lang">${langLabel}</span>`;

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'code-block__copy';
    copyBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(code.textContent).then(() => {
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Copiado';
        window.setTimeout(() => {
          copyBtn.innerHTML = original;
        }, 1500);
      });
    });
    header.appendChild(copyBtn);

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

function enhanceCallouts(bubble) {
  bubble.querySelectorAll('blockquote').forEach((quote) => {
    const firstText = quote.textContent.trim();
    const marker = Object.keys(CALLOUT_MARKERS).find((emoji) => firstText.startsWith(emoji));
    quote.classList.add('callout');
    quote.classList.add(`callout--${marker ? CALLOUT_MARKERS[marker] : 'note'}`);
  });
}

function enhanceLinks(bubble) {
  bubble.querySelectorAll('a').forEach((link) => {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.classList.add('msg-link');
  });
}

function enhanceTables(bubble) {
  bubble.querySelectorAll('table').forEach((table) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function buildTableOfContents(bubble) {
  const headings = Array.from(bubble.querySelectorAll('h1, h2, h3'));
  if (headings.length < 3) return;

  const usedSlugs = new Set();
  const items = headings.map((h) => {
    const id = slugifyHeading(h.textContent, usedSlugs);
    h.id = id;
    const level = Number(h.tagName.slice(1));
    return `<li class="toc__item toc__item--h${level}"><a href="#${id}">${h.textContent}</a></li>`;
  });

  const toc = document.createElement('nav');
  toc.className = 'msg-toc';
  toc.innerHTML = `<span class="msg-toc__title">📑 Índice</span><ul>${items.join('')}</ul>`;
  bubble.prepend(toc);

  toc.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = bubble.querySelector(link.getAttribute('href'));
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderMathIn(bubble) {
  if (!window.renderMathInElement) return;
  try {
    window.renderMathInElement(bubble, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
    });
  } catch (err) {
    /* falha a renderizar matemática — o texto em bruto fica visível na mesma */
  }
}

function renderAssistantMessage(bubble, content) {
  if (!window.marked) {
    bubble.textContent = content;
    return;
  }

  const rawHtml = window.marked.parse(content, { breaks: true, gfm: true });
  bubble.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(rawHtml) : rawHtml;

  enhanceCodeBlocks(bubble);
  enhanceCallouts(bubble);
  enhanceLinks(bubble);
  enhanceTables(bubble);
  buildTableOfContents(bubble);
  renderMathIn(bubble);
}

// ----------------------------------------------------------------------------
// Chat (secção completa) — chat personalizado, autenticado
// ----------------------------------------------------------------------------
let pendingConversationId = null;
let openConversationExternally = () => {};

function initChatPage() {
  const emptyState = document.getElementById('chat-empty');
  const messagesEl = document.getElementById('chat-messages-full');
  const formEl = document.getElementById('chat-form-full');
  const inputEl = document.getElementById('chat-input-full');
  const sendBtn = document.getElementById('chat-send-full');
  const newChatBtn = document.getElementById('chat-new-btn');
  const suggestionButtons = document.querySelectorAll('[data-suggestion]');

  const attachBtn = document.getElementById('chat-attach-btn');
  const fileInput = document.getElementById('chat-file-input');
  const attachmentsList = document.getElementById('chat-attachments');

  if (!formEl || !inputEl || !sendBtn || !messagesEl) return;

  let currentConversationId = null;
  let typing = false;
  let pendingFiles = [];

  function scrollToBottom() {
    messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
  }

  function showEmptyState() {
    if (emptyState) emptyState.hidden = false;
    messagesEl.hidden = true;
    messagesEl.innerHTML = '';
  }

  function showConversation() {
    if (emptyState) emptyState.hidden = true;
    messagesEl.hidden = false;
  }

  function addMessage(role, content, { emphasize = false, autoScroll = true } = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = `msg msg--${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'msg__bubble';
    if (role === 'assistant') {
      renderAssistantMessage(bubble, content);
    } else {
      bubble.textContent = content;
    }
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);

    if (emphasize) {
      // Dá ênfase à pergunta: tenta pô-la o mais perto possível do topo,
      // usando só o conteúdo real que existe (nunca espaço vazio a fingir).
      wrapper.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else if (autoScroll) {
      scrollToBottom();
    }
    // autoScroll:false -> não mexe no scroll (usado na resposta da IA, para
    // não anular a ênfase que a pergunta acabou de receber).

    if (role === 'user') {
      wrapper.classList.add('is-new');
      window.setTimeout(() => wrapper.classList.remove('is-new'), 900);
    }

    return wrapper;
  }

  function showTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg msg--assistant msg--typing';
    wrapper.id = 'typing-indicator-full';
    const bubble = document.createElement('div');
    bubble.className = 'msg__bubble';
    bubble.innerHTML =
      '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    // Sem scrollToBottom aqui de propósito — a pergunta que acabou de ser
    // feita já está em destaque no topo; forçar o scroll agora empurrava-a
    // para fora de vista outra vez.
  }

  function hideTyping() {
    const indicator = document.getElementById('typing-indicator-full');
    if (indicator) indicator.remove();
  }

  function updateSendState() {
    sendBtn.disabled = (!inputEl.value.trim() && pendingFiles.length === 0) || typing;
  }

  // -- Anexos ---------------------------------------------------------------
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function fileTypeIcon(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
    }
    if (['zip', 'rar', '7z'].includes(ext)) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L8.6 3.9A2 2 0 0 0 6.91 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z"/><path d="M12 10v4"/></svg>';
    }
    if (['doc', 'docx'].includes(ext)) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 1.5 4L12 15l1.5 4L15 15"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
  }

  function renderAttachments() {
    if (!attachmentsList) return;
    attachmentsList.innerHTML = '';
    attachmentsList.hidden = pendingFiles.length === 0;

    pendingFiles.forEach((file, index) => {
      const card = document.createElement('div');
      card.className = 'chat-attachments__card';

      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.className = 'chat-attachments__thumb';
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        card.appendChild(img);
      } else {
        const icon = document.createElement('span');
        icon.className = 'chat-attachments__icon';
        icon.innerHTML = fileTypeIcon(file);
        card.appendChild(icon);
      }

      const info = document.createElement('div');
      info.className = 'chat-attachments__info';
      info.innerHTML = `<span class="chat-attachments__name">${file.name}</span><span class="chat-attachments__size">${formatFileSize(file.size)}</span>`;
      card.appendChild(info);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'chat-attachments__remove';
      removeBtn.setAttribute('aria-label', `Remover ${file.name}`);
      removeBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
      removeBtn.addEventListener('click', () => {
        pendingFiles.splice(index, 1);
        renderAttachments();
        updateSendState();
      });
      card.appendChild(removeBtn);
      attachmentsList.appendChild(card);
    });
  }

  attachBtn?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', () => {
    pendingFiles = pendingFiles.concat(Array.from(fileInput.files || []));
    fileInput.value = '';
    renderAttachments();
    updateSendState();
  });

  // -- Enviar mensagem --------------------------------------------------------
  async function send(text) {
    const content = (text || '').trim();
    if ((!content && pendingFiles.length === 0) || typing) return;

    showConversation();
    const questionWrapper = addMessage('user', content || '(ficheiro anexado)', { emphasize: true });
    inputEl.value = '';
    inputEl.style.height = 'auto';

    const filesToSend = pendingFiles;
    pendingFiles = [];
    renderAttachments();
    updateSendState();

    typing = true;
    updateSendState();
    showTyping();

    try {
      const formData = new FormData();
      formData.append('message', content);
      if (currentConversationId) formData.append('conversationId', currentConversationId);
      filesToSend.forEach((file) => formData.append('files', file));

      const res = await apiFetch('/chat', { method: 'POST', body: formData });
      const data = await res.json();
      hideTyping();

      const reply = res.ok ? data.reply : data.error || 'Não foi possível responder agora.';
      addMessage('assistant', reply, { autoScroll: false });
      // A resposta já existe agora — aproveita esse espaço real para tentar
      // pôr a pergunta ainda mais perto do topo (nunca com espaço vazio).
      questionWrapper.scrollIntoView({ behavior: 'instant', block: 'start' });
      if (res.ok && data.conversationId) currentConversationId = data.conversationId;
    } catch (err) {
      hideTyping();
      addMessage('assistant', 'Não foi possível ligar ao servidor. Verifica se a backend está a correr.', { autoScroll: false });
    } finally {
      typing = false;
      updateSendState();
    }
  }

  // -- Nova conversa / abrir conversa do Histórico ---------------------------
  function startNewConversation() {
    currentConversationId = null;
    pendingFiles = [];
    renderAttachments();
    showEmptyState();
    updateSendState();
  }

  async function openConversation(conversationId) {
    try {
      const res = await apiFetch(`/chat/conversations/${conversationId}`);
      if (!res.ok) return;
      const data = await res.json();

      currentConversationId = data.conversation.id;
      showConversation();
      messagesEl.innerHTML = '';
      data.messages.forEach((m) => addMessage(m.role, m.content));
    } catch (err) {
      /* apiFetch já trata do redireccionamento em caso de sessão inválida */
    }
  }

  newChatBtn?.addEventListener('click', startNewConversation);

  openConversationExternally = (conversationId) => {
    window.location.hash = '#chat';
    openConversation(conversationId);
  };

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    send(inputEl.value);
  });

  inputEl.addEventListener('input', () => {
    updateSendState();
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 128) + 'px';
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send(inputEl.value);
    }
  });

  suggestionButtons.forEach((btn) => {
    btn.addEventListener('click', () => send(btn.textContent));
  });

  // Se o utilizador veio do Histórico com uma conversa escolhida, abre-a já.
  if (pendingConversationId) {
    openConversation(pendingConversationId);
    pendingConversationId = null;
  }

  updateSendState();
}

// ----------------------------------------------------------------------------
// Chat público (index.html) — sem sessão, assistente genérica em contexto
// angolano. Chama POST /api/chat/public (sujeito a limite de mensagens).
// ----------------------------------------------------------------------------
function initPublicChat() {
  const messagesEl = document.getElementById('chat-messages');
  const suggestionsEl = document.getElementById('chat-suggestions');
  const formEl = document.getElementById('chat-form');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');

  if (!formEl || !inputEl || !sendBtn || !messagesEl) return;

  const conversation = [];
  let typing = false;

  function scrollToBottom() {
    messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
  }

  function addMessage(role, content, { emphasize = false, autoScroll = true } = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = `msg msg--${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'msg__bubble';
    if (role === 'assistant') {
      renderAssistantMessage(bubble, content);
    } else {
      bubble.textContent = content;
    }
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);

    if (emphasize) {
      wrapper.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else if (autoScroll) {
      scrollToBottom();
    }

    if (role === 'user') {
      wrapper.classList.add('is-new');
      window.setTimeout(() => wrapper.classList.remove('is-new'), 900);
    }

    return wrapper;
  }

  function showTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg msg--assistant msg--typing';
    wrapper.id = 'typing-indicator';
    const bubble = document.createElement('div');
    bubble.className = 'msg__bubble';
    bubble.innerHTML =
      '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    scrollToBottom();
  }

  function hideTyping() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  function updateSendState() {
    sendBtn.disabled = !inputEl.value.trim() || typing;
  }

  async function send(text) {
    const content = (text || '').trim();
    if (!content || typing) return;

    if (suggestionsEl) suggestionsEl.hidden = true;

    const questionWrapper = addMessage('user', content, { emphasize: true });
    conversation.push({ role: 'user', content });
    inputEl.value = '';
    updateSendState();

    typing = true;
    updateSendState();
    showTyping();

    try {
      const res = await fetch(`${API_BASE_URL}/chat/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: conversation.slice(0, -1) }),
      });
      const data = await res.json();
      hideTyping();

      const reply = res.ok ? data.reply : data.error || 'Não foi possível responder agora.';
      addMessage('assistant', reply, { autoScroll: false });
      questionWrapper.scrollIntoView({ behavior: 'instant', block: 'start' });
      conversation.push({ role: 'assistant', content: reply });
    } catch (err) {
      hideTyping();
      addMessage('assistant', 'Não foi possível ligar ao servidor. Verifica se a backend está a correr.', { autoScroll: false });
    } finally {
      typing = false;
      updateSendState();
    }
  }

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    send(inputEl.value);
  });

  inputEl.addEventListener('input', updateSendState);

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send(inputEl.value);
    }
  });

  document.querySelectorAll('.suggestion-chip').forEach((btn) => {
    btn.addEventListener('click', () => send(btn.textContent));
  });

  updateSendState();
}

// ----------------------------------------------------------------------------
// Biblioteca — pesquisa por título/área. A ordem/destaque dos recursos é
// personalizada automaticamente por initPersonalization() a partir do curso
// indicado no onboarding (sem filtro manual).
// ----------------------------------------------------------------------------
function renderLibraryCard(resource) {
  const typeLabel = { livro: 'Livro', sebenta: 'Sebenta', artigo: 'Artigo' }[resource.resource_type] || 'Recurso';
  const metaParts = [resource.category, typeLabel, resource.pages ? `${resource.pages}p` : null];
  if (resource.source_label) metaParts.push(resource.source_label);
  const meta = metaParts.filter(Boolean).join(' · ');
  const isExternal = !resource.file_name && Boolean(resource.source_url);

  const card = document.createElement('div');
  card.className = 'library-card';
  card.dataset.id = resource.id;
  card.dataset.title = resource.title;
  card.dataset.meta = meta;
  if (resource.file_name) card.dataset.fileName = resource.file_name;
  if (resource.source_url) card.dataset.sourceUrl = resource.source_url;
  card.innerHTML = `
    <span class="library-card__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="19" height="19"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg></span>
    <div class="library-card__body">
      <h3>${resource.title}</h3>
      <span>${meta}</span>
    </div>
    <div class="library-card__actions">
      <button type="button" class="library-card__read" aria-label="${isExternal ? 'Ver na fonte oficial' : 'Ler online'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
        ${isExternal ? 'Ver fonte' : 'Ler'}
      </button>
      ${isExternal ? '' : `<button type="button" class="library-card__download" aria-label="Descarregar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg></button>`}
    </div>`;
  return card;
}


function setupLibrarySearch() {
  const searchInput = document.getElementById('library-search');

  if (!searchInput) {
    console.warn('[Biblioteca] Campo de pesquisa não encontrado.');
    return;
  }

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value
      .trim()
      .toLowerCase();

    const cards = document.querySelectorAll('.library-card');

    cards.forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const meta = (card.dataset.meta || '').toLowerCase();

      const matches =
        title.includes(searchTerm) ||
        meta.includes(searchTerm);

      card.style.display = matches ? '' : 'none';
    });
  });
}


// Abre um ficheiro nosso (autenticado) num separador novo, ou faz o download,
// buscando-o com o token de acesso e criando um URL temporário local.
async function openLibraryFile(id, mode, fileName) {
  const res = await apiFetch(`/library/${id}/file?mode=${mode}`);
  if (!res.ok) throw new Error('Não foi possível obter o ficheiro.');
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  if (mode === 'download') {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'documento.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } else {
    window.open(blobUrl, '_blank');
  }
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
}

function bindLibraryCardActions(grid) {
  grid.querySelectorAll('.library-card__read').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.library-card');
      const { id, sourceUrl } = card.dataset;
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg> A abrir';

      try {
        if (sourceUrl) {
          window.open(sourceUrl, '_blank', 'noopener');
        } else {
          await openLibraryFile(id, 'inline');
        }
      } catch (err) {
        /* falha silenciosa — o botão volta ao estado normal a seguir */
      } finally {
        window.setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = original;
        }, 1000);
      }
    });
  });

  grid.querySelectorAll('.library-card__download').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.library-card');
      const { id, fileName } = card.dataset;
      btn.style.color = 'var(--primary)';
      try {
        await openLibraryFile(id, 'download', fileName);
      } catch (err) {
        /* falha silenciosa */
      } finally {
        window.setTimeout(() => {
          btn.style.color = '';
        }, 600);
      }
    });
  });
}

// Vai buscar à backend os recursos da categoria do curso/área do utilizador
// e substitui o grid estático por estes cartões.
async function loadLibrary() {
  const grid = document.getElementById('library-grid');
  const subtitle = document.getElementById('library-subtitle');
  if (!grid) return;

  try {
    const res = await apiFetch('/library');
    if (!res.ok) return;
    const data = await res.json();

    grid.innerHTML = '';
    (data.resources || []).forEach((resource) => grid.appendChild(renderLibraryCard(resource)));
    bindLibraryCardActions(grid);

    if (subtitle) {
      subtitle.textContent = data.category && data.category !== 'generico'
        ? `Recursos selecionados para a tua área: ${data.category}.`
        : 'Livros, sebentas e artigos organizados por área.';
    }
  } catch (err) {
    /* apiFetch já trata do redireccionamento em caso de sessão inválida */
  }
}

function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return `Hoje, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? '1 semana atrás' : `${weeks} semanas atrás`;
}

const HISTORY_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

// Vai buscar a atividade real de estudo à backend — uma conta recém-criada
// não tem nenhuma entrada, porque ainda não estudou nada.
async function loadHistory() {
  const list = document.getElementById('history-list');
  const emptyState = document.getElementById('history-empty');
  if (!list) return;

  try {
    const res = await apiFetch('/history');
    if (!res.ok) return;
    const { history } = await res.json();

    list.innerHTML = '';
    if (!history || history.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }
    if (emptyState) emptyState.hidden = true;

    history.forEach((entry) => {
      const item = document.createElement('a');
      item.href = '#chat';
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-item__main">
          <span class="history-item__icon">${HISTORY_ICON_SVG}</span>
          <div class="history-item__body">
            <h3>${entry.name}</h3>
            <p>Progresso: ${entry.progress_percent}%</p>
          </div>
        </div>
        <span class="history-item__date">${formatRelativeDate(entry.last_studied_at)}</span>`;
      list.appendChild(item);
    });
  } catch (err) {
    /* apiFetch já trata do redireccionamento em caso de sessão inválida */
  }
}

// Vai buscar as conversas de chat do utilizador — cada uma abre no Chat ao
// ser clicada, via openConversationExternally (lida por initChatPage).
async function loadConversations() {
  const list = document.getElementById('conversations-list');
  const emptyState = document.getElementById('conversations-empty');
  if (!list) return;

  try {
    const res = await apiFetch('/chat/conversations');
    if (!res.ok) return;
    const { conversations } = await res.json();

    list.innerHTML = '';
    if (!conversations || conversations.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }
    if (emptyState) emptyState.hidden = true;

    conversations.forEach((conv) => {
      const item = document.createElement('a');
      item.href = '#chat';
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-item__main">
          <span class="history-item__icon">${HISTORY_ICON_SVG}</span>
          <div class="history-item__body">
            <h3>${conv.title}</h3>
            <p>${conv.last_message ? conv.last_message.slice(0, 80) : 'Sem mensagens'}</p>
          </div>
        </div>
        <span class="history-item__date">${formatRelativeDate(conv.updated_at)}</span>`;
      item.addEventListener('click', (e) => {
        e.preventDefault();
        openConversationExternally(conv.id);
      });
      list.appendChild(item);
    });
  } catch (err) {
    /* apiFetch já trata do redireccionamento em caso de sessão inválida */
  }
}

function initLibrary() {
  const searchInput = document.getElementById('library-search');
  const grid = document.getElementById('library-grid');
  const emptyState = document.getElementById('library-empty');
  if (!grid) return;

  function applyFilters() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    const cards = Array.from(grid.querySelectorAll('.library-card'));
    let visibleCount = 0;

    cards.forEach((card) => {
      const title = (card.dataset.title || '').toLowerCase();
      const meta = (card.dataset.meta || '').toLowerCase();

      const visible = !query || title.includes(query) || meta.includes(query);

      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount > 0;
  }

  searchInput?.addEventListener('input', applyFilters);
  setupLibrarySearch();
}
// ----------------------------------------------------------------------------
// Definições — lê/grava as preferências reais na backend (GET/PATCH /api/settings)
// ----------------------------------------------------------------------------
async function loadSettings() {
  const darkModeToggle = document.getElementById('settings-dark-mode');
  const studyRemindersToggle = document.getElementById('settings-study-reminders');
  const platformNewsToggle = document.getElementById('settings-platform-news');
  const saveChatHistoryToggle = document.getElementById('settings-save-chat-history');
  if (!darkModeToggle && !studyRemindersToggle && !platformNewsToggle && !saveChatHistoryToggle) return;

  try {
    const res = await apiFetch('/settings');
    if (!res.ok) return;
    const { settings } = await res.json();

    if (darkModeToggle) applyTheme(settings.dark_mode ? 'dark' : 'light');
    if (studyRemindersToggle) studyRemindersToggle.checked = Boolean(settings.study_reminders);
    if (platformNewsToggle) platformNewsToggle.checked = Boolean(settings.platform_news);
    if (saveChatHistoryToggle) saveChatHistoryToggle.checked = Boolean(settings.save_chat_history);
  } catch (err) {
    /* apiFetch já trata do redireccionamento em caso de sessão inválida */
  }
}

function initSettingsFeedback() {
  const note = document.getElementById('settings-note');
  const darkModeToggle = document.getElementById('settings-dark-mode');
  const studyRemindersToggle = document.getElementById('settings-study-reminders');
  const platformNewsToggle = document.getElementById('settings-platform-news');
  const saveChatHistoryToggle = document.getElementById('settings-save-chat-history');

  function showSavedNote() {
    if (!note) return;
    note.textContent = 'Preferências guardadas.';
    note.classList.add('is-success');
    window.clearTimeout(note._timeout);
    note._timeout = window.setTimeout(() => {
      note.textContent = '';
      note.classList.remove('is-success');
    }, 2000);
  }

  function patchSettings(body) {
    apiFetch('/settings', { method: 'PATCH', body: JSON.stringify(body) })
      .then(() => showSavedNote())
      .catch(() => {
        /* apiFetch já trata do redireccionamento em caso de sessão inválida */
      });
  }

  // O tema já é aplicado de imediato (localStorage) por initThemeToggle; aqui
  // só garantimos que a escolha também fica guardada na base de dados.
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', () => {
      applyTheme(darkModeToggle.checked ? 'dark' : 'light');
      patchSettings({ darkMode: darkModeToggle.checked });
    });
  }
  if (studyRemindersToggle) {
    studyRemindersToggle.addEventListener('change', () => {
      patchSettings({ studyReminders: studyRemindersToggle.checked });
    });
  }
  if (platformNewsToggle) {
    platformNewsToggle.addEventListener('change', () => {
      patchSettings({ platformNews: platformNewsToggle.checked });
    });
  }
  if (saveChatHistoryToggle) {
    saveChatHistoryToggle.addEventListener('change', () => {
      patchSettings({ saveChatHistory: saveChatHistoryToggle.checked });
    });
  }
}

// ----------------------------------------------------------------------------
// Autenticação (entrar.html) — regista/autentica contra a backend real.
// ----------------------------------------------------------------------------
function showFormNote(form, message, isError) {
  const note = form.querySelector('.form-note');
  if (!note) return;
  note.textContent = message;
  note.classList.toggle('is-error', Boolean(isError));
  note.classList.toggle('is-success', !isError);
}

function initAuthForms() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      submitBtn.disabled = true;
      showFormNote(loginForm, 'A entrar...', false);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          showFormNote(loginForm, data.error || 'Não foi possível entrar.', true);
          submitBtn.disabled = false;
          return;
        }

        setSession(data);
        window.location.href = 'painel.html';
      } catch (err) {
        showFormNote(loginForm, 'Não foi possível ligar ao servidor. Verifica se a backend está a correr.', true);
        submitBtn.disabled = false;
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;

      submitBtn.disabled = true;
      showFormNote(signupForm, 'A criar a tua conta...', false);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          showFormNote(signupForm, data.error || 'Não foi possível criar a conta.', true);
          submitBtn.disabled = false;
          return;
        }

        setSession(data);
        window.location.href = 'painel.html';
      } catch (err) {
        showFormNote(signupForm, 'Não foi possível ligar ao servidor. Verifica se a backend está a correr.', true);
        submitBtn.disabled = false;
      }
    });
  }
}

// ----------------------------------------------------------------------------
// Login com Google — usa o Google Identity Services (carregado em entrar.html)
// para obter um ID token e troca-o por uma sessão na nossa backend.
// ----------------------------------------------------------------------------
function initForgotPassword() {
  const form = document.getElementById('forgot-password-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const email = document.getElementById('forgot-email').value.trim();

    submitBtn.disabled = true;
    showFormNote(form, 'A enviar...', false);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      showFormNote(form, data.message || 'Se existir uma conta com esse email, foi enviado um link.', !res.ok);
      if (res.ok) form.reset();
    } catch (err) {
      showFormNote(form, 'Não foi possível ligar ao servidor. Verifica se a backend está a correr.', true);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function initResetPassword() {
  const form = document.getElementById('reset-password-form');
  if (!form) return;

  const token = new URLSearchParams(window.location.search).get('reset');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const password = document.getElementById('reset-password-input').value;

    if (!token) {
      showFormNote(form, 'Link inválido — pede um novo em "Esqueceste a password?".', true);
      return;
    }

    submitBtn.disabled = true;
    showFormNote(form, 'A guardar...', false);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        showFormNote(form, data.error || 'Não foi possível alterar a palavra-passe.', true);
        return;
      }
      showFormNote(form, 'Palavra-passe alterada! Já podes entrar com a nova.', false);
      form.reset();
      window.setTimeout(() => {
        window.history.replaceState(null, '', 'entrar.html#entrar');
        window.location.reload();
      }, 1500);
    } catch (err) {
      showFormNote(form, 'Não foi possível ligar ao servidor. Verifica se a backend está a correr.', true);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function initGoogleAuth() {
  const slots = document.querySelectorAll('[data-google-slot]');
  if (slots.length === 0) return;

  if (!GOOGLE_CLIENT_ID) {
    slots.forEach((slot) => {
      const btn = slot.querySelector('.btn--google');
      if (btn) {
        btn.disabled = true;
        btn.title = 'Login com Google ainda não está configurado (falta o GOOGLE_CLIENT_ID).';
      }
    });
    return;
  }

  async function handleCredentialResponse(response) {
    const activePanel = document.querySelector('.auth-mode[data-auth-panel]:not([hidden])') || document.querySelector('.auth-mode');
    const form = activePanel?.querySelector('form');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (form) showFormNote(form, data.error || 'Não foi possível entrar com o Google.', true);
        return;
      }

      setSession(data);
      window.location.href = 'painel.html';
    } catch (err) {
      if (form) showFormNote(form, 'Não foi possível ligar ao servidor. Verifica se a backend está a correr.', true);
    }
  }

  function ready() {
    return window.google && window.google.accounts && window.google.accounts.id;
  }

  function render() {
    if (!ready()) {
      window.setTimeout(render, 300);
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    // Renderiza o botão oficial do Google (mais fiável do que acionar o
    // popup "One Tap" a partir de um botão à parte, que muitos browsers
    // bloqueiam silenciosamente por causa de cookies de terceiros/FedCM).
    slots.forEach((slot) => {
      slot.innerHTML = '';
      window.google.accounts.id.renderButton(slot, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
        width: 320,
      });
    });
  }

  render();
}

// ----------------------------------------------------------------------------
// Terminar sessão — os dois botões (sidebar e Definições) apontam para
// entrar.html; aqui interceptamos o clique para invalidar a sessão na
// backend e limpar os tokens antes de navegar.
// ----------------------------------------------------------------------------
function initLogout() {
  document.querySelectorAll('a[href="entrar.html"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const refreshToken = getRefreshToken();
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).finally(() => {
        clearSession();
        window.location.href = 'entrar.html';
      });
    });
  });
}

// ----------------------------------------------------------------------------
// Perfil — guarda as alterações do formulário na backend.
// ----------------------------------------------------------------------------
function initProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const name = document.getElementById('profile-name')?.value.trim();
    const institutionName = document.getElementById('profile-university')?.value.trim();
    const course = document.getElementById('profile-course')?.value.trim();
    const yearOrGrade = document.getElementById('profile-year')?.value.trim();
    const area = document.getElementById('profile-area')?.value.trim();

    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await apiFetch('/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, institutionName, course, yearOrGrade, area }),
      });
      const data = await res.json();

      if (!res.ok) {
        showFormNote(form, data.error || 'Não foi possível guardar as alterações.', true);
        return;
      }
      showFormNote(form, 'Alterações guardadas com sucesso.', false);

      // Reflete o nome atualizado no cabeçalho do Perfil e no avatar, sem
      // precisar de recarregar a página.
      if (name) {
        const headName = document.querySelector('.profile-head h2');
        const avatar = document.querySelector('.profile-avatar');
        if (headName) headName.textContent = name;
        if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
      }
    } catch (err) {
      showFormNote(form, 'Não foi possível ligar ao servidor.', true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      window.clearTimeout(form._noteTimeout);
      form._noteTimeout = window.setTimeout(() => {
        const note = form.querySelector('.form-note');
        if (note) {
          note.textContent = '';
          note.classList.remove('is-success', 'is-error');
        }
      }, 2500);
    }
  });
}

// ----------------------------------------------------------------------------
// Personalização — o Painel, os Módulos, a Biblioteca e o Perfil refletem o
// perfil académico e os módulos ativos vindos da backend (GET /api/profile).
// ----------------------------------------------------------------------------
// Verifica se last_studied_at (vindo da BD, formato "YYYY-MM-DD HH:MM:SS")
// já é de hoje — usado para mostrar "Estudado hoje" em vez de "Estudei hoje".
function isStudiedToday(lastStudiedAt) {
  if (!lastStudiedAt) return false;
  const studied = new Date(lastStudiedAt.replace(' ', 'T'));
  const now = new Date();
  return (
    studied.getFullYear() === now.getFullYear() &&
    studied.getMonth() === now.getMonth() &&
    studied.getDate() === now.getDate()
  );
}

const MODULE_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>';

const DEFAULT_MODULE_LABELS = [
  'Fundamentos da área',
  'Exercícios práticos',
  'Resumos guiados',
  'Preparação para provas',
  'Projetos práticos',
];

// Palavras-chave para relacionar o curso com as disciplinas fixas da
// Biblioteca (Direito, Matemática, Medicina, Informática, Economia, Física).
// ============================================================================
// RELAÇÃO ENTRE CURSOS E DISCIPLINAS DA BIBLIOTECA
// ============================================================================

const LIBRARY_DISCIPLINE_MAP = [

  // --------------------------------------------------------------------------
  // INFORMÁTICA E TECNOLOGIA
  // --------------------------------------------------------------------------

  {
    discipline: 'Informática',
    keywords: [
      'informatica',
      'informática',
      'engenharia informatica',
      'engenharia informática',
      'tecnologia de informacao',
      'tecnologia da informacao',
      'tecnologias de informacao',
      'tecnologias da informacao',
      'tecnologias de informação',
      'tecnologia',
      'ti',
      'computacao',
      'computação',
      'ciencia da computacao',
      'ciência da computação',
      'sistemas de informacao',
      'sistemas de informação',
      'sistemas informaticos',
      'sistemas informáticos'
    ]
  },

  {
    discipline: 'Programação',
    keywords: [
      'programacao',
      'programação',
      'engenharia de software',
      'desenvolvimento de software',
      'desenvolvimento web',
      'desenvolvimento de sistemas',
      'desenvolvimento de aplicacoes',
      'desenvolvimento de aplicações',
      'software',
      'programador',
      'programador de software',
      'programacao web',
      'programação web',
      'programacao orientada a objetos',
      'programação orientada a objetos',
      'algoritmos',
      'logica de programacao',
      'lógica de programação'
    ]
  },

  {
    discipline: 'Redes de Computadores',
    keywords: [
      'redes',
      'redes de computadores',
      'engenharia de redes',
      'redes informaticas',
      'redes informáticas',
      'administracao de redes',
      'administração de redes',
      'infraestrutura de redes',
      'infraestrutura de ti',
      'infraestrutura de tecnologia',
      'telecomunicacoes',
      'telecomunicações',
      'comunicacoes',
      'comunicações',
      'seguranca de redes',
      'segurança de redes',
      'networking',
      'sistemas de redes'
    ]
  },

  {
    discipline: 'Banco de Dados',
    keywords: [
      'banco de dados',
      'bases de dados',
      'base de dados',
      'database',
      'databases',
      'administracao de banco de dados',
      'administração de banco de dados',
      'sistemas de banco de dados',
      'gestao de dados',
      'gestão de dados',
      'engenharia de dados',
      'dados',
      'mysql',
      'sql'
    ]
  },

  {
    discipline: 'Cibersegurança',
    keywords: [
      'ciberseguranca',
      'cibersegurança',
      'seguranca informatica',
      'segurança informática',
      'seguranca da informacao',
      'segurança da informação',
      'seguranca de sistemas',
      'segurança de sistemas',
      'seguranca de redes',
      'segurança de redes',
      'seguranca cibernetica',
      'segurança cibernética',
      'cybersecurity',
      'seguranca digital',
      'segurança digital',
      'ethical hacking',
      'hacking',
      'criptografia'
    ]
  },

  {
    discipline: 'Inteligência Artificial',
    keywords: [
      'inteligencia artificial',
      'inteligência artificial',
      'ia',
      'machine learning',
      'aprendizado de maquina',
      'aprendizado de máquina',
      'deep learning',
      'aprendizagem automatica',
      'aprendizagem automática',
      'ciencia de dados',
      'ciência de dados',
      'data science',
      'robotica',
      'robótica',
      'sistemas inteligentes'
    ]
  },


  // --------------------------------------------------------------------------
  // MATEMÁTICA
  // --------------------------------------------------------------------------

  {
    discipline: 'Matemática',
    keywords: [
      'matematica',
      'matemática',
      'matematica geral',
      'matemática geral',
      'matematica aplicada',
      'matemática aplicada',
      'matematica pura',
      'matemática pura',
      'ciencias matematicas',
      'ciências matemáticas',
      'ensino de matematica',
      'ensino de matemática'
    ]
  },

  {
    discipline: 'Cálculo',
    keywords: [
      'calculo',
      'cálculo',
      'calculo diferencial',
      'cálculo diferencial',
      'calculo integral',
      'cálculo integral',
      'calculo diferencial e integral',
      'cálculo diferencial e integral',
      'analise matematica',
      'análise matemática',
      'calculo numerico',
      'cálculo numérico'
    ]
  },

  {
    discipline: 'Estatística',
    keywords: [
      'estatistica',
      'estatística',
      'estatistica aplicada',
      'estatística aplicada',
      'probabilidade',
      'probabilidades',
      'analise estatistica',
      'análise estatística',
      'estatistica e probabilidade',
      'estatística e probabilidade',
      'metodos estatisticos',
      'métodos estatísticos'
    ]
  },


  // --------------------------------------------------------------------------
  // FÍSICA E ENGENHARIAS
  // --------------------------------------------------------------------------

  {
    discipline: 'Física',
    keywords: [
      'fisica',
      'física',
      'fisica geral',
      'física geral',
      'fisica aplicada',
      'física aplicada',
      'fisica teorica',
      'física teórica',
      'fisica experimental',
      'física experimental',
      'mecanica',
      'mecânica',
      'termodinamica',
      'termodinâmica',
      'optica',
      'óptica',
      'eletromagnetismo',
      'electromagnetismo'
    ]
  },

  {
    discipline: 'Engenharia',
    keywords: [
      'engenharia',
      'engenharia civil',
      'engenharia mecanica',
      'engenharia mecânica',
      'engenharia eletrica',
      'engenharia elétrica',
      'engenharia electrotecnica',
      'engenharia electrotécnica',
      'engenharia eletronica',
      'engenharia eletrónica',
      'engenharia informatica',
      'engenharia informática',
      'engenharia industrial',
      'engenharia ambiental',
      'engenharia quimica',
      'engenharia química',
      'engenharia de producao',
      'engenharia de produção'
    ]
  },

  {
    discipline: 'Eletrónica',
    keywords: [
      'eletronica',
      'eletrónica',
      'engenharia eletronica',
      'engenharia eletrónica',
      'eletronica industrial',
      'eletrónica industrial',
      'sistemas eletronicos',
      'sistemas eletrónicos',
      'circuitos eletronicos',
      'circuitos eletrónicos',
      'microeletronica',
      'microeletrónica',
      'automacao',
      'automação',
      'instrumentacao',
      'instrumentação'
    ]
  },


  // --------------------------------------------------------------------------
  // DIREITO
  // --------------------------------------------------------------------------

  {
    discipline: 'Direito',
    keywords: [
      'direito',
      'direito geral',
      'ciencias juridicas',
      'ciências jurídicas',
      'ciencias juridico',
      'ciências jurídico',
      'juridico',
      'jurídico',
      'jurisprudencia',
      'jurisprudência',
      'estudos juridicos',
      'estudos jurídicos',
      'faculdade de direito'
    ]
  },

  {
    discipline: 'Direito Penal',
    keywords: [
      'direito penal',
      'ciencias penais',
      'ciências penais',
      'criminologia',
      'crime',
      'crimes',
      'processo penal',
      'direito criminal',
      'investigacao criminal',
      'investigação criminal'
    ]
  },

  {
    discipline: 'Direito Civil',
    keywords: [
      'direito civil',
      'processo civil',
      'responsabilidade civil',
      'contratos',
      'direito das obrigacoes',
      'direito das obrigações',
      'direito de familia',
      'direito de família',
      'direito das sucessoes',
      'direito das sucessões'
    ]
  },

  {
    discipline: 'Direito Constitucional',
    keywords: [
      'direito constitucional',
      'direito constitucional e administrativo',
      'constituicao',
      'constituição',
      'ciencia politica',
      'ciência política',
      'organizacao do estado',
      'organização do estado',
      'direitos fundamentais'
    ]
  },


  // --------------------------------------------------------------------------
  // MEDICINA E SAÚDE
  // --------------------------------------------------------------------------

  {
    discipline: 'Medicina',
    keywords: [
      'medicina',
      'medicina geral',
      'medicina humana',
      'ciencias medicas',
      'ciências médicas',
      'ciencias da saude',
      'ciências da saúde',
      'medico',
      'médico',
      'clinica',
      'clínica',
      'medicina interna'
    ]
  },

  {
    discipline: 'Enfermagem',
    keywords: [
      'enfermagem',
      'enfermagem geral',
      'enfermagem medico cirurgica',
      'enfermagem médico cirúrgica',
      'enfermagem comunitaria',
      'enfermagem comunitária',
      'enfermagem pediatrica',
      'enfermagem pediátrica',
      'enfermagem obstetrica',
      'enfermagem obstétrica',
      'enfermeiro',
      'enfermeira'
    ]
  },

  {
    discipline: 'Farmácia',
    keywords: [
      'farmacia',
      'farmácia',
      'ciencias farmaceuticas',
      'ciências farmacêuticas',
      'farmaceutica',
      'farmacêutica',
      'farmacologia',
      'farmacoterapia',
      'tecnologia farmaceutica',
      'tecnologia farmacêutica'
    ]
  },

  {
    discipline: 'Análises Clínicas',
    keywords: [
      'analises clinicas',
      'análises clínicas',
      'laboratorio clinico',
      'laboratório clínico',
      'analises laboratoriais',
      'análises laboratoriais',
      'diagnostico laboratorial',
      'diagnóstico laboratorial',
      'bioquimica clinica',
      'bioquímica clínica'
    ]
  },


  // --------------------------------------------------------------------------
  // ECONOMIA, GESTÃO E NEGÓCIOS
  // --------------------------------------------------------------------------

  {
    discipline: 'Economia',
    keywords: [
      'economia',
      'economia geral',
      'economia aplicada',
      'economia empresarial',
      'economia internacional',
      'ciencias economicas',
      'ciências económicas',
      'ciencias economicas e sociais',
      'ciências económicas e sociais',
      'economista'
    ]
  },

  {
    discipline: 'Gestão',
    keywords: [
      'gestao',
      'gestão',
      'gestao empresarial',
      'gestão empresarial',
      'gestao de empresas',
      'gestão de empresas',
      'administracao',
      'administração',
      'administracao de empresas',
      'administração de empresas',
      'gestao empresarial e comercial',
      'gestão empresarial e comercial',
      'gestao de negocios',
      'gestão de negócios'
    ]
  },

  {
    discipline: 'Contabilidade',
    keywords: [
      'contabilidade',
      'contabilidade geral',
      'contabilidade financeira',
      'contabilidade de gestao',
      'contabilidade de gestão',
      'contabilidade empresarial',
      'contabilista',
      'auditoria',
      'auditoria contabilistica',
      'auditoria contábil',
      'fiscalidade',
      'financas empresariais',
      'finanças empresariais'
    ]
  },

  {
    discipline: 'Finanças',
    keywords: [
      'financas',
      'finanças',
      'financas empresariais',
      'finanças empresariais',
      'gestao financeira',
      'gestão financeira',
      'mercado financeiro',
      'mercados financeiros',
      'investimentos',
      'banca',
      'sistema financeiro',
      'analise financeira',
      'análise financeira'
    ]
  },

  {
    discipline: 'Marketing',
    keywords: [
      'marketing',
      'marketing digital',
      'publicidade',
      'comunicacao empresarial',
      'comunicação empresarial',
      'comunicacao e marketing',
      'comunicação e marketing',
      'gestao de marketing',
      'gestão de marketing',
      'mercado',
      'comportamento do consumidor'
    ]
  },


  // --------------------------------------------------------------------------
  // LÍNGUAS E HUMANIDADES
  // --------------------------------------------------------------------------

  {
    discipline: 'Língua Portuguesa',
    keywords: [
      'portugues',
      'português',
      'lingua portuguesa',
      'língua portuguesa',
      'literatura portuguesa',
      'literatura',
      'letras',
      'linguistica',
      'linguística',
      'ensino de portugues',
      'ensino de português'
    ]
  },

  {
    discipline: 'Inglês',
    keywords: [
      'ingles',
      'inglês',
      'lingua inglesa',
      'língua inglesa',
      'literatura inglesa',
      'ensino de ingles',
      'ensino de inglês',
      'estudos ingleses',
      'english'
    ]
  },

  {
    discipline: 'História',
    keywords: [
      'historia',
      'história',
      'historia geral',
      'história geral',
      'historia de africa',
      'história de áfrica',
      'historia africana',
      'história africana',
      'historia de angola',
      'história de angola',
      'ensino de historia',
      'ensino de história'
    ]
  },

  {
    discipline: 'Geografia',
    keywords: [
      'geografia',
      'geografia geral',
      'geografia humana',
      'geografia fisica',
      'geografia física',
      'geografia economica',
      'geografia económica',
      'cartografia',
      'ensino de geografia'
    ]
  },

  {
    discipline: 'Filosofia',
    keywords: [
      'filosofia',
      'filosofia geral',
      'filosofia politica',
      'filosofia política',
      'filosofia da ciencia',
      'filosofia da ciência',
      'etica',
      'ética',
      'pensamento filosofico',
      'pensamento filosófico'
    ]
  },

  {
    discipline: 'Sociologia',
    keywords: [
      'sociologia',
      'sociologia geral',
      'sociologia politica',
      'sociologia política',
      'sociologia economica',
      'sociologia económica',
      'estudos sociais',
      'ciencias sociais',
      'ciências sociais'
    ]
  },

  {
    discipline: 'Psicologia',
    keywords: [
      'psicologia',
      'psicologia geral',
      'psicologia educacional',
      'psicologia clinica',
      'psicologia clínica',
      'psicologia social',
      'psicologia organizacional',
      'comportamento humano',
      'ciencias psicologicas',
      'ciências psicológicas'
    ]
  },


  // --------------------------------------------------------------------------
  // EDUCAÇÃO
  // --------------------------------------------------------------------------

  {
    discipline: 'Pedagogia',
    keywords: [
      'pedagogia',
      'ciencias da educacao',
      'ciências da educação',
      'educacao',
      'educação',
      'educacao infantil',
      'educação infantil',
      'educacao primaria',
      'educação primária',
      'educacao de infancia',
      'educação de infância',
      'pedagogia geral'
    ]
  },

  {
    discipline: 'Didática',
    keywords: [
      'didatica',
      'didática',
      'didatica geral',
      'didática geral',
      'metodologia de ensino',
      'metodologias de ensino',
      'metodos de ensino',
      'métodos de ensino',
      'praticas pedagogicas',
      'práticas pedagógicas',
      'ensino e aprendizagem'
    ]
  },


  // --------------------------------------------------------------------------
  // QUÍMICA E CIÊNCIAS NATURAIS
  // --------------------------------------------------------------------------

  {
    discipline: 'Química',
    keywords: [
      'quimica',
      'química',
      'quimica geral',
      'química geral',
      'quimica organica',
      'química orgânica',
      'quimica inorganica',
      'química inorgânica',
      'quimica analitica',
      'química analítica',
      'bioquimica',
      'bioquímica'
    ]
  },

  {
    discipline: 'Biologia',
    keywords: [
      'biologia',
      'biologia geral',
      'biologia celular',
      'biologia molecular',
      'microbiologia',
      'genetica',
      'genética',
      'zoologia',
      'botanica',
      'botânica',
      'ecologia',
      'ciencias biologicas',
      'ciências biológicas'
    ]
  },


  // --------------------------------------------------------------------------
  // ARQUITETURA E CONSTRUÇÃO
  // --------------------------------------------------------------------------

  {
    discipline: 'Arquitetura',
    keywords: [
      'arquitetura',
      'arquitetura e urbanismo',
      'arquitectura',
      'arquitectura e urbanismo',
      'urbanismo',
      'projeto arquitetonico',
      'projeto arquitetónico',
      'desenho arquitetonico',
      'desenho arquitectónico',
      'planeamento urbano',
      'planejamento urbano'
    ]
  },

  {
    discipline: 'Engenharia Civil',
    keywords: [
      'engenharia civil',
      'construcao civil',
      'construção civil',
      'engenharia de construcao',
      'engenharia de construção',
      'estruturas',
      'geotecnia',
      'hidraulica',
      'hidráulica',
      'materiais de construcao',
      'materiais de construção',
      'topografia'
    ]
  },


  // --------------------------------------------------------------------------
  // AGRONOMIA E AMBIENTE
  // --------------------------------------------------------------------------

  {
    discipline: 'Agronomia',
    keywords: [
      'agronomia',
      'engenharia agronomica',
      'engenharia agronómica',
      'ciencias agrarias',
      'ciências agrárias',
      'agricultura',
      'producao agricola',
      'produção agrícola',
      'producao vegetal',
      'produção vegetal',
      'ciencia do solo',
      'ciência do solo'
    ]
  },

  {
    discipline: 'Ciências Ambientais',
    keywords: [
      'ciencias ambientais',
      'ciências ambientais',
      'engenharia ambiental',
      'gestao ambiental',
      'gestão ambiental',
      'ambiente',
      'meio ambiente',
      'sustentabilidade',
      'gestao de recursos naturais',
      'gestão de recursos naturais',
      'impacto ambiental'
    ]
  }
];

const CHAT_SUGGESTIONS_BY_CATEGORY = {
  informatica: [
    'Explica-me os fundamentos de programação de forma simples',
    'Qual a diferença entre hardware e software?',
    'Como funciona uma rede de computadores?',
    'Cria um plano de estudo de 7 dias para Informática',
  ],

  electricidade: [
    'Explica-me a Lei de Ohm com exemplos práticos',
    'Qual a diferença entre corrente contínua e alternada?',
    'Como calcular tensão, corrente e resistência num circuito?',
    'Cria um plano de estudo de 7 dias para Electricidade',
  ],

  frio_climatizacao: [
    'Como funciona um sistema de refrigeração?',
    'Qual a função do compressor num sistema de frio?',
    'Explica-me o ciclo de refrigeração de forma simples',
    'Cria um plano de estudo de 7 dias para Frio e Climatização',
  ],

  desenhador_projectista: [
    'O que é desenho técnico e para que serve?',
    'Explica-me as principais normas do desenho técnico',
    'Qual a diferença entre planta, corte e alçado?',
    'Cria um plano de estudo de 7 dias para Desenhador Projectista',
  ],

  tecnologia_moveis: [
    'Quais são os principais tipos de madeira usados na fabricação de móveis?',
    'Explica as etapas de fabricação de um móvel',
    'Quais ferramentas são utilizadas na tecnologia de móveis?',
    'Cria um plano de estudo de 7 dias para Tecnologia de Móveis',
  ],

  mecanica: [
    'Explica-me os princípios básicos da Mecânica',
    'Qual a diferença entre motor a gasolina e motor a diesel?',
    'Como funciona um sistema de transmissão automóvel?',
    'Cria um plano de estudo de 7 dias para Mecânica',
  ],

  gestao_empresarial: [
    'O que é gestão empresarial e qual a sua importância?',
    'Explica-me as principais funções de um gestor',
    'Como elaborar um plano de negócios?',
    'Cria um plano de estudo de 7 dias para Gestão Empresarial',
  ],

  contabilidade: [
    'Explica-me o conceito de débito e crédito',
    'Qual a diferença entre ativo, passivo e capital próprio?',
    'Como funciona o balanço patrimonial?',
    'Cria um plano de estudo de 7 dias para Contabilidade',
  ],

  medicina: [
    'Explica-me o sistema circulatório de forma simples',
    'Quais são os principais sistemas do corpo humano?',
    'Qual a diferença entre vírus e bactérias?',
    'Cria um plano de estudo de 7 dias para Medicina',
  ],

  enfermagem: [
    'Quais são os princípios básicos dos cuidados de enfermagem?',
    'Como avaliar os sinais vitais de um paciente?',
    'Qual a importância da higiene e segurança do paciente?',
    'Cria um plano de estudo de 7 dias para Enfermagem',
  ],

  farmacia: [
    'Qual a diferença entre medicamento genérico e de marca?',
    'Como funciona a conservação e armazenamento de medicamentos?',
    'Explica-me as principais formas farmacêuticas',
    'Cria um plano de estudo de 7 dias para Farmácia',
  ],

  topografia: [
    'O que é topografia e qual a sua importância?',
    'Como funciona o nivelamento topográfico?',
    'Para que serve uma estação total?',
    'Cria um plano de estudo de 7 dias para Topografia',
  ],

  construcao_civil: [
    'Quais são as principais etapas de uma construção?',
    'Explica-me os tipos de fundações',
    'Qual a diferença entre betão e betão armado?',
    'Cria um plano de estudo de 7 dias para Construção Civil',
  ],

  engenharia_civil: [
    'Quais são as principais áreas da Engenharia Civil?',
    'Explica-me o conceito de resistência dos materiais',
    'Como funciona uma estrutura de betão armado?',
    'Cria um plano de estudo de 7 dias para Engenharia Civil',
  ],

  arquitectura: [
    'Qual a diferença entre arquitectura e engenharia civil?',
    'Quais são os elementos fundamentais de um projecto arquitectónico?',
    'Explica-me a importância da escala no desenho arquitectónico',
    'Cria um plano de estudo de 7 dias para Arquitectura',
  ],

  electronica: [
    'Qual a diferença entre electrónica analógica e digital?',
    'Explica-me como funciona um díodo',
    'O que são resistores, capacitores e transistores?',
    'Cria um plano de estudo de 7 dias para Electrónica',
  ],

  telecomunicacoes: [
    'Como funciona uma rede de telecomunicações?',
    'Qual a diferença entre fibra óptica e cabo de cobre?',
    'Explica-me o funcionamento das redes móveis',
    'Cria um plano de estudo de 7 dias para Telecomunicações',
  ],

  redes_computadores: [
    'Qual a diferença entre LAN, MAN e WAN?',
    'Explica-me o modelo OSI de forma simples',
    'Como funciona o endereçamento IP?',
    'Cria um plano de estudo de 7 dias para Redes de Computadores',
  ],

  programacao: [
    'O que são variáveis, funções e estruturas condicionais?',
    'Qual a diferença entre programação frontend e backend?',
    'Explica-me programação orientada a objetos',
    'Cria um plano de estudo de 7 dias para Programação',
  ],

  banco_dados: [
    'O que é uma base de dados relacional?',
    'Qual a diferença entre SQL e MySQL?',
    'Explica-me chaves primárias e estrangeiras',
    'Cria um plano de estudo de 7 dias para Banco de Dados',
  ],

  ciberseguranca: [
    'O que é cibersegurança e por que é importante?',
    'Qual a diferença entre vírus, malware e ransomware?',
    'Como criar uma palavra-passe segura?',
    'Cria um plano de estudo de 7 dias para Cibersegurança',
  ],

  inteligencia_artificial: [
    'O que é Inteligência Artificial?',
    'Qual a diferença entre IA, Machine Learning e Deep Learning?',
    'Como funciona um modelo de linguagem como a IA?',
    'Cria um plano de estudo de 7 dias para Inteligência Artificial',
  ],

  matematica: [
    'Como resolver uma equação do segundo grau?',
    'Explica-me funções matemáticas de forma simples',
    'Como calcular percentagens e proporções?',
    'Cria um plano de estudo de 7 dias para Matemática',
  ],

  fisica: [
    'Explica-me as três leis de Newton',
    'Qual a diferença entre velocidade e aceleração?',
    'Como resolver problemas de movimento?',
    'Cria um plano de estudo de 7 dias para Física',
  ],

  quimica: [
    'Explica-me a diferença entre átomo, elemento e molécula',
    'O que são ligações químicas?',
    'Como balancear uma equação química?',
    'Cria um plano de estudo de 7 dias para Química',
  ],

  biologia: [
    'Explica-me a estrutura e função da célula',
    'Qual a diferença entre mitose e meiose?',
    'Como funciona o sistema respiratório?',
    'Cria um plano de estudo de 7 dias para Biologia',
  ],

  agricultura: [
    'Quais são os princípios básicos da agricultura?',
    'Como preparar correctamente o solo para o cultivo?',
    'Quais são os principais métodos de irrigação?',
    'Cria um plano de estudo de 7 dias para Agricultura',
  ],

  agronomia: [
    'O que é Agronomia e quais são as suas principais áreas?',
    'Como melhorar a produtividade de uma cultura agrícola?',
    'Explica a importância da fertilização do solo',
    'Cria um plano de estudo de 7 dias para Agronomia',
  ],

  ambiente: [
    'O que são alterações climáticas?',
    'Quais são os principais problemas ambientais em Angola?',
    'Como funciona a gestão de resíduos?',
    'Cria um plano de estudo de 7 dias para Ciências Ambientais',
  ],

  economia: [
    'Explica-me a lei da oferta e da procura',
    'O que é inflação e como afecta Angola?',
    'Qual a diferença entre PIB e PNB?',
    'Cria um plano de estudo de 7 dias para Economia',
  ],

  gestao: [
    'O que é administração e gestão?',
    'Quais são as principais funções de um gestor?',
    'Como elaborar um plano estratégico?',
    'Cria um plano de estudo de 7 dias para Gestão',
  ],

  marketing: [
    'O que é marketing e qual a sua importância?',
    'Qual a diferença entre marketing tradicional e digital?',
    'Como criar uma estratégia de marketing para uma empresa?',
    'Cria um plano de estudo de 7 dias para Marketing',
  ],

  recursos_humanos: [
    'Qual a importância da gestão de recursos humanos?',
    'Como funciona um processo de recrutamento?',
    'O que é avaliação de desempenho?',
    'Cria um plano de estudo de 7 dias para Recursos Humanos',
  ],

  direito: [
    'Explica-me a estrutura do Estado angolano',
    'Qual a diferença entre Direito Civil e Direito Penal?',
    'O que é a Constituição da República de Angola?',
    'Cria um plano de estudo de 7 dias para Direito',
  ],

  contabilidade_auditoria: [
    'O que é auditoria e qual a sua finalidade?',
    'Qual a diferença entre contabilidade e auditoria?',
    'Como funciona uma auditoria financeira?',
    'Cria um plano de estudo de 7 dias para Contabilidade e Auditoria',
  ],

  turismo: [
    'Qual a importância do turismo para a economia de Angola?',
    'Quais são os principais tipos de turismo?',
    'Como elaborar um roteiro turístico?',
    'Cria um plano de estudo de 7 dias para Turismo',
  ],

  hotelaria: [
    'Quais são os principais sectores de um hotel?',
    'Como funciona a gestão de reservas?',
    'Quais são as boas práticas de atendimento ao cliente?',
    'Cria um plano de estudo de 7 dias para Hotelaria',
  ],

  educacao: [
    'O que é pedagogia e qual a sua importância?',
    'Quais são os principais métodos de ensino?',
    'Como preparar um bom plano de aula?',
    'Cria um plano de estudo de 7 dias para Educação',
  ],

  lingua_portuguesa: [
    'Como melhorar a minha escrita em português?',
    'Explica-me as principais classes gramaticais',
    'Qual a diferença entre texto narrativo e dissertativo?',
    'Cria um plano de estudo de 7 dias para Língua Portuguesa',
  ],

  ingles: [
    'Ensina-me os principais tempos verbais em inglês',
    'Qual a diferença entre do, does e did?',
    'Cria um diálogo simples em inglês para eu praticar',
    'Cria um plano de estudo de 7 dias para Inglês',
  ],

  historia: [
    'Explica-me a história de Angola de forma resumida',
    'Quais foram os principais acontecimentos da independência de Angola?',
    'Explica-me o período colonial em Angola',
    'Cria um plano de estudo de 7 dias para História',
  ],

  geografia: [
    'Explica-me a geografia física de Angola',
    'Quais são as principais províncias e regiões de Angola?',
    'Explica-me os principais tipos de clima de Angola',
    'Cria um plano de estudo de 7 dias para Geografia',
  ],

  sociologia: [
    'O que é Sociologia e qual o seu objecto de estudo?',
    'Explica-me os principais conceitos da Sociologia',
    'Como a sociedade influencia o comportamento humano?',
    'Cria um plano de estudo de 7 dias para Sociologia',
  ],

  psicologia: [
    'O que é Psicologia e qual a sua finalidade?',
    'Explica-me os principais processos psicológicos',
    'Como funciona a memória e a aprendizagem?',
    'Cria um plano de estudo de 7 dias para Psicologia',
  ],

  arquitectura: [
    'O que é um projecto arquitectónico?',
    'Qual a importância da escala no desenho arquitectónico?',
    'Qual a diferença entre planta, corte e alçado?',
    'Cria um plano de estudo de 7 dias para Arquitectura',
  ],

  mecanica_industrial: [
    'O que é manutenção industrial?',
    'Explica-me o funcionamento de máquinas industriais',
    'Qual a diferença entre manutenção preventiva e correctiva?',
    'Cria um plano de estudo de 7 dias para Mecânica Industrial',
  ],

  soldadura: [
    'Quais são os principais processos de soldadura?',
    'Qual a diferença entre soldadura MIG, MAG e TIG?',
    'Quais são os equipamentos de segurança usados na soldadura?',
    'Cria um plano de estudo de 7 dias para Soldadura',
  ],

  energia_electrica: [
    'Como funciona a produção de energia eléctrica?',
    'Qual a diferença entre geração, transmissão e distribuição?',
    'Como funciona um transformador eléctrico?',
    'Cria um plano de estudo de 7 dias para Energia Eléctrica',
  ],

  transportes: [
    'Quais são os principais sistemas de transporte?',
    'Como funciona a logística de transporte?',
    'Qual a importância dos transportes para a economia de Angola?',
    'Cria um plano de estudo de 7 dias para Transportes',
  ],

  logistica: [
    'O que é logística e qual a sua importância?',
    'Como funciona a gestão de stocks?',
    'Qual a diferença entre logística e cadeia de abastecimento?',
    'Cria um plano de estudo de 7 dias para Logística',
  ],

  generico: [
    'Explica-me um assunto da minha área de estudo de forma simples',
    'Ajuda-me a preparar uma matéria para a próxima prova',
    'Cria um plano de estudo de 7 dias para o meu curso',
    'Dá-me técnicas para estudar e memorizar melhor',
  ],
};

function applyChatSuggestions(curso) {
  const buttons = document.querySelectorAll('#chat-empty [data-suggestion]');
  if (!buttons.length) return;

  const normalizedCurso = normalizeText(curso || '');
  const match = normalizedCurso
    ? LIBRARY_DISCIPLINE_MAP.find((entry) => entry.keywords.some((k) => normalizedCurso.includes(k)))
    : null;
  const categoryKey = match ? normalizeText(match.discipline) : 'generico';
  const suggestions = CHAT_SUGGESTIONS_BY_CATEGORY[categoryKey] || CHAT_SUGGESTIONS_BY_CATEGORY.generico;

  buttons.forEach((btn, index) => {
    if (suggestions[index]) btn.textContent = suggestions[index];
  });
}

function applyPersonalization(data) {
  const profile = data?.profile || null;
  const user = data?.user || null;
  const curso = profile?.course || '';
  applyChatSuggestions(curso);
  const activeModules = Array.isArray(data?.modules) ? data.modules : [];
  const moduleLabels = activeModules.length ? activeModules.map((m) => m.name) : DEFAULT_MODULE_LABELS;

  // -- Perfil: nome, email e avatar reais do utilizador --
  if (user) {
    const nameInput = document.getElementById('profile-name');
    const headName = document.querySelector('.profile-head h2');
    const headEmail = document.querySelector('.profile-head p');
    const avatar = document.querySelector('.profile-avatar');
    if (nameInput) nameInput.value = user.name || '';
    if (headName) headName.textContent = user.name || '';
    if (headEmail) headEmail.textContent = user.email || '';
    if (avatar && user.name) avatar.textContent = user.name.charAt(0).toUpperCase();
  }

  // -- Painel: saudação, stat de módulos ativos e cartão "Continua o módulo" --
  const greeting = document.getElementById('painel-greeting');
  if (greeting) greeting.textContent = curso ? `Bem-vindo de volta 👋 — ${curso}` : 'Bem-vindo de volta 👋';

  const statModulos = document.getElementById('stat-modulos-activos');
  if (statModulos) statModulos.textContent = String(moduleLabels.length);

  const continueTitle = document.getElementById('continue-module-title');
  const continueName = document.getElementById('continue-module-name');
  const continueFill = document.getElementById('continue-module-fill');
  const continueLabel = document.getElementById('continue-module-label');
  if (continueTitle && continueName && continueFill && continueLabel) {
    const current = activeModules[0];
    const progress = current?.progress_percent || 0;
    continueTitle.textContent = progress > 0 ? 'Continua o módulo' : 'Começa por aqui';
    continueName.textContent = current?.name || moduleLabels[0];
    continueFill.style.width = `${progress}%`;
    continueLabel.textContent = progress > 0 ? `Progresso ${progress}%` : 'Ainda não iniciado';
  }

  const libraryText = document.getElementById('painel-library-text');
  if (libraryText) {
    libraryText.textContent = curso ? `180+ livros e sebentas para ${curso}` : '180+ livros e sebentas para o teu curso';
  }

  // -- Módulos: lista construída a partir dos módulos ativos na backend --
  const modulesList = document.getElementById('modules-list');
  const modulesSubtitle = document.getElementById('modules-subtitle');
  const modulesEmpty = document.getElementById('modules-empty');
  if (modulesList) {
    modulesList.innerHTML = '';
    modulesEmpty && (modulesEmpty.hidden = activeModules.length > 0);

    (activeModules.length ? activeModules : []).forEach((mod) => {
      const progress = mod.progress_percent || 0;
      const studiedToday = isStudiedToday(mod.last_studied_at);
      const item = document.createElement('div');
      item.className = 'module-item';
      item.dataset.moduleId = mod.id;
      item.innerHTML = `
        <a href="#chat" class="module-item__link">
          <span class="module-item__icon">${MODULE_ICON_SVG}</span>
          <div class="module-item__body">
            <div class="module-item__top">
              <h3>${mod.name}</h3>
              <span>${progress}%</span>
            </div>
            <div class="module-item__meta">${curso || 'Módulo'} · ${progress > 0 ? 'Em curso' : 'Ainda não iniciado'}</div>
            <div class="progress-bar"><div class="progress-bar__fill" style="width:${progress}%"></div></div>
          </div>
        </a>
        <div class="module-item__actions">
          <button type="button" class="module-item__study-btn${studiedToday ? ' is-done' : ''}" data-action="study" data-module-id="${mod.id}" data-progress="${progress}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            ${studiedToday ? 'Estudado hoje' : 'Estudei hoje'}
          </button>
          <button type="button" class="module-item__archive-btn" data-action="archive" data-module-id="${mod.id}" data-module-name="${mod.name}" aria-label="Remover ${mod.name}" title="Remover módulo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>`;
      modulesList.appendChild(item);
    });
  }
  if (modulesSubtitle) {
    modulesSubtitle.textContent = curso
      ? `Módulos escolhidos para ${curso} no teu registo.`
      : 'Trilhos de estudo com exercícios, quizzes e revisões espaçadas.';
  }

  // -- Biblioteca: destaca e traz para o topo os recursos do curso do utilizador --
  const grid = document.getElementById('library-grid');
  const librarySubtitle = document.getElementById('library-subtitle');
  if (grid) {
    const normalizedCurso = normalizeText(curso);
    const match = normalizedCurso
      ? LIBRARY_DISCIPLINE_MAP.find((entry) => entry.keywords.some((k) => normalizedCurso.includes(k)))
      : null;

    grid.querySelectorAll('.library-card').forEach((card) => card.classList.remove('is-recommended'));

    if (match) {
      const cards = Array.from(grid.querySelectorAll('.library-card'));
      cards
        .filter((card) => card.dataset.discipline === match.discipline)
        .forEach((card) => {
          card.classList.add('is-recommended');
          grid.prepend(card);
        });
      if (librarySubtitle) {
        librarySubtitle.textContent = `Destacámos primeiro os recursos de ${match.discipline}, de acordo com o teu curso.`;
      }
    } else if (librarySubtitle) {
      librarySubtitle.textContent = 'Livros, sebentas e artigos organizados por área.';
    }
  }

  // -- Perfil: os campos adaptam-se ao nível do onboarding — "Escola"/"Classe"/
  // "Área" para o ensino médio, "Universidade"/"Ano" para o universitário.
  if (profile) {
    const labelInstitution = document.querySelector('label[for="profile-university"]');
    const inputInstitution = document.getElementById('profile-university');
    const labelPeriod = document.querySelector('label[for="profile-year"]');
    const inputPeriod = document.getElementById('profile-year');
    const inputCourse = document.getElementById('profile-course');
    let areaField = document.getElementById('profile-area-field');

    if (inputCourse) inputCourse.value = profile.course || '';
    if (inputInstitution) inputInstitution.value = profile.institution_name || '';
    if (inputPeriod) inputPeriod.value = profile.year_or_grade || '';

    if (profile.level === 'medio') {
      if (labelInstitution) labelInstitution.textContent = 'Escola';
      if (inputInstitution) inputInstitution.placeholder = 'Ex: Liceu Nacional';
      if (labelPeriod) labelPeriod.textContent = 'Classe';
      if (inputPeriod) inputPeriod.placeholder = 'Ex: 12ª classe';

      if (!areaField && inputPeriod) {
        areaField = document.createElement('div');
        areaField.className = 'field';
        areaField.id = 'profile-area-field';
        areaField.innerHTML =
          '<label for="profile-area">Área</label><input type="text" id="profile-area" name="area" placeholder="Ex: Informática">';
        inputPeriod.closest('.field').after(areaField);
      }
      const inputArea = document.getElementById('profile-area');
      if (inputArea) inputArea.value = profile.area || '';
    } else {
      if (labelInstitution) labelInstitution.textContent = 'Universidade';
      if (inputInstitution) inputInstitution.placeholder = 'Ex: Agostinho Neto';
      if (labelPeriod) labelPeriod.textContent = 'Ano';
      if (inputPeriod) inputPeriod.placeholder = 'Ex: 2º ano';
      if (areaField) areaField.remove();
    }
  }
}

// ----------------------------------------------------------------------------
// Arranque de dados (só em painel.html) — vai buscar o perfil à backend e
// decide se mostra o onboarding (primeira vez) ou personaliza a app.
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// Módulos — ações da área "Os teus módulos": marcar como estudado hoje,
// arquivar (desativar) e adicionar um módulo novo do catálogo completo.
// Todas usam PATCH /api/modules/:id, que já faz upsert em user_modules.
// ----------------------------------------------------------------------------
async function refreshModules() {
  try {
    const res = await apiFetch('/profile');
    if (res.ok) applyPersonalization(await res.json());
  } catch (err) {
    /* apiFetch já trata do redireccionamento em caso de sessão inválida */
  }
}

function initModulesPage() {
  const modulesList = document.getElementById('modules-list');
  const addToggle = document.getElementById('modules-add-toggle');
  const addPanel = document.getElementById('modules-add-panel');
  const addSelect = document.getElementById('modules-add-select');
  const addConfirm = document.getElementById('modules-add-confirm');
  if (!modulesList) return;

  // -- Marcar como estudado hoje / arquivar módulo --------------------------
  modulesList.addEventListener('click', async (e) => {
    const studyBtn = e.target.closest('[data-action="study"]');
    const archiveBtn = e.target.closest('[data-action="archive"]');

    if (studyBtn) {
      e.preventDefault();
      if (studyBtn.disabled) return;
      studyBtn.disabled = true;
      const moduleId = studyBtn.dataset.moduleId;
      const currentProgress = Number(studyBtn.dataset.progress) || 0;
      const nextProgress = Math.min(100, currentProgress + 10);
      try {
        const res = await apiFetch(`/modules/${moduleId}`, {
          method: 'PATCH',
          body: JSON.stringify({ progressPercent: nextProgress }),
        });
        if (res.ok) {
          await refreshModules();
        } else {
          studyBtn.disabled = false;
        }
      } catch (err) {
        studyBtn.disabled = false;
      }
      return;
    }

    if (archiveBtn) {
      e.preventDefault();
      const moduleName = archiveBtn.dataset.moduleName || 'este módulo';
      if (!window.confirm(`Remover "${moduleName}" dos teus módulos ativos?`)) return;
      archiveBtn.disabled = true;
      const moduleId = archiveBtn.dataset.moduleId;
      try {
        const res = await apiFetch(`/modules/${moduleId}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: false }),
        });
        if (res.ok) {
          await refreshModules();
        } else {
          archiveBtn.disabled = false;
        }
      } catch (err) {
        archiveBtn.disabled = false;
      }
    }
  });

  // -- Adicionar módulo do catálogo completo --------------------------------
  if (!addToggle || !addPanel || !addSelect || !addConfirm) return;

  async function openAddPanel() {
    addPanel.hidden = false;
    addToggle.hidden = true;
    addSelect.innerHTML = '<option value="">A carregar módulos...</option>';
    addSelect.disabled = true;
    addConfirm.disabled = true;

    try {
      const profileRes = await apiFetch('/profile');
      const profileData = profileRes.ok ? await profileRes.json() : null;
      const course = profileData?.profile?.course || '';
      const area = profileData?.profile?.area || '';
      const activeIds = new Set((profileData?.modules || []).map((m) => m.id));

      // Módulos sugeridos para o curso/área do utilizador (mesma lógica que
      // já é usada no onboarding) — não o catálogo inteiro.
      const params = new URLSearchParams();
      if (course) params.set('course', course);
      if (area) params.set('area', area);
      const suggestionsRes = await apiFetch(`/modules/suggestions?${params.toString()}`);
      const suggested = suggestionsRes.ok ? (await suggestionsRes.json()).modules : [];
      const available = suggested.filter((m) => !activeIds.has(m.id));

      if (!available.length) {
        addSelect.innerHTML = '<option value="">Já tens todos os módulos sugeridos para o teu curso</option>';
        return;
      }

      addSelect.innerHTML = available.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
      addSelect.disabled = false;
      addConfirm.disabled = false;
    } catch (err) {
      addSelect.innerHTML = '<option value="">Não foi possível carregar os módulos</option>';
    }
  }

  function closeAddPanel() {
    addPanel.hidden = true;
    addToggle.hidden = false;
  }

  addToggle.addEventListener('click', openAddPanel);

  addConfirm.addEventListener('click', async () => {
    const moduleId = addSelect.value;
    if (!moduleId) return;
    addConfirm.disabled = true;
    try {
      const res = await apiFetch(`/modules/${moduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) {
        closeAddPanel();
        await refreshModules();
      } else {
        addConfirm.disabled = false;
      }
    } catch (err) {
      addConfirm.disabled = false;
    }
  });
}

function loadAppSections(profileData) {
  applyPersonalization(profileData);
  loadLibrary();
  loadHistory();
  loadSettings();
}

async function initAppData() {
  if (!document.getElementById('onboarding-overlay')) return; // só existe em painel.html
  if (!getAccessToken()) return; // o guard no <head> já está a redirecionar

  try {
    const res = await apiFetch('/profile');
    if (!res.ok) return;
    const data = await res.json();

    if (data.onboardingCompleted) {
      loadAppSections(data);
    } else {
      startOnboarding();
    }
  } catch (err) {
    /* apiFetch já trata do redireccionamento em caso de sessão inválida */
  }
}

// ----------------------------------------------------------------------------
// Onboarding — as 4 telas mostradas apenas quando a backend confirma que o
// utilizador ainda não completou o onboarding (ver initAppData). Os módulos
// sugeridos vêm de GET /api/modules/suggestions; a submissão final grava tudo
// com POST /api/onboarding.
// ----------------------------------------------------------------------------
let startOnboarding = () => {};

function initOnboarding() {
  const overlay = document.getElementById('onboarding-overlay');
  if (!overlay) return;

  const steps = Array.from(overlay.querySelectorAll('.onboarding-step'));
  const dots = Array.from(overlay.querySelectorAll('.onboarding-progress__dot'));
  const levelOptions = Array.from(overlay.querySelectorAll('.onboarding-option'));
  const fieldsMedio = document.getElementById('onboarding-fields-medio');
  const fieldsUni = document.getElementById('onboarding-fields-universitario');
  const step2Next = document.getElementById('onboarding-step2-next');
  const modulesContainer = document.getElementById('onboarding-modules');
  const checklist = Array.from(document.querySelectorAll('#onboarding-checklist [data-checklist-item]'));

  const state = { level: null };

  const defaultModules = [
    'Fundamentos da área',
    'Exercícios práticos',
    'Resumos guiados',
    'Preparação para provas',
    'Projetos práticos',
  ];

  function renderModuleOptions(names) {
    modulesContainer.innerHTML = '';
    names.forEach((name, index) => {
      const id = `onboarding-module-${index}`;
      const label = document.createElement('label');
      label.className = 'onboarding-module';
      label.setAttribute('for', id);
      label.innerHTML = `<input type="checkbox" id="${id}" value="${name}" checked><span>${name}</span>`;
      modulesContainer.appendChild(label);
    });
  }

  // -- Navegação entre telas --------------------------------------------------
  function goToStep(stepNumber) {
    steps.forEach((section) => {
      section.hidden = Number(section.dataset.step) !== stepNumber;
    });
    dots.forEach((dot) => {
      dot.classList.toggle('is-active', Number(dot.dataset.dot) <= stepNumber);
    });
  }

  overlay.querySelectorAll('[data-onboarding-back]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = Number(btn.closest('.onboarding-step').dataset.step);
      goToStep(current - 1);
    });
  });

  // -- Tela 1: Quem és tu -------------------------------------------------
  levelOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      levelOptions.forEach((o) => o.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.level = btn.dataset.level;

      fieldsMedio.hidden = state.level !== 'medio';
      fieldsUni.hidden = state.level !== 'universitario';
      validateStep2();

      window.setTimeout(() => goToStep(2), 350);
    });
  });

  // -- Tela 2: Informações académicas --------------------------------------
  function activeFieldsForm() {
    return state.level === 'medio' ? fieldsMedio : fieldsUni;
  }

  function validateStep2() {
    const form = activeFieldsForm();
    if (!form) {
      step2Next.disabled = true;
      return;
    }
    const inputs = form.querySelectorAll('input[name], select[name]');
    const allFilled = Array.from(inputs).every((el) => el.value.trim() !== '');
    step2Next.disabled = !allFilled;
  }

  [fieldsMedio, fieldsUni].forEach((form) => {
    form.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('input', validateStep2);
      el.addEventListener('change', validateStep2);
    });
  });

  function collectStep2Data() {
    const form = activeFieldsForm();
    const data = { level: state.level };
    form.querySelectorAll('input[name], select[name]').forEach((el) => {
      data[el.name] = el.value.trim();
    });
    return data;
  }

  step2Next.addEventListener('click', async () => {
    if (step2Next.disabled) return;
    const data = collectStep2Data();
    state.academic = data;

    step2Next.disabled = true;
    step2Next.textContent = 'A carregar módulos...';

    try {
      const params = new URLSearchParams({ course: data.curso || '', area: data.area || '' });
      const res = await apiFetch(`/modules/suggestions?${params.toString()}`);
      const body = await res.json();
      const names = res.ok && body.modules?.length ? body.modules.map((m) => m.name) : defaultModules;
      renderModuleOptions(names);
    } catch (err) {
      renderModuleOptions(defaultModules);
    } finally {
      step2Next.disabled = false;
      step2Next.innerHTML =
        'Continuar <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
    }

    goToStep(3);
  });

  // -- Tela 3: Módulos → Tela 4: animação ----------------------------------
  const step3Section = overlay.querySelector('[data-step="3"]');
  const step3Next = step3Section.querySelector('[data-onboarding-next]');
  let step3Error = step3Section.querySelector('.onboarding-error');
  if (!step3Error) {
    step3Error = document.createElement('p');
    step3Error.className = 'onboarding-error';
    step3Error.hidden = true;
    step3Section.querySelector('.onboarding-nav').before(step3Error);
  }

  step3Next.addEventListener('click', async () => {
    const selectedModules = Array.from(modulesContainer.querySelectorAll('input:checked')).map((el) => el.value);
    state.modules = selectedModules;

    step3Error.hidden = true;
    step3Next.disabled = true;

    const payload = {
      level: state.level,
      institutionName: state.level === 'medio' ? state.academic.escola : state.academic.universidade,
      course: state.academic.curso,
      yearOrGrade: state.level === 'medio' ? state.academic.classe : state.academic.ano,
      area: state.level === 'medio' ? state.academic.area : undefined,
      modules: selectedModules,
    };

    try {
      const res = await apiFetch('/onboarding', { method: 'POST', body: JSON.stringify(payload) });
      const body = await res.json();

      if (!res.ok) {
        step3Error.textContent = body.error || 'Não foi possível guardar. Tenta novamente.';
        step3Error.hidden = false;
        step3Next.disabled = false;
        return;
      }

      goToStep(4);
      runLoadingSequence();
    } catch (err) {
      step3Error.textContent = 'Não foi possível ligar ao servidor. Verifica se estás ligado à internet.';
      step3Error.hidden = false;
      step3Next.disabled = false;
    }
  });

  function runLoadingSequence() {
    checklist.forEach((item) => item.classList.remove('is-done'));
    checklist.forEach((item, index) => {
      window.setTimeout(() => {
        item.classList.add('is-done');
        if (index === checklist.length - 1) {
          window.setTimeout(finishOnboarding, 700);
        }
      }, 600 * (index + 1));
    });
  }

  async function finishOnboarding() {
    overlay.hidden = true;
    try {
      const res = await apiFetch('/profile');
      if (res.ok) loadAppSections(await res.json());
    } catch (err) {
      /* apiFetch já trata do redireccionamento em caso de sessão inválida */
    }
  }

  startOnboarding = () => {
    overlay.hidden = false;
    goToStep(1);
  };
}
