// backend/src/models/user.model.js
// Migrated from TypeScript stubs to plain JS, aligned to pg + schema_phase2
const pool = require("../config/db");

async function q(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows;
}

exports.findByEmail = async (email) => {
  const rows = await q(
    "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1",
    [email]
  );
  return rows[0] ?? null;
};

exports.findById = async (id) => {
  const rows = await q(
    "SELECT id, name, email, role, is_verified, daily_token_limit FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
};

exports.createUser = async ({ name, email, password_hash, role = "user" }) => {
  const rows = await q(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, password_hash, role]
  );
  return rows[0];
};
