// backend/src/models/note.model.js
// Fully migrated to pg (node-postgres) and aligned to schema_phase2.sql
// Phase 2 schema: notes.folder_id (NOT note_folder_id), folders table (NOT note_folders)
// Soft delete: deleted_at TIMESTAMP (NOT is_deleted INTEGER)
const pool = require("../config/db");

async function q(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// ── Shared SELECT — includes source chat/message context and can_show_in_chat ──
// Phase 2: uses `folder_id`, `deleted_at`, and `folders` table
const baseNoteSelect = `
  SELECT
    n.*,
    n.chat_id    AS source_chat_id,
    n.message_id AS source_message_id,
    CASE
      WHEN n.chat_id IS NOT NULL
        AND n.message_id IS NOT NULL
        AND c.id IS NOT NULL
        AND c.deleted_at IS NULL
        AND m.id IS NOT NULL
      THEN TRUE
      ELSE FALSE
    END AS can_show_in_chat
  FROM notes n
  LEFT JOIN chats    c ON c.id = n.chat_id    AND c.user_id = $1
  LEFT JOIN messages m ON m.id = n.message_id AND m.chat_id = n.chat_id AND m.deleted_at IS NULL
`;

// ── Get all notes for a user ──────────────────────────────────────────────
exports.getNotesByUserId = async (userId) => {
  return q(
    `${baseNoteSelect}
     WHERE n.user_id = $2 AND n.deleted_at IS NULL
     ORDER BY n.pinned DESC, n.updated_at DESC`,
    [userId, userId]
  );
};

// ── Get notes by folder ───────────────────────────────────────────────────
exports.getNotesByFolder = async (userId, folderId) => {
  return q(
    `${baseNoteSelect}
     WHERE n.user_id = $2 AND n.folder_id = $3 AND n.deleted_at IS NULL
     ORDER BY n.pinned DESC, n.updated_at DESC`,
    [userId, userId, folderId]
  );
};

// ── Get a single note by ID ────────────────────────────────────────────────
exports.getNoteById = async (noteId, userId) => {
  const rows = await q(
    `${baseNoteSelect}
     WHERE n.id = $2 AND n.user_id = $3 AND n.deleted_at IS NULL`,
    [userId, noteId, userId]
  );
  return rows[0] ?? null;
};

// ── Find note by chatId + title (duplicate prevention) ────────────────────
exports.findNoteByChatIdAndTitle = async (chatId, title, userId) => {
  const rows = await q(
    `${baseNoteSelect}
     WHERE n.chat_id = $2 AND n.title = $3 AND n.user_id = $4 AND n.deleted_at IS NULL
     ORDER BY n.updated_at DESC
     LIMIT 1`,
    [userId, chatId, title, userId]
  );
  return rows[0] ?? null;
};

// ── Find note by chatId only (fallback) ───────────────────────────────────
exports.findNoteByChatId = async (chatId, userId) => {
  const rows = await q(
    `${baseNoteSelect}
     WHERE n.chat_id = $2 AND n.user_id = $3 AND n.deleted_at IS NULL
     ORDER BY n.updated_at DESC
     LIMIT 1`,
    [userId, chatId, userId]
  );
  return rows[0] ?? null;
};

// ── Create a note ─────────────────────────────────────────────────────────
// Phase 2: folder_id (not note_folder_id)
exports.createNote = async ({
  userId,
  title = "Untitled Note",
  content = "",
  folderId = null,
  color = "#5227FF",
  chatId = null,
  messageId = null,
}) => {
  const rows = await q(
    `INSERT INTO notes (user_id, folder_id, chat_id, message_id, title, content, color)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [userId, folderId, chatId, messageId, title, content, color]
  );
  return exports.getNoteById(rows[0].id, userId);
};

// ── Update a note ─────────────────────────────────────────────────────────
exports.updateNote = async ({
  noteId,
  userId,
  title,
  content,
  folderId,
  color,
  chatId = null,
  messageId = null,
}) => {
  const rows = await q(
    `UPDATE notes
     SET title = $1, content = $2, folder_id = $3, color = $4,
         chat_id = $5, message_id = $6, updated_at = NOW()
     WHERE id = $7 AND user_id = $8 AND deleted_at IS NULL
     RETURNING id`,
    [title, content, folderId, color, chatId, messageId, noteId, userId]
  );
  if (rows.length === 0) return null;
  return exports.getNoteById(noteId, userId);
};

// ── Save/link a message to an existing note ───────────────────────────────
exports.saveMessageToNote = async ({ userId, noteId, messageId, title, content, chatId = null }) => {
  const exists = await q(
    "SELECT id FROM notes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
    [noteId, userId]
  );
  if (exists.length === 0) return null;

  const rows = await q(
    `UPDATE notes
     SET content = $1, title = $2, chat_id = $3, message_id = $4, updated_at = NOW()
     WHERE id = $5 AND user_id = $6 AND deleted_at IS NULL
     RETURNING id`,
    [content, title, chatId, messageId, noteId, userId]
  );
  if (rows.length === 0) return null;
  return exports.getNoteById(noteId, userId);
};

// ── Soft delete a note ────────────────────────────────────────────────────
exports.deleteNote = async ({ noteId, userId }) => {
  console.log(`[NOTE.MODEL] Soft-deleting note id=${noteId} userId=${userId}`);
  const rows = await q(
    `UPDATE notes
     SET deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [noteId, userId]
  );
  console.log(`[NOTE.MODEL] Delete result rows=${rows.length}`);
  return rows.length > 0;
};

// ── Pin / unpin a note ────────────────────────────────────────────────────
exports.togglePinNote = async ({ noteId, userId, pinned }) => {
  const rows = await q(
    `UPDATE notes
     SET pinned = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [pinned, noteId, userId]
  );
  return rows[0] ?? null;
};

// ── Get all folders for a user ────────────────────────────────────────────
// Phase 2: uses `folders` table (NOT note_folders)
exports.getFoldersByUserId = async (userId) => {
  return q(
    `SELECT * FROM folders
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY pinned DESC, updated_at DESC`,
    [userId]
  );
};

// Alias used by dashboard controller
exports.getUserNotes = exports.getNotesByUserId;

// ── Create a folder ───────────────────────────────────────────────────────
exports.createFolder = async ({ userId, name = "New Folder", color = "#5227FF", parentFolderId = null }) => {
  const rows = await q(
    `INSERT INTO folders (user_id, parent_folder_id, name, color)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, parentFolderId, name, color]
  );
  return rows[0];
};

// ── Update a folder ───────────────────────────────────────────────────────
exports.updateFolder = async ({ folderId, userId, name, color }) => {
  const rows = await q(
    `UPDATE folders
     SET name = $1, color = $2, updated_at = NOW()
     WHERE id = $3 AND user_id = $4 AND deleted_at IS NULL
     RETURNING *`,
    [name, color, folderId, userId]
  );
  return rows[0] ?? null;
};

// ── Soft delete a folder ──────────────────────────────────────────────────
exports.deleteFolder = async ({ folderId, userId }) => {
  const rows = await q(
    `UPDATE folders
     SET deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [folderId, userId]
  );
  return rows.length > 0;
};

// ── Pin / unpin a folder ──────────────────────────────────────────────────
exports.togglePinFolder = async ({ folderId, userId, pinned }) => {
  const rows = await q(
    `UPDATE folders
     SET pinned = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [pinned, folderId, userId]
  );
  return rows[0] ?? null;
};
