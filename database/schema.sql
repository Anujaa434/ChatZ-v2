-- ==========================
-- CHATZ DATABASE SCHEMA
-- ==========================
-- This is an idempotent schema that can be run multiple times safely

CREATE DATABASE IF NOT EXISTS chatz_refined
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE chatz_refined;

SET default_storage_engine=INNODB;

-- ==========================
-- 1) USERS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  email_verify_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ==========================
-- 2) AI MODELS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS ai_models (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  model_key VARCHAR(100) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_models_active (is_active)
) ENGINE=InnoDB;

-- ==========================
-- 3) CHATS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS chats (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  pinned TINYINT(1) DEFAULT 0,
  is_deleted TINYINT(1) DEFAULT 0,
  is_auto_title_generated TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chats_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_chats_user (user_id),
  INDEX idx_chats_user_active (user_id, is_deleted),
  INDEX idx_chats_sidebar (user_id, is_deleted, pinned DESC, updated_at DESC)
) ENGINE=InnoDB;

-- ==========================
-- 4) MESSAGES TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chat_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  model_id INT UNSIGNED NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content TEXT NOT NULL,
  pinned TINYINT(1) DEFAULT 0,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_chat
    FOREIGN KEY (chat_id) REFERENCES chats(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_messages_model
    FOREIGN KEY (model_id) REFERENCES ai_models(id)
    ON DELETE SET NULL,
  INDEX idx_messages_chat (chat_id, is_deleted, created_at),
  INDEX idx_messages_pinned (chat_id, pinned, is_deleted)
) ENGINE=InnoDB;

-- ==========================
-- 5) NOTE FOLDERS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS note_folders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(20) DEFAULT '#5227FF',
  pinned TINYINT(1) DEFAULT 0,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_note_folders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_note_folders_user (user_id, is_deleted),
  INDEX idx_note_folders_sidebar (user_id, is_deleted, pinned DESC, updated_at DESC)
) ENGINE=InnoDB;

-- ==========================
-- 6) NOTES TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  chat_id BIGINT UNSIGNED NULL,
  note_folder_id BIGINT UNSIGNED NULL,
  message_id BIGINT UNSIGNED NULL,
  title VARCHAR(255) DEFAULT NULL,
  content TEXT NOT NULL,
  color VARCHAR(20) DEFAULT '#5227FF',
  pinned TINYINT(1) DEFAULT 0,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notes_chat
    FOREIGN KEY (chat_id) REFERENCES chats(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_notes_folder
    FOREIGN KEY (note_folder_id) REFERENCES note_folders(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_notes_message
    FOREIGN KEY (message_id) REFERENCES messages(id)
    ON DELETE SET NULL,
  INDEX idx_notes_user (user_id, is_deleted),
  INDEX idx_notes_chat (chat_id, is_deleted),
  INDEX idx_notes_folder (note_folder_id, is_deleted),
  INDEX idx_notes_pinned (user_id, is_deleted, pinned DESC, updated_at DESC)
) ENGINE=InnoDB;

-- ==========================
-- HELPER PROCEDURES
-- ==========================

-- Procedure to safely add columns if they don't exist
DELIMITER $$

DROP PROCEDURE IF EXISTS ensure_schema_updates $$
CREATE PROCEDURE ensure_schema_updates()
BEGIN
  -- All columns are now in the main CREATE TABLE statements above
  -- This procedure is kept for future migrations
  SELECT 'Schema is up to date' AS status;
END $$

DELIMITER ;

CALL ensure_schema_updates();
DROP PROCEDURE ensure_schema_updates;

-- ==========================
-- INITIAL DATA (Optional)
-- ==========================

-- Insert default AI models if they don't exist
INSERT IGNORE INTO ai_models (name, provider, model_key, is_active) VALUES
  ('GPT-4', 'OpenAI', 'gpt-4', 1),
  ('GPT-3.5 Turbo', 'OpenAI', 'gpt-3.5-turbo', 1),
  ('Claude 3 Opus', 'Anthropic', 'claude-3-opus', 1),
  ('Claude 3 Sonnet', 'Anthropic', 'claude-3-sonnet', 1);

-- ==========================
-- NOTES FOR DEVELOPERS
-- ==========================
-- 
-- SOFT DELETE STRATEGY:
-- - All main tables use is_deleted flag
-- - Application should filter is_deleted=0 in queries
-- - Consider a cleanup job to permanently delete old soft-deleted records
-- - When soft-deleting a chat, also soft-delete its messages in application logic
--
-- INDEX STRATEGY:
-- - All indexes include is_deleted for efficient filtering
-- - Sidebar queries optimized with composite indexes (pinned DESC, updated_at DESC)
-- - Foreign key columns are indexed for join performance
--
-- NOTES TABLE DESIGN:
-- - A note can belong to: a folder, a chat, a specific message, or be standalone
-- - chat_id: for notes related to entire conversations
-- - message_id: for notes on specific messages
-- - note_folder_id: for organizational folders
-- - Validate in application that relationships make sense for your use case
--