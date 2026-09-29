# LundoIA — Backend

Node.js + Express + MySQL.

## 1. Instalar

```bash
npm install
```

## 2. Configurar

Copia `.env.example` para `.env` e preenche os dados da tua base de dados MySQL local:

```bash
cp .env.example .env
```

## 3. Criar a base de dados e as tabelas

```bash
npm run db:migrate
```

Isto cria a base de dados (se não existir) e todas as tabelas (`users`, `user_profiles`, `modules`, `user_modules`, `sessions`).

## 4. Popular o catálogo de módulos

```bash
npm run db:seed
```

Insere os módulos já usados no onboarding do frontend (Informática, Direito, Medicina, e a lista genérica).

## 5. Arrancar o servidor

```bash
npm start
```

Por omissão fica em `http://localhost:3000`. Testa com:

```bash
curl http://localhost:3000/api/health
```

---

## Referência da API

Todas as rotas devolvem e recebem JSON. As rotas protegidas exigem o header:

```
Authorization: Bearer <accessToken>
```

### Autenticação

| Método | Rota | Body | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | Cria a conta. Devolve `{ user, accessToken, refreshToken }`. |
| POST | `/api/auth/login` | `{ email, password }` | Devolve `{ user, accessToken, refreshToken }`. |
| POST | `/api/auth/google` | `{ credential }` | `credential` é o ID token devolvido pelo Google Identity Services no frontend. Cria a conta na primeira vez (ou liga a um email já existente); devolve `{ user, accessToken, refreshToken }`. |
| POST | `/api/auth/refresh` | `{ refreshToken }` | Devolve um novo `{ accessToken }`. |
| POST | `/api/auth/logout` | `{ refreshToken }` | Termina a sessão (invalida o refresh token). |
| POST | `/api/auth/forgot-password` | `{ email }` | Envia um email com um link de recuperação (válido 30 min). Responde sempre com sucesso, exista ou não a conta, para não revelar quais emails estão registados. |
| POST | `/api/auth/reset-password` | `{ token, password }` | Define a nova palavra-passe a partir do token do email. Termina todas as sessões ativas dessa conta por segurança. |

O `accessToken` expira em 15 minutos (`JWT_ACCESS_EXPIRES_IN`); usa `/refresh` para obter um novo sem pedir login outra vez. O `refreshToken` dura 30 dias.

### Configurar o login com Google

1. Vai a [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), cria um **OAuth 2.0 Client ID** do tipo "Web application".
2. Em **Authorized JavaScript origins**, adiciona o endereço de onde vais abrir o `frontend` (ex: `http://localhost:5500`, ou o domínio final quando publicares).
3. Copia o Client ID gerado (termina em `.apps.googleusercontent.com`) e cola em dois sítios:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - `frontend/app.js` → constante `GOOGLE_CLIENT_ID` perto do topo do ficheiro
4. Reinicia a backend (`npm start`). Os botões "Continuar com Google" em `entrar.html` ficam ativos automaticamente assim que o `GOOGLE_CLIENT_ID` do frontend deixa de estar vazio.

**Nota:** abrir `entrar.html` diretamente com `file://` não funciona com o Google Identity Services (o Google exige um domínio `http(s)://` nas origens autorizadas) — usa um servidor local (`npx serve` ou a extensão Live Server) para testar o login com Google.

### Perfil (protegido)

| Método | Rota | Body | Descrição |
|---|---|---|---|
| GET | `/api/profile` | — | Devolve `{ user, profile, onboardingCompleted, modules }`. |
| PATCH | `/api/profile` | `{ institutionName?, course?, yearOrGrade?, area? }` | Atualiza campos do formulário de Perfil. |

### Onboarding (protegido)

| Método | Rota | Body |
|---|---|---|
| POST | `/api/onboarding` | `{ level: "medio"|"universitario", institutionName, course, yearOrGrade, area?, modules: string[] }` |

- `institutionName` = Escola (médio) ou Universidade (universitário).
- `yearOrGrade` = Classe (médio) ou Ano (universitário).
- `area` só é obrigatória quando `level` é `"medio"`.
- `modules` = lista dos nomes de módulos escolhidos na Tela 3 (ex: `["Programação", "Redes"]`). Módulos que ainda não existam no catálogo são criados automaticamente.

Podes chamar este endpoint outra vez se o utilizador refizer o onboarding — os módulos anteriores ficam inativos e só os novos ficam ativos.

### Módulos (protegido)

| Método | Rota | Query/Body | Descrição |
|---|---|---|---|
| GET | `/api/modules` | — | Catálogo completo, para a área de Definições (ex: adicionar módulo manualmente). |
| GET | `/api/modules/suggestions?course=...&area=...` | — | Sugestões automáticas para a Tela 3 do onboarding, com a mesma lógica de correspondência já usada no frontend. |
| PATCH | `/api/modules/:id` | `{ isActive?, progressPercent? }` | Ativa/desativa um módulo ou atualiza o progresso (para o cartão "Continua o módulo" no Painel). |

### Biblioteca (protegido)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/library` | Devolve `{ category, resources }` — os livros/sebentas/artigos da categoria correspondente ao curso/área do **próprio utilizador autenticado** (lê o perfil dele, não precisa de parâmetros). Sem correspondência, cai para a categoria "generico". |
| GET | `/api/library/:id/file?mode=inline\|download` | Serve o ficheiro de um recurso alojado localmente (`src/library-files/`). Recursos sem `file_name` (os que só têm `source_url`) não têm ficheiro aqui — abre-se a fonte oficial diretamente. |

**Sobre o conteúdo da biblioteca:** os documentos oficiais reais (Constituição, relatórios do INE, Plano de Saúde do MINSA) não são copiados para o projeto — ficam só com um link (`source_url`) para a fonte oficial, para respeitar direitos de autor e para que fiques sempre com a versão mais atual. Só os guias de estudo originais (escritos de raiz para a LundoIA — Introdução à Programação, Matemática Financeira, Métodos de Estudo) é que têm ficheiro PDF local em `src/library-files/`. Para adicionares mais recursos oficiais no futuro, basta uma linha nova em `seed.sql` com `source_url` a apontar para a fonte.

### Histórico (protegido)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/history` | Devolve `{ history: [{ name, progress_percent, last_studied_at }] }` — só módulos com atividade real (`last_studied_at` preenchido). Uma conta recém-criada devolve uma lista vazia. |

### Definições (protegido)

| Método | Rota | Body | Descrição |
|---|---|---|---|
| GET | `/api/settings` | — | Devolve `{ settings }` (cria a linha com valores por omissão na primeira vez). |
| PATCH | `/api/settings` | `{ darkMode?, studyReminders?, platformNews?, saveChatHistory? }` | Atualiza só os campos enviados; os restantes mantêm o valor guardado. |

---

### Chat (protegido / público)

| Método | Rota | Body | Descrição |
|---|---|---|---|
| POST | `/api/chat/public` | `message`, `history?`, `files?` (form-data) | Chat genérico da página inicial, sem sessão. Limitado a 15 mensagens/10 min por IP. Não persiste histórico (não há conta). |
| POST | `/api/chat` | `message`, `conversationId?`, `files?` (form-data) | Chat personalizado — usa o curso/área e os módulos ativos do próprio utilizador autenticado. Sem `conversationId`, cria uma conversa nova; devolve `{ reply, conversationId }`. Persiste a conversa e as mensagens. |
| GET | `/api/chat/conversations` | — | Lista as conversas do utilizador (mais recente primeiro), com a última mensagem de cada. |
| GET | `/api/chat/conversations/:id` | — | Devolve a conversa e todas as suas mensagens. |

Os dois chats usam a API do **Google Gemini**:

1. Cria uma chave grátis em [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Cola-a em `backend/.env` → `GEMINI_API_KEY`.

**Anexos:** `POST /api/chat` e `POST /api/chat/public` aceitam ficheiros (`multipart/form-data`, campo `files`, até 5 ficheiros de 15MB cada). Imagens são enviadas diretamente à Gemini (multimodal — a IA "vê" a imagem); PDF, DOCX, TXT/MD/CSV/JSON e ZIP têm o texto extraído e passado como contexto à IA. Outros tipos de ficheiro são identificados só pelo nome.

**Sobre o erro 429:** o nível gratuito da API Gemini tem um limite baixo de mensagens por minuto/dia (a Google reduziu isto bastante desde dezembro de 2025). Se aparecer com frequência, espera um pouco entre mensagens, ou ativa faturação na tua conta Google AI Studio para limites mais altos — a app já mostra uma mensagem clara ao utilizador quando isto acontece, em vez de rebentar.

## Lembretes de estudo por email

O servidor tem um agendador simples (`src/services/reminderScheduler.js`, sem dependências extra) que, todos os dias à hora definida em `REMINDER_HOUR` (0-23, por omissão 18h — hora do próprio servidor), envia um email a quem tiver os "Lembretes de estudo" ativados em Definições. Corre automaticamente quando arrancas o servidor com `npm start` — não precisas de nada extra configurado (usa a mesma configuração SMTP do `mailService.js`).

## Próximo passo

Este backend ainda não está ligado ao `lundoiafront` — o `app.js` do frontend continua a guardar tudo em `localStorage`. O passo seguinte é substituir essas chamadas por `fetch()` a estes endpoints (registo/login em `entrar.html`, onboarding e personalização em `painel.html`).
