// backend/src/models/chat.model.js
// Fully migrated to pg (node-postgres) and aligned to schema_phase2.sql
const pool = require("../config/db");

// ── helper: run query, return rows array ─────────────────────────────────
async function q(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// ── Get all chats for a user (sidebar list) ──────────────────────────────
exports.getUserChats = async (userId) => {
  return q(
    `SELECT * FROM chats
     WHERE user_id = $1
       AND deleted_at IS NULL
     ORDER BY pinned DESC, last_message_at DESC NULLS LAST, updated_at DESC`,
    [userId]
  );
};

// ── Get a single chat by ID ───────────────────────────────────────────────
exports.getChatById = async (chatId) => {
  const rows = await q(
    "SELECT * FROM chats WHERE id = $1 AND deleted_at IS NULL",
    [chatId]
  );
  return rows[0] ?? null;
};

// ── Create a new chat ─────────────────────────────────────────────────────
exports.createChat = async ({ userId, title, folderId = null, isAutoTitleGenerated = false }) => {
  const rows = await q(
    `INSERT INTO chats (user_id, folder_id, title, is_auto_title_generated)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, folderId, title, isAutoTitleGenerated]
  );
  return rows[0];
};

// ── Create a new chat and initial message in a transaction ────────────────
exports.createChatWithMessage = async ({ userId, title, folderId = null, isAutoTitleGenerated = false, messageRole, messageContent }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const chatRes = await client.query(
      `INSERT INTO chats (user_id, folder_id, title, is_auto_title_generated)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, folderId, title, isAutoTitleGenerated]
    );
    const chat = chatRes.rows[0];

    await client.query(
      `INSERT INTO messages (chat_id, user_id, role, content)
       VALUES ($1, $2, $3, $4)`,
      [chat.id, userId, messageRole, messageContent]
    );

    await client.query(
      `UPDATE chats SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [chat.id]
    );

    await client.query('COMMIT');
    return chat;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── Rename a chat (manual rename — clears auto-title flag) ────────────────
exports.renameChat = async ({ chatId, title, userId }) => {
  const rows = await q(
    `UPDATE chats
     SET title = $1, is_auto_title_generated = FALSE, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [title, chatId, userId]
  );
  return rows[0] ?? null;
};

// ── Update auto-generated title (only if not manually renamed) ────────────
exports.updateAutoTitle = async ({ chatId, title, userId }) => {
  const rows = await q(
    `UPDATE chats
     SET title = $1, is_auto_title_generated = TRUE, updated_at = NOW()
     WHERE id = $2
       AND user_id = $3
       AND is_auto_title_generated = FALSE
       AND deleted_at IS NULL
     RETURNING *`,
    [title, chatId, userId]
  );
  return rows[0] ?? null;
};

// ── Soft delete a chat ────────────────────────────────────────────────────
exports.deleteChat = async ({ chatId, userId }) => {
  const rows = await q(
    `UPDATE chats
     SET deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [chatId, userId]
  );
  return rows.length > 0;
};

// ── Pin / unpin a chat ────────────────────────────────────────────────────
exports.togglePinChat = async ({ chatId, userId, pinned }) => {
  const rows = await q(
    `UPDATE chats
     SET pinned = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [pinned, chatId, userId]
  );
  return rows[0] ?? null;
};

// ── Count pinned chats for a user ─────────────────────────────────────────
exports.countPinnedChats = async (userId) => {
  const rows = await q(
    `SELECT COUNT(*) AS count
     FROM chats
     WHERE user_id = $1 AND pinned = TRUE AND deleted_at IS NULL`,
    [userId]
  );
  return parseInt(rows[0]?.count ?? "0", 10);
};

// ── Move chat to a different folder ──────────────────────────────────────
exports.moveChatToFolder = async ({ chatId, userId, folderId }) => {
  const rows = await q(
    `UPDATE chats
     SET folder_id = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [folderId, chatId, userId]
  );
  return rows[0] ?? null;
};
