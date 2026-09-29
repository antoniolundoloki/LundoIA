# LundoIA — projeto completo (frontend + backend)

```
lundoia/
├── frontend/   — HTML/CSS/JS estático (entrar.html, painel.html, ...)
└── backend/    — API Node.js + Express + MySQL
```

O frontend já está ligado à API (`app.js` chama `http://localhost:3000/api`).

## Arranque rápido

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Abre o `.env` e preenche os dados da tua MySQL local (`DB_USER`, `DB_PASSWORD`, `DB_NAME`, etc.).

```bash
npm run db:migrate   # cria a base de dados e as tabelas
npm run db:seed      # popula o catálogo de módulos
npm start             # arranca em http://localhost:3000
```

Confirma que está no ar:

```bash
curl http://localhost:3000/api/health
```

### 2. Frontend

Não precisa de build nem de instalar nada — é HTML/CSS/JS puro. Duas formas de abrir:

- **Mais simples:** abre `frontend/entrar.html` diretamente no browser (duplo clique).
- **Com servidor local** (evita alguns comportamentos estranhos de `file://` em certos browsers):
  ```bash
  cd frontend
  npx serve .
  ```
  ou a extensão "Live Server" do VS Code.

### 3. Testar

1. Abre `entrar.html` → separador "Criar conta" → regista-te.
2. És levado ao Painel e aparece o onboarding (Quem és tu → dados académicos → módulos → animação).
3. Depois de completares, o Painel, os Módulos, a Biblioteca e o Perfil já vêm preenchidos com o que respondeste.
4. "Terminar sessão" (sidebar ou Definições) termina a sessão na API e volta ao login.

## Se mudares onde a backend fica

`frontend/app.js` tem esta linha perto do topo:

```js
const API_BASE_URL = 'http://localhost:3000/api';
```

Se a backend correr noutra porta/domínio (ex: já não é local, ou usas outra porta), atualiza aqui.

## Login com Google (opcional)

Os botões "Continuar com Google" em `entrar.html` ficam desativados até configurares um Client ID do Google Cloud Console em dois sítios: `backend/.env` (`GOOGLE_CLIENT_ID`) e `frontend/app.js` (constante `GOOGLE_CLIENT_ID`). Passos completos em `backend/README.md` → "Configurar o login com Google". Sem isso, o registo/login por email e senha funciona normalmente.

## Documentação da API

A referência completa de todos os endpoints (rotas, parâmetros, exemplos) está em `backend/README.md`.
