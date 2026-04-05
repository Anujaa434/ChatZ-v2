// backend/src/controllers/auth.controller.js
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  signToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyToken,
  blacklistToken,
} = require("../utils/jwt");
const { sendEmail } = require("../utils/sendEmail");

// ── Constants ─────────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// ── Helpers ───────────────────────────────────────────────────────────────
function isStrongPassword(pw) {
  if (typeof pw !== "string") return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
}

/** SHA-256 hash of a raw refresh token — stored in user_sessions.token_hash */
function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ── pg helper: run a parameterised query and return rows ─────────────────
async function query(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// ── SIGNUP ────────────────────────────────────────────────────────────────
async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  if (!isStrongPassword(password))
    return res.status(400).json({
      message:
        "Password must be ≥8 chars and include uppercase, lowercase, digit, and special character.",
    });

  try {
    const existing = await query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    if (existing.length)
      return res.status(409).json({ message: "Email already in use" });

    const password_hash = await bcrypt.hash(password, 10);

    const [user] = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, password_hash]
    );

    // Issue tokens immediately on signup
    const accessToken  = signToken({ id: user.id, email: user.email, name: user.name });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email });

    // Store hashed refresh token in user_sessions
    await query(
      `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
      [
        user.id,
        hashToken(refreshToken),
        req.ip,
        req.headers["user-agent"] || null,
      ]
    );

    return res.status(201).json({
      message: "Account created successfully",
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── LOGIN ─────────────────────────────────────────────────────────────────
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email & password required" });

  try {
    const rows = await query(
      "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1",
      [email]
    );
    const user = rows[0];

    // ── Brute-force: account locked? ────────────────────────────────────
    if (user && user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(user.locked_until) - new Date()) / 60000
      );
      return res.status(423).json({
        message: `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // ── Credential check ────────────────────────────────────────────────
    const match = user && (await bcrypt.compare(password, user.password_hash));

    if (!user || !match) {
      if (user) {
        const newAttempts = (user.failed_login_attempts || 0) + 1;
        const lock =
          newAttempts >= MAX_FAILED_ATTEMPTS
            ? `NOW() + INTERVAL '${LOCK_DURATION_MINUTES} minutes'`
            : "NULL";

        await pool.query(
          `UPDATE users
           SET failed_login_attempts = $1,
               locked_until = ${lock}
           WHERE id = $2`,
          [newAttempts, user.id]
        );
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ── Reset brute-force counters on success ────────────────────────────
    await query(
      `UPDATE users
       SET failed_login_attempts = 0,
           locked_until = NULL,
           last_login_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    const accessToken  = signToken({ id: user.id, email: user.email, name: user.name });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email });

    await query(
      `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
      [
        user.id,
        hashToken(refreshToken),
        req.ip,
        req.headers["user-agent"] || null,
      ]
    );

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────
async function refreshToken(req, res) {
  const { refreshToken: raw } = req.body;
  if (!raw)
    return res.status(400).json({ message: "Refresh token required" });

  try {
    // 1. Verify JWT signature
    const payload = verifyRefreshToken(raw);

    // 2. Look up the hashed token in user_sessions
    const sessions = await query(
      `SELECT * FROM user_sessions
       WHERE token_hash = $1
         AND is_revoked = FALSE
         AND expires_at > NOW()
       LIMIT 1`,
      [hashToken(raw)]
    );

    if (!sessions.length)
      return res.status(401).json({ message: "Refresh token invalid or expired" });

    const session = sessions[0];

    // 3. Rotate: revoke old session, issue new tokens
    await query(
      "UPDATE user_sessions SET is_revoked = TRUE WHERE id = $1",
      [session.id]
    );

    const userRows = await query(
      "SELECT id, name, email FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1",
      [payload.id]
    );
    if (!userRows.length)
      return res.status(401).json({ message: "User not found" });

    const user = userRows[0];
    const newAccessToken  = signToken({ id: user.id, email: user.email, name: user.name });
    const newRefreshToken = signRefreshToken({ id: user.id, email: user.email });

    await query(
      `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
      [
        user.id,
        hashToken(newRefreshToken),
        req.ip,
        req.headers["user-agent"] || null,
      ]
    );

    return res.json({
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
}

// ── LOGOUT ────────────────────────────────────────────────────────────────
async function logout(req, res) {
  const authHeader = req.headers.authorization;
  const raw        = req.body?.refreshToken;

  // Blacklist access token
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s*/i, "");
    try {
      const decoded = verifyToken(token);
      blacklistToken(token, decoded.exp);
    } catch { /* already expired — no harm */ }
  }

  // Revoke refresh token in DB
  if (raw) {
    try {
      await query(
        "UPDATE user_sessions SET is_revoked = TRUE WHERE token_hash = $1",
        [hashToken(raw)]
      );
    } catch (err) {
      console.error("Logout revoke error:", err);
    }
  }

  return res.json({ message: "Logged out" });
}

// ── PROFILE ───────────────────────────────────────────────────────────────
async function profile(req, res) {
  return res.json({ user: req.user });
}

// ── VERIFY EMAIL ──────────────────────────────────────────────────────────
async function verifyEmail(req, res) {
  const { token } = req.query;
  if (!token)
    return res.status(400).json({ message: "Invalid token" });

  try {
    const rows = await query(
      `SELECT id FROM users
       WHERE email_verify_token = $1
         AND (email_verify_token_expires_at IS NULL OR email_verify_token_expires_at > NOW())
       LIMIT 1`,
      [token]
    );
    if (!rows.length)
      return res.status(400).json({ message: "Invalid or expired token" });

    await query(
      `UPDATE users
       SET is_verified = TRUE,
           email_verify_token = NULL,
           email_verify_token_expires_at = NULL
       WHERE id = $1`,
      [rows[0].id]
    );

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify email error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────
async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    const resetToken = crypto.randomBytes(32).toString("hex");

    await query(
      `UPDATE users
       SET reset_password_token = $1,
           reset_password_token_expires_at = NOW() + INTERVAL '1 hour'
       WHERE email = $2`,
      [resetToken, email]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: "Reset your ChatZ password",
      html: `<p>Click to reset your password (valid 1 hour):</p>
             <a href="${resetLink}">${resetLink}</a>`,
    });

    return res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    // Always return the same message to prevent email enumeration
    return res.json({ message: "If that email exists, a reset link has been sent." });
  }
}

// ── RESET PASSWORD ────────────────────────────────────────────────────────
async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ message: "Invalid request" });

  if (!isStrongPassword(password))
    return res.status(400).json({
      message:
        "Password must be ≥8 chars and include uppercase, lowercase, digit, and special character.",
    });

  try {
    const hash = await bcrypt.hash(password, 10);

    const rows = await query(
      `UPDATE users
       SET password_hash = $1,
           reset_password_token = NULL,
           reset_password_token_expires_at = NULL
       WHERE reset_password_token = $2
         AND reset_password_token_expires_at > NOW()
       RETURNING id`,
      [hash, token]
    );

    if (!rows.length)
      return res.status(400).json({ message: "Invalid or expired token" });

    // Revoke all active sessions for this user (force re-login everywhere)
    await query(
      "UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = $1",
      [rows[0].id]
    );

    return res.json({ message: "Password updated successfully. Please log in again." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  signup,
  login,
  refreshToken,
  profile,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
