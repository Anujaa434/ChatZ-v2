// backend/src/models/message.model.js
// Fully migrated to pg (node-postgres) and aligned to schema_phase2.sql
const pool = require("../config/db");

async function q(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// ── Get all messages in a chat (oldest first) ─────────────────────────────
exports.getMessagesByChat = async (chatId) => {
  return q(
    `SELECT * FROM messages
     WHERE chat_id = $1 AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    [chatId]
  );
};

// ── Create a message and touch parent chat's last_message_at ─────────────
exports.createMessage = async ({ chatId, userId, role, content }) => {
  // Insert the message
  await pool.query(
    `INSERT INTO messages (chat_id, user_id, role, content)
     VALUES ($1, $2, $3, $4)`,
    [chatId, userId, role, content]
  );

  // App-managed: update chats.last_message_at + updated_at (schema_phase2 v2.3 design)
  await pool.query(
    "UPDATE chats SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1",
    [chatId]
  );
};

// ── Soft delete a message (verify ownership via JOIN) ─────────────────────
// PostgreSQL doesn't support multi-table UPDATE with JOIN like MySQL.
// Use a subquery instead.
exports.deleteMessage = async ({ messageId, userId }) => {
  const rows = await q(
    `UPDATE messages
     SET deleted_at = NOW()
     WHERE id = $1
       AND deleted_at IS NULL
       AND chat_id IN (
         SELECT id FROM chats WHERE user_id = $2
       )
     RETURNING id, chat_id`,
    [messageId, userId]
  );

  if (rows.length > 0 && rows[0].chat_id) {
    await pool.query(
      "UPDATE chats SET updated_at = NOW() WHERE id = $1",
      [rows[0].chat_id]
    );
    return true;
  }

  return false;
};

// ── Pin / unpin a message (verify ownership via subquery) ─────────────────
exports.togglePinMessage = async ({ messageId, userId, pinned }) => {
  const rows = await q(
    `UPDATE messages
     SET pinned = $1
     WHERE id = $2
       AND deleted_at IS NULL
       AND chat_id IN (
         SELECT id FROM chats WHERE user_id = $3
       )
     RETURNING *`,
    [pinned, messageId, userId]
  );
  return rows[0] ?? null;
};

// ── Count pinned messages in a chat ──────────────────────────────────────
exports.countPinnedMessages = async (chatId) => {
  const rows = await q(
    `SELECT COUNT(*) AS count
     FROM messages
     WHERE chat_id = $1 AND pinned = TRUE AND deleted_at IS NULL`,
    [chatId]
  );
  return parseInt(rows[0]?.count ?? "0", 10);
};
