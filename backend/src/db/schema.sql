-- Base de dados da LundoIA
CREATE DATABASE IF NOT EXISTS lundoiafull CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lundoiafull;


-- LundoIA — schema da base de dados (MySQL)

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  auth_provider ENUM('local', 'google') NOT NULL DEFAULT 'local',
  google_id     VARCHAR(255) NULL UNIQUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id                 INT UNSIGNED PRIMARY KEY,
  level                   ENUM('medio', 'universitario') NOT NULL,
  institution_name        VARCHAR(150) NOT NULL,
  course                  VARCHAR(150) NOT NULL,
  year_or_grade           VARCHAR(50)  NOT NULL,
  area                    VARCHAR(100) NULL,
  onboarding_completed_at DATETIME NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS modules (
  id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100) NULL
);

CREATE TABLE IF NOT EXISTS user_modules (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  module_id        INT UNSIGNED NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_studied_at  DATETIME NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_module (user_id, module_id),
  CONSTRAINT fk_user_modules_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_modules_module
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  refresh_token VARCHAR(255) NOT NULL,
  expires_at    DATETIME NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS library_resources (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  category      VARCHAR(100) NOT NULL,
  resource_type ENUM('livro', 'sebenta', 'artigo') NOT NULL DEFAULT 'livro',
  pages         SMALLINT UNSIGNED NULL,
  file_name     VARCHAR(255) NULL,   -- nome do ficheiro em src/library-files/, quando é um recurso nosso
  source_url    VARCHAR(500) NULL,   -- link para a fonte oficial, quando é um recurso externo
  source_label  VARCHAR(150) NULL,   -- nome da fonte oficial (ex: "Governo de Angola", "INE")
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id             INT UNSIGNED PRIMARY KEY,
  dark_mode           BOOLEAN NOT NULL DEFAULT TRUE,
  study_reminders     BOOLEAN NOT NULL DEFAULT TRUE,
  platform_news       BOOLEAN NOT NULL DEFAULT FALSE,
  save_chat_history   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_settings_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL DEFAULT 'Nova conversa',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_conversations_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED NOT NULL,
  role            ENUM('user', 'assistant') NOT NULL,
  content         MEDIUMTEXT NOT NULL,
  attachments     JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);





-- LundoIA — catálogo inicial de módulos (mesmas listas já usadas no onboarding do frontend)


-- LundoIA — catálogo inicial da Biblioteca (mesmas categorias dos módulos)

-- Recursos oficiais/abertos reais — ligamos à fonte, sem copiar o ficheiro
-- (evita cópias desatualizadas e respeita a fonte original).
INSERT IGNORE INTO library_resources (title, category, resource_type, source_url, source_label) VALUES
  ('Constituição da República de Angola', 'direito', 'livro',
   'https://governo.gov.ao/documentos/constitui%C3%A7%C3%A3o', 'Governo de Angola'),
  ('Relatório de Pobreza em Angola', 'economia', 'livro',
   'https://www.ine.gov.ao/Arquivos/arquivosCarregados/Carregados/Publicacao_637494431350652835.pdf', 'INE Angola'),
  ('Anuário Estatístico da Educação', 'generico', 'livro',
   'https://www.ine.gov.ao/Arquivos/arquivosCarregados/Carregados/Publicacao_638376077484660214.pdf', 'INE Angola'),
  ('Plano Nacional de Desenvolvimento Sanitário 2012-2025', 'medicina', 'livro',
   'https://extranet.who.int/countryplanningcycles/sites/default/files/planning_cycle_repository/angola/plano_nacional_de_desenvolvimento_sanitario_pnds_2012-2025.pdf', 'Ministério da Saúde de Angola');

-- Guias próprios (conteúdo original da LundoIA), servidos localmente.
INSERT IGNORE INTO library_resources (title, category, resource_type, pages, file_name) VALUES
  ('Introdução à Programação', 'informatica', 'sebenta', 4, 'introducao-programacao.pdf'),
  ('Matemática Financeira Aplicada', 'matematica', 'sebenta', 3, 'matematica-financeira.pdf'),
  ('Guia de Métodos de Estudo', 'generico', 'sebenta', 3, 'guia-metodos-estudo.pdf');

-- Guias/recursos da Biblioteca da LundoIA
-- Conteúdo servido localmente.
-- pages = NULL porque o número de páginas não está disponível na lista apresentada.

-- ============================================================
-- LIVROS DA BIBLIOTECA — LundoIA
-- ============================================================

INSERT IGNORE INTO library_resources
(title, category, resource_type, pages, file_name)
VALUES

-- ============================================================
-- INFORMÁTICA
-- ============================================================

('A Estrutura do Computador',
 'informatica',
 'livro',
 NULL,
 'A Estrutura do Computador.pdf'),

('Desenvolvimento Web no lado cliente - JavaScript',
 'informatica',
 'livro',
 NULL,
 'Desenvolvimento Web no lado cliente - JavaScript.pdf'),

('Estruturação de páginas usando HTML, CSS e Javascript',
 'informatica',
 'livro',
 NULL,
 'Estruturação de páginas usando HTML, CSS e Javascript.pdf'),

('Introdução à programação com Python',
 'informatica',
 'livro',
 NULL,
 'Introdução à programação com Python.pdf'),

('Introdução à Programação em C++',
 'informatica',
 'livro',
 NULL,
 'Introdução à Programação em C++.pdf'),

('Introdução ao HTML',
 'informatica',
 'livro',
 NULL,
 'Introdução ao HTML.pdf'),

('Introdução ao Universo da Programação com Python',
 'informatica',
 'livro',
 NULL,
 'Introdução ao Universo da Programação com Python.pdf'),

('Introdução Programação',
 'informatica',
 'livro',
 NULL,
 'Introdução Programação.pdf'),

('Java Apostila',
 'informatica',
 'livro',
 NULL,
 'Java Apostila.pdf'),

('Linux',
 'informatica',
 'livro',
 NULL,
 'Linux.pdf'),

('Manual Prático de Hardware',
 'informatica',
 'livro',
 NULL,
 'Manual Prático de Hardware.pdf'),

('Manutenção e montagem de computadores',
 'informatica',
 'livro',
 NULL,
 'Manutenção e montagem de computadores.pdf'),

('Montagem do Computador',
 'informatica',
 'livro',
 NULL,
 'Montagem do Computador.pdf'),

('Placa Mãe',
 'informatica',
 'livro',
 NULL,
 'Placa Mãe.pdf'),

('Redes de Computadores',
 'informatica',
 'livro',
 NULL,
 'Redes de Computadores.pdf'),

 ('Tudo sobre PC',
 'informatica',
 'livro',
 NULL,
 'Tudo sobre PC.pdf'),
-- ============================================================
-- CONTABILIDADE
-- ============================================================

('Contabilidade Básica',
 'contabilidade',
 'livro',
 NULL,
 'Contabilidade Básica.pdf'),

('Contabilidade Geral',
 'contabilidade',
 'livro',
 NULL,
 'Contabilidade Geral.pdf'),


-- ============================================================
-- MATEMÁTICA
-- ============================================================

('Derivadas',
 'matematica',
 'livro',
 NULL,
 'Derivadas.pdf'),

('Grande Book Matemática',
 'matematica',
 'livro',
 NULL,
 'Grande Book Matemática.pdf'),

('Limites e derivadas',
 'matematica',
 'livro',
 NULL,
 'Limites e derivadas.pdf'),

('Matemática - Mestre Nguala',
 'matematica',
 'livro',
 NULL,
 'Matemática - Mestre Nguala.pdf'),

('Matemática Aplicada Vol I',
 'matematica',
 'livro',
 NULL,
 'Matemática Aplicada Vol I.pdf'),

('Matemática Benigno Filho',
 'matematica',
 'livro',
 NULL,
 'Matemática Benigno Filho.pdf'),

('Matemática Financeira',
 'matematica',
 'livro',
 NULL,
 'Matemática Financeira.pdf'),


-- ============================================================
-- ELECTRÓNICA
-- ============================================================

('Electrotecnia',
 'electronica',
 'livro',
 NULL,
 'Electrotecnia.pdf'),

('Electrónica Básica',
 'electronica',
 'livro',
 NULL,
 'Electrónica Básica.pdf'),

('Electrónica Ilustrada',
 'electronica',
 'livro',
 NULL,
 'Electrónica Ilustrada.pdf'),

('Eletronica',
 'electronica',
 'livro',
 NULL,
 'Eletronica.pdf'),


-- ============================================================
-- ELECTRICIDADE
-- ============================================================

('Eletricidade',
 'electricidade',
 'livro',
 NULL,
 'Eletricidade.pdf'),


-- ============================================================
-- FÍSICA
-- ============================================================

('Física 10ª e 11ª classe',
 'fisica',
 'livro',
 NULL,
 'Física 10ª e 11ª classe.pdf'),

('Física 12ª Classe da Reforma Educativa',
 'fisica',
 'livro',
 NULL,
 'Física 12ª Classe da Reforma Educativa.pdf'),

('Mecânica Calor Ondas',
 'fisica',
 'livro',
 NULL,
 'Mecânica Calor Ondas.pdf'),


-- ============================================================
-- MECÂNICA
-- ============================================================

('Hidráulica',
 'mecanica',
 'livro',
 NULL,
 'Hidráulica.pdf'),

('Mecânica dos Fluidos',
 'mecanica',
 'livro',
 NULL,
 'Mecânica dos Fluidos.pdf'),

('Mecânica Ramalho',
 'mecanica',
 'livro',
 NULL,
 'Mecânica Ramalho.pdf');

-- ============================================================
-- VERIFICAR OS LIVROS CADASTRADOS
-- ============================================================

SELECT
    id,
    title,
    category,
    resource_type,
    pages,
    file_name
FROM library_resources
WHERE resource_type = 'livro'
ORDER BY title;