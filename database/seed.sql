-- ============================================================
-- UKL PHASE 2 — Seed Data
-- Database: ukl_phase2
-- Run AFTER schema_phase2.sql
-- ============================================================



-- ============================================================
-- 1.  AI MODELS
-- ============================================================
-- Inserts all supported AI provider configurations.
-- provider values are lowercase — must match user_api_keys.provider.
-- ============================================================
INSERT INTO ai_models (name, provider, model_key, description, max_context_tokens, is_active)
VALUES
  -- OpenAI
  ('GPT-4o',        'openai',    'gpt-4o',                  'Most capable OpenAI model. Multimodal, 128k context.',  128000, TRUE),
  ('GPT-4o Mini',   'openai',    'gpt-4o-mini',             'Lightweight GPT-4o. Faster and cheaper for simple tasks.', 128000, TRUE),

  -- Google Gemini
  ('Gemini 1.5 Pro',   'gemini', 'gemini-1.5-pro',          'Google flagship. 1M token context, excels at long docs.', 1048576, TRUE),
  ('Gemini 1.5 Flash', 'gemini', 'gemini-1.5-flash',        'Faster and more cost-efficient Gemini variant.',            1048576, TRUE),

  -- Groq (fast inference hardware)
  ('Llama 3 70B',      'groq',   'llama3-70b-8192',         'Meta Llama 3 70B on Groq — fastest response times.',      8192,   TRUE),
  ('Mixtral 8x7B',     'groq',   'mixtral-8x7b-32768',      'Mistral MoE model on Groq. Strong reasoning, 32k context.', 32768, TRUE),

  -- Anthropic
  ('Claude 3.5 Sonnet','anthropic','claude-3-5-sonnet-20241022','Anthropic flagship. Excellent at code + analysis.', 200000, TRUE);



-- ============================================================
-- 2.  TEST USER
-- ============================================================
-- Password: Test@1234
-- bcrypt hash (10 rounds) — safe to hardcode in seed for dev/testing.
-- is_verified is set TRUE so you can log in immediately without email flow.
-- ============================================================
INSERT INTO users (name, email, password_hash, is_verified, role)
VALUES (
  'Test User',
  'test@ukl.dev',
  '$2b$10$KIx9l/d1LtcxkEz3B7cF1.f6rkrqFVNHvHnBxSPmQRloiYJzNnqfK',  -- Test@1234
  TRUE,
  'user'
);



-- ============================================================
-- 3.  ADMIN USER (system operator)
-- ============================================================
-- Password: Admin@1234
-- ============================================================
INSERT INTO users (name, email, password_hash, is_verified, role, is_limit_enabled)
VALUES (
  'Admin',
  'admin@ukl.dev',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uJa98uMGy',  -- Admin@1234  (placeholder)
  TRUE,
  'admin',
  FALSE  -- admin bypasses daily token limit
);



-- ============================================================
-- 4.  SAMPLE FOLDER STRUCTURE (for test user)
-- ============================================================
-- Creates: MCA → Semester 2 → Operating Systems
-- This exercises the self-referencing FK and nested hierarchy.
-- ============================================================

-- Root folder
INSERT INTO folders (user_id, parent_folder_id, name, color, pinned)
VALUES (1, NULL, 'MCA', '#5227FF', TRUE)
RETURNING id;  -- id = 1

-- Second-level folder
INSERT INTO folders (user_id, parent_folder_id, name, color, pinned)
VALUES (1, 1, 'Semester 2', '#06b6d4', FALSE);  -- id = 2

-- Third-level folder
INSERT INTO folders (user_id, parent_folder_id, name, color, pinned)
VALUES (1, 2, 'Operating Systems', '#f59e0b', FALSE);  -- id = 3



-- ============================================================
-- 5.  SAMPLE CHAT (linked to folder)
-- ============================================================
INSERT INTO chats (user_id, folder_id, default_model_id, title, pinned)
VALUES (1, 3, 1, 'OS Revision Session', TRUE);  -- linked to Operating Systems, GPT-4o



-- ============================================================
-- 6.  SAMPLE MESSAGES
-- ============================================================
INSERT INTO messages (chat_id, user_id, model_id, role, content, status)
VALUES
  (1, 1, NULL, 'user',      'Explain process scheduling in OS.', 'completed'),
  (1, NULL, 1, 'assistant',
   'Process scheduling is the activity of the process manager that handles the removal '
   'of the running process from the CPU and the selection of another process based on a '
   'particular strategy. Common algorithms include Round Robin, Priority Scheduling, '
   'and Shortest Job First (SJF).',
   'completed');



-- ============================================================
-- 7.  SAMPLE NOTE (linked to chat)
-- ============================================================
INSERT INTO notes (user_id, folder_id, chat_id, title, content, color, pinned)
VALUES (
  1, 3, 1,
  'OS Scheduling Algorithms',
  'Key scheduling algorithms:
- Round Robin: Equal CPU time slices, good for time-sharing.
- Priority Scheduling: Higher priority process runs first.
- SJF (Shortest Job First): Minimises average wait time.
- FCFS: First Come First Served, simplest but can cause convoy effect.',
  '#f59e0b',
  FALSE
);



-- ============================================================
-- END OF SEED
-- ============================================================
-- Seeded:
--   7 AI models (OpenAI ×2, Gemini ×2, Groq ×2, Anthropic ×1)
--   1 test user  (test@ukl.dev / Test@1234)
--   1 admin user (admin@ukl.dev / Admin@1234)
--   3 nested folders (MCA > Semester 2 > Operating Systems)
--   1 sample chat with 2 messages
--   1 sample note linked to the chat
-- ============================================================
