// backend/src/models/folder.model.js
// Fully migrated to pg (node-postgres) and aligned to schema_phase2.sql
// Phase 2: table is `folders` (not `note_folders`), soft delete via `deleted_at`
const pool = require("../config/db");

async function q(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// ── Get all top-level folders for a user ──────────────────────────────────
exports.getUserFolders = async (userId) => {
  return q(
    `SELECT * FROM folders
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY pinned DESC, updated_at DESC`,
    [userId]
  );
};

// ── Create a folder ───────────────────────────────────────────────────────
exports.createFolder = async ({ userId, name, color = "#5227FF", parentFolderId = null }) => {
  const rows = await q(
    `INSERT INTO folders (user_id, parent_folder_id, name, color)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, parentFolderId || null, name || "New Folder", color]
  );
  return rows[0];
};

// ── Update a folder (dynamic fields) ─────────────────────────────────────
exports.updateFolder = async (userId, folderId, updates) => {
  const allowed = ["name", "color", "pinned", "parent_folder_id"];
  const fields = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      fields.push(`${key} = $${i++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return;

  fields.push(`updated_at = NOW()`);
  values.push(folderId, userId);

  await pool.query(
    `UPDATE folders SET ${fields.join(", ")}
     WHERE id = $${i++} AND user_id = $${i} AND deleted_at IS NULL`,
    values
  );
};

// ── Soft delete a folder ──────────────────────────────────────────────────
exports.deleteFolder = async (userId, folderId) => {
  await pool.query(
    `UPDATE folders
     SET deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [folderId, userId]
  );
};

// ── Toggle pin on a folder ────────────────────────────────────────────────
exports.togglePinFolder = async (userId, folderId) => {
  const res = await pool.query(
    `UPDATE folders
     SET pinned = NOT pinned, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [folderId, userId]
  );
  return res.rows[0];
};

// ── Get chats + notes inside a folder (folder home screen) ────────────────
exports.getFolderContents = async (userId, folderId) => {
  const [chats, notes] = await Promise.all([
    pool.query(
      `SELECT id, title, pinned, created_at, updated_at
       FROM chats
       WHERE user_id = $1 AND folder_id = $2 AND deleted_at IS NULL
       ORDER BY pinned DESC, updated_at DESC`,
      [userId, folderId]
    ),
    pool.query(
      `SELECT id, title, content, pinned, created_at, updated_at
       FROM notes
       WHERE user_id = $1 AND folder_id = $2 AND deleted_at IS NULL
       ORDER BY pinned DESC, updated_at DESC`,
      [userId, folderId]
    ),
  ]);
  return { chats: chats.rows, notes: notes.rows };
};