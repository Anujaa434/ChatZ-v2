// backend/src/routes/auth.routes.js
const express = require("express");
const router  = express.Router();

const {
  signup,
  login,
  refreshToken,
  logout,
  profile,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const { requireAuth } = require("../middlewares/auth.middleware");

// ── Public routes ──────────────────────────────────────────────────────────
router.post("/signup",           signup);
router.post("/login",            login);
router.post("/refresh",          refreshToken);    // ★ new: get new token pair
router.post("/forgot-password",  forgotPassword);
router.post("/reset-password",   resetPassword);
router.get ("/verify-email",     verifyEmail);

// ── Protected routes ───────────────────────────────────────────────────────
router.get ("/profile",  requireAuth, profile);
router.post("/logout",   requireAuth, logout);

module.exports = router;
