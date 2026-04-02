-- ============================================================
-- UKL PHASE 2 — PostgreSQL 14+ Schema  (v2.3 — Hardened)
-- Database: ukl_phase2
-- Team: Anuja Patil (2501133) · Akshata Shrivastava (2501173)
-- Based on: DataDict_v4 + UKL_Phase2_PromptGuide (Prompt A-1)
-- ============================================================
-- Run this file against a fresh PostgreSQL 14+ instance.
-- It is idempotent: DROP + CREATE so you can re-run safely.



-- ============================================================
-- 0.  DROP TABLES (reverse FK order) — safe reset
-- ============================================================
DROP TABLE IF EXISTS token_usage      CASCADE;
DROP TABLE IF EXISTS user_sessions    CASCADE;
DROP TABLE IF EXISTS user_api_keys    CASCADE;
DROP TABLE IF EXISTS notes            CASCADE;
DROP TABLE IF EXISTS messages         CASCADE;
DROP TABLE IF EXISTS chats            CASCADE;
DROP TABLE IF EXISTS folders          CASCADE;
DROP TABLE IF EXISTS ai_models        CASCADE;
DROP TABLE IF EXISTS users            CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS message_role CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;



-- ============================================================
-- 1.  EXTENSIONS
-- ============================================================
-- pgvector: required for VECTOR(1536) columns and <=> operator
CREATE EXTENSION IF NOT EXISTS vector;



-- ============================================================
-- 2.  CUSTOM ENUM TYPES
-- ============================================================

-- Role label for every message — 'user' | 'assistant' | 'system'
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- ★ Phase 2 v2.2 — User access level ENUM
-- Using ENUM instead of VARCHAR(20) so DB rejects any typo ('Admin', 'superadmin', etc.)
-- To add a new role later: ALTER TYPE user_role ADD VALUE 'moderator';
CREATE TYPE user_role AS ENUM ('user', 'admin');



-- ============================================================
-- 3.  AUTO-UPDATE TRIGGER FUNCTION
-- ============================================================
-- Applied to every table that has an updated_at column.
-- Fires BEFORE UPDATE and sets updated_at = NOW() automatically.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- ============================================================
-- 4.  TABLE: users
-- ============================================================
-- Root table for all user accounts.
-- Phase 2 v2.2 adds: role (user_role ENUM), token expiry columns.
-- Phase 2 v2.3 adds: failed_login_attempts + locked_until (brute-force protection).
-- ============================================================
CREATE TABLE users (
  id                                BIGSERIAL       PRIMARY KEY,
  name                              VARCHAR(100)    NOT NULL,
  email                             VARCHAR(255)    NOT NULL UNIQUE,
  password_hash                     VARCHAR(255)    NOT NULL,
  is_verified                       BOOLEAN         NOT NULL DEFAULT FALSE,

  -- Phase 2 v2.2 additions ★
  role                              user_role       NOT NULL DEFAULT 'user',
  email_verify_token                VARCHAR(255)    NULL,
  email_verify_token_expires_at     TIMESTAMP       NULL,    -- expiry for verify link (24h)
  reset_password_token              VARCHAR(255)    NULL,
  reset_password_token_expires_at   TIMESTAMP       NULL,    -- expiry for reset link (1h)
  last_login_at                     TIMESTAMP       NULL,
  daily_token_limit                 INTEGER         NOT NULL DEFAULT 10000
                                      CHECK (daily_token_limit > 0),   -- ★ v2.3: must be positive
  is_limit_enabled                  BOOLEAN         NOT NULL DEFAULT TRUE,

  -- Phase 2 v2.3 brute-force protection ★
  failed_login_attempts             INTEGER         NOT NULL DEFAULT 0
                                      CHECK (failed_login_attempts >= 0),
  locked_until                      TIMESTAMP       NULL,    -- NULL = not locked; set to future time on lockout

  deleted_at                        TIMESTAMP       NULL DEFAULT NULL,   -- soft delete
  created_at                        TIMESTAMP       DEFAULT NOW(),
  updated_at                        TIMESTAMP       DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_role         ON users (role);
CREATE INDEX idx_users_active       ON users (id) WHERE deleted_at IS NULL;  -- ★ v2.3: partial index

-- Auto-update trigger
CREATE TRIGGER set_timestamp_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();



-- ============================================================
-- 5.  TABLE: ai_models
-- ============================================================
-- Registry of AI model configurations.
-- Phase 2 adds: description, max_context_tokens, updated_at.
-- Phase 2 v2.3: provider CHECK + UNIQUE (provider, model_key) ★
-- ============================================================
CREATE TABLE ai_models (
  id                    SERIAL          PRIMARY KEY,
  name                  VARCHAR(100)    NOT NULL,
  provider              VARCHAR(50)     NOT NULL
                          CHECK (provider IN ('openai', 'gemini', 'groq', 'anthropic')), -- ★ v2.3
  model_key             VARCHAR(100)    NOT NULL,

  -- Phase 2 additions ★
  description           TEXT            NULL,
  max_context_tokens    INTEGER         NULL CHECK (max_context_tokens > 0),

  is_active             BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMP       DEFAULT NOW(),
  updated_at            TIMESTAMP       DEFAULT NOW(),

  -- ★ v2.3: prevents duplicate model registrations per provider
  CONSTRAINT uq_ai_model UNIQUE (provider, model_key)
);

-- Indexes
CREATE INDEX idx_ai_models_active   ON ai_models (is_active);
CREATE INDEX idx_ai_models_provider ON ai_models (provider);

-- Auto-update trigger
CREATE TRIGGER set_timestamp_ai_models
  BEFORE UPDATE ON ai_models
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();



-- ============================================================
-- 6.  TABLE: folders
-- ============================================================
-- NEW in Phase 2 ★
-- Hierarchical workspace containers.
-- Self-referencing FK (parent_folder_id → folders.id) allows
-- unlimited nesting depth. Replaces note_folders from Phase 1.
-- ============================================================
CREATE TABLE folders (
  id                    BIGSERIAL       PRIMARY KEY,
  user_id               BIGINT          NOT NULL
                          REFERENCES users (id) ON DELETE CASCADE,
  parent_folder_id      BIGINT          NULL
                          REFERENCES folders (id) ON DELETE CASCADE,  -- self-ref
  name                  VARCHAR(255)    NOT NULL,
  color                 VARCHAR(20)     DEFAULT '#5227FF',
  pinned                BOOLEAN         DEFAULT FALSE,
  deleted_at            TIMESTAMP       NULL DEFAULT NULL,             -- soft delete
  created_at            TIMESTAMP       DEFAULT NOW(),
  updated_at            TIMESTAMP       DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_folders_active   ON folders (user_id, deleted_at);
CREATE INDEX idx_folders_parent   ON folders (parent_folder_id);
CREATE INDEX idx_folders_sidebar  ON folders (user_id, deleted_at, pinned DESC, updated_at DESC);

-- Auto-update trigger
CREATE TRIGGER set_timestamp_folders
  BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();



-- ============================================================
-- 7.  TABLE: chats
-- ============================================================
-- Individual AI conversation sessions.
-- Phase 2 adds: folder_id, default_model_id, last_message_at.
-- deleted_at replaces is_deleted boolean from Phase 1.
-- ============================================================
CREATE TABLE chats (
  id                        BIGSERIAL       PRIMARY KEY,
  user_id                   BIGINT          NOT NULL
                              REFERENCES users (id) ON DELETE CASCADE,
  folder_id                 BIGINT          NULL
                              REFERENCES folders (id) ON DELETE SET NULL,  -- ★
  default_model_id          INTEGER         NULL
                              REFERENCES ai_models (id) ON DELETE SET NULL, -- ★
  title                     VARCHAR(255)    NOT NULL,
  pinned                    BOOLEAN         DEFAULT FALSE,
  last_message_at           TIMESTAMP       NULL,                           -- ★
  is_auto_title_generated   BOOLEAN         DEFAULT FALSE,
  deleted_at                TIMESTAMP       NULL DEFAULT NULL,              -- soft delete
  created_at                TIMESTAMP       DEFAULT NOW(),
  updated_at                TIMESTAMP       DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chats_user        ON chats (user_id);
CREATE INDEX idx_chats_user_active ON chats (user_id, deleted_at);
CREATE INDEX idx_chats_sidebar     ON chats (user_id, deleted_at, pinned DESC, last_message_at DESC);

-- NOTE: No trigger on chats.updated_at — it is APP-MANAGED (per DataDict v2.2).
-- The trigger would only fire on direct UPDATE to the chats row.
-- The common update path is inserting a NEW MESSAGE (separate INSERT on messages),
-- which does NOT fire this trigger. The app layer must set updated_at = NOW()
-- when adding a message. This is intentional by design.



-- ============================================================
-- 8.  TABLE: messages
-- ============================================================
-- Messages within a chat session.
-- Phase 2 adds: token_count, status, embedding VECTOR(1536).
-- Phase 2 v2.3: embedding_status (consistent with notes), token_count CHECK ★
-- ============================================================
CREATE TABLE messages (
  id            BIGSERIAL       PRIMARY KEY,
  chat_id       BIGINT          NOT NULL
                  REFERENCES chats (id) ON DELETE CASCADE,
  user_id       BIGINT          NULL
                  REFERENCES users (id) ON DELETE SET NULL,
  model_id      INTEGER         NULL
                  REFERENCES ai_models (id) ON DELETE SET NULL,
  role          message_role    NOT NULL,
  content       TEXT            NOT NULL,

  -- Phase 2 additions ★
  token_count       INTEGER         NULL
                      CHECK (token_count >= 0),           -- ★ v2.3: cannot be negative
  status            VARCHAR(20)     NOT NULL DEFAULT 'completed'
                      CHECK (status IN ('pending', 'completed', 'failed')),
  embedding         VECTOR(1536)    NULL,                 -- OpenAI text-embedding-3-small
  embedding_status  VARCHAR(10)     NOT NULL DEFAULT 'pending'  -- ★ v2.3: async pipeline (mirrors notes)
                      CHECK (embedding_status IN ('pending', 'done', 'failed')),

  pinned        BOOLEAN         NOT NULL DEFAULT FALSE,
  deleted_at    TIMESTAMP       NULL DEFAULT NULL,
  created_at    TIMESTAMP       DEFAULT NOW()
  -- no updated_at — messages are immutable once sent
);

-- Indexes
CREATE INDEX idx_messages_chat      ON messages (chat_id, deleted_at, created_at);
CREATE INDEX idx_messages_pinned    ON messages (chat_id, pinned, deleted_at);
CREATE INDEX idx_messages_status    ON messages (status) WHERE status != 'completed'; -- ★ v2.3: pending/failed lookup
-- IVFFlat index for vector cosine similarity search (RAG) — lists=100 per DataDict spec
CREATE INDEX idx_messages_embedding ON messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);



-- ============================================================
-- 9.  TABLE: notes
-- ============================================================
-- User-created knowledge notes.
-- Phase 2: note_folder_id → folder_id, adds embedding VECTOR(1536).
-- ============================================================
CREATE TABLE notes (
  id            BIGSERIAL       PRIMARY KEY,
  user_id       BIGINT          NOT NULL
                  REFERENCES users (id) ON DELETE CASCADE,
  folder_id     BIGINT          NULL
                  REFERENCES folders (id) ON DELETE SET NULL,    -- ★ replaces note_folder_id
  chat_id       BIGINT          NULL
                  REFERENCES chats (id) ON DELETE SET NULL,
  message_id    BIGINT          NULL
                  REFERENCES messages (id) ON DELETE SET NULL,
  title             VARCHAR(255)    NULL,
  content           TEXT            NOT NULL,

  -- Phase 2 additions ★
  embedding         VECTOR(1536)    NULL,                        -- OpenAI text-embedding-3-small (RAG)
  embedding_status  VARCHAR(10)     NOT NULL DEFAULT 'pending'   -- ★ v2.2: async pipeline state
                      CHECK (embedding_status IN ('pending', 'done', 'failed')),
                      -- 'pending' = saved, embedding not yet generated
                      -- 'done'    = embedding populated, ready for <=> search
                      -- 'failed'  = embedding job failed, will be retried

  color         VARCHAR(20)     DEFAULT '#5227FF',
  pinned        BOOLEAN         DEFAULT FALSE,
  deleted_at    TIMESTAMP       NULL DEFAULT NULL,               -- soft delete
  created_at    TIMESTAMP       DEFAULT NOW(),
  updated_at    TIMESTAMP       DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notes_user      ON notes (user_id, deleted_at);
CREATE INDEX idx_notes_folder    ON notes (folder_id, deleted_at);
CREATE INDEX idx_notes_chat      ON notes (chat_id, deleted_at);
CREATE INDEX idx_notes_pinned          ON notes (user_id, deleted_at, pinned DESC, updated_at DESC);
CREATE INDEX idx_notes_embedding_status ON notes (user_id, embedding_status) WHERE deleted_at IS NULL; -- ★ v2.3
-- IVFFlat index for cosine similarity search on note embeddings — lists=100 per DataDict spec
CREATE INDEX idx_notes_embedding ON notes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Auto-update trigger
CREATE TRIGGER set_timestamp_notes
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();



-- ============================================================
-- 10. TABLE: user_api_keys
-- ============================================================
-- NEW in Phase 2 ★
-- AES-256-GCM encrypted BYOK (Bring Your Own Key) store.
-- One row per user per provider. Never stores keys in plain text.
-- ============================================================
CREATE TABLE user_api_keys (
  id            BIGSERIAL       PRIMARY KEY,
  user_id       BIGINT          NOT NULL
                  REFERENCES users (id) ON DELETE CASCADE,
  provider      VARCHAR(50)     NOT NULL
                  CHECK (provider IN ('openai', 'gemini', 'groq', 'anthropic')), -- ★ v2.3: must match ai_models
  key_label     VARCHAR(100)    NULL,       -- e.g. 'Work Key', 'Personal'
  iv            VARCHAR(64)     NOT NULL,   -- AES-GCM IV stored as hex
  auth_tag      VARCHAR(64)     NOT NULL,   -- GCM auth tag as hex (tamper detection)
  ciphertext    TEXT            NOT NULL,   -- encrypted key as hex
  is_revoked    BOOLEAN         NOT NULL DEFAULT FALSE,
  expires_at    TIMESTAMP       NULL,       -- optional expiry
  last_used_at  TIMESTAMP       NULL,
  created_at    TIMESTAMP       DEFAULT NOW(),
  updated_at    TIMESTAMP       DEFAULT NOW(),

  -- One key record per (user, provider) pair
  CONSTRAINT uq_user_provider UNIQUE (user_id, provider)
);

-- Indexes
CREATE INDEX idx_user_api_keys_user   ON user_api_keys (user_id);
CREATE INDEX idx_api_keys_expiry      ON user_api_keys (expires_at);

-- Auto-update trigger
CREATE TRIGGER set_timestamp_user_api_keys
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();



-- ============================================================
-- 11. TABLE: user_sessions
-- ============================================================
-- NEW in Phase 2 ★
-- Stores hashed refresh tokens for proper JWT logout/revocation.
-- Phase 1 JWTs were stateless and could not be revoked before expiry.
-- ============================================================
CREATE TABLE user_sessions (
  id              BIGSERIAL       PRIMARY KEY,
  user_id         BIGINT          NOT NULL
                    REFERENCES users (id) ON DELETE CASCADE,
  token_hash      VARCHAR(255)    NOT NULL UNIQUE,  -- ★ v2.2: SHA-256 hash of the raw refresh token
                                                    -- Raw token is NEVER stored — only its hash
  ip_address      VARCHAR(45)     NULL,             -- IPv4 or IPv6 (security audit)
  user_agent      TEXT            NULL,             -- browser/device info (security audit)
  is_revoked      BOOLEAN         NOT NULL DEFAULT FALSE,  -- TRUE = logged out / revoked
  expires_at      TIMESTAMP       NOT NULL,         -- NOW() + INTERVAL '30 days' on issue
  last_used_at    TIMESTAMP       NULL,
  created_at      TIMESTAMP       DEFAULT NOW()
  -- no updated_at — sessions are append-only, only is_revoked flag changes
);

-- Indexes
CREATE INDEX idx_sessions_user    ON user_sessions (user_id, is_revoked);
CREATE INDEX idx_sessions_token   ON user_sessions (token_hash);            -- fast lookup on every refresh
CREATE INDEX idx_sessions_expiry  ON user_sessions (expires_at);
-- ★ v2.3: partial index — only active (non-revoked) sessions; reduces index size significantly over time
CREATE INDEX idx_sessions_active  ON user_sessions (user_id, expires_at) WHERE is_revoked = FALSE;



-- ============================================================
-- 12. TABLE: token_usage  (NEW in Phase 2 v2.4)
-- ============================================================
-- Tracks per-user daily AI token consumption to enforce
-- users.daily_token_limit. One row per AI request.
-- Without this table, daily_token_limit cannot be enforced.
--
-- v2.4 adds: chat_id + message_id columns so usage can be
-- queried per conversation and per message — enabling a full
-- "usage history" view per chat in the UI.
-- ============================================================
CREATE TABLE token_usage (
  id            BIGSERIAL       PRIMARY KEY,

  -- Who spent the tokens
  user_id       BIGINT          NOT NULL
                  REFERENCES users (id) ON DELETE CASCADE,

  -- Which model generated them
  model_id      INTEGER         NULL
                  REFERENCES ai_models (id) ON DELETE SET NULL,

  -- ★ v2.4: Which conversation and which specific message
  chat_id       BIGINT          NULL
                  REFERENCES chats (id) ON DELETE SET NULL,
  message_id    BIGINT          NULL
                  REFERENCES messages (id) ON DELETE SET NULL,

  tokens_used   INTEGER         NOT NULL CHECK (tokens_used > 0),
  used_date     DATE            NOT NULL DEFAULT CURRENT_DATE,  -- partitioned by day for limit check
  created_at    TIMESTAMP       DEFAULT NOW()
);

-- Index 1: daily limit check — the most frequent query (runs before every AI request)
CREATE INDEX idx_token_usage_user_date ON token_usage (user_id, used_date);

-- Index 2: ★ v2.4 per-chat usage history (powers the "tokens used in this chat" UI view)
CREATE INDEX idx_token_usage_chat     ON token_usage (chat_id) WHERE chat_id IS NOT NULL;


-- ============================================================
-- QUERY REFERENCE
-- ============================================================
-- Q1: Daily total for limit enforcement (run BEFORE each AI request)
--   SELECT COALESCE(SUM(tokens_used), 0) AS total
--   FROM token_usage
--   WHERE user_id = $1 AND used_date = CURRENT_DATE;
--
-- Q2: ★ v2.4 Token usage breakdown per conversation
--   SELECT chat_id, SUM(tokens_used) AS total_tokens, COUNT(*) AS requests
--   FROM token_usage
--   WHERE user_id = $1
--   GROUP BY chat_id
--   ORDER BY total_tokens DESC;
--
-- Q3: ★ v2.4 Per-message token detail inside a chat
--   SELECT message_id, model_id, tokens_used, created_at
--   FROM token_usage
--   WHERE chat_id = $1
--   ORDER BY created_at;
-- ============================================================



-- ============================================================
-- END OF SCHEMA  (v2.4 — Final)
-- ============================================================
-- Tables (9 total, in FK dependency order):
--   users → ai_models → folders → chats → messages
--   → notes → user_api_keys → user_sessions → token_usage
--
-- Custom ENUMs:
--   message_role : 'user' | 'assistant' | 'system'
--   user_role    : 'user' | 'admin'                         ★ v2.2
--
-- v2.2 changes: user_role ENUM, token expiry columns, token_hash rename
-- v2.3 changes:
--   users        : failed_login_attempts + locked_until (brute-force protection)
--                  daily_token_limit CHECK > 0, partial index on active
--   ai_models    : CHECK on provider + UNIQUE (provider, model_key)
--   chats        : trigger REMOVED — updated_at is APP-MANAGED (DataDict v2.2)
--   messages     : embedding_status, token_count CHECK >= 0
--                  IVFFlat WITH (lists = 100), partial index on pending/failed
--   notes        : IVFFlat WITH (lists = 100), partial index on embedding_status
--   user_api_keys: CHECK on provider
--   user_sessions: partial index WHERE is_revoked = FALSE
--   token_usage  : new table to enforce daily_token_limit
-- v2.4 changes:
--   token_usage  : + chat_id + message_id — enables per-chat usage history
-- ============================================================
