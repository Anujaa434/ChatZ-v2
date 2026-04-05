// backend/src/utils/jwt.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET         = process.env.JWT_SECRET          || "dev-access-secret";
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN       || "15m";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET   || "dev-refresh-secret";
const JWT_REFRESH_EXP    = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

// ── In-memory blacklist for access tokens (until they naturally expire) ──
const tokenBlacklist = new Map();

// ── Access Token ─────────────────────────────────────────────────────────
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ── Refresh Token ─────────────────────────────────────────────────────────
function signRefreshToken(payload) {
  // Payload: { id, email } — keep minimal; no name to reduce claim size
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXP });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

// ── Blacklisting (access tokens on logout) ───────────────────────────────
function blacklistToken(token, expSec) {
  try {
    if (!expSec) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) expSec = decoded.exp;
    }
    if (!expSec) return;
    tokenBlacklist.set(token, expSec * 1000);
  } catch { /* ignore */ }
}

function isTokenBlacklisted(token) {
  const expiry = tokenBlacklist.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    tokenBlacklist.delete(token);
    return false;
  }
  return true;
}

module.exports = {
  signToken,
  verifyToken,
  signRefreshToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
};
