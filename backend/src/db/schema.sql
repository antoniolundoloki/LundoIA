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
