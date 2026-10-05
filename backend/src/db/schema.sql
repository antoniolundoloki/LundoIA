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

INSERT IGNORE INTO library_resources
(title, category, resource_type, pages, file_name)
VALUES

-- INFORMÁTICA
('A Estrutura do Computador',
 'informatica',
 'livro',
 NULL,
 'a-estrutura-do-computador.pdf'),

('Desenvolvimento Web no lado cliente - JavaScript',
 'informatica',
 'livro',
 NULL,
 'desenvolvimento-web-no-lado-cliente-javascript.pdf'),

('Estruturação de páginas usando HTML, CSS e Javascript',
 'informatica',
 'livro',
 NULL,
 'estruturacao-de-paginas-usando-html-css-javascript.pdf'),

('Introdução à programação com Python',
 'informatica',
 'livro',
 NULL,
 'introducao-a-programacao-com-python.pdf'),

('Introdução à Programação em C++',
 'informatica',
 'livro',
 NULL,
 'introducao-a-programacao-em-cpp.pdf'),

('Introdução ao HTML',
 'informatica',
 'livro',
 NULL,
 'introducao-ao-html.pdf'),

('Introdução ao Universo da Programação com Python',
 'informatica',
 'livro',
 NULL,
 'introducao-ao-universo-da-programacao-com-python.pdf'),

('Introdução Programação',
 'informatica',
 'livro',
 NULL,
 'introducao-programacao.pdf'),

('Java Apostila',
 'informatica',
 'livro',
 NULL,
 'java-apostila.pdf'),

('Linux',
 'informatica',
 'livro',
 NULL,
 'linux.pdf'),

('Manual Prático de Hardware',
 'informatica',
 'livro',
 NULL,
 'manual-pratico-de-hardware.pdf'),

('Manutenção e montagem de computadores',
 'informatica',
 'livro',
 NULL,
 'manutencao-e-montagem-de-computadores.pdf'),

('Montagem do Computador',
 'informatica',
 'livro',
 NULL,
 'montagem-do-computador.pdf'),

('Placa Mãe',
 'informatica',
 'livro',
 NULL,
 'placa-mae.pdf'),


-- CONTABILIDADE
('Contabilidade Básica',
 'contabilidade',
 'livro',
 NULL,
 'contabilidade-basica.pdf'),

('Contabilidade Geral',
 'contabilidade',
 'livro',
 NULL,
 'contabilidade-geral.pdf'),


-- MATEMÁTICA
('Derivadas',
 'matematica',
 'livro',
 NULL,
 'derivadas.pdf'),

('Grande Book Matemática',
 'matematica',
 'livro',
 NULL,
 'grande-book-matematica.pdf'),

('Limites e derivadas',
 'matematica',
 'livro',
 NULL,
 'limites-e-derivadas.pdf'),

('Matemática - Mestre Nguala',
 'matematica',
 'livro',
 NULL,
 'matematica-mestre-nguala.pdf'),

('Matemática Aplicada Vol I',
 'matematica',
 'livro',
 NULL,
 'matematica-aplicada-vol-i.pdf'),

('Matemática Benigno Filho',
 'matematica',
 'livro',
 NULL,
 'matematica-benigno-filho.pdf'),

('Matemática Financeira',
 'matematica',
 'livro',
 NULL,
 'matematica-financeira.pdf'),


-- ELECTRÓNICA
('Electrotecnia',
 'electronica',
 'livro',
 NULL,
 'electrotecnia.pdf'),

('Electrónica Básica',
 'electronica',
 'livro',
 NULL,
 'electronica-basica.pdf'),

('Electrónica Ilustrada',
 'electronica',
 'livro',
 NULL,
 'electronica-ilustrada.pdf'),

('Eletronica',
 'electronica',
 'livro',
 NULL,
 'eletronica.pdf'),


-- ELECTRICIDADE
('Eletricidade',
 'electricidade',
 'livro',
 NULL,
 'eletricidade.pdf'),


-- FÍSICA
('Física 10ª e 11ª classe',
 'fisica',
 'livro',
 NULL,
 'fisica-10-e-11-classe.pdf'),

('Física 12ª Classe da Reforma Educativa',
 'fisica',
 'livro',
 NULL,
 'fisica-12-classe-da-reforma-educativa.pdf'),


-- MECÂNICA
('Hidráulica',
 'mecanica',
 'livro',
 NULL,
 'hidraulica.pdf'),

('Mecânica Calor Ondas',
 'fisica',
 'livro',
 NULL,
 'mecanica-calor-ondas.pdf'),

('Mecânica dos Fluidos',
 'mecanica',
 'livro',
 NULL,
 'mecanica-dos-fluidos.pdf'),

('Mecânica Ramalho',
 'mecanica',
 'livro',
 NULL,
 'mecanica-ramalho.pdf');